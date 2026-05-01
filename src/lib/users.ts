import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";

import { UI_SYMBOLS, USER_DOMAIN_ERRORS } from "@/constants/messages";
import { UNIQUE_CONSTRAINT_VIOLATION } from "@/constants/prisma-error-codes";

export type UserRole = "admin" | "member";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: number;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  bio: string | null;
};

/**
 * Maps a raw role string from storage to the supported `UserRole` union.
 * @param role Stored role value (any string).
 * @returns `"admin"` only when input is exactly `"admin"`; otherwise `"member"`.
 */
function normalizeRole(role: string): UserRole {
  return role === "admin" ? "admin" : "member";
}

type UserAttrs = Omit<User, "role"> & { role: string };

/**
 * Converts a Prisma user row (with string role) into the app `User` shape.
 * @param row User fields as returned from Prisma.
 */
function mapPrismaUser(row: UserAttrs): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: normalizeRole(row.role),
    created_at: row.created_at,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    date_of_birth: row.date_of_birth ?? null,
    bio: row.bio ?? null,
  };
}

/**
 * Display name prefers first + last name, then legacy `name`.
 * @param user Subset of user with name fields.
 * @returns Combined given name or `"?"` when all are blank.
 */
export function displayName(
  user: Pick<User, "first_name" | "last_name" | "name">,
): string {
  const a = (user.first_name ?? "").trim();
  const b = (user.last_name ?? "").trim();
  const combined = `${a} ${b}`.trim();
  return combined || user.name.trim() || UI_SYMBOLS.UNKNOWN_INITIAL;
}

/**
 * Applies trim / empty-string-to-null semantics for optional profile PATCH fields.
 * @param v Incoming field value (`undefined` means leave unchanged).
 * @param existing Current stored value when omitted from input.
 */
function normalizeProfileString(
  v: string | null | undefined,
  existing: string | null,
): string | null {
  if (v === undefined) return existing;
  if (v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/**
 * Merges partial profile updates with an existing user using shared normalization rules.
 * @param input Partial profile fields from the caller.
 * @param existing Full user row used for omitted fields.
 */
function mergeProfileInputs(
  input: {
    first_name?: string | null;
    last_name?: string | null;
    date_of_birth?: string | null;
    bio?: string | null;
  },
  existing: User,
): {
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  bio: string | null;
} {
  return {
    first_name: normalizeProfileString(input.first_name, existing.first_name),
    last_name: normalizeProfileString(input.last_name, existing.last_name),
    date_of_birth: normalizeProfileString(
      input.date_of_birth,
      existing.date_of_birth,
    ),
    bio: normalizeProfileString(input.bio, existing.bio),
  };
}

/**
 * Lists every user ordered by newest `created_at` first.
 * @param prisma Active Prisma client.
 */
export async function listUsers(prisma: PrismaClient): Promise<User[]> {
  const rows = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
  });
  return rows.map((r) => mapPrismaUser(r));
}

/**
 * Loads a single user by primary key.
 * @param prisma Active Prisma client.
 * @param id User id (UUID).
 * @returns The user or `null` when missing.
 */
export async function getUser(
  prisma: PrismaClient,
  id: string,
): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? mapPrismaUser(row) : null;
}

/**
 * Counts users whose role is `admin` (bootstrap / first signup).
 * @param prisma Active Prisma client.
 */
export async function countAdmins(prisma: PrismaClient): Promise<number> {
  return prisma.user.count({ where: { role: "admin" } });
}

/**
 * Finds a user by normalized email including `password_hash` for login.
 * @param prisma Active Prisma client.
 * @param email Raw email (trimmed/lowercased internally).
 */
export async function getUserWithSecret(
  prisma: PrismaClient,
  email: string,
): Promise<(User & { password_hash: string | null }) | null> {
  const emailNorm = email.trim().toLowerCase();
  const row = await prisma.user.findUnique({
    where: { email: emailNorm },
  });
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return { ...mapPrismaUser(rest), password_hash };
}

/**
 * Creates a directory-only user (no password) with default member role.
 * @param prisma Active Prisma client.
 * @param input Display name and unique email.
 * @throws When email violates unique constraint.
 */
export async function createUser(
  prisma: PrismaClient,
  input: { name: string; email: string },
): Promise<User> {
  const id = crypto.randomUUID();
  const created_at = Date.now();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  try {
    await prisma.user.create({
      data: {
        id,
        name,
        email,
        created_at,
        password_hash: null,
        role: "member",
        first_name: null,
        last_name: null,
        date_of_birth: null,
        bio: null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === UNIQUE_CONSTRAINT_VIOLATION) {
      throw new Error(USER_DOMAIN_ERRORS.EMAIL_ALREADY_IN_USE);
    }
    throw e;
  }
  const u = await getUser(prisma, id);
  if (!u) throw new Error(USER_DOMAIN_ERRORS.FAILED_TO_READ_CREATED_USER);
  return u;
}

/**
 * Registers a full account with password hash and explicit role.
 * @param prisma Active Prisma client.
 * @param input Name, email, hash, and role (e.g. first admin).
 * @throws On unique email conflict.
 */
export async function registerUserAccount(
  prisma: PrismaClient,
  input: {
    name: string;
    email: string;
    password_hash: string;
    role: UserRole;
  },
): Promise<User> {
  const id = crypto.randomUUID();
  const created_at = Date.now();
  const email = input.email.trim().toLowerCase();
  const parts = input.name.trim().split(/\s+/).filter(Boolean);
  const first_name = parts[0] ?? null;
  const last_name =
    parts.length > 1 ? parts.slice(1).join(" ") : null;

  try {
    await prisma.user.create({
      data: {
        id,
        name: input.name.trim(),
        email,
        created_at,
        password_hash: input.password_hash,
        role: input.role,
        first_name,
        last_name,
        date_of_birth: null,
        bio: null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === UNIQUE_CONSTRAINT_VIOLATION) {
      throw new Error(USER_DOMAIN_ERRORS.EMAIL_ALREADY_REGISTERED);
    }
    throw e;
  }

  const u = await getUser(prisma, id);
  if (!u) throw new Error(USER_DOMAIN_ERRORS.FAILED_TO_READ_REGISTERED_USER);
  return u;
}

/**
 * Updates identity and/or profile fields for any user (admin tooling).
 * @param prisma Active Prisma client.
 * @param input User id plus optional patches.
 * @returns Updated user, `null` if id missing.
 * @throws On unique email conflict.
 */
export async function updateUser(
  prisma: PrismaClient,
  input: {
    id: string;
    name?: string;
    email?: string;
    first_name?: string | null;
    last_name?: string | null;
    date_of_birth?: string | null;
    bio?: string | null;
  },
): Promise<User | null> {
  const existing = await getUser(prisma, input.id);
  if (!existing) return null;
  const name = input.name ?? existing.name;
  const email = (input.email ?? existing.email).trim().toLowerCase();
  const { first_name, last_name, date_of_birth, bio } = mergeProfileInputs(
    input,
    existing,
  );
  try {
    await prisma.user.update({
      where: { id: input.id },
      data: { name, email, first_name, last_name, date_of_birth, bio },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === UNIQUE_CONSTRAINT_VIOLATION) {
      throw new Error(USER_DOMAIN_ERRORS.EMAIL_ALREADY_IN_USE);
    }
    throw e;
  }
  return getUser(prisma, input.id);
}

/**
 * Member self-service: updates only profile columns for `userId`.
 * @param prisma Active Prisma client.
 * @param userId Session user id.
 * @param input Partial profile fields.
 */
export async function updateMemberProfile(
  prisma: PrismaClient,
  userId: string,
  input: {
    first_name?: string | null;
    last_name?: string | null;
    date_of_birth?: string | null;
    bio?: string | null;
  },
): Promise<User | null> {
  const existing = await getUser(prisma, userId);
  if (!existing) return null;
  return updateUser(prisma, { id: userId, ...input });
}

/**
 * Deletes a user row when the id matches.
 * @param prisma Active Prisma client.
 * @param id User primary key.
 * @returns Whether any row was removed.
 */
export async function deleteUser(
  prisma: PrismaClient,
  id: string,
): Promise<{ deleted: boolean }> {
  const res = await prisma.user.deleteMany({ where: { id } });
  return { deleted: res.count > 0 };
}

/**
 * JSON-safe user payload for APIs and chat tools (no secrets).
 * @param user Domain user record.
 */
export function userResponseBody(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    first_name: user.first_name,
    last_name: user.last_name,
    date_of_birth: user.date_of_birth,
    bio: user.bio,
  };
}

export type ClientUser = ReturnType<typeof userResponseBody>;
