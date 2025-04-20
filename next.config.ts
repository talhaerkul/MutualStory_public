import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["media.stockimg.ai"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.stockimg.ai",
      },
    ],
  },
};

export default nextConfig;
