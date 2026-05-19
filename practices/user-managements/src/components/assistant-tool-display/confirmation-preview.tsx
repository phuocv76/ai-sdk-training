'use client';

import type { ReactNode } from 'react';

import {
  CHAT_HUMAN_CONFIRM_MESSAGES,
  DASHBOARD_MESSAGES,
  PROFILE_UI_MESSAGES,
  UI_SYMBOLS,
} from '@/constants/messages';

import { previewDetailLine } from './preview-detail-line';

const optionalStringDisplay = (raw: unknown): string => {
  if (raw === undefined || raw === null) return UI_SYMBOLS.EM_DASH;
  if (typeof raw === 'string') return raw.trim() || UI_SYMBOLS.EM_DASH;
  return String(raw);
};

const pushOptionalStringLine = (
  lines: ReactNode[],
  key: string,
  label: string,
  raw: unknown,
) => {
  if (raw === undefined) return;
  lines.push(previewDetailLine(key, label, optionalStringDisplay(raw)));
};

const pushRequiredStringLine = (
  lines: ReactNode[],
  key: string,
  label: string,
  raw: unknown,
) => {
  if (typeof raw !== 'string') return;
  lines.push(previewDetailLine(key, label, raw.trim() || UI_SYMBOLS.EM_DASH));
};

const pushNullableFieldLine = (
  lines: ReactNode[],
  key: string,
  label: string,
  raw: unknown,
) => {
  const display =
    raw === null || raw === '' ? UI_SYMBOLS.EM_DASH
    : typeof raw === 'string' ? raw.trim() || UI_SYMBOLS.EM_DASH
    : UI_SYMBOLS.EM_DASH;
  lines.push(previewDetailLine(key, label, display));
};

/** Renders structured tool `preview` like user-requested fields (human-in-the-loop). */
export function formatDirectoryToolConfirmationPreview(
  toolId: string,
  preview: unknown,
): ReactNode {
  if (!preview || typeof preview !== 'object') return null;
  const p = preview as Record<string, unknown>;
  const lines: ReactNode[] = [];

  if (toolId === 'createUser') {
    if (
      typeof p.name !== 'string' ||
      typeof p.email !== 'string' ||
      typeof p.date_of_birth !== 'string'
    ) {
      return null;
    }
    pushRequiredStringLine(lines, 'name', PROFILE_UI_MESSAGES.NAME_LABEL, p.name);
    pushRequiredStringLine(lines, 'email', PROFILE_UI_MESSAGES.EMAIL_LABEL, p.email);
    pushRequiredStringLine(
      lines,
      'dob',
      PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL,
      p.date_of_birth,
    );
    if (typeof p.bio === 'string' && p.bio.trim() !== '') {
      pushRequiredStringLine(lines, 'bio', PROFILE_UI_MESSAGES.BIO_LABEL, p.bio);
    }
    return lines.length > 0 ? <div className="space-y-1">{lines}</div> : null;
  }

  if (toolId === 'updateUser') {
    if (typeof p.id !== 'string') return null;
    lines.push(
      previewDetailLine(
        'id',
        CHAT_HUMAN_CONFIRM_MESSAGES.PREVIEW_USER_ID_LABEL,
        p.id,
      ),
    );
    pushOptionalStringLine(lines, 'name', PROFILE_UI_MESSAGES.NAME_LABEL, p.name);
    if ('date_of_birth' in p) {
      pushNullableFieldLine(
        lines,
        'dob',
        PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL,
        p.date_of_birth,
      );
    }
    if ('bio' in p) {
      pushNullableFieldLine(lines, 'bio', PROFILE_UI_MESSAGES.BIO_LABEL, p.bio);
    }
    if (p.status === 'inactive' || p.status === 'active') {
      lines.push(
        previewDetailLine(
          'status',
          PROFILE_UI_MESSAGES.STATUS_LABEL,
          p.status === 'inactive' ?
            DASHBOARD_MESSAGES.ROW_STATUS_INACTIVE
          : DASHBOARD_MESSAGES.ROW_STATUS_ACTIVE,
        ),
      );
    }
    return lines.length > 0 ? <div className="space-y-1">{lines}</div> : null;
  }

  if (toolId === 'updateMyProfile') {
    pushOptionalStringLine(lines, 'name', PROFILE_UI_MESSAGES.NAME_LABEL, p.name);
    if ('date_of_birth' in p) {
      pushNullableFieldLine(
        lines,
        'dob',
        PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL,
        p.date_of_birth,
      );
    }
    if ('bio' in p) {
      pushNullableFieldLine(lines, 'bio', PROFILE_UI_MESSAGES.BIO_LABEL, p.bio);
    }
    return lines.length > 0 ? <div className="space-y-1">{lines}</div> : null;
  }

  return null;
}
