import { NextResponse } from "next/server";

import { userResponseBody } from "@/lib/domain/user";
import { requireDatabase, resolveSessionUser } from "@/server/auth/cookies";

export const dynamic = "force-dynamic";

/**
 * Current session user serialized for client bootstrap (`/api/auth/me`).
 * @returns `{ user }` body; when DB unavailable includes `error` and 503 status.
 */
export const GET = async () => {
  const dbCtx = await requireDatabase();
  if ("error" in dbCtx) {
    return NextResponse.json(
      { user: null, error: dbCtx.error },
      { status: 503 },
    );
  }

  const user = await resolveSessionUser(dbCtx.db);
  return NextResponse.json({
    user: user ? userResponseBody(user) : null,
  });
};
