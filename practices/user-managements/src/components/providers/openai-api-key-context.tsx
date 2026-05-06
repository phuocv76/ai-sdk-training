"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

// Constants
import { OPENAI_KEY_UI_MESSAGES } from "@/constants/messages";

type OpenAiApiKeyContextValue = {
  apiKey: string;
  setApiKey: (value: string) => void;
};

const OpenAiApiKeyContext = createContext<OpenAiApiKeyContextValue | null>(
  null,
);

/** Supplies per-tab OpenAI API key state to the dashboard shell and chat client. */
export function OpenAiApiKeyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [apiKey, setApiKeyState] = useState("");
  const setApiKey = useCallback((value: string) => {
    setApiKeyState(value);
  }, []);

  const value = useMemo(
    () => ({ apiKey, setApiKey }),
    [apiKey, setApiKey],
  );

  return (
    <OpenAiApiKeyContext.Provider value={value}>
      {children}
    </OpenAiApiKeyContext.Provider>
  );
}

/**
 * Accesses the masked API key mirrored into `x-openai-api-key` on chat transport.
 */
export function useOpenAiApiKey() {
  const ctx = useContext(OpenAiApiKeyContext);
  if (!ctx) {
    throw new Error(
      OPENAI_KEY_UI_MESSAGES.USE_PROVIDER_ERROR,
    );
  }
  return ctx;
}

/**
 * Sidebar control: masked OpenAI key sent with chat requests when non-empty.
 */
export function OpenAiApiKeyField() {
  const { apiKey, setApiKey } = useOpenAiApiKey();

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="openai-api-key"
        className="block text-[11px] font-medium uppercase tracking-wide text-indigo-200/90"
      >
        {OPENAI_KEY_UI_MESSAGES.LABEL}
      </label>
      <input
        id="openai-api-key"
        name="openai-api-key"
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={OPENAI_KEY_UI_MESSAGES.PLACEHOLDER}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-indigo-300/40 outline-none ring-indigo-400/40 transition-[box-shadow,border-color] focus:border-indigo-400/50 focus:ring-2"
      />
      <p className="text-[10px] leading-snug text-indigo-200/55">
        {OPENAI_KEY_UI_MESSAGES.HELP_PREFIX}
        <code className="rounded bg-black/20 px-1 py-px font-mono text-[9px]">
          {OPENAI_KEY_UI_MESSAGES.HELP_CODE_LABEL}
        </code>
        {OPENAI_KEY_UI_MESSAGES.HELP_SUFFIX}
      </p>
    </div>
  );
}
