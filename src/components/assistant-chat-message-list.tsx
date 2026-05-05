"use client";

import { getToolName, isTextUIPart, isToolUIPart } from "ai";

import {
  assistantMessageShouldHideProseForCreateUser,
  CreateUserToolDisplay,
} from "@/components/create-user-tool-display";
import { DASHBOARD_MESSAGES } from "@/constants/messages";
import { displayName } from "@/lib/users";
import type { User } from "@/lib/users";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | string;
  parts: unknown[];
};

type AssistantChatMessageListProps = {
  messages: ChatMessage[];
  chatHint: string;
  currentUser: User | null;
};

type UIPart = Parameters<typeof isTextUIPart>[0];

function isUIPart(part: unknown): part is UIPart {
  return typeof part === "object" && part !== null && "type" in part;
}

export function AssistantChatMessageList({
  messages,
  chatHint,
  currentUser,
}: AssistantChatMessageListProps) {
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--background)]/50 p-5">
      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--dash-border)] bg-[var(--dash-card)] p-6 text-center">
          <p className="text-sm text-[var(--dash-muted)]">{chatHint}</p>
        </div>
      ) : null}
      {messages.map((m) => {
        const hideAssistantTextForInviteCard =
          m.role === "assistant" &&
          assistantMessageShouldHideProseForCreateUser(m.parts);

        return (
          <div
            key={m.id}
            className={`max-w-[95%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              m.role === "user"
                ? "ml-auto border border-[var(--dash-accent)]/25 bg-[var(--dash-accent-soft)] text-[var(--foreground)]"
                : "mr-auto border border-[var(--dash-border)] bg-[var(--dash-card)] text-[var(--foreground)]"
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={
                  m.role === "user"
                    ? "text-[11px] font-semibold tracking-wide text-[var(--dash-accent)]"
                    : "text-[11px] font-bold uppercase tracking-wider text-[var(--dash-muted)]"
                }
                title={
                  m.role === "user" && currentUser?.email
                    ? currentUser.email
                    : undefined
                }
              >
                {m.role === "user"
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
                  if (hideAssistantTextForInviteCard) {
                    return null;
                  }
                  return (
                    <p key={i} className="whitespace-pre-wrap leading-relaxed">
                      {part.text}
                    </p>
                  );
                }
                if (isToolUIPart(part)) {
                  const title = getToolName(part);
                  if (title === "createUser") {
                    return <CreateUserToolDisplay key={i} part={part} />;
                  }
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-[var(--dash-border)] bg-[var(--background)] px-3 py-2 font-mono text-[11px] text-[var(--foreground)]"
                    >
                      <div className="font-semibold text-[var(--dash-muted)]">
                        {title}{" "}
                        <span className="font-normal opacity-70">
                          ({part.state})
                        </span>
                      </div>
                      {"input" in part && part.input != null ? (
                        <pre className="mt-2 max-h-40 overflow-auto text-[var(--foreground)]">
                          {JSON.stringify(part.input, null, 2)}
                        </pre>
                      ) : null}
                      {"output" in part && part.output !== undefined ? (
                        <pre className="mt-2 max-h-48 overflow-auto text-[var(--foreground)]">
                          {JSON.stringify(part.output, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
