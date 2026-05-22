'use client';

import { useMemo } from 'react';

import {
  assistantMessageShouldHideProseForDirectoryResultCard,
  directoryToolAwaitingSdkOutput,
} from '@/lib/assistant/directory-tool-stream';
import { knowledgeToolAwaitingSdkOutput } from '@/lib/assistant/knowledge-tool-stream';

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

const isAssistantRole = (role: string): boolean =>
  role === 'assistant' || role === 'Assistant';

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

  const awaitingKnowledgeSdkFinish =
    isLast &&
    isAssistantRole(message.role) &&
    message.parts.some(knowledgeToolAwaitingSdkOutput);

  /**
   * Always pulse on the active assistant bubble while the chat is in flight.
   * Do not gate on visible body: during tool rounds `streamSettledForBubble` is
   * false so directory cards hide, which previously left only the “Assistant” label.
   */
  const streamingThisAssistant =
    isLast &&
    isAssistantRole(message.role) &&
    (busy || awaitingDirectorySdkFinish || awaitingKnowledgeSdkFinish);

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
