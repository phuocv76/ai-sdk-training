import { createOpenAI } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';

import { cosineSimilarity } from '@/server/ai/rag/cosine';
import { listKnowledgeChunks } from '@/server/ai/rag/repository';

const EMBEDDING_MODEL_ID = 'text-embedding-3-small';
const SIMILARITY_THRESHOLD = 0.5;
const MAX_RESULTS = 4;

const generateChunks = (input: string): string[] =>
  input
    .trim()
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean);

const createEmbeddingModel = (apiKey: string) => {
  const openai = createOpenAI({ apiKey });
  return openai.embedding(EMBEDDING_MODEL_ID);
};

export const generateEmbeddings = async (
  apiKey: string,
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  if (chunks.length === 0) return [];
  const model = createEmbeddingModel(apiKey);
  const { embeddings } = await embedMany({ model, values: chunks });
  return embeddings.map((e, i) => ({ content: chunks[i]!, embedding: e }));
};

export const generateEmbedding = async (
  apiKey: string,
  value: string,
): Promise<number[]> => {
  const model = createEmbeddingModel(apiKey);
  const { embedding } = await embed({
    model,
    value: value.replaceAll('\n', ' '),
  });
  return embedding;
};

export const findRelevantContent = async (
  db: D1Database,
  apiKey: string,
  userQuery: string,
): Promise<Array<{ content: string; similarity: number }>> => {
  const queryEmbedding = await generateEmbedding(apiKey, userQuery);
  const rows = await listKnowledgeChunks(db);

  return rows
    .map((row) => {
      let stored: number[];
      try {
        stored = JSON.parse(row.embedding) as number[];
      } catch {
        return { content: row.content, similarity: -1 };
      }
      return {
        content: row.content,
        similarity: cosineSimilarity(queryEmbedding, stored),
      };
    })
    .filter((r) => r.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_RESULTS);
};
