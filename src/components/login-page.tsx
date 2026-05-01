"use client";

import { useAuth } from "@/components/auth-session-provider";

import {
  AUTH_UI_MESSAGES,
  BRAND_MESSAGES,
  LOGIN_MESSAGES,
} from "@/constants/messages";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Sign-in / sign-up form that posts to auth routes and redirects on success.
 */
export function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Submits credentials to `signup` or `login`, then refreshes session and redirects home. */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "sign-up") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? AUTH_UI_MESSAGES.SIGN_UP_FAILED);
          return;
        }
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? AUTH_UI_MESSAGES.SIGN_IN_FAILED);
          return;
        }
      }
      await refresh();
      router.replace("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--dash-accent)] text-sm font-bold text-white shadow-md shadow-indigo-900/25">
            {BRAND_MESSAGES.LOGO_CHIP}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              {BRAND_MESSAGES.PRODUCT_NAME}
            </h1>
            <p className="text-sm text-[var(--dash-muted)]">
              {LOGIN_MESSAGES.SUBTITLE}
            </p>
          </div>
        </div>

        <div className="mb-6 flex rounded-xl border border-[var(--dash-border)] bg-[var(--background)] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("sign-in");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${mode === "sign-in"
                ? "bg-[var(--dash-card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--dash-muted)] hover:text-[var(--foreground)]"
              }`}
          >
            {LOGIN_MESSAGES.SIGN_IN_TAB}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("sign-up");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${mode === "sign-up"
                ? "bg-[var(--dash-card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--dash-muted)] hover:text-[var(--foreground)]"
              }`}
          >
            {LOGIN_MESSAGES.SIGN_UP_TAB}
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          {mode === "sign-up" ? (
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--dash-muted)]"
              >
                {LOGIN_MESSAGES.FULL_NAME_LABEL}
              </label>
              <input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--dash-border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--dash-muted)] focus:border-[var(--dash-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--dash-accent)]/20"
                placeholder={LOGIN_MESSAGES.FULL_NAME_PLACEHOLDER}
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--dash-muted)]"
            >
              {LOGIN_MESSAGES.EMAIL_LABEL}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--dash-border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--dash-muted)] focus:border-[var(--dash-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--dash-accent)]/20"
              placeholder={LOGIN_MESSAGES.EMAIL_PLACEHOLDER}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--dash-muted)]"
            >
              {LOGIN_MESSAGES.PASSWORD_LABEL}
            </label>
            <input
              id="password"
              type="password"
              autoComplete={
                mode === "sign-up" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "sign-up" ? 8 : 1}
              className="w-full rounded-xl border border-[var(--dash-border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--dash-muted)] focus:border-[var(--dash-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--dash-accent)]/20"
              placeholder={
                mode === "sign-up" ?
                  LOGIN_MESSAGES.PASSWORD_PLACEHOLDER_SIGN_UP
                : LOGIN_MESSAGES.PASSWORD_PLACEHOLDER_SIGN_IN
              }
            />
            {mode === "sign-up" ? (
              <p className="mt-1.5 text-[11px] text-[var(--dash-muted)]">
                {LOGIN_MESSAGES.FIRST_ACCOUNT_HINT}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[var(--dash-accent)] py-3 text-sm font-semibold text-white shadow-md shadow-indigo-900/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ?
              LOGIN_MESSAGES.SUBMIT_BUSY
            : mode === "sign-up" ?
              LOGIN_MESSAGES.SIGN_UP_TAB
            : LOGIN_MESSAGES.SIGN_IN_TAB}
          </button>
        </form>
      </div>
    </div>
  );
}
