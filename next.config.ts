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
  async redirects() {
    // Virtue moved under Products when the products menu arrived.
    return [{ source: "/virtue", destination: "/products/virtue", permanent: true }];
  },
  poweredByHeader: false,
  // Dev only: the dev server blocks cross-origin dev resources, and
  // 127.0.0.1 counts as a different origin from localhost. Without this,
  // pages opened at http://127.0.0.1:3000 render but never hydrate.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
