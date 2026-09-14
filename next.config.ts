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
  experimental: {
    serverActions: {
      // Change-request attachments travel through the server action:
      // up to 5 files at 10 MB each (lib/vigil/attachments.ts).
      bodySizeLimit: "52mb",
    },
  },
};

export default nextConfig;
