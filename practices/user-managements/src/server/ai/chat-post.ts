import { createOpenAI } from '@ai-sdk/openai';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createOllama } from 'ollama-ai-provider-v2';
import {
  createAgentUIStreamResponse,
  streamText,
  TypeValidationError,
  type LanguageModel,
  type UIMessage,
} from 'ai';

import { CHAT_AI_PROVIDER, type ChatAiProviderId } from '@/constants/ai-provider';
import { API_MESSAGES, REQUEST_HEADERS } from '@/constants/messages';
import {
  wrapUserManagementChatModel,
  wrapUserManagementOllamaChatModel,
} from '@/server/ai/chat-language-model';
import { requireDatabase, resolveSessionUser } from '@/server/auth/cookies';
import { sanitizeChatUiMessagesForValidation } from '@/server/ai/sanitize-chat-ui-messages';
import { createUserManagementAgent } from '@/server/ai/user-management-agent';
import { USER_MANAGEMENT_TOPICS } from '@/constants/promts';

/** Loose pattern so pasted emails (e.g. add-member requests) count as on-topic. */
const LOOKS_LIKE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
/** Common date value format for profile updates (YYYY-MM-DD). */
const LOOKS_LIKE_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Accept explicit confirmation-only follow-ups as valid chat intents. */
const LOOKS_LIKE_CONFIRMATION = /(?:^|\b)(confirm|approve|yes|ok)(?:\b|$)/i;

/** Returns the most recent non-empty user text from UI messages. */
const latestUserText = (messages: UIMessage[] | undefined): string => {
  if (!messages?.length) return '';

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;

    const textParts = msg.parts
      .filter(
        (
          part,
        ): part is {
          type: 'text';
          text: string;
        } => part.type === 'text' && typeof part.text === 'string',
      )
      .map((part) => part.text.trim())
      .filter(Boolean);

    const text = textParts.join(' ').trim();
    if (text) return text;
  }

  return '';
};

/**
 * Maps stream errors to safe UI text and logs details server-side
 * (see AI SDK UI message stream `onError`).
 */
const handleChatAiStreamError = (error: unknown): string => {
  console.error('[chat] AI stream error:', error);
  return API_MESSAGES.CHAT_STREAM_ERROR;
};

/**
 * JSON error response for failures before or while building a stream.
 */
const chatJsonError = (message: string, status: number) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434/api';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';

const parseChatProvider = (raw: unknown): ChatAiProviderId => {
  if (typeof raw !== 'string') return CHAT_AI_PROVIDER.OPENAI;
  const v = raw.trim().toLowerCase();
  return v === CHAT_AI_PROVIDER.OLLAMA ?
      CHAT_AI_PROVIDER.OLLAMA
    : CHAT_AI_PROVIDER.OPENAI;
};

/** Basic guard to keep chat constrained to user-management intents. */
const isUserManagementRelated = (input: string): boolean => {
  const normalized = input.toLowerCase();
  if (!normalized) return true;
  if (LOOKS_LIKE_EMAIL.test(input)) return true;
  if (LOOKS_LIKE_DATE.test(normalized.trim())) return true;
  if (LOOKS_LIKE_CONFIRMATION.test(normalized)) return true;
  return USER_MANAGEMENT_TOPICS.some((topic) => normalized.includes(topic));
};

/**
 * Streams an AI assistant backed by authenticated tool calls (profile + admin CRUD).
 * @param req Incoming chat UI messages, optional JSON `provider` (`openai` | `ollama`),
 *   and optional `x-openai-api-key` override when using OpenAI.
 */
export const handleChatPost = async (req: Request): Promise<Response> => {
  let body: { messages: UIMessage[]; provider?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: API_MESSAGES.INVALID_JSON_BODY }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const dbCtx = await requireDatabase();
  if ('error' in dbCtx) {
    return new Response(JSON.stringify({ error: dbCtx.error }), {
      status: dbCtx.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const me = await resolveSessionUser(dbCtx.db);
  if (!me) {
    return new Response(JSON.stringify({ error: API_MESSAGES.UNAUTHORIZED }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { env } = await getCloudflareContext({ async: true });
  const db = dbCtx.db;
  const provider = parseChatProvider(body.provider);

  const headerKey = req.headers
    .get(REQUEST_HEADERS.OPENAI_API_KEY_OVERRIDE)
    ?.trim();
  const envKey = env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  const apiKey = headerKey || envKey;

  let languageModel: LanguageModel;

  if (provider === CHAT_AI_PROVIDER.OPENAI) {
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: API_MESSAGES.MISSING_OPENAI_API_KEY,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const openai = createOpenAI({ apiKey });
    languageModel = wrapUserManagementChatModel(openai);
  } else {
    const ollamaBaseUrl =
      env.OLLAMA_BASE_URL ??
      process.env.OLLAMA_BASE_URL ??
      DEFAULT_OLLAMA_BASE_URL;
    const ollamaModel =
      env.OLLAMA_MODEL ?? process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
    const ollama = createOllama({ baseURL: ollamaBaseUrl });
    languageModel = wrapUserManagementOllamaChatModel(ollama, ollamaModel);
  }
  const latestText = latestUserText(body.messages);

  try {
    if (!isUserManagementRelated(latestText)) {
      const offTopicResult = streamText({
        model: languageModel,
        system:
          'You are a strict user-management assistant. Reply with exactly the provided message and nothing else.',
        messages: [
          {
            role: 'user',
            content: API_MESSAGES.CHAT_OFF_TOPIC,
          },
        ],
        abortSignal: req.signal,
      });
      return offTopicResult.toUIMessageStreamResponse({
        onError: handleChatAiStreamError,
      });
    }

    const agent = createUserManagementAgent({
      model: languageModel,
      db,
      me,
      latestText,
    });

    const uiMessages = sanitizeChatUiMessagesForValidation(body.messages);

    return await createAgentUIStreamResponse({
      agent,
      uiMessages,
      abortSignal: req.signal,
      onError: handleChatAiStreamError,
    });
  } catch (error) {
    console.error('[chat] failed:', error);
    if (error instanceof TypeValidationError) {
      return chatJsonError(API_MESSAGES.INVALID_INPUT, 400);
    }
    return chatJsonError(API_MESSAGES.CHAT_STREAM_ERROR, 500);
  }
};
