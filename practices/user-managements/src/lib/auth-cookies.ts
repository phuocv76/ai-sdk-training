import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Constants
import { DATABASE_MESSAGES } from "@/constants/messages";

// Libraries
import { getUserForSession } from "@/lib/sessions";
import type { User } from "@/lib/users";

export const SESSION_COOKIE = "um_session";

export const SESSION_COOKIE_SETTINGS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

/**
 * Resolves the bound D1 database from the Cloudflare context.
 * @returns Either `{ db }` or an HTTP-style `{ error, status }` when misconfigured or unavailable.
 */
export async function requireDatabase(): Promise<
  { db: D1Database } | { error: string; status: 500 | 503 }
> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.DB) {
      return {
        error: DATABASE_MESSAGES.D1_BINDING_MISSING,
        status: 500,
      };
    }
    return { db: env.DB };
  } catch {
    return { error: DATABASE_MESSAGES.UNAVAILABLE, status: 503 };
  }
}

/**
 * Returns the signed-in user from the session cookie and database (Route Handlers).
 * @param prisma Active Prisma client for the current request.
 */
export async function resolveSessionUser(
  db: D1Database,
): Promise<User | null> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  return getUserForSession(db, sid);
}
