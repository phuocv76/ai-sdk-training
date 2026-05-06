import { NextResponse } from "next/server";

// Constants
import { API_MESSAGES } from "@/constants/messages";

// Domain
import { userResponseBody } from "@/lib/domain/user";
import { loginBodySchema } from "@/lib/schemas/user-management-schemas";
// Server
import {
  requireDatabase,
  resolveSessionUser,
  SESSION_COOKIE,
  SESSION_COOKIE_SETTINGS,
  SESSION_MAX_AGE_SEC,
} from "@/server/auth/cookies";
import { verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/sessions";
import { getUserWithSecret } from "@/server/users/repository";

export const dynamic = "force-dynamic";

/**
 * Validates credentials and issues a signed session cookie (`um_session`).
 * @returns JSON `{ ok, user }` on success, or `{ error }` with 4xx status.
 */
export const POST = async (req: Request) => {
  const parsed = loginBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: API_MESSAGES.INVALID_INPUT },
      { status: 400 },
    );
  }

  const dbCtx = await requireDatabase();
  if ("error" in dbCtx) {
    return NextResponse.json({ error: dbCtx.error }, { status: dbCtx.status });
  }
  const { db } = dbCtx;

  const existingAuth = await resolveSessionUser(db);
  if (existingAuth) {
    return NextResponse.json(
      { error: API_MESSAGES.ALREADY_SIGNED_IN },
      { status: 400 },
    );
  }

  try {
    const { email, password } = parsed.data;
    const row = await getUserWithSecret(db, email);
    const ok =
      row && row.password && (await verifyPassword(password, row.password));
    if (!ok) {
      return NextResponse.json(
        { error: API_MESSAGES.INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    if (row.status !== "active") {
      return NextResponse.json(
        { error: API_MESSAGES.ACCOUNT_INACTIVE },
        { status: 403 },
      );
    }

    const sessionId = await createSession(db, row.id);
    const { password: _p, ...u } = row;
    const res = NextResponse.json({
      ok: true,
      user: userResponseBody(u),
    });
    res.cookies.set(SESSION_COOKIE, sessionId, {
      ...SESSION_COOKIE_SETTINGS,
      maxAge: SESSION_MAX_AGE_SEC,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: API_MESSAGES.INVALID_CREDENTIALS },
      { status: 401 },
    );
  }
};
