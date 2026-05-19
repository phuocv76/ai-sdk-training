type JsonObject = Record<string, unknown>;

const TOOL_PART_STATES_NEED_INPUT = new Set([
  'input-available',
  'output-available',
  'output-error',
  'output-denied',
  'approval-requested',
  'approval-responded',
]);

/**
 * The AI SDK validates replayed UI messages with Zod. `JSON.stringify` drops keys
 * set to `undefined`, so client history can omit `input`/`output` on tool parts
 * even when `state: "output-available"` requires them — `validateUIMessages` then
 * throws `TypeValidationError` ("Invalid input") on harmless follow-ups like "ok".
 *
 * Normalize tool-like parts before `createAgentUIStreamResponse`.
 */
export function sanitizeChatUiMessagesForValidation(
  messages: unknown,
): unknown[] {
  if (!Array.isArray(messages)) return messages as unknown[];
  return messages.map((msg) => sanitizeMessage(msg));
}

function sanitizeMessage(msg: unknown): unknown {
  if (!msg || typeof msg !== 'object') return msg;
  const m = msg as JsonObject;
  const parts = m.parts;
  if (!Array.isArray(parts)) return msg;
  return { ...m, parts: parts.map((p) => sanitizePart(p)) };
}

function sanitizePart(part: unknown): unknown {
  if (!part || typeof part !== 'object') return part;
  const p = part as JsonObject;
  const type = p.type;
  const typeStr = typeof type === 'string' ? type : '';

  const isTypedTool =
    typeStr.startsWith('tool-') && type !== 'dynamic-tool';
  const isDynamic = type === 'dynamic-tool';
  if (!isTypedTool && !isDynamic) return part;

  const state = p.state;
  const next: JsonObject = { ...p };

  if (
    typeof state === 'string' &&
    TOOL_PART_STATES_NEED_INPUT.has(state) &&
    next.input === undefined
  ) {
    next.input = {};
  }

  if (state === 'output-available' && next.output === undefined) {
    next.output = null;
  }

  // Zod forbids `errorText` outside `output-error` — strip stray fields from streams.
  if (state !== 'output-error' && 'errorText' in next) {
    delete next.errorText;
  }

  if (
    state === 'output-error' &&
    (typeof next.errorText !== 'string' || next.errorText.trim() === '')
  ) {
    next.errorText = 'Tool execution failed.';
  }

  if (typeof next.toolCallId !== 'string' || next.toolCallId.trim() === '') {
    next.toolCallId = 'recovered-tool-call';
  }

  if (isDynamic && (typeof next.toolName !== 'string' || next.toolName === '')) {
    next.toolName = 'unknownTool';
  }

  if (
    state === 'approval-requested' &&
    (!next.approval || typeof next.approval !== 'object')
  ) {
    next.approval = { id: 'recovered-approval-requested' };
  }

  if (
    state === 'approval-responded' &&
    (!next.approval ||
      typeof next.approval !== 'object' ||
      typeof (next.approval as JsonObject).approved !== 'boolean')
  ) {
    next.approval = {
      id: 'recovered-approval-responded',
      approved: true as const,
    };
  }

  if (
    state === 'output-denied' &&
    (!next.approval ||
      typeof next.approval !== 'object' ||
      typeof (next.approval as JsonObject).id !== 'string')
  ) {
    next.approval = {
      id: 'recovered-denied',
      approved: false as const,
    };
  }

  return next;
}
