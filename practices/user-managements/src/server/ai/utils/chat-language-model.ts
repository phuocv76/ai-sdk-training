import type { OpenAIProvider } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider-v2';
import { defaultSettingsMiddleware, wrapLanguageModel } from 'ai';

export const OPENAI_CHAT_MODEL_ID = 'gpt-4o-mini' as const;

/** OpenAI chat model used for user-management flows, with shared middleware. */
export const wrapUserManagementChatModel = (openai: OpenAIProvider) =>
  wrapLanguageModel({
    model: openai(OPENAI_CHAT_MODEL_ID),
    middleware: defaultSettingsMiddleware({
      settings: { temperature: 0 },
    }),
  });

/** Ollama chat model via `ollama-ai-provider-v2` (same middleware as OpenAI). */
export const wrapUserManagementOllamaChatModel = (
  ollama: ReturnType<typeof createOllama>,
  modelId: string,
) =>
  wrapLanguageModel({
    model: ollama.chat(modelId.trim() || 'llama3.2'),
    middleware: defaultSettingsMiddleware({
      settings: { temperature: 0 },
    }),
  });
