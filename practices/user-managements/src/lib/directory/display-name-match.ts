import type { User } from "@/lib/domain/user";

const EMAIL_GREP_GLOBAL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * Canonical key for grouping “same display name” in the directory (trim,
 * lowercase, internal whitespace collapsed).
 */
export const normalizeDirectoryDisplayNameKey = (name: string): string =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

/** Every email-like substring found in natural-language text. */
const extractEmailsFromText = (text: string): string[] =>
  text.match(EMAIL_GREP_GLOBAL) ?? [];

/**
 * True when the latest user message alone is enough to point at `record`:
 * cites the UUID, cites that row’s stored email (case-insensitive), or cites
 * the same date-of-birth string (YYYY-MM-DD) stored on that row (substring match).
 */
export const userLatestTextIdentifiesDirectoryRecord = (
  latestText: string,
  record: Pick<User, "id" | "email" | "date_of_birth">,
): boolean => {
  const t = latestText.toLowerCase();
  if (t.includes(record.id.toLowerCase())) return true;

  const emailNorm = record.email.trim().toLowerCase();
  for (const raw of extractEmailsFromText(latestText)) {
    if (raw.trim().toLowerCase() === emailNorm) return true;
  }

  if (record.date_of_birth && record.date_of_birth.trim()) {
    if (t.includes(record.date_of_birth.trim().toLowerCase())) return true;
  }

  return false;
};
