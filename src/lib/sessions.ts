// Libraries
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
  db: D1Database,
  userId: string,
  ttlSeconds: number = WEEK_SEC,
): Promise<string> {
  const id = crypto.randomUUID();
  const expires_at = Date.now() + ttlSeconds * 1000;
  await db
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?1, ?2, ?3)")
    .bind(id, userId, expires_at)
    .run();
  return id;
}

/**
 * Resolves a non-expired session to the linked `User`, or `null`.
 * @param prisma Active Prisma client.
 * @param sessionId Session id from the cookie.
 */
export async function getUserForSession(
  db: D1Database,
  sessionId: string,
): Promise<User | null> {
  const now = Date.now();
  const session = (await db
    .prepare(
      "SELECT user_id FROM sessions WHERE id = ?1 AND expires_at > ?2 LIMIT 1",
    )
    .bind(sessionId, now)
    .first()) as { user_id: string } | null;
  if (!session) return null;
  return getUser(db, session.user_id);
}

/**
 * Deletes all session rows matching `sessionId` (idempotent sign-out).
 * @param prisma Active Prisma client.
 * @param sessionId Session id to revoke.
 */
export async function deleteSession(
  db: D1Database,
  sessionId: string,
) {
  await db.prepare("DELETE FROM sessions WHERE id = ?1").bind(sessionId).run();
}
