/** Chat backend identifiers sent with `/api/chat` and mirrored in the assistant UI. */
export const CHAT_AI_PROVIDER = {
  OPENAI: "openai",
  OLLAMA: "ollama",
} as const;

export type ChatAiProviderId =
  (typeof CHAT_AI_PROVIDER)[keyof typeof CHAT_AI_PROVIDER];

export const CHAT_AI_PROVIDER_STORAGE_KEY = "um-chat-ai-provider";
