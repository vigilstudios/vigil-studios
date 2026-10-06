import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vigil Studios | Web Development Agency",
    short_name: "Vigil Studios",
    description:
      "Polished Express websites, tailored multi-page Professional experiences and bespoke Custom builds. Designed for your business and managed by Vigil.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
