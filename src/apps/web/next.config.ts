import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["../../libs"],
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
