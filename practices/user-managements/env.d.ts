/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    /** Set via wrangler secret put OPENAI_API_KEY or .dev.vars for local preview */
    OPENAI_API_KEY?: string;
  }
}

export {};
