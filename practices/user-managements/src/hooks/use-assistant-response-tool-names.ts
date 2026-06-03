'use client';

export const ASSISTANT_RESPONSE_TOOL_NAMES = {
  createUser: 'createUser',
  updateUser: 'updateUser',
  updateMyProfile: 'updateMyProfile',
  getMyProfile: 'getMyProfile',
  deleteUser: 'deleteUser',
  listUsers: 'listUsers',
  getKnowledge: 'getKnowledge',
} as const;

export type AssistantResponseToolName =
  (typeof ASSISTANT_RESPONSE_TOOL_NAMES)[keyof typeof ASSISTANT_RESPONSE_TOOL_NAMES];

export const ALL_ASSISTANT_RESPONSE_TOOL_NAMES: readonly AssistantResponseToolName[] =
  Object.values(ASSISTANT_RESPONSE_TOOL_NAMES);

export const useAssistantResponseToolNames = () => ASSISTANT_RESPONSE_TOOL_NAMES;
