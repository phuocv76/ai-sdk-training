import type { OpenAIProvider } from '@ai-sdk/openai';
import { defaultSettingsMiddleware, wrapLanguageModel } from 'ai';

const CHAT_MODEL_ID = 'gpt-4o-mini' as const;

/** OpenAI chat model used for user-management flows, with shared middleware. */
export const wrapUserManagementChatModel = (openai: OpenAIProvider) =>
  wrapLanguageModel({
    model: openai(CHAT_MODEL_ID),
    middleware: defaultSettingsMiddleware({
      settings: { temperature: 0 },
    }),
  });
