'use client';

import {
  CHAT_HUMAN_CONFIRM_MESSAGES,
  DASHBOARD_MESSAGES,
  PROFILE_UI_MESSAGES,
  UI_SYMBOLS,
} from '@/constants/messages';
import type { ClientUser } from '@/lib/domain/user';
import { renderInlineMarkdownBold } from '@/lib/markdown/render-inline-markdown-bold';

const matchBioPeek = (bio: string | null | undefined): string => {
  const trimmed = bio?.trim();
  if (!trimmed) return UI_SYMBOLS.EM_DASH;
  return trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed;
};

export const AmbiguousDuplicateNamePanel = ({
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
        {matches.map((u) => (
          <li key={u.id}>
            <div className="rounded-lg border border-[var(--dash-border)] bg-[var(--background)]/60 px-3 py-2 text-xs text-[var(--foreground)]">
              <p>
                <span className="font-medium text-[var(--foreground)]/80">
                  {PROFILE_UI_MESSAGES.NAME_LABEL}
                </span>{' '}
                <span>{u.name}</span>
              </p>
              <p className="break-all">
                <span className="font-medium text-[var(--foreground)]/80">
                  {PROFILE_UI_MESSAGES.EMAIL_LABEL}
                </span>{' '}
                <span>{u.email}</span>
              </p>
              <p className="break-all font-mono text-[11px] text-[var(--dash-muted)]">
                <span className="font-medium text-[var(--foreground)]/80">
                  {CHAT_HUMAN_CONFIRM_MESSAGES.PREVIEW_USER_ID_LABEL}
                </span>{' '}
                <span>{u.id}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--foreground)]/80">
                  {PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL}
                </span>{' '}
                <span>{u.date_of_birth?.trim() || UI_SYMBOLS.EM_DASH}</span>
              </p>
              <p>
                <span className="font-medium text-[var(--foreground)]/80">
                  {PROFILE_UI_MESSAGES.BIO_LABEL}
                </span>{' '}
                <span className="whitespace-pre-wrap">{matchBioPeek(u.bio)}</span>
              </p>
            </div>
          </li>
        ))}
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
