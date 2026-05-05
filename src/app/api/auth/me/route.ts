import { NextResponse } from "next/server";

// Libraries
import { requireDatabase, resolveSessionUser } from "@/lib/auth-cookies";
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

  const user = await resolveSessionUser(dbCtx.db);
  return NextResponse.json({
    user: user ? userResponseBody(user) : null,
  });
}
