'use client';

import { getToolName, isTextUIPart, isToolUIPart } from 'ai';

import {
  CreateUserToolDisplay,
  DuplicateDisplayNameBlockedDisplay,
  GetMyProfileToolDisplay,
  UpdateMyProfileToolDisplay,
  UpdateUserToolDisplay,
} from '@/components/assistant-tool-display';
import { DASHBOARD_MESSAGES } from '@/constants/messages';

// Libraries
import { displayName, type User } from '@/lib/domain/user';
import { renderInlineMarkdownBold } from '@/lib/markdown/render-inline-markdown-bold';

import {
  type AssistantChatMessage,
  useAssistantChatMessageList,
} from '@/hooks/use-assistant-chat-message-list';

type AssistantChatMessageListProps = {
  messages: AssistantChatMessage[];
  chatHint: string;
  currentUser: User | null;
  busy: boolean;
};

type UIPart = Parameters<typeof isTextUIPart>[0];

const isUIPart = (part: unknown): part is UIPart =>
  typeof part === 'object' && part !== null && 'type' in part;

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

export const AssistantChatMessageList = ({
  messages,
  chatHint,
  currentUser,
  busy,
}: AssistantChatMessageListProps) => {
  const { showDetachedAssistantBusy, messageViewStates } =
    useAssistantChatMessageList({ messages, busy });

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--background)]/50 p-5">
      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--dash-border)] bg-[var(--dash-card)] p-6 text-center">
          <p className="text-sm text-[var(--dash-muted)]">{chatHint}</p>
        </div>
      ) : null}
      {messages.map((m, msgIdx) => {
        const {
          streamSettledForBubble,
          hideAssistantTextForDirectoryCard,
          streamingThisAssistant,
        } = messageViewStates[msgIdx];

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
                    return (
                      <CreateUserToolDisplay
                        key={i}
                        part={part}
                        streamSettled={streamSettledForBubble}
                      />
                    );
                  }
                  if (title === 'updateUser') {
                    return (
                      <UpdateUserToolDisplay
                        key={i}
                        part={part}
                        streamSettled={streamSettledForBubble}
                      />
                    );
                  }
                  if (title === 'updateMyProfile') {
                    return (
                      <UpdateMyProfileToolDisplay
                        key={i}
                        part={part}
                        streamSettled={streamSettledForBubble}
                      />
                    );
                  }
                  if (title === 'getMyProfile') {
                    return (
                      <GetMyProfileToolDisplay
                        key={i}
                        part={part}
                        streamSettled={streamSettledForBubble}
                      />
                    );
                  }
                  if (title === 'deleteUser') {
                    return (
                      <DuplicateDisplayNameBlockedDisplay
                        key={i}
                        part={part}
                        streamSettled={streamSettledForBubble}
                      />
                    );
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
