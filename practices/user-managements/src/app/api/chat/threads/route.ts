import { NextResponse } from 'next/server';

// Constants
import { API_MESSAGES } from '@/server/constants/messages';

// Server
import { requireDatabase, resolveSessionUser } from '@/server/auth/cookies';
import {
  createChatThread,
  listChatThreads,
} from '@/server/chat/threads-repository';

export const dynamic = 'force-dynamic';

/**
 * Lists the signed-in user's conversation threads (newest activity first).
 * @returns `{ threads }` or `{ error }` with the appropriate HTTP status.
 */
export const GET = async () => {
  const dbCtx = await requireDatabase();
  if ('error' in dbCtx) {
    return NextResponse.json({ error: dbCtx.error }, { status: dbCtx.status });
  }
  const me = await resolveSessionUser(dbCtx.db);
  if (!me) {
    return NextResponse.json(
      { error: API_MESSAGES.UNAUTHORIZED },
      { status: 401 },
    );
  }
  try {
    const threads = await listChatThreads(dbCtx.db, me.id);
    return NextResponse.json({ threads });
  } catch (e) {
    const message = e instanceof Error ? e.message : API_MESSAGES.UNKNOWN_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

/**
 * Creates a new conversation thread for the signed-in user.
 * @param req JSON body with optional `title`.
 * @returns `{ thread }` summary (without messages).
 */
export const POST = async (req: Request) => {
  const dbCtx = await requireDatabase();
  if ('error' in dbCtx) {
    return NextResponse.json({ error: dbCtx.error }, { status: dbCtx.status });
  }
  const me = await resolveSessionUser(dbCtx.db);
  if (!me) {
    return NextResponse.json(
      { error: API_MESSAGES.UNAUTHORIZED },
      { status: 401 },
    );
  }

  let title: string | undefined;
  try {
    const body = (await req.json()) as { title?: unknown };
    if (typeof body.title === 'string') title = body.title;
  } catch {
    // Empty/invalid body is fine; thread gets the default title.
  }

  try {
    const thread = await createChatThread(dbCtx.db, me.id, title);
    return NextResponse.json({ thread }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : API_MESSAGES.UNKNOWN_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
