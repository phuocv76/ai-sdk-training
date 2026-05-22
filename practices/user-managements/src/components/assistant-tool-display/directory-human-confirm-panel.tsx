'use client';

import { DASHBOARD_MESSAGES } from '@/constants/messages';
import { renderInlineMarkdownBold } from '@/lib/markdown/render-inline-markdown-bold';

import {
  formatStatusOnlyChangeMessage,
  isStatusOnlyUserUpdatePreview,
  tryParseUserUpdatePreview,
} from '@/lib/assistant/user-update-preview';

import { formatDirectoryToolConfirmationPreview } from './confirmation-preview';

export const DirectoryHumanConfirmPanel = ({
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
  const updatePreview =
    toolId === 'updateUser' || toolId === 'updateMyProfile'
      ? tryParseUserUpdatePreview(preview)
      : null;
  const statusOnly =
    updatePreview !== null && isStatusOnlyUserUpdatePreview(updatePreview);

  const previewLines = statusOnly
    ? null
    : formatDirectoryToolConfirmationPreview(toolId, preview);

  return (
    <div className="space-y-2">
      {statusOnly ? (
        <p className="whitespace-pre-wrap leading-relaxed text-sm font-medium text-[var(--foreground)]">
          {formatStatusOnlyChangeMessage(updatePreview)}
        </p>
      ) : null}
      {previewLines ? (
        <div
          className="rounded-xl border border-[var(--dash-accent)]/25 bg-[var(--dash-accent-soft)] px-3 py-2.5 text-sm text-[var(--foreground)] shadow-sm"
          aria-label={heading}
        >
          <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[11px] text-[var(--dash-muted)]">
              {heading}
            </span>
          </div>
          <div className="leading-relaxed">{previewLines}</div>
        </div>
      ) : null}
      <p className="whitespace-pre-wrap leading-relaxed text-sm text-[var(--foreground)]">
        {renderInlineMarkdownBold(message)}
      </p>
      <p className="whitespace-pre-wrap leading-relaxed text-sm text-[var(--dash-muted)]">
        {renderInlineMarkdownBold(hint)}
      </p>
    </div>
  );
};
