import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  // Dev only: the dev server blocks cross-origin dev resources, and
  // 127.0.0.1 counts as a different origin from localhost. Without this,
  // pages opened at http://127.0.0.1:3000 render but never hydrate.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
