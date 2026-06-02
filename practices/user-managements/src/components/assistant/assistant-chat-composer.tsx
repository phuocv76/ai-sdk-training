'use client';

import { useEffect, useRef } from 'react';

// Constants
import { DASHBOARD_MESSAGES } from '@/constants/messages';

type AssistantChatComposerProps = {
  isAdmin: boolean;
  busy: boolean;
  input: string;
  setInput: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
};

export const AssistantChatComposer = ({
  isAdmin,
  busy,
  input,
  setInput,
  onSubmit,
}: AssistantChatComposerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isInputEmpty = !input.trim();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const baseHeight = 45; // ~20% smaller than previous 56px baseline
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(baseHeight, textarea.scrollHeight)}px`;
  }, [input]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (busy || !input.trim()) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  };

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="border-t border-[var(--dash-border)] bg-[var(--dash-card)] p-4"
    >
      <div className="flex items-stretch rounded-xl border border-[var(--dash-border)] bg-[var(--background)]">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isAdmin
              ? DASHBOARD_MESSAGES.PLACEHOLDER_ADMIN_INPUT
              : DASHBOARD_MESSAGES.PLACEHOLDER_MEMBER_INPUT
          }
          rows={1}
          disabled={busy}
          className="w-full flex-1 resize-none overflow-hidden rounded-l-xl rounded-r-none bg-transparent px-3 py-3 text-sm leading-5 text-[var(--foreground)] placeholder:text-[var(--dash-muted)] focus:outline-none disabled:opacity-60"
        />
        <div className="inline-flex shrink-0 items-center justify-center rounded-l-none rounded-r-xl px-1.5">
          <button
            type="submit"
            disabled={busy || isInputEmpty}
            aria-label={DASHBOARD_MESSAGES.SEND}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all disabled:cursor-not-allowed ${
              isInputEmpty ? 'opacity-45' : 'opacity-100'
            }`}
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 bg-emerald-500"
              style={{
                maskImage: "url('/icons/send-icon.png')",
                maskRepeat: "no-repeat",
                maskPosition: "center",
                maskSize: "88%",
                WebkitMaskImage: "url('/icons/send-icon.png')",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                WebkitMaskSize: "88%",
              }}
            />
          </button>
        </div>
      </div>
    </form>
  );
};
