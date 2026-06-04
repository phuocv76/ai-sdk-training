// External libraries
import { tool } from 'ai';

// Constants
import {
  CHAT_HUMAN_CONFIRM_MESSAGES,
} from '@/constants/messages';
import {
  API_MESSAGES,
  CHAT_TOOL_MESSAGES,
  USER_DOMAIN_ERRORS,
} from '@/server/constants/messages';

// Domain
import { buildUserUpdatePreview } from '@/lib/assistant/user-update-preview';
import { sanitizeUserUpdateToolInput } from '@/lib/user/profile-patch';
import { userLatestTextIdentifiesDirectoryRecord } from '@/lib/directory/display-name-match';
import { userResponseBody, type User } from '@/lib/domain/user';
import {
  createUserToolInputSchema,
  deleteUserToolInputSchema,
  emptyObjectSchema,
  findUserByEmailPayloadSchema,
  userEmailSchema,
  updateMyProfileToolInputSchema,
  updateUserToolInputSchema,
  userIdPayloadSchema,
} from '@/lib/schemas/user-management-schemas';

// Server
import {
  createUser,
  deleteUser,
  getUser,
  getUserByEmail,
  listUsers,
  listUsersSharingDisplayNameKey,
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

const INVALID_EMAIL_FORMAT_ERROR =
  'invalid-format: Invalid email address. Please use a valid format like name@example.com.';

/** Strip model-only mutation flag from preview payloads shown to the client. */
const stripHumanAffirmsFromToolInput = (input: unknown): unknown => {
  if (typeof input !== 'object' || input === null) return input;
  const { humanAffirmsExecute: _, ...rest } = input as Record<string, unknown>;
  return rest;
};

const readHumanAffirmsExecute = (input: unknown): boolean =>
  typeof input === 'object' &&
  input !== null &&
  (input as { humanAffirmsExecute?: boolean }).humanAffirmsExecute === true;

/**
 * If the latest user text clearly refuses, do not run execute even when the model
 * set humanAffirmsExecute (defense in depth).
 */
const looksLikeUserRefusal = (text: string): boolean => {
  const n = text.trim().toLowerCase();
  if (!n) return false;
  return /\b(?:no|nope|nah|never|don't|dont|stop|cancel|abort|reject|refused|disagree|wrong|hold on|wait)\b/.test(
    n,
  );
};

const shouldExecuteMutation = (latestText: string, input: unknown): boolean => {
  if (!readHumanAffirmsExecute(input)) return false;
  if (!latestText.trim()) return false;
  if (looksLikeUserRefusal(latestText)) return false;
  return true;
};

const DOB_ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const extractAgeYears = (text: string): number | null => {
  const m = text.match(/\b(\d{1,3})\s*(?:years?\s*old|yrs?\s*old|y\/o|yo)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0 || n > 130) return null;
  return n;
};

const ageFromDate = (
  year: number,
  month: number,
  day: number,
  now: Date,
): number => {
  let age = now.getFullYear() - year;
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();
  if (nowMonth < month || (nowMonth === month && nowDay < day)) age -= 1;
  return age;
};

/**
 * Guardrail for LLM DOB extraction:
 * when latest text includes explicit age (e.g. "22 years old"), ensure the
 * DOB year matches that age for the provided month/day.
 */
const normalizeCreateDobFromLatestText = (
  latestText: string,
  dateOfBirth: string | undefined,
): string | undefined => {
  if (typeof dateOfBirth !== 'string') return dateOfBirth;
  const m = dateOfBirth.trim().match(DOB_ISO_RE);
  if (!m) return dateOfBirth;

  const parsedAge = extractAgeYears(latestText);
  if (parsedAge === null) return dateOfBirth;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  const now = new Date();
  const inferredAge = ageFromDate(year, month, day, now);
  if (inferredAge === parsedAge) return dateOfBirth;

  let correctedYear = now.getFullYear() - parsedAge;
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();
  if (nowMonth < month || (nowMonth === month && nowDay < day)) {
    correctedYear -= 1;
  }
  if (correctedYear < 1900 || correctedYear > now.getFullYear()) {
    return dateOfBirth;
  }
  return `${String(correctedYear).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * Blocks directory mutations against an arbitrary id when several users share the
 * display name unless the latest user message already identifies that row.
 */
type DuplicateDirectoryNameGate =
  | { kind: 'proceed' }
  | {
      kind: 'ambiguous';
      matches: ReturnType<typeof userResponseBody>[];
      message: string;
      hint: string;
    };

const rejectDuplicateDirectoryNameUnlessDisambiguated = async (
  db: D1Database,
  latestText: string,
  target: User,
  affirmsExecute: boolean,
): Promise<DuplicateDirectoryNameGate> => {
  if (
    affirmsExecute &&
    latestText.trim() &&
    !looksLikeUserRefusal(latestText)
  ) {
    return { kind: 'proceed' };
  }

  const shared = await listUsersSharingDisplayNameKey(db, target.name);
  if (shared.length <= 1) return { kind: 'proceed' };

  if (userLatestTextIdentifiesDirectoryRecord(latestText, target)) {
    return { kind: 'proceed' };
  }

  return {
    kind: 'ambiguous',
    matches: shared.map(userResponseBody),
    message: CHAT_HUMAN_CONFIRM_MESSAGES.DUPLICATE_DISPLAY_NAME_BLOCKED,
    hint: CHAT_HUMAN_CONFIRM_MESSAGES.DUPLICATE_DISPLAY_NAME_HINT,
  };
};

/** Human-in-loop: execute only when the model sets humanAffirmsExecute and text is not a refusal. */
const createHumanInLoopWorkflow: (
  latestText: string,
  action: string,
  options?: { buildPreview?: (input: unknown) => unknown },
) => <T>(
  input: unknown,
  run: () => Promise<T>,
) => Promise<WorkflowResult<T>> = (latestText, action, options) => {
  return async <T>(input: unknown, run: () => Promise<T>) => {
    if (!shouldExecuteMutation(latestText, input)) {
      return {
        ok: false,
        requiresConfirmation: true,
        action,
        message: CHAT_HUMAN_CONFIRM_MESSAGES.AWAITING,
        hint: CHAT_HUMAN_CONFIRM_MESSAGES.HOW_TO_REPLY,
        preview:
          options?.buildPreview?.(input) ??
          stripHumanAffirmsFromToolInput(input),
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
        const existing = await getUser(db, me.id);
        if (!existing) {
          return { ok: false as const, error: USER_DOMAIN_ERRORS.COULD_NOT_LOAD_PROFILE };
        }

        const workflow = createHumanInLoopWorkflow(
          latestText,
          'updateMyProfile',
          {
            buildPreview: (raw) => buildUserUpdatePreview(existing, raw),
          },
        );
        const sanitized = sanitizeUserUpdateToolInput(input);
        const result = await workflow(input, async () => {
          const patch: {
            name?: string;
            date_of_birth?: string | null;
            bio?: string | null;
          } = {};
          if (input.name !== undefined) patch.name = input.name;
          if ('date_of_birth' in sanitized) {
            patch.date_of_birth = sanitized.date_of_birth as string | null;
          }
          if ('bio' in sanitized) {
            patch.bio = sanitized.bio as string | null;
          }
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
    findUserByEmail: tool({
      description: CHAT_TOOL_MESSAGES.FIND_USER_BY_EMAIL,
      inputSchema: findUserByEmailPayloadSchema,
      execute: async ({ email }) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!userEmailSchema.safeParse(normalizedEmail).success) {
          return {
            ok: false as const,
            error: INVALID_EMAIL_FORMAT_ERROR,
          };
        }
        const user = await getUserByEmail(db, normalizedEmail);
        if (!user) {
          return {
            notFound: true as const,
            emailSearched: normalizedEmail,
          };
        }
        return { user: userResponseBody(user) };
      },
    }),
  } as const;

  const adminTools = {
    ...adminReadTools,
    createUser: tool({
      description: CHAT_TOOL_MESSAGES.CREATE_USER,
      inputSchema: createUserToolInputSchema,
      execute: async (input) => {
        const normalizedInput = {
          ...input,
          date_of_birth: normalizeCreateDobFromLatestText(
            latestText,
            input.date_of_birth,
          ),
        };
        const missingFields: string[] = [];
        if (
          typeof normalizedInput.name !== 'string' ||
          !normalizedInput.name.trim()
        ) {
          missingFields.push('name');
        }
        if (
          typeof normalizedInput.email !== 'string' ||
          !normalizedInput.email.trim()
        ) {
          missingFields.push('email');
        }
        if (
          typeof normalizedInput.date_of_birth !== 'string' ||
          !normalizedInput.date_of_birth.trim()
        ) {
          missingFields.push('date_of_birth');
        }
        if (missingFields.length > 0) {
          return {
            ok: false as const,
            error: `Missing required field(s) for createUser: ${missingFields.join(', ')}`,
          };
        }
        const normalizedName = (normalizedInput.name as string).trim();
        const normalizedEmail = (normalizedInput.email as string)
          .trim()
          .toLowerCase();
        const normalizedDob = (normalizedInput.date_of_birth as string).trim();
        if (!userEmailSchema.safeParse(normalizedEmail).success) {
          return {
            ok: false as const,
            error: INVALID_EMAIL_FORMAT_ERROR,
          };
        }

        const workflow = createHumanInLoopWorkflow(latestText, 'createUser');
        const result = await workflow(normalizedInput, async () => {
          const { humanAffirmsExecute, ...payload } = normalizedInput;
          void humanAffirmsExecute;
          return createUser(db, {
            ...payload,
            name: normalizedName,
            email: normalizedEmail,
            date_of_birth: normalizedDob,
          });
        });
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
        const target = await getUser(db, input.id);
        if (!target) return { ok: false as const, error: API_MESSAGES.USER_NOT_FOUND };

        const dup = await rejectDuplicateDirectoryNameUnlessDisambiguated(
          db,
          latestText,
          target,
          readHumanAffirmsExecute(input),
        );
        if (dup.kind === 'ambiguous') {
          return {
            ambiguousDisplayName: true as const,
            matches: dup.matches,
            message: dup.message,
            hint: dup.hint,
          };
        }

        const sanitizedFields = sanitizeUserUpdateToolInput(input);
        const workflow = createHumanInLoopWorkflow(latestText, 'updateUser', {
          buildPreview: (raw) => buildUserUpdatePreview(target, raw),
        });
        const result = await workflow(input, async () => {
          const { humanAffirmsExecute, id, ...fields } = input;
          void humanAffirmsExecute;
          if (fields.status === 'inactive' && id === me.id) {
            throw new Error(API_MESSAGES.CANNOT_DEACTIVATE_SELF_ACCOUNT);
          }
          const user = await updateUser(db, {
            id,
            name: fields.name,
            ...(fields.status !== undefined ? { status: fields.status } : {}),
            ...('date_of_birth' in sanitizedFields
              ? { date_of_birth: sanitizedFields.date_of_birth as string | null }
              : {}),
            ...('bio' in sanitizedFields
              ? { bio: sanitizedFields.bio as string | null }
              : {}),
          });
          if (!user) throw new Error(API_MESSAGES.USER_NOT_FOUND);
          return user;
        });
        if (!result.ok) {
          if ('requiresConfirmation' in result) return result;
          return { ok: false as const, error: result.error };
        }
        return { ok: true as const, user: result.data };
      },
    }),
    deleteUser: tool({
      description: CHAT_TOOL_MESSAGES.DELETE_USER,
      inputSchema: deleteUserToolInputSchema,
      execute: async (input) => {
        const target = await getUser(db, input.id);
        if (!target) return { ok: false as const, error: API_MESSAGES.USER_NOT_FOUND };

        const dup = await rejectDuplicateDirectoryNameUnlessDisambiguated(
          db,
          latestText,
          target,
          readHumanAffirmsExecute(input),
        );
        if (dup.kind === 'ambiguous') {
          return {
            ambiguousDisplayName: true as const,
            matches: dup.matches,
            message: dup.message,
            hint: dup.hint,
          };
        }

        const workflow = createHumanInLoopWorkflow(latestText, 'deleteUser');
        const result = await workflow(input, async () => {
          const { humanAffirmsExecute, id } = input;
          void humanAffirmsExecute;
          const { deleted } = await deleteUser(db, id);
          return { ok: deleted, id };
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
