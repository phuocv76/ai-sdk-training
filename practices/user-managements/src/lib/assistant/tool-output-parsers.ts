import type { ClientUser } from '@/lib/domain/user';

export const tryParseClientUser = (u: unknown): ClientUser | null => {
  if (!u || typeof u !== 'object') return null;
  const user = u as Record<string, unknown>;
  if (
    typeof user.id !== 'string' ||
    typeof user.name !== 'string' ||
    typeof user.email !== 'string' ||
    typeof user.created_at !== 'number' ||
    typeof user.role !== 'string' ||
    (user.status !== 'active' && user.status !== 'inactive')
  ) {
    return null;
  }
  return u as ClientUser;
};

/** Parses `{ profile }` from getMyProfile tool output. */
export const parseGetMyProfileToolOutput = (output: unknown): ClientUser | null => {
  if (!output || typeof output !== 'object') return null;
  return tryParseClientUser((output as Record<string, unknown>).profile);
};

/** Parses `{ ok: true, user }` from createUser / updateUser tool output. */
export const parseOkUserToolOutput = (output: unknown): ClientUser | null => {
  if (!output || typeof output !== 'object') return null;
  const o = output as Record<string, unknown>;
  if (o.ok !== true) return null;
  return tryParseClientUser(o.user);
};

export const parseListUsersToolOutput = (output: unknown): ClientUser[] | null => {
  if (!output || typeof output !== 'object') return null;
  const raw = (output as Record<string, unknown>).users;
  if (!Array.isArray(raw)) return null;
  const users: ClientUser[] = [];
  for (const item of raw) {
    const parsed = tryParseClientUser(item);
    if (!parsed) return null;
    users.push(parsed);
  }
  return users;
};

export const parseConfirmationOutput = (
  output: unknown,
): { message: string; hint: string; preview: unknown } | null => {
  if (!output || typeof output !== 'object') return null;
  const o = output as Record<string, unknown>;
  if (o.requiresConfirmation !== true) return null;
  if (typeof o.message !== 'string' || typeof o.hint !== 'string') return null;
  return {
    message: o.message,
    hint: o.hint,
    preview: 'preview' in o ? o.preview : undefined,
  };
};

/** `updateUser` / `deleteUser` blocked until the admin picks a row among duplicate display names. */
export const parseAmbiguousDuplicateNameOutput = (
  output: unknown,
): { matches: ClientUser[]; message: string; hint: string } | null => {
  if (!output || typeof output !== 'object') return null;
  const o = output as Record<string, unknown>;
  if (o.ambiguousDisplayName !== true) return null;
  if (typeof o.message !== 'string' || typeof o.hint !== 'string') return null;
  const raw = o.matches;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const matches: ClientUser[] = [];
  for (const item of raw) {
    const u = tryParseClientUser(item);
    if (!u) return null;
    matches.push(u);
  }
  return { matches, message: o.message, hint: o.hint };
};
