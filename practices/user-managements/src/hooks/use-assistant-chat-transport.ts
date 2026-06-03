"use client";

import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, type RefObject } from "react";

import type { ChatAiProviderId } from "@/constants/ai-provider";
import { REQUEST_HEADERS } from "@/constants/messages";

/**
 * Chat transport: sends `x-openai-api-key` only until the server returns
 * `x-openai-api-key-token`, then sends that token on every subsequent request.
 *
 * The active conversation thread is read from `threadIdRef` on every send so
 * the transport stays stable while the user switches threads.
 */
export const useAssistantChatTransport = (
  openAiApiKey: string,
  aiProvider: ChatAiProviderId,
  threadIdRef: RefObject<string | null>,
) => {
  const openAiKeyTokenRef = useRef<string | null>(null);

  useEffect(() => {
    openAiKeyTokenRef.current = null;
  }, [openAiApiKey]);

  /* eslint-disable react-hooks/refs -- token ref is only used in transport callbacks */
  return useMemo(
    () =>
      new DefaultChatTransport({
        fetch: async (input, init) => {
          const res = await fetch(input, {
            ...init,
            credentials: "include",
          });
          const issuedToken = res.headers
            .get(REQUEST_HEADERS.OPENAI_API_KEY_TOKEN)
            ?.trim();
          if (issuedToken) openAiKeyTokenRef.current = issuedToken;
          return res;
        },
        headers: () => {
          const headers: Record<string, string> = {};
          const token = openAiKeyTokenRef.current?.trim();
          if (token) {
            headers[REQUEST_HEADERS.OPENAI_API_KEY_TOKEN] = token;
            return headers;
          }
          const key = openAiApiKey.trim();
          if (key) headers[REQUEST_HEADERS.OPENAI_API_KEY_OVERRIDE] = key;
          return headers;
        },
        prepareSendMessagesRequest: ({
          id,
          messages,
          body,
          trigger,
          messageId,
        }) => ({
          body: {
            ...body,
            id,
            messages,
            trigger,
            messageId,
            provider: aiProvider,
            threadId: threadIdRef.current,
          },
        }),
      }),
    [openAiApiKey, aiProvider, threadIdRef],
  );
  /* eslint-enable react-hooks/refs */
};
