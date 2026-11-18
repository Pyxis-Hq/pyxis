import type { NextConfig } from "next";

// Local UI against a deployed backend: set BACKEND_URL (e.g. in .env.local) and every API call is
// proxied to it. Unset, the app uses its own API routes and database.
const backend = process.env.BACKEND_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    if (!backend) return [];
    return {
      // beforeFiles so the proxy wins over the local route handlers.
      beforeFiles: [
        { source: "/api/:path*", destination: `${backend}/api/:path*` },
        { source: "/v1/:path*", destination: `${backend}/v1/:path*` },
      ],
    };
  },
};

export default nextConfig;
