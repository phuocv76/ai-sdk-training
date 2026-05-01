"use client";

import { useAuth } from "@/components/auth-session-provider";

import { ACCOUNT_MESSAGES, UI_SYMBOLS } from "@/constants/messages";
import { displayName } from "@/lib/users";

/** Two-letter initials from whitespace-separated words, or `UI_SYMBOLS.UNKNOWN_INITIAL`. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return UI_SYMBOLS.UNKNOWN_INITIAL;
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}

/**
 * Compact signed-in summary shown in the desktop sidebar footer.
 */
export function DashboardAccountSummary() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
      <p className="truncate text-sm font-semibold text-white">
        {displayName(user)}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-indigo-200/85">
        {user.email}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200/85">
          Role
        </span>
        <span
          className={`inline-flex rounded-full py-0.5 text-[10px] font-bold uppercase tracking-wide ${user.role === "admin"
              ? "bg-emerald-400/20 text-emerald-200"
              : "bg-white/10 text-indigo-100/90"
            }`}
        >
          {user.role === "admin" ?
            ACCOUNT_MESSAGES.ROLE_ADMIN
          : ACCOUNT_MESSAGES.ROLE_MEMBER}
        </span>
      </div>
    </div>
  );
}

/**
 * Toolbar sign-out triggers plus avatar initials for narrow and wide breakpoints.
 */
export function DashboardUserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={() => void logout()}
        className="hidden rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] shadow-sm transition-colors hover:bg-[var(--background)] sm:inline-flex"
      >
        {ACCOUNT_MESSAGES.SIGN_OUT}
      </button>
      <button
        type="button"
        onClick={() => void logout()}
        className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--dash-accent)] sm:hidden"
        aria-label={ACCOUNT_MESSAGES.SIGN_OUT_ARIA}
      >
        {ACCOUNT_MESSAGES.SIGN_OUT_SHORT}
      </button>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-[10px] font-semibold text-white shadow-md sm:h-10 sm:w-10 sm:text-xs"
        title={`${displayName(user)} · ${user.email}`}
      >
        {initials(displayName(user))}
      </div>
    </div>
  );
}
