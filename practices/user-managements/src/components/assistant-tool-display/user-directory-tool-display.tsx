'use client';

import type { ReactNode } from 'react';

import { getToolName } from 'ai';

import {
  parseAmbiguousDuplicateNameOutput,
  parseConfirmationOutput,
  parseOkUserToolOutput,
} from '@/lib/assistant/tool-output-parsers';
import type { ClientUser } from '@/lib/domain/user';

import { AmbiguousDuplicateNamePanel } from './ambiguous-duplicate-name-panel';
import { confirmationToolHeading } from './confirmation-tool-heading';
import { DirectoryHumanConfirmPanel } from './directory-human-confirm-panel';
import type { AssistantToolPart, UserResultCardVariant } from './types';
import {
  getToolPartOutput,
  isToolOutputReady,
} from './tool-part-state';
import { UserResultCard } from './user-result-card';

export const UserDirectoryToolDisplay = ({
  part,
  cardVariant,
  parseOutput = parseOkUserToolOutput,
  failedFallback,
  streamSettled,
}: {
  part: AssistantToolPart;
  cardVariant: UserResultCardVariant;
  parseOutput?: (output: unknown) => ClientUser | null;
  failedFallback?: ReactNode;
  streamSettled: boolean;
}) => {
  if (!isToolOutputReady(part, streamSettled)) {
    return null;
  }

  const title = getToolName(part);
  const output = getToolPartOutput(part);

  const ambiguous = parseAmbiguousDuplicateNameOutput(output);
  if (ambiguous && title === 'updateUser') {
    return (
      <AmbiguousDuplicateNamePanel
        toolHeading={confirmationToolHeading(title)}
        matches={ambiguous.matches}
        message={ambiguous.message}
        hint={ambiguous.hint}
      />
    );
  }

  const confirmation = parseConfirmationOutput(output);
  if (confirmation) {
    return (
      <DirectoryHumanConfirmPanel
        toolId={title}
        heading={confirmationToolHeading(title)}
        message={confirmation.message}
        hint={confirmation.hint}
        preview={confirmation.preview}
      />
    );
  }

  const user = parseOutput(output);
  if (user) {
    return <UserResultCard user={user} variant={cardVariant} />;
  }

  if (failedFallback !== undefined) {
    return failedFallback;
  }

  return null;
};
