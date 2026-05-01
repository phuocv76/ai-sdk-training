import {
  DashboardAccountSummary,
  DashboardUserMenu,
} from "@/components/dashboard-account";
import { DashboardHeaderTitle } from "@/components/dashboard-header-title";
import { DashboardSidebarNav } from "@/components/dashboard-sidebar-nav";
import {
  OpenAiApiKeyField,
  OpenAiApiKeyProvider,
} from "@/components/openai-api-key-context";

import {
  BRAND_MESSAGES,
  DASHBOARD_SHELL_MESSAGES,
} from "@/constants/messages";

/**
 * Dashboard chrome: sidebar, top bar, OpenAI key field, and main content slot.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <OpenAiApiKeyProvider>
      <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <aside
          className="hidden w-[260px] shrink-0 flex-col border-r border-[var(--dash-sidebar-border)] bg-[var(--dash-sidebar)] text-white lg:flex"
          aria-label={DASHBOARD_SHELL_MESSAGES.SIDEBAR_ARIA_MAIN_NAV}
        >
          <div className="flex h-16 items-center gap-3 border-b border-[var(--dash-sidebar-border)] px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--dash-accent)] text-sm font-bold shadow-lg shadow-indigo-900/30">
              {BRAND_MESSAGES.LOGO_CHIP}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">
                {BRAND_MESSAGES.PRODUCT_NAME}
              </p>
              <p className="text-[11px] font-medium text-indigo-200/80">
                {DASHBOARD_SHELL_MESSAGES.SIGNED_IN_SUBTITLE}
              </p>
            </div>
          </div>
          <DashboardSidebarNav />
          <div className="space-y-4 border-t border-[var(--dash-sidebar-border)] p-4">
            <DashboardAccountSummary />
            <OpenAiApiKeyField />
            <p className="text-[11px] leading-relaxed text-indigo-200/70">
              {DASHBOARD_SHELL_MESSAGES.TECH_STACK_NOTE}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--dash-border)] bg-[var(--dash-card)]/90 px-4 backdrop-blur-md sm:h-16 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--dash-accent-soft)] lg:hidden">
                <span className="text-xs font-bold text-[var(--dash-accent)]">
                  {BRAND_MESSAGES.LOGO_CHIP}
                </span>
              </div>
              <DashboardHeaderTitle />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="hidden rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm transition-colors hover:bg-[var(--background)] sm:inline-flex"
                aria-label={DASHBOARD_SHELL_MESSAGES.NOTIFICATIONS_ARIA}
              >
                <svg
                  className="h-5 w-5 text-[var(--dash-muted)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.082A2.02 2.02 0 0018 14.07V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <DashboardUserMenu />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </OpenAiApiKeyProvider>
  );
}
