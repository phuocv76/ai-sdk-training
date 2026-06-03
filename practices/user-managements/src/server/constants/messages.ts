/** JSON response `error` field and HTTP-related server messages. */
export const API_MESSAGES = {
  INVALID_INPUT: 'Invalid input.',
  ALREADY_SIGNED_IN: 'Already signed in. Sign out first.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_INACTIVE: 'This account has been deactivated.',
  CANNOT_DEACTIVATE_SELF_ACCOUNT:
    'You cannot deactivate your own account while signed in.',
  UNAUTHORIZED: 'Unauthorized.',
  ADMIN_LIST_USERS_ONLY: 'Only admins can list all users.',
  FORBIDDEN: 'Forbidden.',
  USER_NOT_FOUND: 'User not found.',
  REGISTER_CONFLICT:
    'Could not register. Email may already be registered.',
  UNKNOWN_ERROR: 'Unknown error',
  INVALID_JSON_BODY: 'Invalid JSON body',
  MISSING_OPENAI_API_KEY:
    'Missing OPENAI_API_KEY. Add it to .dev.vars / wrangler secrets / .env.local.',
  CHAT_OFF_TOPIC:
    'I can only help with user management tasks like profiles, users, roles, and account updates.',
  /** Shown when the assistant stream fails (model, tools, or transport). */
  CHAT_STREAM_ERROR:
    'The assistant could not finish that reply. Please try again in a moment.',
  /** Returned when a request references a chat thread the user does not own. */
  THREAD_NOT_FOUND: 'Conversation not found.',
  /** Returned when a thread title PATCH omits a usable title. */
  THREAD_TITLE_REQUIRED: 'A conversation title is required.',
} as const;

/** D1 / infrastructure errors from `requireDatabase`. */
export const DATABASE_MESSAGES = {
  D1_BINDING_MISSING: 'D1 binding missing (configure wrangler.jsonc).',
  UNAVAILABLE: 'Database unavailable.',
} as const;

/** Thrown or returned from user domain logic (`users`, chat tools). */
export const USER_DOMAIN_ERRORS = {
  EMAIL_ALREADY_IN_USE: 'Email already in use.',
  EMAIL_ALREADY_REGISTERED: 'Email already registered.',
  FAILED_TO_READ_CREATED_USER: 'Failed to read created user',
  FAILED_TO_READ_REGISTERED_USER: 'Failed to read registered user',
  COULD_NOT_LOAD_PROFILE: 'Could not load profile.',
} as const;

/** Vercel AI tool descriptions (`chat` route). */
export const CHAT_TOOL_MESSAGES = {
  GET_MY_PROFILE:
    "Load the signed-in user's full profile record (name, DOB YYYY-MM-DD, bio). Email is shown for reference only; do not submit email changes.",
  UPDATE_MY_PROFILE:
    "Update ONLY the signed-in user's profile fields (name, bio, date of birth). Omit unchanged fields entirely—never send date_of_birth or bio as null. Empty string clears a field only when the human explicitly asked to clear it. Date of birth as YYYY-MM-DD. Do not include email—it cannot be updated via this tool. Two-step: first call with humanAffirmsExecute false or omitted returns a preview; after the user clearly affirms (you judge their wording, including typos), call again with the same field values and humanAffirmsExecute true to apply.",
  LIST_USERS:
    'List every user, newest first (including profile columns). Use this to resolve duplicate display names before updateUser/deleteUser: compare names case-insensitively with trim. For a single email existence check, prefer findUserByEmail.',
  GET_USER: 'Fetch one user by id (includes profile columns).',
  FIND_USER_BY_EMAIL:
    "Look up one directory user by email (trimmed and compared case-insensitively, same as sign-in). Use this whenever the human asks whether an address exists, who has an email, or similar—then answer only from this tool’s result (or from listUsers if you already listed). Never claim an email is or is not in the directory without tool output.",
  USER_ID_PARAM: 'User id (UUID)',
  CREATE_USER:
    'Create a directory user with unique email (standard RFC-like syntax; multi-part domains such as example.com.vn or mail.co.uk are valid), full name, and date of birth (YYYY-MM-DD); bio is optional. Default password is Abcd@123. Two-step: first call with humanAffirmsExecute false or omitted previews; after the user clearly affirms, same payload with humanAffirmsExecute true creates the user.',
  UPDATE_USER:
    'Update name, bio, date of birth, or status (active | inactive) for exactly one user id. Do not pick an id when several users share the same name unless the directory has already been narrowed to one match or the human specified email/uuid/uniquely identifying fields—otherwise list matching users (via listUsers) and wait for them to choose. Omit unchanged patch fields entirely—never send date_of_birth or bio as null (null is treated as omit; use empty string only when the human explicitly asked to clear that field). Do not submit email—addresses are fixed after account creation. Setting status to inactive signs the user out everywhere. Two-step: first call with humanAffirmsExecute false or omitted previews; after clear user affirmation, same args with humanAffirmsExecute true applies.',
  DELETE_USER:
    'Delete one user by id. Same ambiguity rule as updateUser: if multiple users share the asked-for name without a distinguishing email or id given, list matches from listUsers and wait for explicit choice before deleteUser. Two-step: first call with humanAffirmsExecute false or omitted previews deletion; after clear user affirmation, same id with humanAffirmsExecute true deletes.',
  GET_KNOWLEDGE:
    'Search the product knowledge base for policies, field rules, FAQs, and how the assistant works. Use before answering how-to or policy questions that are not answered by live directory data. Do not invent policy—if no relevant chunks are returned, say you do not know.',
  ADD_KNOWLEDGE:
    'Add text to the knowledge base (policies, runbooks, FAQ). Use when the admin provides durable documentation unprompted. Chunks and embeddings are stored automatically.',
} as const;
