"use client";

// Constants
import { DASHBOARD_MESSAGES } from "@/constants/messages";

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
  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="border-t border-[var(--dash-border)] bg-[var(--dash-card)] p-4"
    >
      <div className="flex items-center gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isAdmin
              ? DASHBOARD_MESSAGES.PLACEHOLDER_ADMIN_INPUT
              : DASHBOARD_MESSAGES.PLACEHOLDER_MEMBER_INPUT
          }
          rows={2}
          disabled={busy}
          className="min-h-[48px] flex-1 resize-none rounded-xl border border-[var(--dash-border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--dash-muted)] focus:border-[var(--dash-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--dash-accent)]/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="shrink-0 rounded-xl bg-[var(--dash-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-900/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? DASHBOARD_MESSAGES.SEND_BUSY : DASHBOARD_MESSAGES.SEND}
        </button>
      </div>
    </form>
  );
};
