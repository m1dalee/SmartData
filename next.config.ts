import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@libsql/client"],
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
