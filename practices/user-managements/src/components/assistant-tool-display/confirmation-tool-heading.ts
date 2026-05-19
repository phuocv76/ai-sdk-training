import { DASHBOARD_MESSAGES } from '@/constants/messages';

/** Human-readable tool title in confirmation previews (matches internal ids in CHAT tooling). */
export const confirmationToolHeading = (toolId: string): string => {
  switch (toolId) {
    case 'createUser':
      return DASHBOARD_MESSAGES.ASSISTANT_CONFIRM_HEADING_CREATE_USER;
    case 'updateUser':
      return DASHBOARD_MESSAGES.ASSISTANT_CONFIRM_HEADING_UPDATE_USER;
    case 'updateMyProfile':
      return DASHBOARD_MESSAGES.ASSISTANT_CONFIRM_HEADING_UPDATE_MY_PROFILE;
    default:
      return toolId;
  }
};
