import { NextResponse } from "next/server";
import { z } from "zod";

// Constants
import { API_MESSAGES } from "@/constants/messages";

// Libraries
import {
  requireDatabase,
  resolveSessionUser,
  SESSION_COOKIE,
  SESSION_COOKIE_SETTINGS,
  SESSION_MAX_AGE_SEC,
} from "@/lib/auth-cookies";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/sessions";
import { getUserWithSecret, userResponseBody } from "@/lib/users";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(256),
});

/**
 * Validates credentials and issues a signed session cookie (`um_session`).
 * @returns JSON `{ ok, user }` on success, or `{ error }` with 4xx status.
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
}
