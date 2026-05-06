"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Constants
import { AUTH_SESSION_MESSAGES } from "@/constants/messages";

// Libraries
import type { User } from "@/lib/users";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Reads the current auth context; must be used under `AuthSessionProvider`.
 * @throws When called outside the provider tree.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(AUTH_SESSION_MESSAGES.USE_AUTH_OUTSIDE_PROVIDER);
  }
  return ctx;
}

const PUBLIC_PATHS = new Set(["/login", "/docs"]);

function isPublicPath(pathname: string | null): boolean {
  return pathname != null && PUBLIC_PATHS.has(pathname);
}

/**
 * Fetches `/api/auth/me`, gates protected routes, and redirects between `/login` and `/`.
 * `/docs` (Swagger UI) is reachable without a session.
 */
export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json()) as { user: User | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    const onLogin = pathname === "/login";
    const allowWithoutUser = isPublicPath(pathname);
    if (!user && !allowWithoutUser) {
      router.replace("/login");
    }
    if (user && onLogin) {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, refresh, logout }),
    [user, loading, refresh, logout],
  );

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 bg-[var(--background)] px-4 py-16 text-[var(--dash-muted)]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--dash-accent)] border-t-transparent" />
        <p className="text-sm">{AUTH_SESSION_MESSAGES.LOADING}</p>
      </div>
    );
  }

  const allowWithoutUser = isPublicPath(pathname);
  if (!user && !allowWithoutUser) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 bg-[var(--background)] px-4 py-16 text-[var(--dash-muted)]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--dash-accent)] border-t-transparent" />
        <p className="text-sm">{AUTH_SESSION_MESSAGES.REDIRECTING_TO_SIGN_IN}</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
