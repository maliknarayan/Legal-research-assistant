import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma out of the bundler so Turbopack does not symlink the generated
  // client — that symlink fails on Windows ("junction point / access denied").
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
