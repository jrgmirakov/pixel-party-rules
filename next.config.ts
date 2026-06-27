import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_CUSTOM_DOMAIN ? "" : "/pixel-party-rules",
  images: { unoptimized: true },
};

export default nextConfig;
