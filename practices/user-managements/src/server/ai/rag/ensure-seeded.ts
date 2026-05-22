import { buildKnowledgeSeedDocument } from '@/server/ai/rag/knowledge-seed-content';
import { ingestKnowledgeContent } from '@/server/ai/rag/ingest';
import { countKnowledgeChunks } from '@/server/ai/rag/repository';

let seedInFlight: Promise<void> | null = null;

/** Ingests built-in policy docs when the knowledge base is empty. */
export const ensureKnowledgeBaseSeeded = async (
  db: D1Database,
  apiKey: string,
): Promise<void> => {
  const existing = await countKnowledgeChunks(db);
  if (existing > 0) return;

  if (!seedInFlight) {
    seedInFlight = (async () => {
      const again = await countKnowledgeChunks(db);
      if (again > 0) return;
      await ingestKnowledgeContent(db, {
        apiKey,
        content: buildKnowledgeSeedDocument(),
        createdBy: null,
      });
    })().finally(() => {
      seedInFlight = null;
    });
  }

  await seedInFlight;
};
