import {
  CHAT_HUMAN_CONFIRM_MESSAGES,
} from '@/constants/messages';
import {
  API_MESSAGES,
  CHAT_TOOL_MESSAGES,
  USER_DOMAIN_ERRORS,
} from '@/server/constants/messages';
import { buildAdminChatSystemPrompt } from '@/server/constants/promts';

/** Static knowledge ingested on first RAG use (policies, tool rules, FAQs). */
export const buildKnowledgeSeedDocument = (): string => {
  return [
    '# User management knowledge base',
    '## Product scope',
    API_MESSAGES.CHAT_OFF_TOPIC,
    'The assistant helps with profiles, users, roles, and account updates in English only.',
    '## Admin directory rules',
    buildAdminChatSystemPrompt(),
    '## Tool reference',
    `getMyProfile: ${CHAT_TOOL_MESSAGES.GET_MY_PROFILE}`,
    `updateMyProfile: ${CHAT_TOOL_MESSAGES.UPDATE_MY_PROFILE}`,
    `listUsers: ${CHAT_TOOL_MESSAGES.LIST_USERS}`,
    `getUser: ${CHAT_TOOL_MESSAGES.GET_USER}`,
    `findUserByEmail: ${CHAT_TOOL_MESSAGES.FIND_USER_BY_EMAIL}`,
    `createUser: ${CHAT_TOOL_MESSAGES.CREATE_USER}`,
    `updateUser: ${CHAT_TOOL_MESSAGES.UPDATE_USER}`,
    `deleteUser: ${CHAT_TOOL_MESSAGES.DELETE_USER}`,
    '## Confirmation workflow',
    CHAT_HUMAN_CONFIRM_MESSAGES.AWAITING,
    CHAT_HUMAN_CONFIRM_MESSAGES.HOW_TO_REPLY,
    CHAT_HUMAN_CONFIRM_MESSAGES.DUPLICATE_DISPLAY_NAME_BLOCKED,
    CHAT_HUMAN_CONFIRM_MESSAGES.DUPLICATE_DISPLAY_NAME_HINT,
    '## Domain errors',
    USER_DOMAIN_ERRORS.EMAIL_ALREADY_IN_USE,
    USER_DOMAIN_ERRORS.COULD_NOT_LOAD_PROFILE,
    API_MESSAGES.CANNOT_DEACTIVATE_SELF_ACCOUNT,
    API_MESSAGES.ACCOUNT_INACTIVE,
    '## Member scope',
    'Members may only use getMyProfile and updateMyProfile on their own account.',
    'Email cannot be changed after account creation.',
    'Profile fields: name, bio, date_of_birth (YYYY-MM-DD). Use empty string to clear bio or DOB when explicitly requested.',
    'Default password for assistant-created users is Abcd@123.',
    'User status: active or inactive. Inactive users cannot sign in.',
    'Roles: admin (directory management) or member (own profile only).',
  ].join('\n\n');
};
