'use client';

import {
  ACCOUNT_MESSAGES,
  DASHBOARD_MESSAGES,
  PROFILE_UI_MESSAGES,
  UI_SYMBOLS,
} from '@/constants/messages';
import type { ClientUser } from '@/lib/domain/user';

import type { UserResultCardVariant } from './types';

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
};

const formatJoinedLine = (ms: number): string => {
  const d = new Date(ms);
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const date = d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return `${time} • ${date}`;
};

const VARIANT_COPY: Record<
  UserResultCardVariant,
  { badge: string; successLine: string; skyTone: boolean }
> = {
  invited: {
    badge: DASHBOARD_MESSAGES.MEMBER_INVITED_CARD_BADGE,
    successLine: DASHBOARD_MESSAGES.MEMBER_INVITED_SUCCESS_LINE,
    skyTone: true,
  },
  updated: {
    badge: DASHBOARD_MESSAGES.USER_UPDATED_CARD_BADGE,
    successLine: DASHBOARD_MESSAGES.USER_UPDATED_SUCCESS_LINE,
    skyTone: false,
  },
  'profile-loaded': {
    badge: DASHBOARD_MESSAGES.MEMBER_PROFILE_CARD_BADGE,
    successLine: DASHBOARD_MESSAGES.MEMBER_PROFILE_LOADED_SUCCESS_LINE,
    skyTone: true,
  },
  'profile-updated': {
    badge: DASHBOARD_MESSAGES.MEMBER_PROFILE_UPDATED_CARD_BADGE,
    successLine: DASHBOARD_MESSAGES.MEMBER_PROFILE_UPDATED_SUCCESS_LINE,
    skyTone: false,
  },
};

export const UserResultCard = ({
  user,
  variant,
}: {
  user: ClientUser;
  variant: UserResultCardVariant;
}) => {
  const { badge, successLine, skyTone } = VARIANT_COPY[variant];
  const badgeClass =
    skyTone ? 'text-sky-600 dark:text-sky-400' : 'text-violet-600 dark:text-violet-400';
  const shellClass =
    skyTone ?
      'from-sky-50 to-[var(--dash-card)] dark:from-sky-950/35'
    : 'from-violet-50 to-[var(--dash-card)] dark:from-violet-950/35';
  const dobDisplay = user.date_of_birth?.trim() || UI_SYMBOLS.EM_DASH;
  const bioTrimmed = user.bio?.trim();

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl border border-[var(--dash-border)] bg-gradient-to-b ${shellClass} p-4 shadow-sm dark:to-[var(--dash-card)]`}
      >
        <p className={`text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
          {badge}
        </p>
        <div className="mt-3 flex gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-emerald-400/90 bg-gradient-to-br from-indigo-100 to-sky-100 text-sm font-bold text-[var(--foreground)] dark:from-indigo-950 dark:to-sky-950"
            aria-hidden
          >
            {initialsFromName(user.name)}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="font-semibold text-[var(--foreground)]">{user.name}</p>
            <p className="break-all text-xs text-[var(--foreground)]">{user.email}</p>
            <p className="text-xs text-[var(--dash-muted)]">
              <span className="font-medium text-[var(--foreground)]/80">
                {PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL}
              </span>{' '}
              <span className="text-[var(--foreground)]">{dobDisplay}</span>
            </p>
            <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--dash-muted)]">
              <span className="font-medium text-[var(--foreground)]/80">
                {PROFILE_UI_MESSAGES.ROLE_LABEL}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase leading-none ${
                  user.role === 'admin' ?
                    'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                  : 'bg-[var(--foreground)]/10 text-[var(--foreground)]'
                }`}
              >
                {user.role === 'admin' ?
                  ACCOUNT_MESSAGES.ROLE_ADMIN
                : ACCOUNT_MESSAGES.ROLE_MEMBER}
              </span>
            </p>
            <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--dash-muted)]">
              <span className="font-medium text-[var(--foreground)]/80">
                {PROFILE_UI_MESSAGES.STATUS_LABEL}
              </span>
              {user.status === 'inactive' ?
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
                </span>{' '}
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
