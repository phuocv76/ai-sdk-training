import { NextResponse } from "next/server";

import { API_MESSAGES } from "@/constants/messages";
import {
  requireDatabase,
  resolveSessionUser,
} from "@/lib/auth-cookies";
import { withPrisma } from "@/lib/prisma";
import { getUser, userResponseBody } from "@/lib/users";

export const dynamic = "force-dynamic";

/**
 * Fetches one user: admins see anyone; members see only themselves.
 * @param ctx Route context with `{ id }` param.
 */
export async function GET(
  _: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const dbCtx = await requireDatabase();
  if ("error" in dbCtx) {
    return NextResponse.json({ error: dbCtx.error }, { status: dbCtx.status });
  }

  const me = await withPrisma(dbCtx.db, (p) => resolveSessionUser(p));
  if (!me) {
    return NextResponse.json(
      { error: API_MESSAGES.UNAUTHORIZED },
      { status: 401 },
    );
  }
  if (me.role !== "admin" && me.id !== id) {
    return NextResponse.json(
      { error: API_MESSAGES.FORBIDDEN },
      { status: 403 },
    );
  }

  const user = await withPrisma(dbCtx.db, (p) => getUser(p, id));
  if (!user) {
    return NextResponse.json(
      { error: API_MESSAGES.USER_NOT_FOUND },
      { status: 404 },
    );
  }

  return NextResponse.json({ user: userResponseBody(user) });
}
