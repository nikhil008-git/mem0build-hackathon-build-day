import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Monorepo root — avoids Turbopack picking ~/package-lock.json instead of mem0build/
const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  transpilePackages: ["@repo/db", "@rift/sdk-core"],
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;
