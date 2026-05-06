// Constants
import { UI_SYMBOLS } from "@/constants/messages";

export type UserRole = "admin" | "member";
export type UserStatus = "active" | "inactive";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: number;
  date_of_birth: string | null;
  bio: string | null;
};

/**
 * Display name from canonical `name`, or a placeholder when blank.
 * @param user Subset with `name`.
 */
export const displayName = (user: Pick<User, "name">): string => {
  const n = user.name.trim();
  return n || UI_SYMBOLS.UNKNOWN_INITIAL;
};

/**
 * JSON-safe user payload for APIs and chat tools (no secrets).
 * @param user Domain user record.
 */
export const userResponseBody = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  created_at: user.created_at,
  date_of_birth: user.date_of_birth,
  bio: user.bio,
});

export type ClientUser = ReturnType<typeof userResponseBody>;
