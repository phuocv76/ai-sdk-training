"use client";

import { getToolName, isToolUIPart } from "ai";
import type {
  DynamicToolUIPart,
  ToolUIPart,
  UIDataTypes,
  UIMessagePart,
  UITools,
} from "ai";

import {
  DASHBOARD_MESSAGES,
  PROFILE_UI_MESSAGES,
  UI_SYMBOLS,
} from "@/constants/messages";
import type { ClientUser } from "@/lib/users";

type AssistantToolPart = ToolUIPart | DynamicToolUIPart;

function parseCreateUserSuccess(output: unknown): ClientUser | null {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  if (o.ok !== true) return null;
  const u = o.user;
  if (!u || typeof u !== "object") return null;
  const user = u as Record<string, unknown>;
  if (
    typeof user.id !== "string" ||
    typeof user.name !== "string" ||
    typeof user.email !== "string" ||
    typeof user.created_at !== "number"
  ) {
    return null;
  }
  return u as ClientUser;
}

/**
 * When true, assistant prose for this message is hidden so only the invite card shows.
 */
export function assistantMessageShouldHideProseForCreateUser(
  parts: unknown[],
): boolean {
  for (const raw of parts) {
    if (!isToolUIPart(raw as UIMessagePart<UIDataTypes, UITools>)) continue;
    const part = raw as ToolUIPart | DynamicToolUIPart;
    if (getToolName(part) !== "createUser") continue;
    if (part.state !== "output-available") continue;
    const out = "output" in part ? part.output : undefined;
    if (parseCreateUserSuccess(out)) return true;
  }
  return false;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function formatMemberInvitedAt(ms: number): string {
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

function MemberInvitedCard({ user }: { user: ClientUser }) {
  const initials = initialsFromName(user.name);
  const dobDisplay =
    user.date_of_birth && user.date_of_birth.trim() !== "" ?
      user.date_of_birth
    : UI_SYMBOLS.EM_DASH;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--dash-border)] bg-gradient-to-b from-sky-50 to-[var(--dash-card)] p-4 shadow-sm dark:from-sky-950/35 dark:to-[var(--dash-card)]">
        <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          {DASHBOARD_MESSAGES.MEMBER_INVITED_CARD_BADGE}
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
            <p className="text-xs text-[var(--dash-muted)]">
              <span className="font-medium text-[var(--foreground)]/80">
                {PROFILE_UI_MESSAGES.EMAIL_LABEL}
              </span>{" "}
              <span className="break-all text-[var(--foreground)]">
                {user.email}
              </span>
            </p>
            <p className="text-xs text-[var(--dash-muted)]">
              <span className="font-medium text-[var(--foreground)]/80">
                {PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL}
              </span>{" "}
              <span className="text-[var(--foreground)]">{dobDisplay}</span>
            </p>
          </div>
        </div>
        <div className="my-3 border-t border-[var(--dash-border)]" />
        <p className="text-xs text-[var(--dash-muted)]">
          Updated at {formatMemberInvitedAt(user.created_at)}
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
        <p className="text-sm font-medium leading-snug">
          {DASHBOARD_MESSAGES.MEMBER_INVITED_SUCCESS_LINE}
        </p>
      </div>
    </div>
  );
}

function GenericToolBlock({
  title,
  state,
  input,
  output,
}: {
  title: string;
  state: string;
  input?: unknown;
  output?: unknown;
}) {
  return (
    <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--background)] px-3 py-2 font-mono text-[11px] text-[var(--foreground)]">
      <div className="font-semibold text-[var(--dash-muted)]">
        {title}{" "}
        <span className="font-normal opacity-70">({state})</span>
      </div>
      {input != null ? (
        <pre className="mt-2 max-h-40 overflow-auto text-[var(--foreground)]">
          {JSON.stringify(input, null, 2)}
        </pre>
      ) : null}
      {output !== undefined ? (
        <pre className="mt-2 max-h-48 overflow-auto text-[var(--foreground)]">
          {JSON.stringify(output, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

/**
 * Rich UI for `createUser` tool parts; other tools keep the default JSON block.
 */
export function CreateUserToolDisplay({ part }: { part: AssistantToolPart }) {
  const title = getToolName(part);
  const state = "state" in part && typeof part.state === "string" ? part.state : "";

  if (state !== "output-available") {
    return (
      <div className="rounded-xl border border-dashed border-[var(--dash-border)] bg-[var(--background)]/80 px-3 py-3 text-sm text-[var(--dash-muted)]">
        <p className="font-mono text-[11px] font-semibold text-[var(--foreground)]">
          {title}{" "}
          <span className="font-normal opacity-70">({state})</span>
        </p>
        <p className="mt-1 text-xs">{DASHBOARD_MESSAGES.CREATE_USER_TOOL_PENDING}</p>
        {"input" in part && part.input != null ? (
          <pre className="mt-2 max-h-32 overflow-auto font-mono text-[11px] text-[var(--foreground)]">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        ) : null}
      </div>
    );
  }

  const output = "output" in part ? part.output : undefined;
  const user = parseCreateUserSuccess(output);

  if (user) {
    return <MemberInvitedCard user={user} />;
  }

  return (
    <GenericToolBlock
      title={title}
      state={state}
      input={"input" in part ? part.input : undefined}
      output={output}
    />
  );
}
