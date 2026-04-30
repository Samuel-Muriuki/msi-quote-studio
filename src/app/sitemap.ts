import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://msi-quote-studio.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, priority: 1 },
    { url: `${BASE}/sign-in`, lastModified: now, priority: 0.8 },
    { url: `${BASE}/sign-up`, lastModified: now, priority: 0.6 },
  ];
}
