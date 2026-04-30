"use client";

import { AnimatedNumber } from "./animated-number";

export type KpiFormat = "count" | "currency" | "percent" | "score";

const FORMATTERS: Record<KpiFormat, (n: number) => string> = {
  count: (n) => Math.round(Math.max(n, 0)).toLocaleString(),
  currency: (n) => "$" + Math.round(Math.max(n, 0)).toLocaleString(),
  percent: (n) => `${Math.round(Math.max(n, 0))}%`,
  score: (n) => `${Math.max(n, 0).toFixed(1)} / 10`,
};

export function KpiValueAnimated({
  value,
  format,
  fallback = "—",
  className,
}: {
  value: number | null;
  format: KpiFormat;
  fallback?: string;
  className?: string;
}) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className={className}>{fallback}</span>;
  }
  return (
    <AnimatedNumber value={value} format={FORMATTERS[format]} className={className} />
  );
}
