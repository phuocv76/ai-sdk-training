import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireDatabase, SESSION_COOKIE } from "@/lib/auth-cookies";
import { withPrisma } from "@/lib/prisma";
import { deleteSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

/**
 * Deletes the DB session row (if present) and clears the session cookie.
 */
export async function POST() {
  const dbCtx = await requireDatabase();
  if ("error" in dbCtx) {
    return NextResponse.json({ error: dbCtx.error }, { status: dbCtx.status });
  }

  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (sid) {
    await withPrisma(dbCtx.db, (p) => deleteSession(p, sid));
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
