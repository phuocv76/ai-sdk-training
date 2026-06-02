/** Persists a per-user OpenAI key and returns an opaque token for later chat requests. */
export const registerOpenAiApiKey = async (
  db: D1Database,
  userId: string,
  apiKey: string,
): Promise<string> => {
  const token = crypto.randomUUID();
  const updatedAt = Date.now();
  await db
    .prepare(
      `INSERT INTO openai_api_key_tokens (user_id, token, api_key, updated_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(user_id) DO UPDATE SET
         token = excluded.token,
         api_key = excluded.api_key,
         updated_at = excluded.updated_at`,
    )
    .bind(userId, token, apiKey, updatedAt)
    .run();
  return token;
};

/** Resolves a stored key when the token belongs to the authenticated user. */
export const resolveOpenAiApiKeyFromToken = async (
  db: D1Database,
  userId: string,
  token: string,
): Promise<string | null> => {
  const row = await db
    .prepare(
      `SELECT api_key FROM openai_api_key_tokens
       WHERE token = ?1 AND user_id = ?2
       LIMIT 1`,
    )
    .bind(token, userId)
    .first<{ api_key: string }>();
  const key = row?.api_key?.trim();
  return key || null;
};
