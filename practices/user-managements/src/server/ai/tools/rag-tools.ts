import { tool } from 'ai';
import { z } from 'zod';

import { CHAT_TOOL_MESSAGES } from '@/constants/messages';
import { ensureKnowledgeBaseSeeded } from '@/server/ai/rag/ensure-seeded';
import { findRelevantContent } from '@/server/ai/rag/embedding';
import { ingestKnowledgeContent } from '@/server/ai/rag/ingest';

type RagToolsContext = {
  db: D1Database;
  embeddingApiKey: string | null;
  createdBy: string;
  isAdmin: boolean;
};

const missingEmbeddingKeyResult = () => ({
  ok: false as const,
  error:
    'Knowledge search requires an OpenAI API key (server OPENAI_API_KEY or your sidebar key when using OpenAI).',
});

export const createRagTools = ({
  db,
  embeddingApiKey,
  createdBy,
  isAdmin,
}: RagToolsContext) => {
  const getKnowledge = tool({
    description: CHAT_TOOL_MESSAGES.GET_KNOWLEDGE,
    inputSchema: z.object({
      question: z
        .string()
        .min(1)
        .describe('Policy, FAQ, or how-to question to look up'),
    }),
    execute: async ({ question }) => {
      if (!embeddingApiKey) return missingEmbeddingKeyResult();
      await ensureKnowledgeBaseSeeded(db, embeddingApiKey);
      const matches = await findRelevantContent(
        db,
        embeddingApiKey,
        question,
      );
      return { ok: true as const, matches };
    },
  });

  const tools = { getKnowledge } as const;

  if (!isAdmin) return tools;

  return {
    ...tools,
    addKnowledge: tool({
      description: CHAT_TOOL_MESSAGES.ADD_KNOWLEDGE,
      inputSchema: z.object({
        content: z
          .string()
          .min(1)
          .describe('Text to add to the knowledge base (policies, notes, FAQ)'),
      }),
      execute: async ({ content }) => {
        if (!embeddingApiKey) return missingEmbeddingKeyResult();
        await ensureKnowledgeBaseSeeded(db, embeddingApiKey);
        const result = await ingestKnowledgeContent(db, {
          apiKey: embeddingApiKey,
          content,
          createdBy,
        });
        return {
          ok: true as const,
          resourceId: result.resourceId,
          chunkCount: result.chunkCount,
        };
      },
    }),
  } as const;
};
