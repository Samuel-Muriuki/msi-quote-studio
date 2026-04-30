import type { MetadataRoute } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://msi-quote-studio.vercel.app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MSI Quote Studio",
    short_name: "MSI Quote",
    description:
      "AI-enhanced quote estimator for custom manufacturing — complexity scoring, calibrated price recommendations, and rule-based estimating in one workflow.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F172A",
    theme_color: "#0F172A",
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    lang: "en-US",
    dir: "ltr",
  };
}
