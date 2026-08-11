import type { NextConfig } from "next";

// The backend proxy lives in `src/proxy.ts`, not here: `rewrites()` is evaluated at
// build time, which would freeze BACKEND_URL into the standalone image.
const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        // A cached worker would keep serving an old app after a deploy.
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
