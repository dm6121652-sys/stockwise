import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? "stockwise-dev" : "stockwise-live",
  outputFileTracingRoot: process.cwd(),
  experimental: { cpus: 1, workerThreads: false },
};

export default nextConfig;
