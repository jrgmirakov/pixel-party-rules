import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/pixel-party-rules",
  images: { unoptimized: true },
};

export default nextConfig;
