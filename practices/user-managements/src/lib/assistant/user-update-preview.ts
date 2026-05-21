import {
  DASHBOARD_MESSAGES,
  PROFILE_UI_MESSAGES,
  UI_SYMBOLS,
} from '@/constants/messages';
import type { User, UserStatus } from '@/lib/domain/user';
import { sanitizeUserUpdateToolInput } from '@/lib/user/profile-patch';

export type UserFieldChange = {
  field: 'name' | 'date_of_birth' | 'bio' | 'status';
  label: string;
  oldValue: string;
  newValue: string;
};

export type UserUpdatePreviewPayload = {
  kind: 'userUpdate';
  id: string;
  name: string;
  email: string;
  changes: UserFieldChange[];
};

const displayNullable = (v: string | null | undefined): string => {
  const t = v?.trim();
  return t ? t : UI_SYMBOLS.EM_DASH;
};

const displayStatus = (s: UserStatus): string =>
  s === 'inactive'
    ? DASHBOARD_MESSAGES.ROW_STATUS_INACTIVE
    : DASHBOARD_MESSAGES.ROW_STATUS_ACTIVE;

/** Builds a confirmation preview with only fields that differ from `existing`. */
export const buildUserUpdatePreview = (
  existing: User,
  input: unknown,
): UserUpdatePreviewPayload => {
  const p = sanitizeUserUpdateToolInput(input);
  const id = typeof p.id === 'string' ? p.id : existing.id;
  const changes: UserFieldChange[] = [];

  if (typeof p.name === 'string') {
    const next = p.name.trim();
    const old = existing.name.trim();
    if (next !== old) {
      changes.push({
        field: 'name',
        label: PROFILE_UI_MESSAGES.NAME_LABEL,
        oldValue: old || UI_SYMBOLS.EM_DASH,
        newValue: next || UI_SYMBOLS.EM_DASH,
      });
    }
  }

  if ('date_of_birth' in p) {
    const next = p.date_of_birth as string | null;
    if (next !== existing.date_of_birth) {
      changes.push({
        field: 'date_of_birth',
        label: PROFILE_UI_MESSAGES.DATE_OF_BIRTH_LABEL,
        oldValue: displayNullable(existing.date_of_birth),
        newValue: displayNullable(next),
      });
    }
  }

  if ('bio' in p) {
    const next = p.bio as string | null;
    if (next !== existing.bio) {
      changes.push({
        field: 'bio',
        label: PROFILE_UI_MESSAGES.BIO_LABEL,
        oldValue: displayNullable(existing.bio),
        newValue: displayNullable(next),
      });
    }
  }

  if (p.status === 'active' || p.status === 'inactive') {
    if (p.status !== existing.status) {
      changes.push({
        field: 'status',
        label: PROFILE_UI_MESSAGES.STATUS_LABEL,
        oldValue: displayStatus(existing.status),
        newValue: displayStatus(p.status),
      });
    }
  }

  return {
    kind: 'userUpdate',
    id,
    name: existing.name,
    email: existing.email,
    changes,
  };
};

export const tryParseUserUpdatePreview = (
  preview: unknown,
): UserUpdatePreviewPayload | null => {
  if (!preview || typeof preview !== 'object') return null;
  const p = preview as Record<string, unknown>;
  if (p.kind !== 'userUpdate') return null;
  if (typeof p.id !== 'string' || typeof p.name !== 'string') return null;
  if (typeof p.email !== 'string' || !Array.isArray(p.changes)) return null;

  const changes: UserFieldChange[] = [];
  for (const item of p.changes) {
    if (!item || typeof item !== 'object') return null;
    const c = item as Record<string, unknown>;
    if (
      (c.field !== 'name' &&
        c.field !== 'date_of_birth' &&
        c.field !== 'bio' &&
        c.field !== 'status') ||
      typeof c.label !== 'string' ||
      typeof c.oldValue !== 'string' ||
      typeof c.newValue !== 'string'
    ) {
      return null;
    }
    changes.push({
      field: c.field,
      label: c.label,
      oldValue: c.oldValue,
      newValue: c.newValue,
    });
  }

  return {
    kind: 'userUpdate',
    id: p.id,
    name: p.name,
    email: p.email,
    changes,
  };
};
