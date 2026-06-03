"use client";

import type { UIMessage } from "ai";
import { startTransition, useCallback, useEffect, useState } from "react";

import { DASHBOARD_MESSAGES } from "@/constants/messages";

/** Thread metadata as returned by `/api/chat/threads` (no message payload). */
export type ChatThreadSummary = {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
};

type ThreadsResponse = { threads?: ChatThreadSummary[]; error?: string };
type ThreadResponse = {
  thread?: ChatThreadSummary & { messages?: UIMessage[] };
  error?: string;
};

/**
 * Client-side manager for the signed-in user's persisted conversation threads.
 *
 * Owns the thread list + loading/error state and exposes CRUD helpers that talk
 * to `/api/chat/threads`. Message hydration (loading a thread's history into the
 * chat) is returned as data so the caller can push it into `useChat`'s state.
 *
 * @param enabled When false, the hook stays idle (e.g. before auth resolves).
 */
export const useChatThreads = (enabled: boolean) => {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/threads", {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json()) as ThreadsResponse;
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setThreads(data.threads ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : DASHBOARD_MESSAGES.THREADS_FAILED_LOAD,
      );
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    startTransition(() => {
      void refresh();
    });
  }, [enabled, refresh]);

  /** Creates a new thread and prepends it to the list. */
  const createThread = useCallback(
    async (title?: string): Promise<ChatThreadSummary | null> => {
      try {
        const res = await fetch("/api/chat/threads", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(title ? { title } : {}),
        });
        const data = (await res.json()) as ThreadResponse;
        if (!res.ok || !data.thread) {
          throw new Error(data.error ?? res.statusText);
        }
        const { messages: _ignored, ...summary } = data.thread;
        void _ignored;
        setThreads((prev) => [summary, ...prev]);
        return summary;
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : DASHBOARD_MESSAGES.THREADS_FAILED_LOAD,
        );
        return null;
      }
    },
    [],
  );

  /** Loads a thread's persisted message history (empty array on failure). */
  const fetchThreadMessages = useCallback(
    async (id: string): Promise<UIMessage[]> => {
      try {
        const res = await fetch(`/api/chat/threads/${id}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await res.json()) as ThreadResponse;
        if (!res.ok || !data.thread) {
          throw new Error(data.error ?? res.statusText);
        }
        return data.thread.messages ?? [];
      } catch {
        return [];
      }
    },
    [],
  );

  /** Deletes a thread and removes it from the list. */
  const deleteThread = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/chat/threads/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) return false;
      setThreads((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    threads,
    loading,
    error,
    refresh,
    createThread,
    fetchThreadMessages,
    deleteThread,
  };
};
