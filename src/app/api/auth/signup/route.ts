import { NextResponse } from "next/server";
import { z } from "zod";

import { API_MESSAGES } from "@/constants/messages";
import {
  resolveSessionUser,
  requireDatabase,
  SESSION_COOKIE,
  SESSION_COOKIE_SETTINGS,
  SESSION_MAX_AGE_SEC,
} from "@/lib/auth-cookies";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/sessions";
import { countAdmins, registerUserAccount } from "@/lib/users";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).max(256),
});

/**
 * Registers a new account (first signup becomes admin) and starts a session.
 * @returns JSON `{ ok, user }` or `{ error }` with conflict/validation status.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
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
}
