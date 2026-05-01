"use client";

import { useAuth } from "@/components/auth-session-provider";

import { HEADER_TITLE_MESSAGES } from "@/constants/messages";
import { displayName } from "@/lib/users";

/**
 * Responsive page title reflecting admin overview vs signed-in member name.
 */
export function DashboardHeaderTitle() {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === "admin";
  const heading = displayName(user);

  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-medium uppercase tracking-wider text-[var(--dash-muted)]">
        {isAdmin ? HEADER_TITLE_MESSAGES.ADMIN_KICKER : HEADER_TITLE_MESSAGES.MEMBER_KICKER}
      </p>
      <h1 className="truncate text-base font-semibold sm:text-lg">
        {isAdmin ? HEADER_TITLE_MESSAGES.ADMIN_HEADING : heading}
      </h1>
    </div>
  );
}
