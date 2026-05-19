'use client';

import { useMemo } from 'react';

import { isTextUIPart, isToolUIPart } from 'ai';

import {
  assistantMessageShouldHideProseForDirectoryResultCard,
  directoryToolAwaitingSdkOutput,
  directoryToolSurfaceIsDeferred,
} from '@/lib/assistant/directory-tool-stream';

export type AssistantChatMessage = {
  id: string;
  role: 'user' | 'assistant' | string;
  parts: unknown[];
};

export type UseAssistantChatMessageListParams = {
  messages: AssistantChatMessage[];
  busy: boolean;
};

export type AssistantChatMessageViewState = {
  streamSettledForBubble: boolean;
  hideAssistantTextForDirectoryCard: boolean;
  streamingThisAssistant: boolean;
};

type UIPart = Parameters<typeof isTextUIPart>[0];

const isUIPart = (part: unknown): part is UIPart =>
  typeof part === 'object' && part !== null && 'type' in part;

const isAssistantRole = (role: string): boolean =>
  role === 'assistant' || role === 'Assistant';

/** True if the message already shows text (after prose-hiding rules) or any tool UI. */
const assistantBubbleHasVisibleBody = (
  parts: unknown[],
  hideAssistantProse: boolean,
  streamSettledForBubble: boolean,
): boolean => {
  for (const part of parts) {
    if (!isUIPart(part)) continue;
    if (isTextUIPart(part)) {
      if (!hideAssistantProse && part.text.trim().length > 0) return true;
      continue;
    }
    if (isToolUIPart(part)) {
      if (directoryToolSurfaceIsDeferred(part, streamSettledForBubble)) {
        continue;
      }
      return true;
    }
  }
  return false;
};

const computeMessageViewState = (
  message: AssistantChatMessage,
  msgIdx: number,
  messages: AssistantChatMessage[],
  busy: boolean,
): AssistantChatMessageViewState => {
  const isLast = msgIdx === messages.length - 1;
  const streamSettledForBubble = !(
    busy &&
    isLast &&
    isAssistantRole(message.role)
  );
  const hideAssistantTextForDirectoryCard =
    message.role === 'assistant' &&
    assistantMessageShouldHideProseForDirectoryResultCard(message.parts);

  const awaitingDirectorySdkFinish =
    isLast &&
    isAssistantRole(message.role) &&
    message.parts.some(directoryToolAwaitingSdkOutput);

  const streamingThisAssistant =
    isLast &&
    isAssistantRole(message.role) &&
    !assistantBubbleHasVisibleBody(
      message.parts,
      hideAssistantTextForDirectoryCard,
      streamSettledForBubble,
    ) &&
    (busy || awaitingDirectorySdkFinish);

  return {
    streamSettledForBubble,
    hideAssistantTextForDirectoryCard,
    streamingThisAssistant,
  };
};

export const useAssistantChatMessageList = ({
  messages,
  busy,
}: UseAssistantChatMessageListParams) => {
  const lastRole = messages.at(-1)?.role;

  /**
   * `useChat` adds an in-progress assistant row while streaming; that row already
   * carries the ASSISTANT label. Skip the extra loading card in that case to avoid
   * two “Assistant” headers at once.
   */
  const showDetachedAssistantBusy =
    busy && !isAssistantRole(lastRole ?? '');

  const messageViewStates = useMemo(
    () =>
      messages.map((message, msgIdx) =>
        computeMessageViewState(message, msgIdx, messages, busy),
      ),
    [messages, busy],
  );

  return {
    showDetachedAssistantBusy,
    messageViewStates,
  };
};
