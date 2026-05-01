import type { PrismaClient } from "@/generated/prisma/client";

import type { User } from "@/lib/users";
import { getUser } from "@/lib/users";

const WEEK_SEC = 60 * 60 * 24 * 7;

/**
 * Creates a new session row and returns its opaque id (cookie value).
 * @param prisma Active Prisma client.
 * @param userId User to attach.
 * @param ttlSeconds Session lifetime in seconds (default one week).
 */
export async function createSession(
  prisma: PrismaClient,
  userId: string,
  ttlSeconds: number = WEEK_SEC,
): Promise<string> {
  const id = crypto.randomUUID();
  const expires_at = Date.now() + ttlSeconds * 1000;
  await prisma.session.create({
    data: { id, user_id: userId, expires_at },
  });
  return id;
}

/**
 * Resolves a non-expired session to the linked `User`, or `null`.
 * @param prisma Active Prisma client.
 * @param sessionId Session id from the cookie.
 */
export async function getUserForSession(
  prisma: PrismaClient,
  sessionId: string,
): Promise<User | null> {
  const now = Date.now();
  const session = await prisma.session.findFirst({
    where: { id: sessionId, expires_at: { gt: now } },
    select: { user_id: true },
  });
  if (!session) return null;
  return getUser(prisma, session.user_id);
}

/**
 * Deletes all session rows matching `sessionId` (idempotent sign-out).
 * @param prisma Active Prisma client.
 * @param sessionId Session id to revoke.
 */
export async function deleteSession(
  prisma: PrismaClient,
  sessionId: string,
) {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}
