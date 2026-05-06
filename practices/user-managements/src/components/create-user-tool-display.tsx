"use client";

import type { ReactNode } from "react";

import { getToolName, isToolUIPart } from "ai";
import type {
  DynamicToolUIPart,
  ToolUIPart,
  UIDataTypes,
  UIMessagePart,
  UITools,
} from "ai";

import {
  ACCOUNT_MESSAGES,
  DASHBOARD_MESSAGES,
  PROFILE_UI_MESSAGES,
  UI_SYMBOLS,
} from "@/constants/messages";
import { renderInlineMarkdownBold } from "@/lib/render-inline-markdown-bold";
import { displayName, type ClientUser } from "@/lib/users";

type AssistantToolPart = ToolUIPart | DynamicToolUIPart;

const tryParseClientUser = (u: unknown): ClientUser | null => {
  if (!u || typeof u !== "object") return null;
  const user = u as Record<string, unknown>;
  if (
    typeof user.id !== "string" ||
    typeof user.name !== "string" ||
    typeof user.email !== "string" ||
    typeof user.created_at !== "number" ||
    typeof user.role !== "string" ||
    (user.status !== "active" && user.status !== "inactive")
  ) {
    return null;
  }
  return u as ClientUser;
};

/** Parses `{ profile }` from getMyProfile tool output. */
const parseGetMyProfileToolOutput = (output: unknown): ClientUser | null => {
  if (!output || typeof output !== "object") return null;
  return tryParseClientUser((output as Record<string, unknown>).profile);
};

/** Parses `{ ok: true, user }` from createUser / updateUser tool output. */
const parseOkUserToolOutput = (output: unknown): ClientUser | null => {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  if (o.ok !== true) return null;
  return tryParseClientUser(o.user);
};

const parseListUsersToolOutput = (output: unknown): ClientUser[] | null => {
  if (!output || typeof output !== "object") return null;
  const raw = (output as Record<string, unknown>).users;
  if (!Array.isArray(raw)) return null;
  const users: ClientUser[] = [];
  for (const item of raw) {
    const parsed = tryParseClientUser(item);
    if (!parsed) return null;
    users.push(parsed);
  }
  return users;
};

const parseConfirmationOutput = (output: unknown): {
  message: string;
  hint: string;
} | null => {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  if (o.requiresConfirmation !== true) return null;
  if (typeof o.message !== "string" || typeof o.hint !== "string") return null;
  return { message: o.message, hint: o.hint };
};

const ToolPendingCard = ({
  title,
  message,
}: {
  title: string;
  message: ReactNode;
}) => (
  <div className="rounded-xl border border-dashed border-[var(--dash-border)] bg-[var(--background)]/80 px-3 py-3 text-sm text-[var(--dash-muted)]">
    <p className="font-mono text-[11px] font-semibold text-[var(--foreground)]">
      {title}
    </p>
    <p className="mt-1 text-xs">{message}</p>
  </div>
);

/**
 * When true, assistant prose for this message is hidden so only the directory result card shows.
 */
export function assistantMessageShouldHideProseForDirectoryResultCard(
  parts: unknown[],
): boolean {
  for (const raw of parts) {
    if (!isToolUIPart(raw as UIMessagePart<UIDataTypes, UITools>)) continue;
    const part = raw as ToolUIPart | DynamicToolUIPart;
    const toolName = getToolName(part);
    if (part.state !== "output-available") continue;
    const out = "output" in part ? part.output : undefined;
    if (
      toolName === "createUser" ||
      toolName === "updateUser" ||
      toolName === "updateMyProfile"
    ) {
      if (parseOkUserToolOutput(out)) return true;
    }
    if (toolName === "getMyProfile" && parseGetMyProfileToolOutput(out)) {
      return true;
    }
  }
  return false;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function formatJoinedLine(ms: number): string {
  const d = new Date(ms);
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const date = d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${time} • ${date}`;
}

function UserResultCard({
  user,
  variant,
}: {
  user: ClientUser;
  variant: "invited" | "updated" | "profile-loaded" | "profile-updated";
}) {
  const initials = initialsFromName(user.name);
  const dobDisplay =
    user.date_of_birth && user.date_of_birth.trim() !== "" ?
      user.date_of_birth
    : UI_SYMBOLS.EM_DASH;

  const badge =
    variant === "invited" ?
      DASHBOARD_MESSAGES.MEMBER_INVITED_CARD_BADGE
    : variant === "updated" ?
      DASHBOARD_MESSAGES.USER_UPDATED_CARD_BADGE
    : variant === "profile-loaded" ?
      DASHBOARD_MESSAGES.MEMBER_PROFILE_CARD_BADGE
    : DASHBOARD_MESSAGES.MEMBER_PROFILE_UPDATED_CARD_BADGE;
  const badgeClass =
    variant === "invited" || variant === "profile-loaded" ?
      "text-sky-600 dark:text-sky-400"
    : "text-violet-600 dark:text-violet-400";
  const shellClass =
    variant === "invited" || variant === "profile-loaded" ?
      "from-sky-50 to-[var(--dash-card)] dark:from-sky-950/35"
    : "from-violet-50 to-[var(--dash-card)] dark:from-violet-950/35";

  const successLine =
    variant === "invited" ?
      DASHBOARD_MESSAGES.MEMBER_INVITED_SUCCESS_LINE
    : variant === "updated" ?
      DASHBOARD_MESSAGES.USER_UPDATED_SUCCESS_LINE
    : variant === "profile-loaded" ?
      DASHBOARD_MESSAGES.MEMBER_PROFILE_LOADED_SUCCESS_LINE
    : DASHBOARD_MESSAGES.MEMBER_PROFILE_UPDATED_SUCCESS_LINE;

  const bioTrimmed = user.bio?.trim();

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl border border-[var(--dash-border)] bg-gradient-to-b ${shellClass} p-4 shadow-sm dark:to-[var(--dash-card)]`}
      >
        <p
          className={`text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}
        >
          {badge}
        </p>
        <div className="mt-3 flex gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-emerald-400/90 bg-gradient-to-br from-indigo-100 to-sky-100 text-sm font-bold text-[var(--foreground)] dark:from-indigo-950 dark:to-sky-950"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="font-semibold text-[var(--foreground)]">{user.name}</p>
            <p className="break-all text-xs text-[var(--foreground)]">
              {user.email}
            </p>
            <p className="text-xs text-[var(--dash-muted)]">
              <span className="font-medium text-[var(--foreground)]/80">
                {PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL}
              </span>{" "}
              <span className="text-[var(--foreground)]">{dobDisplay}</span>
            </p>
            <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--dash-muted)]">
              <span className="font-medium text-[var(--foreground)]/80">
                {PROFILE_UI_MESSAGES.ROLE_LABEL}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase leading-none ${user.role === "admin"
                    ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                    : "bg-[var(--foreground)]/10 text-[var(--foreground)]"
                  }`}
              >
                {user.role === "admin" ?
                  ACCOUNT_MESSAGES.ROLE_ADMIN
                : ACCOUNT_MESSAGES.ROLE_MEMBER}
              </span>
            </p>
            <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--dash-muted)]">
              <span className="font-medium text-[var(--foreground)]/80">
                {PROFILE_UI_MESSAGES.STATUS_LABEL}
              </span>
              {user.status === "inactive" ?
                <span className="inline-flex items-center rounded-full bg-[var(--background)] px-2 py-0.5 text-[11px] font-semibold text-[var(--dash-muted)] ring-1 ring-[var(--dash-border)]">
                  {DASHBOARD_MESSAGES.ROW_STATUS_INACTIVE}
                </span>
              : <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  {DASHBOARD_MESSAGES.ROW_STATUS_ACTIVE}
                </span>
              }
            </p>
            {bioTrimmed ?
              <p className="text-xs text-[var(--dash-muted)]">
                <span className="font-medium text-[var(--foreground)]/80">
                  {PROFILE_UI_MESSAGES.BIO_LABEL}
                </span>{" "}
                <span className="text-[var(--foreground)]">{bioTrimmed}</span>
              </p>
            : null}
          </div>
        </div>
        <div className="my-3 border-t border-[var(--dash-border)]" />
        <p className="text-xs text-[var(--dash-muted)]">
          {PROFILE_UI_MESSAGES.JOINED_LABEL} · {formatJoinedLine(user.created_at)}
        </p>
      </div>
      <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
        <span
          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
          aria-hidden
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 6l2.5 2.5L9.5 3.5" />
          </svg>
        </span>
        <p className="text-sm font-medium leading-snug">{successLine}</p>
      </div>
    </div>
  );
}

function UserDirectoryToolDisplay({
  part,
  pendingMessage,
  cardVariant,
  parseOutput = parseOkUserToolOutput,
  hideConfirmationOutput = false,
  failedFallback,
}: {
  part: AssistantToolPart;
  pendingMessage: string;
  cardVariant: "invited" | "updated" | "profile-loaded" | "profile-updated";
  parseOutput?: (output: unknown) => ClientUser | null;
  hideConfirmationOutput?: boolean;
  failedFallback?: ReactNode;
}) {
  const title = getToolName(part);
  const state = "state" in part && typeof part.state === "string" ? part.state : "";

  if (state !== "output-available") {
    return (
      <ToolPendingCard
        title={title}
        message={pendingMessage}
      />
    );
  }

  const output = "output" in part ? part.output : undefined;
  const confirmation = parseConfirmationOutput(output);
  if (confirmation) {
    if (hideConfirmationOutput) return null;
    return (
      <ToolPendingCard
        title={title}
        message={
          <>
            {renderInlineMarkdownBold(confirmation.message)}
            <br />
            {renderInlineMarkdownBold(confirmation.hint)}
          </>
        }
      />
    );
  }
  const user = parseOutput(output);

  if (user) {
    return <UserResultCard user={user} variant={cardVariant} />;
  }

  if (failedFallback !== undefined) {
    return failedFallback;
  }

  return null;
}

/** Rich UI for successful `createUser` tool parts. */
export function CreateUserToolDisplay({ part }: { part: AssistantToolPart }) {
  return (
    <UserDirectoryToolDisplay
      part={part}
      pendingMessage={DASHBOARD_MESSAGES.CREATE_USER_TOOL_PENDING}
      cardVariant="invited"
      hideConfirmationOutput
    />
  );
}

/** Rich UI for successful `updateUser` tool parts (same card pattern as create). */
export function UpdateUserToolDisplay({ part }: { part: AssistantToolPart }) {
  return (
    <UserDirectoryToolDisplay
      part={part}
      pendingMessage={DASHBOARD_MESSAGES.UPDATE_USER_TOOL_PENDING}
      cardVariant="updated"
    />
  );
}

/** Rich UI for successful `updateMyProfile` (same `{ ok, user }` payload as updateUser). */
export function UpdateMyProfileToolDisplay({
  part,
}: {
  part: AssistantToolPart;
}) {
  return (
    <UserDirectoryToolDisplay
      part={part}
      pendingMessage={DASHBOARD_MESSAGES.UPDATE_MY_PROFILE_TOOL_PENDING}
      cardVariant="profile-updated"
    />
  );
}

/** Member profile card for `getMyProfile` (`{ profile }` payload). */
export function GetMyProfileToolDisplay({ part }: { part: AssistantToolPart }) {
  return (
    <UserDirectoryToolDisplay
      part={part}
      pendingMessage={DASHBOARD_MESSAGES.GET_MY_PROFILE_TOOL_PENDING}
      cardVariant="profile-loaded"
      parseOutput={parseGetMyProfileToolOutput}
      failedFallback={
        <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-4 text-sm text-[var(--dash-muted)] shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--dash-muted)]">
            {DASHBOARD_MESSAGES.MEMBER_PROFILE_CARD_BADGE}
          </p>
          <p className="mt-2">{PROFILE_UI_MESSAGES.PROFILE_LOAD_FAILED}</p>
        </div>
      }
    />
  );
}

/** Compact directory table for `listUsers` — hides raw JSON payloads. */
export function ListUsersToolDisplay({ part }: { part: AssistantToolPart }) {
  const title = getToolName(part);
  const state = "state" in part && typeof part.state === "string" ? part.state : "";

  if (state !== "output-available") {
    return (
      <ToolPendingCard
        title={title}
        message={DASHBOARD_MESSAGES.LOADING_DIRECTORY}
      />
    );
  }

  const output = "output" in part ? part.output : undefined;
  const users = parseListUsersToolOutput(output);

  if (!users) {
    return null;
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--dash-muted)]">
          {DASHBOARD_MESSAGES.USERS_SECTION_TITLE}
        </p>
        <p className="mt-2 text-sm text-[var(--dash-muted)]">
          {DASHBOARD_MESSAGES.NO_USERS_EMPTY}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--dash-muted)]">
          {DASHBOARD_MESSAGES.USERS_SECTION_TITLE}
        </p>
        <p className="text-xs text-[var(--dash-muted)]">
          {DASHBOARD_MESSAGES.FOOTER_SHOWING_PREFIX}
          {users.length}
          {DASHBOARD_MESSAGES.FOOTER_OF}
          {users.length}
          {DASHBOARD_MESSAGES.FOOTER_USERS}
        </p>
      </div>
      <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-[var(--dash-border)]">
        <table className="w-full min-w-[280px] text-left text-xs">
          <thead className="sticky top-0 z-[1] border-b border-[var(--dash-border)] bg-[var(--background)]/95 backdrop-blur-sm">
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dash-muted)]">
              <th className="px-3 py-2">{DASHBOARD_MESSAGES.COL_USER}</th>
              <th className="hidden px-3 py-2 sm:table-cell">
                {DASHBOARD_MESSAGES.COL_ROLE}
              </th>
              <th className="px-3 py-2">{DASHBOARD_MESSAGES.COL_STATUS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--dash-border)]">
            {users.map((u) => (
              <tr key={u.id} className="bg-[var(--dash-card)]">
                <td className="px-3 py-2">
                  <p className="font-semibold text-[var(--foreground)]">
                    {displayName(u)}
                  </p>
                  <p className="break-all text-[11px] text-[var(--dash-muted)]">
                    {u.email}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--dash-muted)] sm:hidden">
                    {u.role === "admin" ?
                      ACCOUNT_MESSAGES.ROLE_ADMIN
                    : ACCOUNT_MESSAGES.ROLE_MEMBER}
                  </p>
                </td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold leading-none ${u.role === "admin"
                        ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                        : "bg-[var(--foreground)]/10 text-[var(--dash-muted)]"
                      }`}
                  >
                    {u.role === "admin" ?
                      ACCOUNT_MESSAGES.ROLE_ADMIN
                    : ACCOUNT_MESSAGES.ROLE_MEMBER}
                  </span>
                </td>
                <td className="px-3 py-2 align-top">
                  {u.status === "inactive" ?
                    <span className="inline-flex items-center rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold text-[var(--dash-muted)] ring-1 ring-[var(--dash-border)]">
                      {DASHBOARD_MESSAGES.ROW_STATUS_INACTIVE}
                    </span>
                  : <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      {DASHBOARD_MESSAGES.ROW_STATUS_ACTIVE}
                    </span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
