import type { ReactNode } from 'react';

export const ToolPendingCard = ({
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
