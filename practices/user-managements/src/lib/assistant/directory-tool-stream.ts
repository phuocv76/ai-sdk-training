import { getToolName, isToolUIPart } from 'ai';
import type {
  DynamicToolUIPart,
  ToolUIPart,
  UIDataTypes,
  UIMessagePart,
  UITools,
} from 'ai';

import {
  parseAmbiguousDuplicateNameOutput,
  parseConfirmationOutput,
  parseGetMyProfileToolOutput,
  parseOkUserToolOutput,
} from '@/lib/assistant/tool-output-parsers';

/** Tools that use result cards in the assistant thread. */
export const DIRECTORY_CARD_TOOL_NAMES = new Set([
  'createUser',
  'updateUser',
  'updateMyProfile',
  'getMyProfile',
]);

export const isDirectoryCardToolName = (name: string): boolean =>
  DIRECTORY_CARD_TOOL_NAMES.has(name);

/**
 * True when the tool part renders nothing yet (caller shows loading dots) — streaming assistant turn,
 * SDK pre-output states, or preliminary tool results.
 */
export const directoryToolSurfaceIsDeferred = (
  part: unknown,
  streamSettled: boolean,
): boolean => {
  if (!isToolUIPart(part as UIMessagePart<UIDataTypes, UITools>)) return false;
  const name = getToolName(part as ToolUIPart | DynamicToolUIPart);
  if (!isDirectoryCardToolName(name)) return false;
  if (!streamSettled) return true;
  const p = part as ToolUIPart | DynamicToolUIPart;
  if (p.state !== 'output-available') return true;
  return 'preliminary' in p && p.preliminary === true;
};

/** Latest assistant bubble still resolving a directory tool client-side after the HTTP stream ends. */
export const directoryToolAwaitingSdkOutput = (part: unknown): boolean => {
  if (!isToolUIPart(part as UIMessagePart<UIDataTypes, UITools>)) return false;
  const p = part as ToolUIPart | DynamicToolUIPart;
  if (!isDirectoryCardToolName(getToolName(p))) return false;
  if (p.state !== 'output-available') return true;
  return 'preliminary' in p && p.preliminary === true;
};

/**
 * When true, assistant prose for this message is hidden so tool UI (cards, dots) carries the update.
 * Confirmation previews use the dashed tool panel only (no duplicated model prose).
 */
export const assistantMessageShouldHideProseForDirectoryResultCard = (
  parts: unknown[],
): boolean => {
  for (const raw of parts) {
    if (!isToolUIPart(raw as UIMessagePart<UIDataTypes, UITools>)) continue;
    const part = raw as ToolUIPart | DynamicToolUIPart;
    if (part.state !== 'output-available') continue;
    if ('preliminary' in part && part.preliminary === true) continue;
    if (getToolName(part) === 'deleteUser') {
      const outDel = 'output' in part ? part.output : undefined;
      if (parseAmbiguousDuplicateNameOutput(outDel)) return true;
    }
  }

  for (const raw of parts) {
    if (!isToolUIPart(raw as UIMessagePart<UIDataTypes, UITools>)) continue;
    const part = raw as ToolUIPart | DynamicToolUIPart;
    const toolName = getToolName(part);
    if (!isDirectoryCardToolName(toolName)) continue;

    if (part.state !== 'output-available') return true;
    if ('preliminary' in part && part.preliminary === true) return true;

    const out = 'output' in part ? part.output : undefined;
    if (toolName === 'updateUser' && parseAmbiguousDuplicateNameOutput(out)) {
      return true;
    }
    if (parseConfirmationOutput(out)) return true;
    if (
      (toolName === 'createUser' ||
        toolName === 'updateUser' ||
        toolName === 'updateMyProfile') &&
      parseOkUserToolOutput(out)
    ) {
      return true;
    }
    if (toolName === 'getMyProfile' && parseGetMyProfileToolOutput(out)) {
      return true;
    }
  }

  return false;
};
