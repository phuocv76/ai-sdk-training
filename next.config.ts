import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Use local Miniflare + persisted D1 (default .wrangler/state) during `next dev`.
// Remote bindings call Cloudflare edge-preview and often fail with APIError 10000
// if credentials, account access, or proxies block that API.
initOpenNextCloudflareForDev({ remoteBindings: false });

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
