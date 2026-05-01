/**
 * Backward-compatible helper: executes callback with the D1 database binding.
 * Keeping the same utility name avoids broad route rewrites.
 */
export async function withPrisma<T>(
  d1: D1Database,
  fn: (db: D1Database) => Promise<T>,
): Promise<T> {
  return fn(d1);
}
