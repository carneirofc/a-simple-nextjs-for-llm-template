import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // PGlite ships WASM + data files; load it from node_modules instead of bundling.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
