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
  CHAT_HUMAN_CONFIRM_MESSAGES,
  DASHBOARD_MESSAGES,
  PROFILE_UI_MESSAGES,
  UI_SYMBOLS,
} from "@/constants/messages";
import { type ClientUser, displayName } from "@/lib/domain/user";
import { renderInlineMarkdownBold } from "@/lib/markdown/render-inline-markdown-bold";

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

/** Human-readable tool title in confirmation previews (matches internal ids in CHAT tooling). */
const confirmationToolHeading = (toolId: string): string => {
  switch (toolId) {
    case "createUser":
      return DASHBOARD_MESSAGES.ASSISTANT_CONFIRM_HEADING_CREATE_USER;
    case "updateUser":
      return DASHBOARD_MESSAGES.ASSISTANT_CONFIRM_HEADING_UPDATE_USER;
    case "updateMyProfile":
      return DASHBOARD_MESSAGES.ASSISTANT_CONFIRM_HEADING_UPDATE_MY_PROFILE;
    default:
      return toolId;
  }
};

const parseConfirmationOutput = (output: unknown): {
  message: string;
  hint: string;
  preview: unknown;
} | null => {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  if (o.requiresConfirmation !== true) return null;
  if (typeof o.message !== "string" || typeof o.hint !== "string") return null;
  return {
    message: o.message,
    hint: o.hint,
    preview: "preview" in o ? o.preview : undefined,
  };
};

/** `updateUser` / `deleteUser` blocked until the admin picks a row among duplicate display names. */
const parseAmbiguousDuplicateNameOutput = (output: unknown): {
  matches: ClientUser[];
  message: string;
  hint: string;
} | null => {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  if (o.ambiguousDisplayName !== true) return null;
  if (typeof o.message !== "string" || typeof o.hint !== "string") return null;
  const raw = o.matches;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const matches: ClientUser[] = [];
  for (const item of raw) {
    const u = tryParseClientUser(item);
    if (!u) return null;
    matches.push(u);
  }
  return { matches, message: o.message, hint: o.hint };
};

const AmbiguousDuplicateNamePanel = ({
  toolHeading,
  matches,
  message,
  hint,
}: {
  toolHeading: string;
  matches: ClientUser[];
  message: string;
  hint: string;
}) => (
  <div className="space-y-2">
    <div className="rounded-xl border border-amber-400/35 bg-gradient-to-b from-amber-50/90 to-[var(--dash-card)] px-3 py-3 text-sm shadow-sm dark:border-amber-500/25 dark:from-amber-950/30">
      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
        {DASHBOARD_MESSAGES.DIRECTORY_DUPLICATE_NAME_PANEL_BADGE}
      </p>
      <p className="mt-1 text-xs text-[var(--dash-muted)]">· {toolHeading}</p>
      <ol className="mt-3 list-decimal space-y-3 pl-4 marker:font-semibold marker:text-amber-800 dark:marker:text-amber-200">
        {matches.map((u) => {
          const dob =
            u.date_of_birth && u.date_of_birth.trim() !== "" ?
              u.date_of_birth
            : UI_SYMBOLS.EM_DASH;
          const bioPeek =
            u.bio?.trim() ?
              u.bio.length > 160 ?
                `${u.bio.trim().slice(0, 160)}…`
              : u.bio.trim()
            : UI_SYMBOLS.EM_DASH;
          return (
            <li key={u.id}>
              <div className="rounded-lg border border-[var(--dash-border)] bg-[var(--background)]/60 px-3 py-2 text-xs text-[var(--foreground)]">
                <p>
                  <span className="font-medium text-[var(--foreground)]/80">
                    {PROFILE_UI_MESSAGES.NAME_LABEL}
                  </span>{" "}
                  <span>{u.name}</span>
                </p>
                <p className="break-all">
                  <span className="font-medium text-[var(--foreground)]/80">
                    {PROFILE_UI_MESSAGES.EMAIL_LABEL}
                  </span>{" "}
                  <span>{u.email}</span>
                </p>
                <p className="break-all font-mono text-[11px] text-[var(--dash-muted)]">
                  <span className="font-medium text-[var(--foreground)]/80">
                    {CHAT_HUMAN_CONFIRM_MESSAGES.PREVIEW_USER_ID_LABEL}
                  </span>{" "}
                  <span>{u.id}</span>
                </p>
                <p>
                  <span className="font-medium text-[var(--foreground)]/80">
                    {PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL}
                  </span>{" "}
                  <span>{dob}</span>
                </p>
                <p>
                  <span className="font-medium text-[var(--foreground)]/80">
                    {PROFILE_UI_MESSAGES.BIO_LABEL}
                  </span>{" "}
                  <span className="whitespace-pre-wrap">{bioPeek}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
    <p className="whitespace-pre-wrap leading-relaxed text-sm text-[var(--foreground)]">
      {renderInlineMarkdownBold(message)}
    </p>
    <p className="whitespace-pre-wrap leading-relaxed text-sm text-[var(--dash-muted)]">
      {renderInlineMarkdownBold(hint)}
    </p>
  </div>
);

const previewDetailLine = (key: string, label: string, value: string) => (
  <p key={key}>
    <span className="font-medium text-[var(--foreground)]/80">{label}</span>{" "}
    <span className="break-words">{value}</span>
  </p>
);

/** Renders structured tool `preview` like user-requested fields (human-in-the-loop). */
function formatDirectoryToolConfirmationPreview(
  toolId: string,
  preview: unknown,
): ReactNode {
  if (!preview || typeof preview !== "object") return null;
  const p = preview as Record<string, unknown>;
  const lines: ReactNode[] = [];

  const pushStringLine = (
    key: string,
    label: string,
    raw: unknown,
    optional: boolean,
  ) => {
    if (optional && raw === undefined) return;
    if (!optional && typeof raw !== "string") return;
    const text =
      raw === undefined || raw === null ? UI_SYMBOLS.EM_DASH
      : typeof raw === "string" ?
        raw.trim() || UI_SYMBOLS.EM_DASH
      : String(raw);
    lines.push(previewDetailLine(key, label, text));
  };

  if (toolId === "createUser") {
    if (
      typeof p.name !== "string" ||
      typeof p.email !== "string" ||
      typeof p.date_of_birth !== "string"
    ) {
      return null;
    }
    pushStringLine("name", PROFILE_UI_MESSAGES.NAME_LABEL, p.name, false);
    pushStringLine("email", PROFILE_UI_MESSAGES.EMAIL_LABEL, p.email, false);
    pushStringLine(
      "dob",
      PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL,
      p.date_of_birth,
      false,
    );
    if (
      typeof p.bio === "string" &&
      (p.bio as string).trim() !== ""
    ) {
      pushStringLine("bio", PROFILE_UI_MESSAGES.BIO_LABEL, p.bio, false);
    }
    return lines.length > 0 ? <div className="space-y-1">{lines}</div> : null;
  }

  if (toolId === "updateUser") {
    if (typeof p.id !== "string") return null;
    lines.push(
      previewDetailLine(
        "id",
        CHAT_HUMAN_CONFIRM_MESSAGES.PREVIEW_USER_ID_LABEL,
        p.id,
      ),
    );
    if ("name" in p) pushStringLine("name", PROFILE_UI_MESSAGES.NAME_LABEL, p.name, true);
    if ("date_of_birth" in p) {
      const d = p.date_of_birth;
      const display =
        d === null || d === "" ? UI_SYMBOLS.EM_DASH
        : typeof d === "string" ? d
        : UI_SYMBOLS.EM_DASH;
      lines.push(
        previewDetailLine(
          "dob",
          PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL,
          display,
        ),
      );
    }
    if ("bio" in p) {
      const b = p.bio;
      const display =
        b === null || b === "" ? UI_SYMBOLS.EM_DASH
        : typeof b === "string" ? (b.trim() || UI_SYMBOLS.EM_DASH)
        : UI_SYMBOLS.EM_DASH;
      lines.push(previewDetailLine("bio", PROFILE_UI_MESSAGES.BIO_LABEL, display));
    }
    if (
      p.status === "inactive" ||
      p.status === "active"
    ) {
      lines.push(
        previewDetailLine(
          "status",
          PROFILE_UI_MESSAGES.STATUS_LABEL,
          p.status === "inactive" ?
            DASHBOARD_MESSAGES.ROW_STATUS_INACTIVE
          : DASHBOARD_MESSAGES.ROW_STATUS_ACTIVE,
        ),
      );
    }
    return lines.length > 0 ? <div className="space-y-1">{lines}</div> : null;
  }

  if (toolId === "updateMyProfile") {
    if ("name" in p) {
      pushStringLine("name", PROFILE_UI_MESSAGES.NAME_LABEL, p.name, true);
    }
    if ("date_of_birth" in p) {
      const d = p.date_of_birth;
      const display =
        d === null || d === "" ? UI_SYMBOLS.EM_DASH
        : typeof d === "string" ? d
        : UI_SYMBOLS.EM_DASH;
      lines.push(
        previewDetailLine(
          "dob",
          PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL,
          display,
        ),
      );
    }
    if ("bio" in p) {
      const b = p.bio;
      const display =
        b === null || b === "" ? UI_SYMBOLS.EM_DASH
        : typeof b === "string" ? (b.trim() || UI_SYMBOLS.EM_DASH)
        : UI_SYMBOLS.EM_DASH;
      lines.push(previewDetailLine("bio", PROFILE_UI_MESSAGES.BIO_LABEL, display));
    }
    return lines.length > 0 ? <div className="space-y-1">{lines}</div> : null;
  }

  return null;
}

const DirectoryHumanConfirmPanel = ({
  toolId,
  heading,
  message,
  hint,
  preview,
}: {
  toolId: string;
  heading: string;
  message: string;
  hint: string;
  preview: unknown;
}) => {
  const previewLines = formatDirectoryToolConfirmationPreview(toolId, preview);
  return (
    <div className="space-y-2">
      {previewLines ?
        <div
          className="rounded-xl border border-[var(--dash-accent)]/25 bg-[var(--dash-accent-soft)] px-3 py-2.5 text-sm text-[var(--foreground)] shadow-sm"
          aria-label={heading}
        >
          <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[11px] font-semibold tracking-wide text-[var(--dash-accent)]">
              {DASHBOARD_MESSAGES.LABEL_YOU}
            </span>
            <span className="text-[11px] text-[var(--dash-muted)]">· {heading}</span>
          </div>
          <div className="leading-relaxed">{previewLines}</div>
        </div>
      : null}
      <p className="whitespace-pre-wrap leading-relaxed text-sm text-[var(--foreground)]">
        {renderInlineMarkdownBold(message)}
      </p>
      <p className="whitespace-pre-wrap leading-relaxed text-sm text-[var(--dash-muted)]">
        {renderInlineMarkdownBold(hint)}
      </p>
    </div>
  );
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

/** Tools that use `UserDirectoryToolDisplay` / result cards in the assistant thread. */
const DIRECTORY_CARD_TOOL_NAMES = new Set([
  "createUser",
  "updateUser",
  "updateMyProfile",
  "getMyProfile",
]);

const isDirectoryCardToolName = (name: string): boolean =>
  DIRECTORY_CARD_TOOL_NAMES.has(name);

/**
 * True when the tool part renders nothing yet (caller shows loading dots) — streaming assistant turn,
 * SDK pre-output states, or preliminary tool results.
 */
export const directoryToolSurfaceIsDeferred = (
  part: unknown,
  streamSettled: boolean,
): boolean => {
  if (!isToolUIPart(part as UIMessagePart<UIDataTypes, UITools>)) return false;
  const name = getToolName(part as ToolUIPart | DynamicToolUIPart);
  if (!isDirectoryCardToolName(name)) return false;
  if (!streamSettled) return true;
  const p = part as ToolUIPart | DynamicToolUIPart;
  if (p.state !== "output-available") return true;
  return "preliminary" in p && p.preliminary === true;
};

/** Latest assistant bubble still resolving a directory tool client-side after the HTTP stream ends. */
export const directoryToolAwaitingSdkOutput = (part: unknown): boolean => {
  if (!isToolUIPart(part as UIMessagePart<UIDataTypes, UITools>)) return false;
  const p = part as ToolUIPart | DynamicToolUIPart;
  if (!isDirectoryCardToolName(getToolName(p))) return false;
  if (p.state !== "output-available") return true;
  return "preliminary" in p && p.preliminary === true;
};

/**
 * When true, assistant prose for this message is hidden so tool UI (cards, dots) carries the update.
 * Confirmation previews use the dashed tool panel only (no duplicated model prose).
 */
export const assistantMessageShouldHideProseForDirectoryResultCard = (
  parts: unknown[],
): boolean => {
  for (const raw of parts) {
    if (!isToolUIPart(raw as UIMessagePart<UIDataTypes, UITools>)) continue;
    const part = raw as ToolUIPart | DynamicToolUIPart;
    if (part.state !== "output-available") continue;
    if ("preliminary" in part && part.preliminary === true) continue;
    if (getToolName(part) === "deleteUser") {
      const outDel = "output" in part ? part.output : undefined;
      if (parseAmbiguousDuplicateNameOutput(outDel)) return true;
    }
  }

  for (const raw of parts) {
    if (!isToolUIPart(raw as UIMessagePart<UIDataTypes, UITools>)) continue;
    const part = raw as ToolUIPart | DynamicToolUIPart;
    const toolName = getToolName(part);
    if (!isDirectoryCardToolName(toolName)) continue;

    if (part.state !== "output-available") {
      return true;
    }
    if ("preliminary" in part && part.preliminary === true) {
      return true;
    }
    const out = "output" in part ? part.output : undefined;
    if (
      toolName === "updateUser" &&
      parseAmbiguousDuplicateNameOutput(out)
    ) {
      return true;
    }
    const confirmation = parseConfirmationOutput(out);
    if (confirmation) {
      return true;
    }
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
};

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
};

const formatJoinedLine = (ms: number): string => {
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
};

const UserResultCard = ({
  user,
  variant,
}: {
  user: ClientUser;
  variant: "invited" | "updated" | "profile-loaded" | "profile-updated";
}) => {
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
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
        <span
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
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
};

const UserDirectoryToolDisplay = ({
  part,
  pendingMessage: _pendingMessage,
  cardVariant,
  parseOutput = parseOkUserToolOutput,
  failedFallback,
  streamSettled,
}: {
  part: AssistantToolPart;
  /** Unused: pre-output states render no chrome (dots only); kept for readable call-site labels. */
  pendingMessage: string;
  cardVariant: "invited" | "updated" | "profile-loaded" | "profile-updated";
  parseOutput?: (output: unknown) => ClientUser | null;
  failedFallback?: ReactNode;
  /** When false (streaming the latest assistant bubble), defer all tool chrome until the turn completes. */
  streamSettled: boolean;
}) => {
  const title = getToolName(part);
  const state = "state" in part && typeof part.state === "string" ? part.state : "";
  const outputIsPreliminary =
    state === "output-available" &&
    "preliminary" in part &&
    part.preliminary === true;

  if (!streamSettled || outputIsPreliminary) {
    return null;
  }

  if (state !== "output-available") {
    // Avoid flashing dashed "tool name / Updating…" UI while the SDK is still invoking the tool;
    // rely on StreamingDots until output-available + non-preliminary (see AssistantChatMessageList).
    return null;
  }

  const output = "output" in part ? part.output : undefined;
  const ambiguous = parseAmbiguousDuplicateNameOutput(output);
  if (ambiguous && title === "updateUser") {
    return (
      <AmbiguousDuplicateNamePanel
        toolHeading={confirmationToolHeading(title)}
        matches={ambiguous.matches}
        message={ambiguous.message}
        hint={ambiguous.hint}
      />
    );
  }
  const confirmation = parseConfirmationOutput(output);
  if (confirmation) {
    return (
      <DirectoryHumanConfirmPanel
        toolId={title}
        heading={confirmationToolHeading(title)}
        message={confirmation.message}
        hint={confirmation.hint}
        preview={confirmation.preview}
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
};

/** Rich UI for successful `createUser` tool parts. */
export const CreateUserToolDisplay = ({
  part,
  streamSettled,
}: {
  part: AssistantToolPart;
  streamSettled: boolean;
}) => (
  <UserDirectoryToolDisplay
    part={part}
    pendingMessage={DASHBOARD_MESSAGES.CREATE_USER_TOOL_PENDING}
    cardVariant="invited"
    streamSettled={streamSettled}
  />
);

/** Rich UI for successful `updateUser` tool parts (same card pattern as create). */
export const UpdateUserToolDisplay = ({
  part,
  streamSettled,
}: {
  part: AssistantToolPart;
  streamSettled: boolean;
}) => (
  <UserDirectoryToolDisplay
    part={part}
    pendingMessage={DASHBOARD_MESSAGES.UPDATE_USER_TOOL_PENDING}
    cardVariant="updated"
    streamSettled={streamSettled}
  />
);

/** Duplicate-name guard panel for `deleteUser` only (successful deletes stay prose-only). */
export const DuplicateDisplayNameBlockedDisplay = ({
  part,
  streamSettled,
}: {
  part: AssistantToolPart;
  streamSettled: boolean;
}) => {
  const title = getToolName(part);
  if (title !== "deleteUser") return null;

  const state =
    "state" in part && typeof part.state === "string" ? part.state : "";
  const outputIsPreliminary =
    state === "output-available" &&
    "preliminary" in part &&
    part.preliminary === true;

  if (!streamSettled || outputIsPreliminary) return null;
  if (state !== "output-available") return null;

  const output = "output" in part ? part.output : undefined;
  const ambiguous = parseAmbiguousDuplicateNameOutput(output);
  if (!ambiguous) return null;

  return (
    <AmbiguousDuplicateNamePanel
      toolHeading={confirmationToolHeading(title)}
      matches={ambiguous.matches}
      message={ambiguous.message}
      hint={ambiguous.hint}
    />
  );
};

/** Rich UI for successful `updateMyProfile` (same `{ ok, user }` payload as updateUser). */
export const UpdateMyProfileToolDisplay = ({
  part,
  streamSettled,
}: {
  part: AssistantToolPart;
  streamSettled: boolean;
}) => (
  <UserDirectoryToolDisplay
    part={part}
    pendingMessage={DASHBOARD_MESSAGES.UPDATE_MY_PROFILE_TOOL_PENDING}
    cardVariant="profile-updated"
    streamSettled={streamSettled}
  />
);

/** Member profile card for `getMyProfile` (`{ profile }` payload). */
export const GetMyProfileToolDisplay = ({
  part,
  streamSettled,
}: {
  part: AssistantToolPart;
  streamSettled: boolean;
}) => (
  <UserDirectoryToolDisplay
    part={part}
    pendingMessage={DASHBOARD_MESSAGES.GET_MY_PROFILE_TOOL_PENDING}
    cardVariant="profile-loaded"
    streamSettled={streamSettled}
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

/** Compact directory table for `listUsers` — hides raw JSON payloads. */
export const ListUsersToolDisplay = ({ part }: { part: AssistantToolPart }) => {
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
};
