'use client';

import { getToolName } from 'ai';

import { DASHBOARD_MESSAGES, PROFILE_UI_MESSAGES } from '@/constants/messages';
import {
  parseAmbiguousDuplicateNameOutput,
  parseGetMyProfileToolOutput,
} from '@/lib/assistant/tool-output-parsers';

import { AmbiguousDuplicateNamePanel } from './ambiguous-duplicate-name-panel';
import { confirmationToolHeading } from './confirmation-tool-heading';
import type { ToolDisplayProps } from './types';
import {
  getToolPartOutput,
  getToolPartState,
  isToolOutputReady,
} from './tool-part-state';
import { UserDirectoryToolDisplay } from './user-directory-tool-display';

/** Rich UI for successful `createUser` tool parts. */
export const CreateUserToolDisplay = ({ part, streamSettled }: ToolDisplayProps) => (
  <UserDirectoryToolDisplay
    part={part}
    cardVariant="invited"
    streamSettled={streamSettled}
  />
);

/** Rich UI for successful `updateUser` tool parts (same card pattern as create). */
export const UpdateUserToolDisplay = ({ part, streamSettled }: ToolDisplayProps) => (
  <UserDirectoryToolDisplay
    part={part}
    cardVariant="updated"
    streamSettled={streamSettled}
  />
);

/** Rich UI for successful `updateMyProfile` (same `{ ok, user }` payload as updateUser). */
export const UpdateMyProfileToolDisplay = ({
  part,
  streamSettled,
}: ToolDisplayProps) => (
  <UserDirectoryToolDisplay
    part={part}
    cardVariant="profile-updated"
    streamSettled={streamSettled}
  />
);

/** Member profile card for `getMyProfile` (`{ profile }` payload). */
export const GetMyProfileToolDisplay = ({ part, streamSettled }: ToolDisplayProps) => (
  <UserDirectoryToolDisplay
    part={part}
    cardVariant="profile-loaded"
    streamSettled={streamSettled}
    parseOutput={parseGetMyProfileToolOutput}
    failedFallback={
      <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-4 text-sm text-[var(--dash-muted)] shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--dash-muted)]">
          {DASHBOARD_MESSAGES.MEMBER_PROFILE_CARD_BADGE}
        </p>
        <p className="mt-2">{PROFILE_UI_MESSAGES.PROFILE_LOAD_FAILED}</p>
      </div>
    }
  />
);

/** Duplicate-name guard panel for `deleteUser` only (successful deletes stay prose-only). */
export const DuplicateDisplayNameBlockedDisplay = ({
  part,
  streamSettled,
}: ToolDisplayProps) => {
  if (getToolName(part) !== 'deleteUser') return null;
  if (!isToolOutputReady(part, streamSettled)) return null;
  if (getToolPartState(part) !== 'output-available') return null;

  const ambiguous = parseAmbiguousDuplicateNameOutput(getToolPartOutput(part));
  if (!ambiguous) return null;

  const title = getToolName(part);
  return (
    <AmbiguousDuplicateNamePanel
      toolHeading={confirmationToolHeading(title)}
      matches={ambiguous.matches}
      message={ambiguous.message}
      hint={ambiguous.hint}
    />
  );
};
