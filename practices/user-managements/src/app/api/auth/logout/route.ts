import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireDatabase, SESSION_COOKIE } from "@/server/auth/cookies";
import { deleteSession } from "@/server/auth/sessions";

export const dynamic = "force-dynamic";

/**
 * Deletes the DB session row (if present) and clears the session cookie.
 */
export const POST = async () => {
  const dbCtx = await requireDatabase();
  if ("error" in dbCtx) {
    return NextResponse.json({ error: dbCtx.error }, { status: dbCtx.status });
  }

  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (sid) {
    await deleteSession(dbCtx.db, sid);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
};
