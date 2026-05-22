import { generateEmbeddings } from '@/server/ai/rag/embedding';
import {
  insertKnowledgeChunks,
  insertKnowledgeResource,
} from '@/server/ai/rag/repository';

export const ingestKnowledgeContent = async (
  db: D1Database,
  input: {
    apiKey: string;
    content: string;
    createdBy?: string | null;
  },
): Promise<{ resourceId: string; chunkCount: number }> => {
  const trimmed = input.content.trim();
  if (!trimmed) {
    throw new Error('Knowledge content cannot be empty.');
  }

  const resourceId = crypto.randomUUID();
  const createdAt = Date.now();
  await insertKnowledgeResource(db, {
    id: resourceId,
    content: trimmed,
    createdBy: input.createdBy ?? null,
    createdAt,
  });

  const embeddings = await generateEmbeddings(input.apiKey, trimmed);
  await insertKnowledgeChunks(
    db,
    embeddings.map((row) => ({
      id: crypto.randomUUID(),
      resourceId,
      content: row.content,
      embedding: row.embedding,
    })),
  );

  return { resourceId, chunkCount: embeddings.length };
};
