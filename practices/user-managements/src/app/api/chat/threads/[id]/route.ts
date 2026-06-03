import { NextResponse } from 'next/server';

// Constants
import { API_MESSAGES } from '@/server/constants/messages';

// Server
import { requireDatabase, resolveSessionUser } from '@/server/auth/cookies';
import {
  deleteChatThread,
  getChatThread,
  renameChatThread,
} from '@/server/chat/threads-repository';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Returns one owned thread with its full message history.
 */
export const GET = async (_: Request, ctx: RouteContext) => {
  const { id } = await ctx.params;
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
  const thread = await getChatThread(dbCtx.db, me.id, id);
  if (!thread) {
    return NextResponse.json(
      { error: API_MESSAGES.THREAD_NOT_FOUND },
      { status: 404 },
    );
  }
  return NextResponse.json({ thread });
};

/**
 * Renames an owned thread.
 * @param req JSON body with `title`.
 */
export const PATCH = async (req: Request, ctx: RouteContext) => {
  const { id } = await ctx.params;
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

  let title = '';
  try {
    const body = (await req.json()) as { title?: unknown };
    if (typeof body.title === 'string') title = body.title;
  } catch {
    // fall through to validation below
  }
  if (!title.trim()) {
    return NextResponse.json(
      { error: API_MESSAGES.THREAD_TITLE_REQUIRED },
      { status: 400 },
    );
  }

  const thread = await renameChatThread(dbCtx.db, me.id, id, title);
  if (!thread) {
    return NextResponse.json(
      { error: API_MESSAGES.THREAD_NOT_FOUND },
      { status: 404 },
    );
  }
  return NextResponse.json({ thread });
};

/**
 * Deletes an owned thread (idempotent: missing thread returns 404).
 */
export const DELETE = async (_: Request, ctx: RouteContext) => {
  const { id } = await ctx.params;
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
  const { deleted } = await deleteChatThread(dbCtx.db, me.id, id);
  if (!deleted) {
    return NextResponse.json(
      { error: API_MESSAGES.THREAD_NOT_FOUND },
      { status: 404 },
    );
  }
  return NextResponse.json({ deleted: true });
};
