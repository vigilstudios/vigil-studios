import type { MetadataRoute } from "next";
import { url } from "@/lib/site";

const updated = new Date("2026-09-15");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: url("/"), lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: url("/products"), lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/products/websites"), lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/products/vigil"), lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/products/virtue"), lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/pricing"), lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/terms"), lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
    { url: url("/express"), lastModified: new Date("2026-08-27"), changeFrequency: "monthly", priority: 0.9 },
  ];
}
