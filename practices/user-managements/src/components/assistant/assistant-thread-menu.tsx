'use client';

import { useState } from 'react';

import { DASHBOARD_MESSAGES } from '@/constants/messages';
import type { ChatThreadSummary } from '@/hooks/use-chat-threads';

type AssistantThreadMenuProps = {
  threads: ChatThreadSummary[];
  activeThreadId: string | null;
  loading: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

/**
 * Compact conversation switcher for the assistant popup: a toggle button that
 * reveals the user's saved threads with select / delete / new-chat actions.
 */
export const AssistantThreadMenu = ({
  threads,
  activeThreadId,
  loading,
  busy,
  onSelect,
  onNew,
  onDelete,
}: AssistantThreadMenuProps) => {
  const [open, setOpen] = useState(false);

  const activeTitle =
    threads.find((t) => t.id === activeThreadId)?.title ??
    DASHBOARD_MESSAGES.THREADS_NEW_CHAT;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={DASHBOARD_MESSAGES.THREADS_OPEN_ARIA}
        className="inline-flex h-7 max-w-[10rem] items-center gap-1.5 rounded-md border border-[var(--dash-border)] bg-[var(--background)] px-2 text-[11px] font-semibold leading-none text-[var(--foreground)] transition hover:border-[var(--dash-accent)]"
      >
        <svg
          className="h-3.5 w-3.5 shrink-0 text-[var(--dash-accent)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h8M8 14h5m-9 7l1.6-3.2A9 9 0 1121 12a9 9 0 01-13.4 7.8L4 21z"
          />
        </svg>
        <span className="truncate">{activeTitle}</span>
        <svg
          className="h-3 w-3 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 top-9 z-50 w-72 max-w-[80vw] overflow-hidden rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--dash-border)] px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.THREADS_MENU_TITLE}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onNew();
                setOpen(false);
              }}
              aria-label={DASHBOARD_MESSAGES.THREADS_NEW_CHAT_ARIA}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--dash-accent)] px-2 py-1 text-[11px] font-semibold leading-none text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + {DASHBOARD_MESSAGES.THREADS_NEW_CHAT}
            </button>
          </div>

          <div className="max-h-64 overflow-auto py-1">
            {loading ? (
              <p className="px-3 py-3 text-xs text-[var(--dash-muted)]">
                {DASHBOARD_MESSAGES.THREADS_LOADING}
              </p>
            ) : threads.length === 0 ? (
              <p className="px-3 py-3 text-xs text-[var(--dash-muted)]">
                {DASHBOARD_MESSAGES.THREADS_EMPTY}
              </p>
            ) : (
              threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    className={`group flex items-center gap-2 px-2 ${
                      isActive ? 'bg-[var(--dash-accent-soft)]' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(thread.id);
                        setOpen(false);
                      }}
                      className="min-w-0 flex-1 truncate rounded-md px-1.5 py-2 text-left text-xs font-medium text-[var(--foreground)] transition hover:text-[var(--dash-accent)]"
                      title={thread.title}
                    >
                      {thread.title || DASHBOARD_MESSAGES.THREADS_UNTITLED}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDelete(thread.id)}
                      aria-label={DASHBOARD_MESSAGES.THREADS_DELETE_ARIA}
                      className="shrink-0 rounded-md p-1 text-[var(--dash-muted)] opacity-0 transition hover:text-red-500 focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
