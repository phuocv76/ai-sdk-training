import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// OpenNext pulls in Wrangler tooling; loading it during `next build` (Turbopack) can reject with a
// generic SyntaxError. Only wire Miniflare / local bindings for `next dev`.
const isNextDevCli =
  process.argv.includes("dev") ||
  process.env.npm_lifecycle_event === "dev";

if (isNextDevCli) {
  initOpenNextCloudflareForDev({ remoteBindings: false });
}

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;