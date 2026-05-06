import { createOpenAI } from "@ai-sdk/openai";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

// Constants
import {
  API_MESSAGES,
  CHAT_SYSTEM_PROMPTS,
  CHAT_TOOL_MESSAGES,
  REQUEST_HEADERS,
  USER_DOMAIN_ERRORS,
  chatMemberSystemPrompt,
} from "@/constants/messages";

// Libraries
import {
  requireDatabase,
  resolveSessionUser,
} from "@/lib/auth-cookies";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateMemberProfile,
  updateUser,
  userResponseBody,
} from "@/lib/users";

export const dynamic = "force-dynamic";

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

function latestUserText(messages: UIMessage[] | undefined): string {
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
}

function isUserManagementRelated(input: string): boolean {
  const normalized = input.toLowerCase();
  if (!normalized) return true;
  if (LOOKS_LIKE_EMAIL.test(input)) return true;
  return USER_MANAGEMENT_TOPICS.some((topic) => normalized.includes(topic));
}

const dobField = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.literal(""),
    z.null(),
  ])
  .optional();

/**
 * Streams an AI assistant backed by authenticated tool calls (profile + admin CRUD).
 * @param req Incoming chat UI messages and optional `x-openai-api-key` override.
 */
export async function POST(req: Request) {
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
  const isAdmin = me.role === "admin";

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

  const modelMessages = await convertToModelMessages(body.messages);

  const memberTools =
    ({
      getMyProfile: tool({
        description: CHAT_TOOL_MESSAGES.GET_MY_PROFILE,
        inputSchema: z.object({}),
        execute: async () => {
          const u = await getUser(db, me.id);
          return { profile: u ? userResponseBody(u) : null };
        },
      }),
      updateMyProfile: tool({
        description: CHAT_TOOL_MESSAGES.UPDATE_MY_PROFILE,
        inputSchema: z.object({
          name: z.string().min(1).max(120).optional(),
          date_of_birth: dobField,
          bio: z.string().max(8000).nullable().optional(),
        }),
        execute: async (input) => {
          try {
            const patch: {
              name?: string;
              date_of_birth?: string | null;
              bio?: string | null;
            } = {};
            if (input.name !== undefined) patch.name = input.name;
            if (input.date_of_birth !== undefined) {
              patch.date_of_birth =
                input.date_of_birth === "" || input.date_of_birth === null ?
                  null
                : input.date_of_birth;
            }
            if (input.bio !== undefined) patch.bio = input.bio;

            const user = await updateMemberProfile(db, me.id, patch);
            if (!user)
              return {
                ok: false as const,
                error: USER_DOMAIN_ERRORS.COULD_NOT_LOAD_PROFILE,
              };
            return { ok: true as const, user: userResponseBody(user) };
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return { ok: false as const, error: msg };
          }
        },
      }),
    }) as const;

  const adminReadTools =
    ({
      ...memberTools,
      listUsers: tool({
        description: CHAT_TOOL_MESSAGES.LIST_USERS,
        inputSchema: z.object({}),
        execute: async () => ({
          users: await listUsers(db),
        }),
      }),
      getUser: tool({
        description: CHAT_TOOL_MESSAGES.GET_USER,
        inputSchema: z.object({
          id: z.string().describe(CHAT_TOOL_MESSAGES.USER_ID_PARAM),
        }),
        execute: async ({ id }) => {
          const user = await getUser(db, id);
          return user ?? { notFound: true, id };
        },
      }),
    }) as const;

  const adminTools =
    ({
      ...adminReadTools,
      createUser: tool({
        description: CHAT_TOOL_MESSAGES.CREATE_USER,
        inputSchema: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          bio: z.string().max(8000).optional(),
        }),
        execute: async (input) => {
          try {
            const user = await createUser(db, input);
            return { ok: true as const, user };
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return { ok: false as const, error: msg };
          }
        },
      }),
      updateUser: tool({
        description: CHAT_TOOL_MESSAGES.UPDATE_USER,
        inputSchema: z.object({
          id: z.string(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          date_of_birth: dobField,
          bio: z.string().max(8000).nullable().optional(),
          status: z.enum(["active", "inactive"]).optional(),
        }),
        execute: async (input) => {
          try {
            const { id, ...fields } = input;
            if (fields.status === "inactive" && id === me.id) {
              return {
                ok: false as const,
                error: API_MESSAGES.CANNOT_DEACTIVATE_SELF_ACCOUNT,
              };
            }
            const user = await updateUser(db, {
              id,
              name: fields.name,
              email: fields.email,
              bio: fields.bio,
              ...(fields.status !== undefined ? { status: fields.status } : {}),
              ...(fields.date_of_birth !== undefined ?
                {
                  date_of_birth:
                    fields.date_of_birth === "" ||
                      fields.date_of_birth === null ?
                      null
                    : fields.date_of_birth,
                }
              : {}),
            });
            if (!user)
              return { ok: false as const, error: API_MESSAGES.USER_NOT_FOUND };
            return { ok: true as const, user };
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return { ok: false as const, error: msg };
          }
        },
      }),
      deleteUser: tool({
        description: CHAT_TOOL_MESSAGES.DELETE_USER,
        inputSchema: z.object({
          id: z.string(),
        }),
        execute: async ({ id }) => {
          const { deleted } = await deleteUser(db, id);
          return { ok: deleted, id };
        },
      }),
    }) as const;

  const tools = isAdmin ? adminTools : memberTools;

  const result = streamText({
    model: openai("gpt-4o-mini"),
    stopWhen: stepCountIs(12),
    system:
      isAdmin ?
        CHAT_SYSTEM_PROMPTS.ADMIN
      : chatMemberSystemPrompt(me.name),
    messages: modelMessages,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
