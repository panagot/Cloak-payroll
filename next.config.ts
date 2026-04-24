import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@cloak.dev/sdk", "@solana/web3.js"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/v1/**",
      },
    ],
  },
  webpack: (config) => {
    const bufferShim = path.join(
      process.cwd(),
      "node_modules",
      "buffer",
      "index.js"
    );
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: bufferShim,
    };
    return config;
  },
};

export default nextConfig;
