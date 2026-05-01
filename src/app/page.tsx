import { DashboardShell } from "@/components/dashboard-shell";
import { UserDashboard } from "@/components/user-dashboard";

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
