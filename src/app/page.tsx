// Components
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserDashboard } from "@/components/dashboard/user-dashboard";

/**
 * Signed-in dashboard: directory, profile, and chat assistant.
 */
export default function Home() {
  return (
    <DashboardShell>
      <UserDashboard />
    </DashboardShell>
  );
}
