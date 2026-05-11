/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    /** Set via wrangler secret put OPENAI_API_KEY or .dev.vars for local preview */
    OPENAI_API_KEY?: string;
    /** Base URL for Ollama HTTP API (default `http://127.0.0.1:11434/api`). */
    OLLAMA_BASE_URL?: string;
    /** Ollama model id when using the Ollama provider (e.g. `llama3.2`). */
    OLLAMA_MODEL?: string;
  }
}

export {};
