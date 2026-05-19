import type { AssistantToolPart } from './types';

export const getToolPartState = (part: AssistantToolPart): string =>
  'state' in part && typeof part.state === 'string' ? part.state : '';

export const isToolOutputPreliminary = (part: AssistantToolPart): boolean =>
  getToolPartState(part) === 'output-available' &&
  'preliminary' in part &&
  part.preliminary === true;

/** Ready to render final tool UI (not streaming, not preliminary, output available). */
export const isToolOutputReady = (
  part: AssistantToolPart,
  streamSettled: boolean,
): boolean => {
  if (!streamSettled || isToolOutputPreliminary(part)) return false;
  return getToolPartState(part) === 'output-available';
};

export const getToolPartOutput = (part: AssistantToolPart): unknown =>
  'output' in part ? part.output : undefined;
