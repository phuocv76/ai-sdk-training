// Components
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserDashboard } from "@/components/dashboard/user-dashboard";

/**
 * Signed-in dashboard: directory, profile, and chat assistant.
 */
const Home = () => (
  <DashboardShell>
    <UserDashboard />
  </DashboardShell>
);

export default Home;
