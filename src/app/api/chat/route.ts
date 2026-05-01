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

import {
  API_MESSAGES,
  CHAT_SYSTEM_PROMPTS,
  CHAT_TOOL_MESSAGES,
  REQUEST_HEADERS,
  USER_DOMAIN_ERRORS,
  chatMemberSystemPrompt,
} from "@/constants/messages";
import {
  resolveSessionUser,
  requireDatabase,
} from "@/lib/auth-cookies";
import { withPrisma } from "@/lib/prisma";
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
  const me = await withPrisma(dbCtx.db, (p) => resolveSessionUser(p));
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
  const modelMessages = await convertToModelMessages(body.messages);

  const memberTools =
    ({
      getMyProfile: tool({
        description: CHAT_TOOL_MESSAGES.GET_MY_PROFILE,
        inputSchema: z.object({}),
        execute: async () => {
          const u = await withPrisma(db, (p) => getUser(p, me.id));
          return { profile: u ? userResponseBody(u) : null };
        },
      }),
      updateMyProfile: tool({
        description: CHAT_TOOL_MESSAGES.UPDATE_MY_PROFILE,
        inputSchema: z.object({
          first_name: z.string().max(120).nullable().optional(),
          last_name: z.string().max(120).nullable().optional(),
          date_of_birth: dobField,
          bio: z.string().max(8000).nullable().optional(),
        }),
        execute: async (input) => {
          try {
            const patch: {
              first_name?: string | null;
              last_name?: string | null;
              date_of_birth?: string | null;
              bio?: string | null;
            } = {};
            if (input.first_name !== undefined)
              patch.first_name = input.first_name;
            if (input.last_name !== undefined)
              patch.last_name = input.last_name;
            if (input.date_of_birth !== undefined) {
              patch.date_of_birth =
                input.date_of_birth === "" || input.date_of_birth === null ?
                  null
                : input.date_of_birth;
            }
            if (input.bio !== undefined) patch.bio = input.bio;

            const user = await withPrisma(db, (p) =>
              updateMemberProfile(p, me.id, patch),
            );
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
          users: await withPrisma(db, (p) => listUsers(p)),
        }),
      }),
      getUser: tool({
        description: CHAT_TOOL_MESSAGES.GET_USER,
        inputSchema: z.object({
          id: z.string().describe(CHAT_TOOL_MESSAGES.USER_ID_PARAM),
        }),
        execute: async ({ id }) => {
          const user = await withPrisma(db, (p) => getUser(p, id));
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
        }),
        execute: async (input) => {
          try {
            const user = await withPrisma(db, (p) => createUser(p, input));
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
          first_name: z.string().max(120).nullable().optional(),
          last_name: z.string().max(120).nullable().optional(),
          date_of_birth: dobField,
          bio: z.string().max(8000).nullable().optional(),
        }),
        execute: async (input) => {
          try {
            const { id, ...fields } = input;
            const user = await withPrisma(db, (p) =>
              updateUser(p, {
                id,
                name: fields.name,
                email: fields.email,
                first_name: fields.first_name,
                last_name: fields.last_name,
                bio: fields.bio,
                ...(fields.date_of_birth !== undefined ?
                  {
                    date_of_birth:
                      fields.date_of_birth === "" ||
                        fields.date_of_birth === null ?
                        null
                      : fields.date_of_birth,
                  }
                : {}),
              }),
            );
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
          const { deleted } = await withPrisma(db, (p) => deleteUser(p, id));
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
