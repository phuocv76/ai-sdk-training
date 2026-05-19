import type { DynamicToolUIPart, ToolUIPart } from 'ai';

export type AssistantToolPart = ToolUIPart | DynamicToolUIPart;

export type UserResultCardVariant =
  | 'invited'
  | 'updated'
  | 'profile-loaded'
  | 'profile-updated';

export type ToolDisplayProps = {
  part: AssistantToolPart;
  streamSettled: boolean;
};
