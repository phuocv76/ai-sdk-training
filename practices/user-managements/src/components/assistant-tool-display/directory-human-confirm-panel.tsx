'use client';

import { DASHBOARD_MESSAGES } from '@/constants/messages';
import { renderInlineMarkdownBold } from '@/lib/markdown/render-inline-markdown-bold';

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
