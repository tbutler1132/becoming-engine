import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["fs-extra"],
  webpack: (config) => {
    // Resolve @libs/* alias to actual paths
    config.resolve.alias = {
      ...config.resolve.alias,
      "@libs": path.resolve(__dirname, "../../libs"),
    };
    // Resolve .js imports to .ts files (needed for libs using ESM-style imports)
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
  turbopack: {
    root: path.resolve(__dirname, "../../.."),
    resolveAlias: {
      "@libs/memory": "../../libs/memory/index.ts",
      "@libs/regulator": "../../libs/regulator/index.ts",
      "@libs/shared": "../../libs/shared/index.ts",
    },
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
};

export default nextConfig;
