import type { UIMessage } from 'ai';

/** Default title for a freshly created thread before the first message is known. */
export const DEFAULT_THREAD_TITLE = 'New chat';

/** Max length of an auto-derived thread title (from the first user message). */
const MAX_TITLE_LENGTH = 60;

/** Thread metadata without the (potentially large) message payload. */
export type ChatThreadSummary = {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
};

/** A thread plus its persisted UI message history. */
export type ChatThreadWithMessages = ChatThreadSummary & {
  messages: UIMessage[];
};

type ChatThreadRow = {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
};

type ChatThreadMessagesRow = ChatThreadRow & { messages: string };

/**
 * Derives a short, single-line thread title from arbitrary text.
 * @param text Raw user message (or other source text).
 * @returns Trimmed/collapsed title, or {@link DEFAULT_THREAD_TITLE} when empty.
 */
export const deriveThreadTitle = (text: string): string => {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (!collapsed) return DEFAULT_THREAD_TITLE;
  return collapsed.length > MAX_TITLE_LENGTH
    ? `${collapsed.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`
    : collapsed;
};

const parseMessages = (raw: string): UIMessage[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
};

/**
 * Lists a user's threads (newest activity first) without message payloads.
 * @param db Active D1 database.
 * @param userId Owner whose threads to list.
 */
export const listChatThreads = async (
  db: D1Database,
  userId: string,
): Promise<ChatThreadSummary[]> => {
  const rows = (await db
    .prepare(
      `SELECT id, title, created_at, updated_at
       FROM chat_threads
       WHERE user_id = ?1
       ORDER BY updated_at DESC`,
    )
    .bind(userId)
    .all()) as { results?: ChatThreadRow[] };
  return rows.results ?? [];
};

/**
 * Creates an empty thread owned by `userId`.
 * @param title Optional initial title; falls back to {@link DEFAULT_THREAD_TITLE}.
 */
export const createChatThread = async (
  db: D1Database,
  userId: string,
  title?: string,
): Promise<ChatThreadSummary> => {
  const id = crypto.randomUUID();
  const now = Date.now();
  const resolvedTitle = title?.trim() || DEFAULT_THREAD_TITLE;
  await db
    .prepare(
      `INSERT INTO chat_threads (id, user_id, title, messages, created_at, updated_at)
       VALUES (?1, ?2, ?3, '[]', ?4, ?4)`,
    )
    .bind(id, userId, resolvedTitle, now)
    .run();
  return { id, title: resolvedTitle, created_at: now, updated_at: now };
};

/**
 * Loads a single owned thread with its message history.
 * @returns The thread, or `null` when missing or not owned by `userId`.
 */
export const getChatThread = async (
  db: D1Database,
  userId: string,
  id: string,
): Promise<ChatThreadWithMessages | null> => {
  const row = (await db
    .prepare(
      `SELECT id, title, messages, created_at, updated_at
       FROM chat_threads
       WHERE id = ?1 AND user_id = ?2
       LIMIT 1`,
    )
    .bind(id, userId)
    .first()) as ChatThreadMessagesRow | null;
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    created_at: row.created_at,
    updated_at: row.updated_at,
    messages: parseMessages(row.messages),
  };
};

/** Returns whether `id` exists and is owned by `userId`. */
export const chatThreadOwnedByUser = async (
  db: D1Database,
  userId: string,
  id: string,
): Promise<boolean> => {
  const row = await db
    .prepare(
      `SELECT 1 AS ok FROM chat_threads WHERE id = ?1 AND user_id = ?2 LIMIT 1`,
    )
    .bind(id, userId)
    .first<{ ok: number }>();
  return Boolean(row);
};

/**
 * Replaces a thread's stored message history and bumps `updated_at`.
 *
 * When the thread still has the default title, a title is derived from the
 * first user text so the sidebar shows something meaningful after the first turn.
 * No-op when the thread is missing or not owned by `userId`.
 */
export const saveChatThreadMessages = async (
  db: D1Database,
  userId: string,
  id: string,
  messages: UIMessage[],
): Promise<void> => {
  const existing = (await db
    .prepare(
      `SELECT title FROM chat_threads WHERE id = ?1 AND user_id = ?2 LIMIT 1`,
    )
    .bind(id, userId)
    .first()) as { title: string } | null;
  if (!existing) return;

  let title = existing.title;
  if (title === DEFAULT_THREAD_TITLE) {
    const firstUserText = firstUserMessageText(messages);
    if (firstUserText) title = deriveThreadTitle(firstUserText);
  }

  await db
    .prepare(
      `UPDATE chat_threads
       SET messages = ?1, title = ?2, updated_at = ?3
       WHERE id = ?4 AND user_id = ?5`,
    )
    .bind(JSON.stringify(messages), title, Date.now(), id, userId)
    .run();
};

/** Renames an owned thread; returns the updated summary or `null` when missing. */
export const renameChatThread = async (
  db: D1Database,
  userId: string,
  id: string,
  title: string,
): Promise<ChatThreadSummary | null> => {
  const resolvedTitle = title.trim() || DEFAULT_THREAD_TITLE;
  const result = await db
    .prepare(
      `UPDATE chat_threads SET title = ?1, updated_at = ?2
       WHERE id = ?3 AND user_id = ?4`,
    )
    .bind(resolvedTitle, Date.now(), id, userId)
    .run();
  if (Number(result.meta.changes ?? 0) === 0) return null;
  const row = (await db
    .prepare(
      `SELECT id, title, created_at, updated_at FROM chat_threads
       WHERE id = ?1 AND user_id = ?2 LIMIT 1`,
    )
    .bind(id, userId)
    .first()) as ChatThreadRow | null;
  return row;
};

/** Deletes an owned thread; returns whether a row was removed. */
export const deleteChatThread = async (
  db: D1Database,
  userId: string,
  id: string,
): Promise<{ deleted: boolean }> => {
  const result = await db
    .prepare(`DELETE FROM chat_threads WHERE id = ?1 AND user_id = ?2`)
    .bind(id, userId)
    .run();
  return { deleted: Number(result.meta.changes ?? 0) > 0 };
};

/** Extracts the first user message's plain text, used for auto-titling. */
const firstUserMessageText = (messages: UIMessage[]): string => {
  for (const msg of messages) {
    if (msg.role !== 'user') continue;
    const text = msg.parts
      .filter(
        (part): part is { type: 'text'; text: string } =>
          part.type === 'text' && typeof (part as { text?: unknown }).text === 'string',
      )
      .map((part) => part.text.trim())
      .filter(Boolean)
      .join(' ')
      .trim();
    if (text) return text;
  }
  return '';
};
