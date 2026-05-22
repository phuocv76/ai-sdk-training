'use client';

import { CHAT_HUMAN_CONFIRM_MESSAGES } from '@/constants/messages';
import type { UserUpdatePreviewPayload } from '@/lib/assistant/user-update-preview';

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
};

export const UserUpdatePreviewCard = ({
  preview,
}: {
  preview: UserUpdatePreviewPayload;
}) => {
  const displayName = preview.name.trim() || preview.email;

  return (
    <div className="rounded-xl border border-[var(--dash-border)] bg-gradient-to-b from-amber-50/80 to-[var(--dash-card)] p-4 shadow-sm dark:from-amber-950/25 dark:to-[var(--dash-card)]">
      <div className="flex gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-amber-400/70 bg-gradient-to-br from-amber-100 to-orange-100 text-sm font-bold text-[var(--foreground)] dark:from-amber-950 dark:to-orange-950"
          aria-hidden
        >
          {initialsFromName(displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--foreground)]">{displayName}</p>
          <p className="break-all text-xs text-[var(--dash-muted)]">{preview.email}</p>
        </div>
      </div>

      {preview.changes.length > 0 ?
        <div className="mt-4 space-y-3 border-t border-[var(--dash-border)] pt-3">
          {preview.changes.map((change) => (
            <div key={change.field} className="space-y-1.5">
              <p className="text-xs font-semibold text-[var(--foreground)]">
                {change.label}
              </p>
              <div className="grid gap-1 rounded-lg bg-[var(--background)]/60 px-2.5 py-2 text-xs ring-1 ring-[var(--dash-border)]">
                <p className="text-[var(--dash-muted)]">
                  <span className="font-medium text-[var(--foreground)]/70">
                    {CHAT_HUMAN_CONFIRM_MESSAGES.PREVIEW_CHANGE_OLD_LABEL}
                  </span>{': '}
                  <span className="break-words text-[var(--foreground)]/80">
                    {change.oldValue}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-[var(--foreground)]/80">
                    {CHAT_HUMAN_CONFIRM_MESSAGES.PREVIEW_CHANGE_NEW_LABEL}
                  </span>{': '}
                  <span className="break-words font-medium text-[var(--foreground)]">
                    {change.newValue}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      : <p className="mt-3 text-xs text-[var(--dash-muted)]">
          {CHAT_HUMAN_CONFIRM_MESSAGES.PREVIEW_NO_FIELD_CHANGES}
        </p>
      }
    </div>
  );
};
