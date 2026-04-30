"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_LABELS,
  DATE_RANGE_LABELS,
  QUOTE_STATUSES,
  type QuoteStatus,
  type DateRange,
} from "@/lib/quote-helpers";

const ALL = "all";

const DATE_RANGES: readonly DateRange[] = ["7d", "30d", "90d", "all"] as const;

export function QuotesFilterBar({
  status,
  range,
}: {
  status: QuoteStatus | "all";
  range: DateRange;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: "status" | "range", value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === ALL && key === "status") params.delete("status");
    else params.set(key, value);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/quotes?${qs}` : "/quotes");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          Status
        </span>
        <Select
          value={status}
          onValueChange={(v) => v && update("status", v)}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {QUOTE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          Range
        </span>
        <Select
          value={range}
          onValueChange={(v) => v && update("range", v)}
        >
          <SelectTrigger className="h-8 w-[160px] text-xs" aria-label="Filter by date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => (
              <SelectItem key={r} value={r}>
                {DATE_RANGE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {pending && (
        <span className="font-mono text-xs text-text-muted">filtering…</span>
      )}
    </div>
  );
}
