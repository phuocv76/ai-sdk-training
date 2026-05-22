import { getToolName, isToolUIPart } from 'ai';
import type {
  DynamicToolUIPart,
  ToolUIPart,
  UIDataTypes,
  UIMessagePart,
  UITools,
} from 'ai';

/** Tools that show a short knowledge-base status line in the assistant thread. */
export const KNOWLEDGE_TOOL_NAMES = new Set(['getKnowledge', 'addKnowledge']);

export const isKnowledgeToolName = (name: string): boolean =>
  KNOWLEDGE_TOOL_NAMES.has(name);

/**
 * True when the knowledge tool UI must not count as “visible body” yet — keeps
 * streaming dots while the model continues after the tool returns.
 */
export const knowledgeToolSurfaceIsDeferred = (
  part: unknown,
  streamSettled: boolean,
): boolean => {
  if (!isToolUIPart(part as UIMessagePart<UIDataTypes, UITools>)) return false;
  const name = getToolName(part as ToolUIPart | DynamicToolUIPart);
  if (!isKnowledgeToolName(name)) return false;
  if (!streamSettled) return true;
  const p = part as ToolUIPart | DynamicToolUIPart;
  if (p.state !== 'output-available') return true;
  return 'preliminary' in p && p.preliminary === true;
};

/** Latest assistant bubble still resolving a knowledge tool after the HTTP stream ends. */
export const knowledgeToolAwaitingSdkOutput = (part: unknown): boolean => {
  if (!isToolUIPart(part as UIMessagePart<UIDataTypes, UITools>)) return false;
  const p = part as ToolUIPart | DynamicToolUIPart;
  if (!isKnowledgeToolName(getToolName(p))) return false;
  if (p.state !== 'output-available') return true;
  return 'preliminary' in p && p.preliminary === true;
};
