import { LoginPage } from "@/components/login-page";

/** Public authentication entry rendered only when logged out by `AuthSessionProvider`. */
export default function Page() {
  return <LoginPage />;
}
