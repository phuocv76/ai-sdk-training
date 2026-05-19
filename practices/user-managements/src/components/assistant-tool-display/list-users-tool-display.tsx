'use client';

import { getToolName } from 'ai';

import {
  ACCOUNT_MESSAGES,
  DASHBOARD_MESSAGES,
} from '@/constants/messages';
import { parseListUsersToolOutput } from '@/lib/assistant/tool-output-parsers';
import { displayName } from '@/lib/domain/user';

import { ToolPendingCard } from './tool-pending-card';
import type { AssistantToolPart } from './types';
import { getToolPartOutput, getToolPartState } from './tool-part-state';

/** Compact directory table for `listUsers` — hides raw JSON payloads. */
export const ListUsersToolDisplay = ({ part }: { part: AssistantToolPart }) => {
  const title = getToolName(part);
  const state = getToolPartState(part);

  if (state !== 'output-available') {
    return (
      <ToolPendingCard
        title={title}
        message={DASHBOARD_MESSAGES.LOADING_DIRECTORY}
      />
    );
  }

  const users = parseListUsersToolOutput(getToolPartOutput(part));
  if (!users) return null;

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
                    {u.role === 'admin' ?
                      ACCOUNT_MESSAGES.ROLE_ADMIN
                    : ACCOUNT_MESSAGES.ROLE_MEMBER}
                  </p>
                </td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold leading-none ${
                      u.role === 'admin' ?
                        'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                      : 'bg-[var(--foreground)]/10 text-[var(--dash-muted)]'
                    }`}
                  >
                    {u.role === 'admin' ?
                      ACCOUNT_MESSAGES.ROLE_ADMIN
                    : ACCOUNT_MESSAGES.ROLE_MEMBER}
                  </span>
                </td>
                <td className="px-3 py-2 align-top">
                  {u.status === 'inactive' ?
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
