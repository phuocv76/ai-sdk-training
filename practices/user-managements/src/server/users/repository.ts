// Constants
import { USER_DOMAIN_ERRORS } from "@/server/constants/messages";

// Domain
import { normalizeDirectoryDisplayNameKey } from "@/lib/directory/display-name-match";
import type { User, UserRole, UserStatus } from "@/lib/domain/user";

// Server
import { hashPassword } from "@/server/auth/password";

const DEFAULT_NEW_USER_PASSWORD = "Abcd@123";

/**
 * Maps a raw role string from storage to the supported `UserRole` union.
 * @param role Stored role value (any string).
 * @returns `"admin"` only when input is exactly `"admin"`; otherwise `"member"`.
 */
const normalizeRole = (role: string): UserRole =>
  role === "admin" ? "admin" : "member";

/**
 * Maps stored status text to `UserStatus` (defaults unknown values to active).
 */
const normalizeUserStatus = (raw: string): UserStatus => {
  const s = raw.trim().toLowerCase();
  return s === "inactive" ? "inactive" : "active";
};

type UserAttrs = Omit<User, "role"> & { role: string };

const isUniqueEmailViolation = (error: unknown): boolean =>
  error instanceof Error &&
  error.message.toLowerCase().includes("unique");

/**
 * Converts a Prisma user row (with string role) into the app `User` shape.
 * @param row User fields as returned from Prisma.
 */
const mapPrismaUser = (row: UserAttrs): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: normalizeRole(row.role),
  status: normalizeUserStatus(row.status ?? "active"),
  created_at: row.created_at,
  date_of_birth: row.date_of_birth ?? null,
  bio: row.bio ?? null,
});

/**
 * Applies trim / empty-string-to-null semantics for optional profile PATCH fields.
 * @param v Incoming field value (`undefined` means leave unchanged).
 * @param existing Current stored value when omitted from input.
 */
const normalizeProfileString = (
  v: string | null | undefined,
  existing: string | null,
): string | null => {
  if (v === undefined) return existing;
  if (v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
};

/**
 * Merges partial profile updates with an existing user using shared normalization rules.
 * @param input Partial profile fields from the caller.
 * @param existing Full user row used for omitted fields.
 */
const mergeProfileInputs = (
  input: {
    date_of_birth?: string | null;
    bio?: string | null;
  },
  existing: User,
): {
  date_of_birth: string | null;
  bio: string | null;
} => ({
  date_of_birth: normalizeProfileString(
    input.date_of_birth,
    existing.date_of_birth,
  ),
  bio: normalizeProfileString(input.bio, existing.bio),
});

/**
 * Lists every user ordered by newest `created_at` first.
 * @param prisma Active Prisma client.
 */
export const listUsers = async (db: D1Database): Promise<User[]> => {
  const rows = (await db
    .prepare(
      "SELECT id, name, email, role, status, created_at, date_of_birth, bio FROM users ORDER BY created_at DESC",
    )
    .all()) as { results?: UserAttrs[] };
  return (rows.results ?? []).map((r) => mapPrismaUser(r));
};

/**
 * Everyone whose display name matches `name` using {@link normalizeDirectoryDisplayNameKey}.
 */
export const listUsersSharingDisplayNameKey = async (
  db: D1Database,
  name: string,
): Promise<User[]> => {
  const key = normalizeDirectoryDisplayNameKey(name);
  const all = await listUsers(db);
  return all.filter(
    (u) => normalizeDirectoryDisplayNameKey(u.name) === key,
  );
};

/**
 * Loads a single user by primary key.
 * @param prisma Active Prisma client.
 * @param id User id (UUID).
 * @returns The user or `null` when missing.
 */
export const getUser = async (
  db: D1Database,
  id: string,
): Promise<User | null> => {
  const row = (await db
    .prepare(
      "SELECT id, name, email, role, status, created_at, date_of_birth, bio FROM users WHERE id = ?1 LIMIT 1",
    )
    .bind(id)
    .first()) as UserAttrs | null;
  return row ? mapPrismaUser(row) : null;
};

/**
 * Loads a directory user by email using the same normalization as login/signup (`trim`, lowercase).
 */
export const getUserByEmail = async (
  db: D1Database,
  email: string,
): Promise<User | null> => {
  const norm = email.trim().toLowerCase();
  const row = (await db
    .prepare(
      "SELECT id, name, email, role, status, created_at, date_of_birth, bio FROM users WHERE email = ?1 LIMIT 1",
    )
    .bind(norm)
    .first()) as UserAttrs | null;
  return row ? mapPrismaUser(row) : null;
};

/**
 * Counts users whose role is `admin` (bootstrap / first signup).
 * @param prisma Active Prisma client.
 */
export const countAdmins = async (db: D1Database): Promise<number> => {
  const row = (await db
    .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
    .first()) as { count: number } | null;
  return Number(row?.count ?? 0);
};

/**
 * Finds a user by normalized email including `password` for login.
 * @param prisma Active Prisma client.
 * @param email Raw email (trimmed/lowercased internally).
 */
export const getUserWithSecret = async (
  db: D1Database,
  email: string,
): Promise<(User & { password: string | null }) | null> => {
  const emailNorm = email.trim().toLowerCase();
  const row = (await db
    .prepare(
      "SELECT id, name, email, role, status, created_at, date_of_birth, bio, password FROM users WHERE email = ?1 LIMIT 1",
    )
    .bind(emailNorm)
    .first()) as (UserAttrs & { password: string | null }) | null;
  if (!row) return null;
  const { password, ...rest } = row;
  return { ...mapPrismaUser(rest), password };
};

/**
 * Creates a member user with a default password and profile fields.
 * @param prisma Active Prisma client.
 * @param input Display name and unique email.
 * @throws When email violates unique constraint.
 */
export const createUser = async (
  db: D1Database,
  input: { name: string; email: string; date_of_birth: string; bio?: string },
): Promise<User> => {
  const id = crypto.randomUUID();
  const created_at = Date.now();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const date_of_birth = input.date_of_birth.trim();
  const bio = input.bio?.trim();
  const password = await hashPassword(DEFAULT_NEW_USER_PASSWORD);
  try {
    await db
      .prepare(
        "INSERT INTO users (id, name, email, created_at, password, role, status, date_of_birth, bio) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
      )
      .bind(
        id,
        name,
        email,
        created_at,
        password,
        "member",
        "active",
        date_of_birth,
        bio ? bio : null,
      )
      .run();
  } catch (e) {
    if (isUniqueEmailViolation(e)) {
      throw new Error(USER_DOMAIN_ERRORS.EMAIL_ALREADY_IN_USE);
    }
    throw e;
  }
  const u = await getUser(db, id);
  if (!u) throw new Error(USER_DOMAIN_ERRORS.FAILED_TO_READ_CREATED_USER);
  return u;
};

/**
 * Registers a full account with password hash and explicit role.
 * @param prisma Active Prisma client.
 * @param input Name, email, hash, and role (e.g. first admin).
 * @throws On unique email conflict.
 */
export const registerUserAccount = async (
  db: D1Database,
  input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  },
): Promise<User> => {
  const id = crypto.randomUUID();
  const created_at = Date.now();
  const resolvedName = input.name.trim();
  const email = input.email.trim().toLowerCase();

  try {
    await db
      .prepare(
        "INSERT INTO users (id, name, email, created_at, password, role, status, date_of_birth, bio) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL, NULL)",
      )
      .bind(id, resolvedName, email, created_at, input.password, input.role, "active")
      .run();
  } catch (e) {
    if (isUniqueEmailViolation(e)) {
      throw new Error(USER_DOMAIN_ERRORS.EMAIL_ALREADY_REGISTERED);
    }
    throw e;
  }

  const u = await getUser(db, id);
  if (!u) throw new Error(USER_DOMAIN_ERRORS.FAILED_TO_READ_REGISTERED_USER);
  return u;
};

/**
 * Updates identity and/or profile fields for any user (admin tooling).
 * @param prisma Active Prisma client.
 * @param input User id plus optional patches.
 * @returns Updated user, `null` if id missing.
 * @throws On unique email conflict.
 */
export const updateUser = async (
  db: D1Database,
  input: {
    id: string;
    name?: string;
    email?: string;
    date_of_birth?: string | null;
    bio?: string | null;
    status?: UserStatus;
  },
): Promise<User | null> => {
  const existing = await getUser(db, input.id);
  if (!existing) return null;
  const name =
    input.name !== undefined ? input.name.trim() : existing.name;
  const email = (input.email ?? existing.email).trim().toLowerCase();
  const { date_of_birth, bio } = mergeProfileInputs(input, existing);
  const nextStatus =
    input.status !== undefined ? input.status : existing.status;
  const becomesInactive =
    existing.status === "active" && nextStatus === "inactive";
  try {
    await db
      .prepare(
        "UPDATE users SET name = ?1, email = ?2, date_of_birth = ?3, bio = ?4, status = ?5 WHERE id = ?6",
      )
      .bind(name, email, date_of_birth, bio, nextStatus, input.id)
      .run();
  } catch (e) {
    if (isUniqueEmailViolation(e)) {
      throw new Error(USER_DOMAIN_ERRORS.EMAIL_ALREADY_IN_USE);
    }
    throw e;
  }
  if (becomesInactive) {
    await db
      .prepare("DELETE FROM sessions WHERE user_id = ?1")
      .bind(input.id)
      .run();
  }
  return getUser(db, input.id);
};

/**
 * Member self-service: updates only profile columns for `userId`.
 * @param prisma Active Prisma client.
 * @param userId Session user id.
 * @param input Partial profile fields.
 */
export const updateMemberProfile = async (
  db: D1Database,
  userId: string,
  input: {
    name?: string;
    date_of_birth?: string | null;
    bio?: string | null;
  },
): Promise<User | null> => {
  const existing = await getUser(db, userId);
  if (!existing) return null;
  return updateUser(db, { id: userId, ...input });
};

/**
 * Deletes a user row when the id matches.
 * @param prisma Active Prisma client.
 * @param id User primary key.
 * @returns Whether any row was removed.
 */
export const deleteUser = async (
  db: D1Database,
  id: string,
): Promise<{ deleted: boolean }> => {
  const result = await db.prepare("DELETE FROM users WHERE id = ?1").bind(id).run();
  return { deleted: Number(result.meta.changes ?? 0) > 0 };
};
