"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Components
import { AssistantChatPopup } from "@/components/assistant/assistant-chat-popup";
import {
  ProfileFieldsDisplay,
  UserProfileModal,
} from "@/components/dashboard/user-profile-ui";
import { useAuth } from "@/components/providers/auth-session-provider";
import { useOpenAiApiKey } from "@/components/providers/openai-api-key-context";

// Constants
import {
  ACCOUNT_MESSAGES,
  DASHBOARD_MESSAGES,
  REQUEST_HEADERS,
  UI_SYMBOLS,
} from "@/constants/messages";

// Libraries
import { displayName } from "@/lib/users";
import type { User } from "@/lib/users";

/** Formats a millisecond epoch for table “joined” cells in the viewer locale. */
function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Avatar initials derived from the resolved display name. */
function initialsFromUser(u: Pick<User, "name">) {
  return initials(displayName(u));
}

/** Up to two letters for avatar chips; falls back to `UI_SYMBOLS.UNKNOWN_INITIAL`. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return UI_SYMBOLS.UNKNOWN_INITIAL;
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Deterministic HSL gradient from an arbitrary seed string (typically user id).
 * @param seed Stable per-user identifier used only for hashing hue.
 */
function avatarGradient(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 65%, 58%) 0%, hsl(${(hue + 40) % 360}, 70%, 45%) 100%)`;
}

/**
 * Main authenticated experience: stats, optional admin directory, streaming chat.
 */
export function UserDashboard() {
  const { user: currentUser, refresh } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const { apiKey: openAiApiKey } = useOpenAiApiKey();
  const openAiApiKeyRef = useRef(openAiApiKey);
  openAiApiKeyRef.current = openAiApiKey;

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        fetch: (input, init) =>
          fetch(input, { ...init, credentials: "include" }),
        headers: () => {
          const k = openAiApiKeyRef.current.trim();
          const headers: Record<string, string> = {};
          if (k) headers[REQUEST_HEADERS.OPENAI_API_KEY_OVERRIDE] = k;
          return headers;
        },
      }),
    [],
  );

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [profileDetailOpen, setProfileDetailOpen] = useState(false);
  const [profileDetailLoading, setProfileDetailLoading] = useState(false);
  const [profileDetailUser, setProfileDetailUser] = useState<User | null>(
    null,
  );
  const profileDetailSelectionRef = useRef<string | null>(null);

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  /** Fetches `/api/users` when the viewer is an admin (used on mount / refresh). */
  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const res = await fetch("/api/users", {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json()) as {
        users?: User[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setUsers(data.users ?? []);
    } catch (e) {
      setUsersError(
        e instanceof Error ? e.message : DASHBOARD_MESSAGES.FAILED_LOAD_USERS,
      );
    } finally {
      setLoadingUsers(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setLoadingUsers(false);
      setUsers([]);
      setUsersError(null);
      return;
    }
    void loadUsers();
  }, [isAdmin, loadUsers]);

  /** Loads the latest row for the profile drawer, ignoring stale responses. */
  const loadProfileDetail = useCallback(async (id: string) => {
    profileDetailSelectionRef.current = id;
    setProfileDetailLoading(true);
    setProfileDetailUser(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json()) as { user?: User; error?: string };
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      if (profileDetailSelectionRef.current === id) {
        setProfileDetailUser(data.user ?? null);
      }
    } catch {
      if (profileDetailSelectionRef.current === id) {
        setProfileDetailUser(null);
      }
    } finally {
      if (profileDetailSelectionRef.current === id) {
        setProfileDetailLoading(false);
      }
    }
  }, []);

  /** Opens the modal and hydrates from cache + network. */
  function openProfileForUser(user: User) {
    profileDetailSelectionRef.current = user.id;
    setProfileDetailUser(user);
    setProfileDetailOpen(true);
    void loadProfileDetail(user.id);
  }

  /** Clears selection and closes the modal. */
  function closeProfileDetail() {
    profileDetailSelectionRef.current = null;
    setProfileDetailOpen(false);
    setProfileDetailUser(null);
    setProfileDetailLoading(false);
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        displayName(u).toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  /** After an assistant turn, refresh session, directory, and any open profile. */
  async function refreshAfterChat() {
    await refresh();
    if (isAdmin) void loadUsers();
    const selId = profileDetailSelectionRef.current;
    if (selId && profileDetailOpen) void loadProfileDetail(selId);
  }

  const { messages, sendMessage, status, error } = useChat({
    transport: chatTransport,
    onFinish: () => {
      void refreshAfterChat();
    },
  });

  const busy = status === "streaming" || status === "submitted";

  /** Sends the composer text as the next user message when not busy. */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  const chatSubtitle = isAdmin ?
    DASHBOARD_MESSAGES.ADMIN_CHAT_SUBTITLE
  : DASHBOARD_MESSAGES.MEMBER_CHAT_SUBTITLE;

  const chatHint = isAdmin ?
    DASHBOARD_MESSAGES.CHAT_HINT_ADMIN
  : DASHBOARD_MESSAGES.CHAT_HINT_MEMBER;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 lg:gap-8">
      <UserProfileModal
        open={profileDetailOpen}
        loading={profileDetailLoading}
        user={profileDetailUser}
        onClose={closeProfileDetail}
      />

      {isAdmin ?
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-5 shadow-sm">
            <p className="text-sm font-medium text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.STAT_TOTAL_USERS}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {loadingUsers ? UI_SYMBOLS.EM_DASH : users.length}
            </p>
            <p className="mt-1 text-xs text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.STAT_PROFILES_NOTE}
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-5 shadow-sm">
            <p className="text-sm font-medium text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.STAT_DIRECTORY_STATUS}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {DASHBOARD_MESSAGES.STAT_LIVE}
            </p>
            <p className="mt-1 text-xs text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.STAT_ROWS_NOTE}
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <p className="text-sm font-medium text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.STAT_AI_ASSISTANT}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--dash-accent)]">
              {busy ? DASHBOARD_MESSAGES.STAT_WORKING : DASHBOARD_MESSAGES.STAT_READY}
            </p>
            <p className="mt-1 text-xs text-[var(--dash-muted)]">{chatSubtitle}</p>
          </article>
        </div>
      : <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-5 shadow-sm">
            <p className="text-sm font-medium text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.STAT_MY_PROFILE}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--dash-accent)]">
              {busy ? DASHBOARD_MESSAGES.STAT_WORKING : DASHBOARD_MESSAGES.STAT_ACTIVE}
            </p>
            <p className="mt-1 text-xs text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.STAT_FIELDS_SYNC_NOTE}
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-5 shadow-sm">
            <p className="text-sm font-medium text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.STAT_CHAT_UPDATES}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {DASHBOARD_MESSAGES.STAT_OPEN}
            </p>
            <p className="mt-1 text-xs text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.STAT_NATURAL_NOTE}
            </p>
          </article>
        </div>
      }

      <div className="grid gap-6 xl:grid-cols-8 xl:items-start">
        {!isAdmin && currentUser ?
          <section
            id="my-profile"
            className="flex flex-col rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] shadow-sm xl:col-span-3"
          >
            <header className="border-b border-[var(--dash-border)] p-5">
              <h2 className="text-lg font-semibold tracking-tight">
                {DASHBOARD_MESSAGES.YOUR_PROFILE_SECTION_TITLE}
              </h2>
              <p className="mt-1 text-sm text-[var(--dash-muted)]">
                {DASHBOARD_MESSAGES.YOUR_PROFILE_SECTION_BLURB}
              </p>
            </header>
            <div className="p-5">
              <ProfileFieldsDisplay user={currentUser} variant="compact" />
            </div>
          </section>
        : null}

        {isAdmin ?
          <section
            id="user-directory"
            className="flex min-h-0 flex-col rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] shadow-sm xl:col-span-5"
          >
            <header className="flex flex-col gap-4 border-b border-[var(--dash-border)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {DASHBOARD_MESSAGES.USERS_SECTION_TITLE}
                </h2>
                <p className="mt-0.5 text-sm text-[var(--dash-muted)]">
                  {DASHBOARD_MESSAGES.USERS_SECTION_BLURB}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--dash-muted)]">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={DASHBOARD_MESSAGES.SEARCH_PLACEHOLDER}
                    className="w-full rounded-xl border border-[var(--dash-border)] bg-[var(--background)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--dash-muted)] focus:border-[var(--dash-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--dash-accent)]/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void loadUsers()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--dash-border)] bg-[var(--background)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-sm transition-colors hover:border-[var(--dash-accent)]/40 hover:bg-[var(--dash-accent-soft)]"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {DASHBOARD_MESSAGES.REFRESH}
                </button>
              </div>
            </header>

            <div className="min-h-[280px] flex-1 overflow-auto">
              {loadingUsers ?
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--dash-muted)]">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--dash-accent)] border-t-transparent" />
                  <p className="text-sm">{DASHBOARD_MESSAGES.LOADING_DIRECTORY}</p>
                </div>
              : usersError ?
                <p className="p-6 text-sm text-red-600 dark:text-red-400">
                  {usersError}
                </p>
              : filteredUsers.length === 0 ?
                <div className="p-8 text-center">
                  <p className="text-sm text-[var(--dash-muted)]">
                    {users.length === 0 ?
                      DASHBOARD_MESSAGES.NO_USERS_EMPTY
                    : DASHBOARD_MESSAGES.NO_SEARCH_MATCHES}
                  </p>
                </div>
              : <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--dash-border)] bg-[var(--background)]/80 text-xs font-semibold uppercase tracking-wider text-[var(--dash-muted)]">
                        <th className="px-5 py-3.5">{DASHBOARD_MESSAGES.COL_USER}</th>
                        <th className="hidden px-5 py-3.5 lg:table-cell">
                          {DASHBOARD_MESSAGES.COL_DOB}
                        </th>
                        <th className="hidden px-5 py-3.5 md:table-cell">
                          {DASHBOARD_MESSAGES.COL_ROLE}
                        </th>
                        <th className="px-5 py-3.5">{DASHBOARD_MESSAGES.COL_STATUS}</th>
                        <th className="hidden whitespace-nowrap px-5 py-3.5 lg:table-cell">
                          {DASHBOARD_MESSAGES.COL_JOINED}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--dash-border)]">
                      {filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openProfileForUser(u)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openProfileForUser(u);
                            }
                          }}
                          className="cursor-pointer transition-colors hover:bg-[var(--background)]/60"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
                                style={{ background: avatarGradient(u.id) }}
                              >
                                {initialsFromUser(u)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-[var(--foreground)]">
                                  {displayName(u)}
                                </p>
                                <p className="truncate text-xs text-[var(--dash-muted)]">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-5 py-4 text-[var(--dash-muted)] lg:table-cell">
                            {u.date_of_birth ?? UI_SYMBOLS.EM_DASH}
                          </td>
                          <td className="hidden px-5 py-4 md:table-cell">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "admin"
                                  ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                                  : "text-[var(--dash-muted)]"
                                }`}
                            >
                              {u.role === "admin" ?
                                ACCOUNT_MESSAGES.ROLE_ADMIN
                              : ACCOUNT_MESSAGES.ROLE_MEMBER}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                              {DASHBOARD_MESSAGES.ROW_STATUS_ACTIVE}
                            </span>
                          </td>
                          <td className="hidden whitespace-nowrap px-5 py-4 text-[var(--dash-muted)] lg:table-cell">
                            {formatTime(u.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            </div>
            <footer className="border-t border-[var(--dash-border)] px-5 py-3 text-xs text-[var(--dash-muted)]">
              {DASHBOARD_MESSAGES.FOOTER_SHOWING_PREFIX}
              {filteredUsers.length}
              {DASHBOARD_MESSAGES.FOOTER_OF}
              {users.length}
              {DASHBOARD_MESSAGES.FOOTER_USERS}
              {search.trim() ? DASHBOARD_MESSAGES.FOOTER_FILTERED : ""}
            </footer>
          </section>
        : null}

      </div>

      <AssistantChatPopup
        isAdmin={isAdmin}
        currentUser={currentUser ?? null}
        messages={messages}
        chatHint={chatHint}
        busy={busy}
        errorMessage={error?.message}
        input={input}
        setInput={setInput}
        onSubmit={onSubmit}
      />
    </div>
  );
}
