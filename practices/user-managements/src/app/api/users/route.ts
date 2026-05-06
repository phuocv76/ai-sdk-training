import { NextResponse } from "next/server";

// Constants
import { API_MESSAGES } from "@/constants/messages";

// Libraries
import {
  requireDatabase,
  resolveSessionUser,
} from "@/lib/auth-cookies";
import { listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

/**
 * Lists all users (admin only).
 * @returns `{ users }` or `{ error }` with appropriate HTTP status.
 */
export async function GET() {
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
  if (me.role !== "admin") {
    return NextResponse.json(
      { error: API_MESSAGES.ADMIN_LIST_USERS_ONLY },
      { status: 403 },
    );
  }

  try {
    const users = await listUsers(dbCtx.db);
    return NextResponse.json({ users });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : API_MESSAGES.UNKNOWN_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
