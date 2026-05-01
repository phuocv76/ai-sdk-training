"use client";

import type { User } from "@/lib/users";
import { displayName } from "@/lib/users";

import {
  ACCOUNT_MESSAGES,
  PROFILE_UI_MESSAGES,
  UI_SYMBOLS,
} from "@/constants/messages";

/** Formats ISO date-only strings for display or returns the sentinel em dash when empty. */
function formatDob(iso: string | null) {
  if (!iso) return UI_SYMBOLS.EM_DASH;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Absolute `created_at` millisecond epoch rendered in the viewer locale. */
function formatJoined(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Label + definition pair for `<dl>` style profile rows. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
        {label}
      </dt>
      <dd className="text-sm text-[var(--foreground)]">{children}</dd>
    </div>
  );
}

/** Read-only rendering of canonical profile fields plus role / join metadata. */
export function ProfileFieldsDisplay({
  user,
  variant = "default",
}: {
  user: User;
  variant?: "default" | "compact";
}) {
  const dn = displayName(user);
  const cls =
    variant === "compact"
      ? "grid gap-4 sm:grid-cols-2"
      : "grid gap-5 sm:grid-cols-2";

  return (
    <dl className={cls}>
      <Field label={PROFILE_UI_MESSAGES.DISPLAY_NAME_LABEL}>{dn}</Field>
      <Field label={PROFILE_UI_MESSAGES.EMAIL_LABEL}>{user.email}</Field>
      <Field label={PROFILE_UI_MESSAGES.FIRST_NAME_LABEL}>
        {user.first_name?.trim() || UI_SYMBOLS.EM_DASH}
      </Field>
      <Field label={PROFILE_UI_MESSAGES.LAST_NAME_LABEL}>
        {user.last_name?.trim() || UI_SYMBOLS.EM_DASH}
      </Field>
      <Field label={PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL}>
        {formatDob(user.date_of_birth)}
      </Field>
      <Field label={PROFILE_UI_MESSAGES.LEGACY_NAME_LABEL}>{user.name}</Field>
      <Field label={PROFILE_UI_MESSAGES.ROLE_LABEL}>
        <span
          className={`text-sm font-semibold uppercase ${user.role === "admin"
              ? "text-violet-700 dark:text-violet-300"
              : "text-[var(--foreground)]"
            }`}
        >
          {user.role === "admin" ?
            ACCOUNT_MESSAGES.ROLE_ADMIN
          : ACCOUNT_MESSAGES.ROLE_MEMBER}
        </span>
      </Field>
      <Field label={PROFILE_UI_MESSAGES.JOINED_LABEL}>
        {formatJoined(user.created_at)}
      </Field>
      <div className="sm:col-span-2">
        <Field label={PROFILE_UI_MESSAGES.BIO_LABEL}>
          {user.bio?.trim() || UI_SYMBOLS.EM_DASH}
        </Field>
      </div>
    </dl>
  );
}

/**
 * Modal-style drawer for a single user’s directory record (admin table drill-in).
 */
export function UserProfileModal({
  open,
  user,
  loading,
  onClose,
}: {
  open: boolean;
  user: User | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label={PROFILE_UI_MESSAGES.CLOSE_PROFILE_ARIA}
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--dash-border)] p-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {PROFILE_UI_MESSAGES.MODAL_TITLE}
            </h2>
            <p className="mt-1 text-xs text-[var(--dash-muted)]">
              {PROFILE_UI_MESSAGES.MODAL_SUBTITLE}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--dash-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
            aria-label={PROFILE_UI_MESSAGES.CLOSE_ARIA}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-5">
          {loading ?
            <div className="flex flex-col items-center gap-3 py-12 text-[var(--dash-muted)]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--dash-accent)] border-t-transparent" />
              <p className="text-sm">{PROFILE_UI_MESSAGES.LOADING_PROFILE}</p>
            </div>
          : user ?
            <ProfileFieldsDisplay user={user} variant="compact" />
          : <p className="text-sm text-red-600 dark:text-red-400">
              {PROFILE_UI_MESSAGES.PROFILE_LOAD_FAILED}
            </p>
          }
        </div>
      </div>
    </div>
  );
}
