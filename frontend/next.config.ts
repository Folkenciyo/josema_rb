import type { NextConfig } from "next";

// The backend proxy lives in `src/proxy.ts`, not here: `rewrites()` is evaluated at
// build time, which would freeze BACKEND_URL into the standalone image.
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
