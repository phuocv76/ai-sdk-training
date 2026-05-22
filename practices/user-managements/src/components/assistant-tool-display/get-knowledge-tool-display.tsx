'use client';

import { DASHBOARD_MESSAGES } from '@/constants/messages';

import { ToolPendingCard } from './tool-pending-card';
import type { ToolDisplayProps } from './types';
import {
  getToolPartState,
  isToolOutputPreliminary,
} from './tool-part-state';

const knowledgeToolStillSearching = (
  part: ToolDisplayProps['part'],
): boolean => {
  if (isToolOutputPreliminary(part)) return true;
  return getToolPartState(part) !== 'output-available';
};

/** Searching UI only for `getKnowledge` / `addKnowledge` (no result line). */
export const KnowledgeToolDisplay = ({
  part,
  variant,
}: ToolDisplayProps & { variant: 'getKnowledge' | 'addKnowledge' }) => {
  if (!knowledgeToolStillSearching(part)) return null;

  const pendingMessage =
    variant === 'getKnowledge'
      ? DASHBOARD_MESSAGES.GET_KNOWLEDGE_TOOL_PENDING
      : DASHBOARD_MESSAGES.ADD_KNOWLEDGE_TOOL_PENDING;

  return (
    <ToolPendingCard
      title="Knowledge"
      message={pendingMessage}
    />
  );
};
