/**
 * Central application copy: API payloads, UI strings, domain errors,
 * and AI assistant prompts. Prefer importing here over inline literals.
 */

/** JSON response `error` field and HTTP-related server messages. */
export const API_MESSAGES = {
  INVALID_INPUT: "Invalid input.",
  ALREADY_SIGNED_IN: "Already signed in. Sign out first.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  UNAUTHORIZED: "Unauthorized.",
  ADMIN_LIST_USERS_ONLY: "Only admins can list all users.",
  FORBIDDEN: "Forbidden.",
  USER_NOT_FOUND: "User not found.",
  REGISTER_CONFLICT:
    "Could not register. Email may already be registered.",
  UNKNOWN_ERROR: "Unknown error",
  INVALID_JSON_BODY: "Invalid JSON body",
  MISSING_OPENAI_API_KEY:
    "Missing OPENAI_API_KEY. Add it to .dev.vars / wrangler secrets / .env.local.",
} as const;

/** D1 / infrastructure errors from `requireDatabase`. */
export const DATABASE_MESSAGES = {
  D1_BINDING_MISSING: "D1 binding missing (configure wrangler.jsonc).",
  UNAVAILABLE: "Database unavailable.",
} as const;

/** Thrown or returned from user domain logic (`users`, chat tools). */
export const USER_DOMAIN_ERRORS = {
  EMAIL_ALREADY_IN_USE: "Email already in use.",
  EMAIL_ALREADY_REGISTERED: "Email already registered.",
  FAILED_TO_READ_CREATED_USER: "Failed to read created user",
  FAILED_TO_READ_REGISTERED_USER: "Failed to read registered user",
  COULD_NOT_LOAD_PROFILE: "Could not load profile.",
} as const;

/** Client-side fallback when `/api/auth/*` omits `error`. */
export const AUTH_UI_MESSAGES = {
  SIGN_UP_FAILED: "Sign up failed.",
  SIGN_IN_FAILED: "Sign in failed.",
} as const;

/** Shared glyphs for empty state / initials (single source for “missing” UI). */
export const UI_SYMBOLS = {
  EM_DASH: "—",
  UNKNOWN_INITIAL: "?",
} as const;

/** Sidebar / branding short code (logo chip). */
export const BRAND_MESSAGES = {
  LOGO_CHIP: "UM",
  PRODUCT_NAME: "User Management",
} as const;

/** Login and registration screen. */
export const LOGIN_MESSAGES = {
  SUBTITLE: "Sign in to view the directory",
  SIGN_IN_TAB: "Sign in",
  SIGN_UP_TAB: "Sign up",
  FULL_NAME_LABEL: "Full name",
  EMAIL_LABEL: "Email",
  PASSWORD_LABEL: "Password",
  FULL_NAME_PLACEHOLDER: "Jane Doe",
  EMAIL_PLACEHOLDER: "you@company.com",
  PASSWORD_PLACEHOLDER_SIGN_UP: "At least 8 characters",
  PASSWORD_PLACEHOLDER_SIGN_IN: "••••••••",
  FIRST_ACCOUNT_HINT:
    "The first account becomes an admin so you can manage users in the assistant; later signups are members.",
  SUBMIT_BUSY: "Please wait…",
} as const;

/** Auth session provider and hook errors / loading copy. */
export const AUTH_SESSION_MESSAGES = {
  USE_AUTH_OUTSIDE_PROVIDER: "useAuth must be used within AuthSessionProvider",
  LOADING: "Loading…",
  REDIRECTING_TO_SIGN_IN: "Redirecting to sign in…",
} as const;

/** Dashboard shell (sidebar + header chrome). */
export const DASHBOARD_SHELL_MESSAGES = {
  SIDEBAR_ARIA_MAIN_NAV: "Main navigation",
  SIGNED_IN_SUBTITLE: "Signed-in account · D1 + AI",
  TECH_STACK_NOTE: "Cloudflare D1 · OpenNext · Vercel AI SDK",
  NOTIFICATIONS_ARIA: "Notifications",
} as const;

/** Header title by role. */
export const HEADER_TITLE_MESSAGES = {
  ADMIN_KICKER: "Overview",
  MEMBER_KICKER: "Account",
  ADMIN_HEADING: "Team directory",
} as const;

/** Sidebar navigation labels. */
export const SIDEBAR_NAV_LABELS = {
  DASHBOARD: "Dashboard",
  USERS: "Users",
  AI_ASSISTANT: "AI Assistant",
  MY_PROFILE: "My profile",
} as const;

/** Dashboard account chip and actions. */
export const ACCOUNT_MESSAGES = {
  ROLE_ADMIN: "Admin",
  ROLE_MEMBER: "Member",
  SIGN_OUT: "Sign out",
  SIGN_OUT_SHORT: "Out",
  SIGN_OUT_ARIA: "Sign out",
} as const;

/** OpenAI API key sidebar field. */
export const OPENAI_KEY_UI_MESSAGES = {
  USE_PROVIDER_ERROR:
    "useOpenAiApiKey must be used within OpenAiApiKeyProvider",
  LABEL: "OpenAI API key",
  PLACEHOLDER: "Optional — overrides env key",
  HELP_PREFIX: "Stored in this tab only. Leave blank to use the server ",
  HELP_CODE_LABEL: "OPENAI_API_KEY",
  HELP_SUFFIX: ".",
} as const;

/** User directory + chat dashboard. */
export const DASHBOARD_MESSAGES = {
  FAILED_LOAD_USERS: "Failed to load users",
  ADMIN_CHAT_SUBTITLE: "Natural-language directory + profile edits",
  MEMBER_CHAT_SUBTITLE:
    "Assistant updates your profile (name, bio, birthday) via chat",
  CHAT_HINT_ADMIN:
    'Try: "List users", "Set user <id> bio to …", or add a new account.',
  CHAT_HINT_MEMBER:
    'Try: "Show my profile", "Set my first name to …", "Update my date of birth to 1995-06-01".',
  MEMBER_BANNER:
    "The assistant uses getMyProfile and updateMyProfile—only your account can change.",
  STAT_TOTAL_USERS: "Total users",
  STAT_PROFILES_NOTE: "Profiles stored in Cloudflare D1",
  STAT_DIRECTORY_STATUS: "Directory status",
  STAT_LIVE: "Live",
  STAT_ROWS_NOTE: "Rows open a full profile drawer",
  STAT_AI_ASSISTANT: "AI assistant",
  STAT_WORKING: "Working…",
  STAT_READY: "Ready",
  STAT_MY_PROFILE: "My profile",
  STAT_ACTIVE: "Active",
  STAT_FIELDS_SYNC_NOTE: "Fields sync when the assistant confirms an update.",
  STAT_CHAT_UPDATES: "Chat updates",
  STAT_OPEN: "Open",
  STAT_NATURAL_NOTE:
    "Speak naturally to change name, bio, or birthday (YYYY-MM-DD).",
  YOUR_PROFILE_SECTION_TITLE: "Your profile",
  YOUR_PROFILE_SECTION_BLURB:
    "Use the assistant to revise first name, last name, date of birth, or bio anytime.",
  USERS_SECTION_TITLE: "Users",
  USERS_SECTION_BLURB:
    "Click a row to open the full profile. Chat can update listings and profile fields for any user id.",
  SEARCH_PLACEHOLDER: "Search name or email…",
  REFRESH: "Refresh",
  LOADING_DIRECTORY: "Loading directory…",
  NO_USERS_EMPTY:
    "No users yet. Ask the assistant to add someone or run your seed migrations.",
  NO_SEARCH_MATCHES: "No users match your search.",
  COL_USER: "User",
  COL_DOB: "DOB",
  COL_ROLE: "Role",
  COL_STATUS: "Status",
  COL_JOINED: "Joined",
  ROW_STATUS_ACTIVE: "Active",
  FOOTER_SHOWING_PREFIX: "Showing ",
  FOOTER_OF: " of ",
  FOOTER_USERS: "users",
  FOOTER_FILTERED: " (filtered)",
  DIRECTORY_ASSISTANT_TITLE: "Directory assistant",
  PROFILE_ASSISTANT_TITLE: "Profile assistant",
  LABEL_YOU: "You",
  LABEL_ASSISTANT: "Assistant",
  PLACEHOLDER_ADMIN_INPUT: "Ask about users or profiles…",
  PLACEHOLDER_MEMBER_INPUT: "Tell the assistant how to update your profile…",
  SEND_BUSY: "…",
  SEND: "Send",
} as const;

/** User profile drawer and field labels. */
export const PROFILE_UI_MESSAGES = {
  DISPLAY_NAME_LABEL: "Display name",
  EMAIL_LABEL: "Email",
  FIRST_NAME_LABEL: "First name",
  LAST_NAME_LABEL: "Last name",
  DATE_OF_BIRTH_LABEL: "Date of birth",
  LEGACY_NAME_LABEL: "Legacy name (account)",
  ROLE_LABEL: "Role",
  JOINED_LABEL: "Joined",
  BIO_LABEL: "Bio",
  MODAL_TITLE: "Profile",
  MODAL_SUBTITLE: "Detailed directory record · click backdrop to close",
  CLOSE_PROFILE_ARIA: "Close profile",
  CLOSE_ARIA: "Close",
  LOADING_PROFILE: "Loading profile…",
  PROFILE_LOAD_FAILED: "Could not load this profile.",
} as const;

/** Next.js metadata (layout). */
export const APP_METADATA_MESSAGES = {
  TITLE: "User Management · AI + D1",
  DESCRIPTION:
    "Chat-driven user CRUD with Vercel AI SDK, Next.js, and Cloudflare D1.",
} as const;

/** Vercel AI tool descriptions (`chat` route). */
export const CHAT_TOOL_MESSAGES = {
  GET_MY_PROFILE:
    "Load the signed-in user's full profile record (directory fields plus first name, last name, DOB YYYY-MM-DD, bio).",
  UPDATE_MY_PROFILE:
    "Update ONLY the signed-in user's profile fields. Omit unchanged fields. Empty string clears a field. Date of birth as YYYY-MM-DD.",
  LIST_USERS:
    "List every user, newest first (including profile columns).",
  GET_USER: "Fetch one user by id (includes profile columns).",
  USER_ID_PARAM: "User id (UUID)",
  CREATE_USER:
    "Create a directory user with unique email (no portal password)",
  UPDATE_USER:
    "Update identity, profile, or both for any user by id (omit unchanged fields)",
  DELETE_USER: "Delete a user by id.",
} as const;

/** `streamText` system prompts for admins vs members. */
export const CHAT_SYSTEM_PROMPTS = {
  ADMIN: `You are the assistant for an internal user directory. Profiles live on the users table:
first_name, last_name, date_of_birth (YYYY-MM-DD), bio, plus legacy name/email/role.

Rules:
- After each successful tool call, briefly confirm ids and updated fields (including profile when relevant).
- For updates only pass fields that change; omit others.
- Handle unique email collisions clearly.`,
} as const;

/**
 * Builds the member-facing system prompt with the user's display/account name.
 * @param memberName Signed-in user's name shown in prompt context.
 */
export function chatMemberSystemPrompt(memberName: string): string {
  return `You help the signed-in member (${memberName}) with their OWN profile via getMyProfile and updateMyProfile.
They cannot list everyone or change others. Field rules:
- first_name, last_name, bio optional strings; omit if unchanged.
- date_of_birth as YYYY-MM-DD or omit; empty/null clears DOB where supported.
Invite natural language (“set my bio to”) and translate to explicit tool inputs.`;
}

/** Canonical HTTP header names shared by the chat API and client transport. */
export const REQUEST_HEADERS = {
  OPENAI_API_KEY_OVERRIDE: "x-openai-api-key",
} as const;
