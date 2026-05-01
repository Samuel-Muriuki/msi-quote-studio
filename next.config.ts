import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating dev indicator overlay so screenshots stay clean.
  // (No effect in production builds — the overlay only renders in dev.)
  devIndicators: false,
};

export default nextConfig;
