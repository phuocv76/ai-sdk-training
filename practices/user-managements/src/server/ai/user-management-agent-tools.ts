// External libraries
import { tool } from 'ai';

// Constants
import {
  API_MESSAGES,
  CHAT_TOOL_MESSAGES,
  USER_DOMAIN_ERRORS,
} from '@/constants/messages';

// Domain
import { userResponseBody, type User } from '@/lib/domain/user';
import {
  createUserToolInputSchema,
  emptyObjectSchema,
  updateMyProfileToolInputSchema,
  updateUserToolInputSchema,
  userIdPayloadSchema,
} from '@/lib/schemas/user-management-schemas';

// Server
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateMemberProfile,
  updateUser,
} from '@/server/users/repository';

/** Result envelope for confirmation-aware tool workflows. */
type WorkflowResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }
  | {
      ok: false;
      requiresConfirmation: true;
      action: string;
      message: string;
      hint: string;
      preview: unknown;
    };

/** Detects whether the latest user message explicitly approves an action. */
const isHumanConfirmation = (text: string): boolean => {
  const normalized = text.trim().toLowerCase();
  const alphaOnly = normalized.replace(/[^a-z]/g, '');
  if (!normalized) return false;
  const looksLikeApprove = /^a+p+r+o+v+e+$/.test(alphaOnly);
  return (
    normalized.includes('confirm') ||
    normalized.includes('approve') ||
    looksLikeApprove ||
    normalized.includes('yes, proceed') ||
    normalized === 'yes' ||
    normalized === 'ok'
  );
};

/** Standardized confirmation instruction returned in preview responses. */
const approvalHint = (action: string): string => {
  return `Reply with "confirm ${action}" (or "approve") to execute this action.`;
};

/**
 * Wraps a mutating operation with a human-in-the-loop confirmation gate.
 * Returns a preview payload until the user explicitly confirms.
 */
const createHumanInLoopWorkflow: (
  latestText: string,
  action: string,
) => <T>(
  input: unknown,
  run: () => Promise<T>,
) => Promise<WorkflowResult<T>> = (latestText, action) => {
  return async <T>(input: unknown, run: () => Promise<T>) => {
    if (!isHumanConfirmation(latestText)) {
      return {
        ok: false,
        requiresConfirmation: true,
        action,
        message: `Awaiting your confirmation before running ${action}.`,
        hint: approvalHint(action),
        preview: input,
      };
    }
    try {
      return { ok: true, data: await run() };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
};

type UserManagementToolsContext = {
  db: D1Database;
  me: Pick<User, 'id' | 'name' | 'role'>;
  latestText: string;
};

export const createUserManagementAgentTools = ({
  db,
  me,
  latestText,
}: UserManagementToolsContext) => {
  const memberTools = {
    getMyProfile: tool({
      description: CHAT_TOOL_MESSAGES.GET_MY_PROFILE,
      inputSchema: emptyObjectSchema,
      execute: async () => {
        const u = await getUser(db, me.id);
        return { profile: u ? userResponseBody(u) : null };
      },
    }),
    updateMyProfile: tool({
      description: CHAT_TOOL_MESSAGES.UPDATE_MY_PROFILE,
      inputSchema: updateMyProfileToolInputSchema,
      execute: async (input) => {
        const workflow = createHumanInLoopWorkflow(
          latestText,
          'updateMyProfile',
        );
        const result = await workflow(input, async () => {
          const patch: {
            name?: string;
            date_of_birth?: string | null;
            bio?: string | null;
          } = {};
          if (input.name !== undefined) patch.name = input.name;
          if (input.date_of_birth !== undefined) {
            patch.date_of_birth =
              input.date_of_birth === '' || input.date_of_birth === null
                ? null
                : input.date_of_birth;
          }
          if (input.bio !== undefined) patch.bio = input.bio;
          const user = await updateMemberProfile(db, me.id, patch);
          if (!user) throw new Error(USER_DOMAIN_ERRORS.COULD_NOT_LOAD_PROFILE);
          return userResponseBody(user);
        });
        if (!result.ok) {
          if ('requiresConfirmation' in result) return result;
          return { ok: false as const, error: result.error };
        }
        return { ok: true as const, user: result.data };
      },
    }),
  } as const;

  const adminReadTools = {
    ...memberTools,
    listUsers: tool({
      description: CHAT_TOOL_MESSAGES.LIST_USERS,
      inputSchema: emptyObjectSchema,
      execute: async () => ({
        users: await listUsers(db),
      }),
    }),
    getUser: tool({
      description: CHAT_TOOL_MESSAGES.GET_USER,
      inputSchema: userIdPayloadSchema.extend({
        id: userIdPayloadSchema.shape.id.describe(
          CHAT_TOOL_MESSAGES.USER_ID_PARAM,
        ),
      }),
      execute: async ({ id }) => {
        const user = await getUser(db, id);
        return user ?? { notFound: true, id };
      },
    }),
  } as const;

  const adminTools = {
    ...adminReadTools,
    createUser: tool({
      description: CHAT_TOOL_MESSAGES.CREATE_USER,
      inputSchema: createUserToolInputSchema,
      execute: async (input) => {
        const workflow = createHumanInLoopWorkflow(latestText, 'createUser');
        const result = await workflow(input, async () => createUser(db, input));
        if (!result.ok) {
          if ('requiresConfirmation' in result) return result;
          return { ok: false as const, error: result.error };
        }
        return { ok: true as const, user: result.data };
      },
    }),
    updateUser: tool({
      description: CHAT_TOOL_MESSAGES.UPDATE_USER,
      inputSchema: updateUserToolInputSchema,
      execute: async (input) => {
        try {
          const { id, ...fields } = input;
          if (fields.status === 'inactive' && id === me.id) {
            throw new Error(API_MESSAGES.CANNOT_DEACTIVATE_SELF_ACCOUNT);
          }
          const user = await updateUser(db, {
            id,
            name: fields.name,
            email: fields.email,
            bio: fields.bio,
            ...(fields.status !== undefined ? { status: fields.status } : {}),
            ...(fields.date_of_birth !== undefined
              ? {
                  date_of_birth:
                    fields.date_of_birth === '' || fields.date_of_birth === null
                      ? null
                      : fields.date_of_birth,
                }
              : {}),
          });
          if (!user) throw new Error(API_MESSAGES.USER_NOT_FOUND);
          return { ok: true as const, user };
        } catch (error) {
          return {
            ok: false as const,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    }),
    deleteUser: tool({
      description: CHAT_TOOL_MESSAGES.DELETE_USER,
      inputSchema: userIdPayloadSchema,
      execute: async (input) => {
        const workflow = createHumanInLoopWorkflow(latestText, 'deleteUser');
        const result = await workflow(input, async () => {
          const { deleted } = await deleteUser(db, input.id);
          return { ok: deleted, id: input.id };
        });
        if (!result.ok) {
          if ('requiresConfirmation' in result) return result;
          return { ok: false as const, error: result.error };
        }
        return result.data;
      },
    }),
  } as const;

  return { memberTools, adminTools } as const;
};
