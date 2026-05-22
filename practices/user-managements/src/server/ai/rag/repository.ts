export type KnowledgeChunkRow = {
  content: string;
  embedding: string;
};

export const countKnowledgeChunks = async (db: D1Database): Promise<number> => {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM knowledge_chunks')
    .first<{ n: number }>();
  return row?.n ?? 0;
};

export const listKnowledgeChunks = async (
  db: D1Database,
): Promise<KnowledgeChunkRow[]> => {
  const result = await db
    .prepare('SELECT content, embedding FROM knowledge_chunks')
    .all<KnowledgeChunkRow>();
  return result.results ?? [];
};

export const insertKnowledgeResource = async (
  db: D1Database,
  input: { id: string; content: string; createdBy: string | null; createdAt: number },
): Promise<void> => {
  await db
    .prepare(
      'INSERT INTO knowledge_resources (id, content, created_by, created_at) VALUES (?1, ?2, ?3, ?4)',
    )
    .bind(input.id, input.content, input.createdBy, input.createdAt)
    .run();
};

export const insertKnowledgeChunks = async (
  db: D1Database,
  rows: Array<{ id: string; resourceId: string; content: string; embedding: number[] }>,
): Promise<void> => {
  if (rows.length === 0) return;
  const statements = rows.map((row) =>
    db
      .prepare(
        'INSERT INTO knowledge_chunks (id, resource_id, content, embedding) VALUES (?1, ?2, ?3, ?4)',
      )
      .bind(row.id, row.resourceId, row.content, JSON.stringify(row.embedding)),
  );
  await db.batch(statements);
};
