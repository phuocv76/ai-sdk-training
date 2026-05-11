/**
 * Central application copy: API payloads, UI strings, domain errors,
 * and AI assistant prompts. Prefer importing here over inline literals.
 */

/** JSON response `error` field and HTTP-related server messages. */
export const API_MESSAGES = {
  INVALID_INPUT: "Invalid input.",
  ALREADY_SIGNED_IN: "Already signed in. Sign out first.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_INACTIVE: "This account has been deactivated.",
  CANNOT_DEACTIVATE_SELF_ACCOUNT:
    "You cannot deactivate your own account while signed in.",
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
  CHAT_OFF_TOPIC:
    "I can only help with user management tasks like profiles, users, roles, and account updates.",
  /** Shown when the assistant stream fails (model, tools, or transport). */
  CHAT_STREAM_ERROR:
    "The assistant could not finish that reply. Please try again in a moment.",
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
    'Try: create new user, updated or deleted user or deactivate/activate user',
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
    "Click a row to open the full profile. Chat can update name, bio, birthday, or status—email stays fixed once the account exists.",
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
  ROW_STATUS_INACTIVE: "Inactive",
  FOOTER_SHOWING_PREFIX: "Showing ",
  FOOTER_OF: " of ",
  FOOTER_USERS: " users",
  FOOTER_FILTERED: " (filtered)",
  DIRECTORY_ASSISTANT_TITLE: "Directory assistant",
  PROFILE_ASSISTANT_TITLE: "Profile assistant",
  AI_PROVIDER_LABEL: "Provider",
  AI_PROVIDER_OPENAI: "OpenAI",
  AI_PROVIDER_OLLAMA: "Ollama (local)",
  LABEL_YOU: "You",
  LABEL_ASSISTANT: "Assistant",
  PLACEHOLDER_ADMIN_INPUT: "Ask about users or profiles…",
  PLACEHOLDER_MEMBER_INPUT: "Tell the assistant how to update your profile…",
  SEND_BUSY: "…",
  SEND: "Send",
  MEMBER_INVITED_CARD_BADGE: "Member invited",
  MEMBER_INVITED_SUCCESS_LINE:
    "Member has been successfully invited to the system",
  USER_UPDATED_CARD_BADGE: "User updated",
  USER_UPDATED_SUCCESS_LINE: "Directory record updated — details below.",
  CREATE_USER_TOOL_PENDING: "Creating user…",
  UPDATE_USER_TOOL_PENDING: "Updating user…",
  UPDATE_MY_PROFILE_TOOL_PENDING: "Updating your profile…",
  GET_MY_PROFILE_TOOL_PENDING: "Loading your profile…",
  MEMBER_PROFILE_CARD_BADGE: "Your profile",
  MEMBER_PROFILE_LOADED_SUCCESS_LINE:
    "Here’s your profile as stored in the directory.",
  MEMBER_PROFILE_UPDATED_CARD_BADGE: "Profile updated",
  MEMBER_PROFILE_UPDATED_SUCCESS_LINE: "Your profile has been saved.",
} as const;

/** User profile drawer and field labels. */
export const PROFILE_UI_MESSAGES = {
  STATUS_LABEL: "Status",
  NAME_LABEL: "Name",
  EMAIL_LABEL: "Email",
  DATE_OF_BIRTH_LABEL: "Date of birth",
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
    "Load the signed-in user's full profile record (name, DOB YYYY-MM-DD, bio). Email is shown for reference only; do not submit email changes.",
  UPDATE_MY_PROFILE:
    "Update ONLY the signed-in user's profile fields (name, bio, date of birth). Omit unchanged fields. Empty string clears a field where supported. Date of birth as YYYY-MM-DD. Do not include email—it cannot be updated via this tool. First call returns a preview; the human must reply with \"confirm updateMyProfile\" or approve; call again with the same arguments to apply.",
  LIST_USERS:
    "List every user, newest first (including profile columns).",
  GET_USER: "Fetch one user by id (includes profile columns).",
  USER_ID_PARAM: "User id (UUID)",
  CREATE_USER:
    "Create a directory user with unique email (standard RFC-like syntax; multi-part domains such as example.com.vn or mail.co.uk are valid), full name, and date of birth (YYYY-MM-DD); bio is optional. Default password is Abcd@123.",
  UPDATE_USER:
    "Update name, bio, date of birth, or status (active | inactive) for any user by id. Omit unchanged fields. Do not submit email—addresses are fixed after account creation. Setting status to inactive signs the user out everywhere. First call returns a preview; the human must reply with \"confirm updateUser\" or approve; call again with the same arguments to apply.",
  DELETE_USER: "Delete a user by id.",
} as const;

/** Canonical HTTP header names shared by the chat API and client transport. */
export const REQUEST_HEADERS = {
  OPENAI_API_KEY_OVERRIDE: "x-openai-api-key",
} as const;
