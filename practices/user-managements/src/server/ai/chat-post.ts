import { createOpenAI } from "@ai-sdk/openai";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  createAgentUIStreamResponse,
  streamText,
  type UIMessage,
} from "ai";

import {
  API_MESSAGES,
  REQUEST_HEADERS,
} from "@/constants/messages";
import {
  requireDatabase,
  resolveSessionUser,
} from "@/server/auth/cookies";
import { createUserManagementAgent } from "@/server/ai/user-management-agent";

const USER_MANAGEMENT_TOPICS = [
  "user",
  "users",
  "profile",
  "account",
  "accounts",
  "admin",
  "member",
  "members",
  "role",
  "roles",
  "directory",
  "name",
  "email",
  "password",
  "born",
  "birth",
  "birthday",
  "bday",
  "date of birth",
  "dob",
  "bio",
  "signup",
  "sign up",
  "login",
  "sign in",
  "create",
  "add",
  "invite",
  "update",
  "delete",
  "remove",
  "list",
  "deactivate",
  "deactive",
  "disable",
  "disabled",
  "inactive",
  "activate",
  "enable",
  "enabled",
  "status",
] as const;

/** Loose pattern so pasted emails (e.g. add-member requests) count as on-topic. */
const LOOKS_LIKE_EMAIL =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
/** Common date value format for profile updates (YYYY-MM-DD). */
const LOOKS_LIKE_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Accept explicit confirmation-only follow-ups as valid chat intents. */
const LOOKS_LIKE_CONFIRMATION = /(?:^|\b)(confirm|approve|yes|ok)(?:\b|$)/i;

/** Returns the most recent non-empty user text from UI messages. */
const latestUserText = (messages: UIMessage[] | undefined): string => {
  if (!messages?.length) return "";

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.role !== "user") continue;

    const textParts = msg.parts
      .filter(
        (
          part,
        ): part is {
          type: "text";
          text: string;
        } => part.type === "text" && typeof part.text === "string",
      )
      .map((part) => part.text.trim())
      .filter(Boolean);

    const text = textParts.join(" ").trim();
    if (text) return text;
  }

  return "";
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
 * @param req Incoming chat UI messages and optional `x-openai-api-key` override.
 */
export const handleChatPost = async (req: Request): Promise<Response> => {
  let body: { messages: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: API_MESSAGES.INVALID_JSON_BODY }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const dbCtx = await requireDatabase();
  if ("error" in dbCtx) {
    return new Response(JSON.stringify({ error: dbCtx.error }), {
      status: dbCtx.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  const me = await resolveSessionUser(dbCtx.db);
  if (!me) {
    return new Response(JSON.stringify({ error: API_MESSAGES.UNAUTHORIZED }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { env } = await getCloudflareContext({ async: true });
  const db = dbCtx.db;
  const headerKey = req.headers.get(REQUEST_HEADERS.OPENAI_API_KEY_OVERRIDE)?.trim();
  const envKey = env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  const apiKey = headerKey || envKey;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: API_MESSAGES.MISSING_OPENAI_API_KEY,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const openai = createOpenAI({ apiKey });
  const latestText = latestUserText(body.messages);
  if (!isUserManagementRelated(latestText)) {
    const offTopicResult = streamText({
      model: openai("gpt-4o-mini"),
      system:
        "You are a strict user-management assistant. Reply with exactly the provided message and nothing else.",
      messages: [
        {
          role: "user",
          content: API_MESSAGES.CHAT_OFF_TOPIC,
        },
      ],
    });
    return offTopicResult.toUIMessageStreamResponse();
  }

  const agent = createUserManagementAgent({
    model: openai("gpt-4o-mini"),
    db,
    me,
    latestText,
  });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: body.messages,
  });
};
