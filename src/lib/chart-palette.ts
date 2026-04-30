/**
 * Chart palette per the Industrial Slate brand decision.
 * Use these tokens for any Recharts series so colours stay consistent across
 * the reporting dashboard and any future chart surfaces.
 */

export const CHART_PALETTE = {
  primary: "#0F172A", // slate-900 — primary series
  accent: "#D97706", // amber-600 — secondary / highlight series
  info: "#3B82F6", // blue-500 — tertiary
  success: "#10B981", // emerald-500 — wins / positive
  quaternary: "#A855F7", // purple-500
  neutral: "#94A3B8", // slate-400 — "other"
} as const;

export const CHART_SERIES = [
  CHART_PALETTE.primary,
  CHART_PALETTE.accent,
  CHART_PALETTE.info,
  CHART_PALETTE.success,
  CHART_PALETTE.quaternary,
  CHART_PALETTE.neutral,
] as const;

/**
 * Status-keyed colours used in the status-distribution chart.
 * Aligned with QuoteStatusBadge tones.
 */
export const STATUS_PALETTE = {
  draft: CHART_PALETTE.neutral,
  sent: CHART_PALETTE.info,
  accepted: CHART_PALETTE.success,
  declined: "#EF4444", // red-500 — same as destructive token
  expired: "#64748B", // slate-500
} as const;
