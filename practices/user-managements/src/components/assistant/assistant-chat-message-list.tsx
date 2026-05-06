'use client';

import { getToolName, isTextUIPart, isToolUIPart } from 'ai';

import {
  assistantMessageShouldHideProseForDirectoryResultCard,
  CreateUserToolDisplay,
  GetMyProfileToolDisplay,
  UpdateMyProfileToolDisplay,
  UpdateUserToolDisplay,
} from '@/components/create-user-tool-display';
import { DASHBOARD_MESSAGES } from '@/constants/messages';

// Libraries
import { renderInlineMarkdownBold } from '@/lib/render-inline-markdown-bold';
import { displayName } from '@/lib/users';
import type { User } from '@/lib/users';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | string;
  parts: unknown[];
};

type AssistantChatMessageListProps = {
  messages: ChatMessage[];
  chatHint: string;
  currentUser: User | null;
  busy: boolean;
};

type UIPart = Parameters<typeof isTextUIPart>[0];

const isUIPart = (part: unknown): part is UIPart =>
  typeof part === 'object' && part !== null && 'type' in part;

const isAssistantRole = (role: string): boolean =>
  role === 'assistant' || role === 'Assistant';

/** Pulsing dots shown inside the active assistant bubble when there is no visible body yet. */
const StreamingDots = () => (
    <div className="flex items-center gap-1.5 pt-1" aria-hidden>
      <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--dash-muted)]/70" />
      <span
        className="h-2 w-2 animate-pulse rounded-full bg-[var(--dash-muted)]/70"
        style={{ animationDelay: '140ms' }}
      />
      <span
        className="h-2 w-2 animate-pulse rounded-full bg-[var(--dash-muted)]/70"
        style={{ animationDelay: '280ms' }}
      />
    </div>
);

/** True if the message already shows text (after prose-hiding rules) or any tool UI. */
const assistantBubbleHasVisibleBody = (
  parts: unknown[],
  hideAssistantProse: boolean,
): boolean => {
  for (const part of parts) {
    if (!isUIPart(part)) continue;
    if (isTextUIPart(part)) {
      if (!hideAssistantProse && part.text.trim().length > 0) return true;
      continue;
    }
    if (isToolUIPart(part)) return true;
  }
  return false;
};

export const AssistantChatMessageList = ({
  messages,
  chatHint,
  currentUser,
  busy,
}: AssistantChatMessageListProps) => {
  const lastRole = messages.at(-1)?.role;
  /**
   * `useChat` adds an in-progress assistant row while streaming; that row already
   * carries the ASSISTANT label. Skip the extra loading card in that case to avoid
   * two “Assistant” headers at once.
   */
  const showDetachedAssistantBusy = busy && !isAssistantRole(lastRole ?? '');

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--background)]/50 p-5">
      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--dash-border)] bg-[var(--dash-card)] p-6 text-center">
          <p className="text-sm text-[var(--dash-muted)]">{chatHint}</p>
        </div>
      ) : null}
      {messages.map((m, msgIdx) => {
        const hideAssistantTextForDirectoryCard =
          m.role === 'assistant' &&
          assistantMessageShouldHideProseForDirectoryResultCard(m.parts);

        const isLast = msgIdx === messages.length - 1;
        const streamingThisAssistant =
          busy &&
          isLast &&
          isAssistantRole(m.role) &&
          !assistantBubbleHasVisibleBody(
            m.parts,
            hideAssistantTextForDirectoryCard,
          );

        return (
          <div
            key={m.id}
            className={`max-w-[95%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              m.role === 'user'
                ? 'ml-auto border border-[var(--dash-accent)]/25 bg-[var(--dash-accent-soft)] text-[var(--foreground)]'
                : 'mr-auto border border-[var(--dash-border)] bg-[var(--dash-card)] text-[var(--foreground)]'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={
                  m.role === 'user'
                    ? 'text-[11px] font-semibold tracking-wide text-[var(--dash-accent)]'
                    : 'text-[11px] font-bold uppercase tracking-wider text-[var(--dash-muted)]'
                }
                title={
                  m.role === 'user' && currentUser?.email
                    ? currentUser.email
                    : undefined
                }
              >
                {m.role === 'user'
                  ? currentUser
                    ? displayName(currentUser)
                    : DASHBOARD_MESSAGES.LABEL_YOU
                  : DASHBOARD_MESSAGES.LABEL_ASSISTANT}
              </span>
            </div>
            <div className="space-y-2">
              {m.parts.map((part, i) => {
                if (!isUIPart(part)) {
                  return null;
                }

                if (isTextUIPart(part)) {
                  if (hideAssistantTextForDirectoryCard) {
                    return null;
                  }
                  return (
                    <p key={i} className="whitespace-pre-wrap leading-relaxed">
                      {renderInlineMarkdownBold(part.text)}
                    </p>
                  );
                }
                if (isToolUIPart(part)) {
                  const title = getToolName(part);
                  if (title === 'createUser') {
                    return <CreateUserToolDisplay key={i} part={part} />;
                  }
                  if (title === 'updateUser') {
                    return <UpdateUserToolDisplay key={i} part={part} />;
                  }
                  if (title === 'updateMyProfile') {
                    return <UpdateMyProfileToolDisplay key={i} part={part} />;
                  }
                  if (title === 'getMyProfile') {
                    return <GetMyProfileToolDisplay key={i} part={part} />;
                  }
                  if (title === 'listUsers') return null;
                  return null;
                }
                return null;
              })}
              {streamingThisAssistant ? <StreamingDots /> : null}
            </div>
          </div>
        );
      })}
      {showDetachedAssistantBusy ? (
        <div className="mr-auto max-w-[95%] rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--dash-muted)]">
            {DASHBOARD_MESSAGES.LABEL_ASSISTANT}
          </div>
          <StreamingDots />
        </div>
      ) : null}
    </div>
  );
};
