/**
 * Pure helpers for the quotes pipeline + dashboard.
 * Status normalisation, currency formatting, and KPI computation.
 */

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "expired";

export const QUOTE_STATUSES: readonly QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "declined",
  "expired",
] as const;

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
};

export type DateRange = "7d" | "30d" | "90d" | "all";

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const currencyDetailed = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function isQuoteStatus(value: unknown): value is QuoteStatus {
  return (
    typeof value === "string" &&
    (QUOTE_STATUSES as readonly string[]).includes(value)
  );
}

export function isDateRange(value: unknown): value is DateRange {
  return value === "7d" || value === "30d" || value === "90d" || value === "all";
}

/** Returns the cutoff `Date` for a date-range filter, or null for "all". */
export function dateRangeCutoff(range: DateRange): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export type KpiQuote = {
  status: string;
  base_estimate: number | string;
  final_price: number | string | null;
  created_at: string;
};

export type Kpis = {
  totalQuotes30d: number;
  avgQuoteValue: number;
  winRate: number | null; // 0..1, null if no decisions yet
  pendingQuotes: number;
};

export function computeKpis(quotes: readonly KpiQuote[]): Kpis {
  const cutoff30 = dateRangeCutoff("30d")!;

  let totalQuotes30d = 0;
  let valueSum = 0;
  let valueCount = 0;
  let accepted = 0;
  let declined = 0;
  let pending = 0;

  for (const q of quotes) {
    if (new Date(q.created_at) >= cutoff30) totalQuotes30d++;

    const value = q.final_price !== null ? Number(q.final_price) : Number(q.base_estimate);
    if (Number.isFinite(value)) {
      valueSum += value;
      valueCount++;
    }

    if (q.status === "accepted") accepted++;
    else if (q.status === "declined") declined++;
    else if (q.status === "draft" || q.status === "sent") pending++;
  }

  const winRate =
    accepted + declined > 0 ? accepted / (accepted + declined) : null;
  const avgQuoteValue = valueCount > 0 ? valueSum / valueCount : 0;

  return { totalQuotes30d, avgQuoteValue, winRate, pendingQuotes: pending };
}
