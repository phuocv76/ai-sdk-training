'use client';

import type { ReactNode } from 'react';

import {
  isStatusOnlyUserUpdatePreview,
  tryParseUserUpdatePreview,
} from '@/lib/assistant/user-update-preview';
import { PROFILE_UI_MESSAGES, UI_SYMBOLS } from '@/constants/messages';

import { previewDetailLine } from './preview-detail-line';
import { UserUpdatePreviewCard } from './user-update-preview-card';

const pushRequiredStringLine = (
  lines: ReactNode[],
  key: string,
  label: string,
  raw: unknown,
) => {
  if (typeof raw !== 'string') return;
  lines.push(previewDetailLine(key, label, raw.trim() || UI_SYMBOLS.EM_DASH));
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

  if (toolId === 'updateUser' || toolId === 'updateMyProfile') {
    const updatePreview = tryParseUserUpdatePreview(preview);
    if (updatePreview) {
      if (isStatusOnlyUserUpdatePreview(updatePreview)) {
        return null;
      }
      return <UserUpdatePreviewCard preview={updatePreview} />;
    }
    return null;
  }

  return null;
}
