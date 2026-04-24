import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/cloak-pay/present", destination: "/cloak-pay/merchant", permanent: false }];
  },
  /** Expose Vercel build to the client (show deployment RPC help banner in AppChrome). */
  env: {
    NEXT_PUBLIC_ON_VERCEL: process.env.VERCEL ? "1" : "0",
  },
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
