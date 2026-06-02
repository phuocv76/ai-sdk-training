import { NextResponse } from "next/server";

// Constants
import { API_MESSAGES } from "@/server/constants/messages";

import { userResponseBody } from "@/lib/domain/user";
import {
  requireDatabase,
  resolveSessionUser,
} from "@/server/auth/cookies";
import { getUser } from "@/server/users/repository";

export const dynamic = "force-dynamic";

/**
 * Fetches one user: admins see anyone; members see only themselves.
 * @param ctx Route context with `{ id }` param.
 */
export const GET = async (
  _: Request,
  ctx: { params: Promise<{ id: string }> },
) => {
  const { id } = await ctx.params;
  const dbCtx = await requireDatabase();
  if ("error" in dbCtx) {
    return NextResponse.json({ error: dbCtx.error }, { status: dbCtx.status });
  }

  const me = await resolveSessionUser(dbCtx.db);
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

  const user = await getUser(dbCtx.db, id);
  if (!user) {
    return NextResponse.json(
      { error: API_MESSAGES.USER_NOT_FOUND },
      { status: 404 },
    );
  }

  return NextResponse.json({ user: userResponseBody(user) });
};
