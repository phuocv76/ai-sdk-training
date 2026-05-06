import { NextResponse } from "next/server";

// Constants
import { API_MESSAGES } from "@/constants/messages";

import { signupBodySchema } from "@/lib/schemas/user-management-schemas";
import {
  requireDatabase,
  resolveSessionUser,
  SESSION_COOKIE,
  SESSION_COOKIE_SETTINGS,
  SESSION_MAX_AGE_SEC,
} from "@/server/auth/cookies";
import { hashPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/sessions";
import { countAdmins, registerUserAccount } from "@/server/users/repository";

export const dynamic = "force-dynamic";

/**
 * Registers a new account (first signup becomes admin) and starts a session.
 * @returns JSON `{ ok, user }` or `{ error }` with conflict/validation status.
 */
export const POST = async (req: Request) => {
  const parsed = signupBodySchema.safeParse(await req.json().catch(() => null));
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

  const { name, email, password } = parsed.data;
  const admins = await countAdmins(db);
  const role = admins === 0 ? ("admin" as const) : ("member" as const);

  try {
    const pw = await hashPassword(password);
    const user = await registerUserAccount(db, {
      name,
      email,
      password: pw,
      role,
    });

    const sessionId = await createSession(db, user.id);
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(SESSION_COOKIE, sessionId, {
      ...SESSION_COOKIE_SETTINGS,
      maxAge: SESSION_MAX_AGE_SEC,
    });
    return res;
  } catch {
    return NextResponse.json(
      {
        error: API_MESSAGES.REGISTER_CONFLICT,
      },
      { status: 409 },
    );
  }
};
