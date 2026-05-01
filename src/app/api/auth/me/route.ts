import { NextResponse } from "next/server";

import { requireDatabase, resolveSessionUser } from "@/lib/auth-cookies";
import { withPrisma } from "@/lib/prisma";
import { userResponseBody } from "@/lib/users";

export const dynamic = "force-dynamic";

/**
 * Current session user serialized for client bootstrap (`/api/auth/me`).
 * @returns `{ user }` body; when DB unavailable includes `error` and 503 status.
 */
export async function GET() {
  const dbCtx = await requireDatabase();
  if ("error" in dbCtx) {
    return NextResponse.json(
      { user: null, error: dbCtx.error },
      { status: 503 },
    );
  }

  const user = await withPrisma(dbCtx.db, (p) => resolveSessionUser(p));
  return NextResponse.json({
    user: user ? userResponseBody(user) : null,
  });
}
