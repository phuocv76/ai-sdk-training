"use client";

import { useMemo, useState } from "react";

// Constants
import { DASHBOARD_MESSAGES } from "@/constants/messages";

// Libraries
import type { User } from "@/lib/users";

import { AssistantChatComposer } from "./assistant-chat-composer";
import { AssistantChatMessageList } from "./assistant-chat-message-list";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | string;
  parts: unknown[];
};

type AssistantChatPopupProps = {
  isAdmin: boolean;
  currentUser: User | null;
  messages: ChatMessage[];
  chatHint: string;
  busy: boolean;
  errorMessage?: string;
  input: string;
  setInput: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
};

const MIN_SCALE = 0.85;
const MAX_SCALE = 1.35;
const SCALE_STEP = 0.1;
const BASE_WIDTH = 430;
const BASE_HEIGHT = 620;

export function AssistantChatPopup({
  isAdmin,
  currentUser,
  messages,
  chatHint,
  busy,
  errorMessage,
  input,
  setInput,
  onSubmit,
}: AssistantChatPopupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [scale, setScale] = useState(1);

  const panelStyle = useMemo(() => {
    const width = Math.round(BASE_WIDTH * scale);
    const height = Math.round(BASE_HEIGHT * scale);
    return {
      width: `min(92vw, ${width}px)`,
      height: `min(84vh, ${height}px)`,
    };
  }, [scale]);

  const title = isAdmin
    ? DASHBOARD_MESSAGES.DIRECTORY_ASSISTANT_TITLE
    : DASHBOARD_MESSAGES.PROFILE_ASSISTANT_TITLE;

  const decreaseScale = () => {
    setScale((value) => Math.max(MIN_SCALE, Number((value - SCALE_STEP).toFixed(2))));
  };

  const increaseScale = () => {
    setScale((value) => Math.min(MAX_SCALE, Number((value + SCALE_STEP).toFixed(2))));
  };

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto inline-flex h-12 items-center gap-2 rounded-full bg-[var(--dash-accent)] px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:brightness-110"
          aria-label={DASHBOARD_MESSAGES.SEND}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          {title}
        </button>
      ) : null}

      {isOpen ? (
        <section
          id="ai-assistant-popup"
          style={panelStyle}
          className="pointer-events-auto flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] shadow-2xl shadow-black/10"
        >
          <header className="border-b border-[var(--dash-border)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--dash-accent-soft)]">
                  <svg
                    className="h-5 w-5 text-[var(--dash-accent)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold tracking-tight sm:text-base">
                  {title}
                </h2>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={decreaseScale}
                  disabled={scale <= MIN_SCALE}
                  className="rounded-lg border border-[var(--dash-border)] px-2 py-1 text-xs font-semibold text-[var(--foreground)] disabled:opacity-45"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={increaseScale}
                  disabled={scale >= MAX_SCALE}
                  className="rounded-lg border border-[var(--dash-border)] px-2 py-1 text-xs font-semibold text-[var(--foreground)] disabled:opacity-45"
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-[var(--dash-border)] px-2 py-1 text-xs font-semibold text-[var(--foreground)]"
                  aria-label="Close assistant popup"
                >
                  -
                </button>
              </div>
            </div>
          </header>

          <AssistantChatMessageList
            messages={messages}
            chatHint={chatHint}
            currentUser={currentUser}
          />

          {errorMessage ? (
            <p className="px-5 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          ) : null}

          {!isAdmin ? (
            <p className="border-b border-[var(--dash-border)] bg-emerald-500/[0.08] px-5 py-3 text-xs text-emerald-950 dark:text-emerald-200/95">
              {DASHBOARD_MESSAGES.MEMBER_BANNER}
            </p>
          ) : null}

          <AssistantChatComposer
            isAdmin={isAdmin}
            busy={busy}
            input={input}
            setInput={setInput}
            onSubmit={onSubmit}
          />
        </section>
      ) : null}
    </div>
  );
}
