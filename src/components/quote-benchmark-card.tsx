import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CategoryDelta,
  type CostBreakdown,
  COST_CATEGORIES,
} from "@/lib/cost-breakdown";

const CATEGORY_COLOURS: Record<keyof CostBreakdown, string> = {
  Materials: "bg-primary",
  Labor: "bg-accent",
  Overhead: "bg-info",
  Scrap: "bg-destructive",
};

export function QuoteBenchmarkCard({
  industryName,
  yours,
  industry,
  deltas,
}: {
  industryName: string;
  yours: CostBreakdown;
  industry: CostBreakdown;
  deltas: CategoryDelta[];
}) {
  // Identify the category with the biggest delta — feature it in the headline
  const biggest = [...deltas].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
  )[0];

  return (
    <section
      aria-label="Industry benchmark comparison"
      className="rounded-lg border border-border bg-card p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-text-secondary">
            Your numbers vs {industryName} benchmark
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Cost-structure comparison derived from this quote&apos;s product, material, and run
            characteristics. Synthetic preview &mdash; Phase 1 will replace with per-org benchmarks.
          </p>
        </div>
        {biggest && Math.abs(biggest.delta) >= 1 && (
          <BiggestDeltaBadge delta={biggest} />
        )}
      </header>

      <div className="mt-6 space-y-4">
        {COST_CATEGORIES.map((cat) => {
          const yoursVal = yours[cat];
          const benchVal = industry[cat];
          const delta = Math.round((yoursVal - benchVal) * 10) / 10;
          const positive = delta > 0;
          return (
            <div key={cat} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-text">
                  <span className={cn("size-2.5 rounded-full", CATEGORY_COLOURS[cat])} aria-hidden />
                  {cat}
                </span>
                <span className="font-mono text-xs text-text-muted">
                  <span className="text-text">{yoursVal.toFixed(1)}%</span>
                  <span> · {benchVal.toFixed(1)}%</span>
                  <span
                    className={cn(
                      "ml-2",
                      Math.abs(delta) < 0.1 && "text-text-muted",
                      cat === "Scrap" || cat === "Overhead"
                        ? positive
                          ? "text-destructive"
                          : "text-success"
                        : positive
                          ? "text-success"
                          : "text-destructive",
                    )}
                    title={`${Math.abs(delta).toFixed(1)} pts ${positive ? "above" : "below"} ${industryName}`}
                  >
                    {Math.abs(delta) < 0.1 ? "—" : `${positive ? "+" : "−"}${Math.abs(delta).toFixed(1)}`}
                  </span>
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-text/30"
                  style={{ width: `${benchVal}%` }}
                  aria-label={`${industryName} ${benchVal.toFixed(1)}%`}
                />
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-full", CATEGORY_COLOURS[cat])}
                  style={{ width: `${yoursVal}%` }}
                  aria-label={`This quote ${yoursVal.toFixed(1)}%`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="block h-1 w-4 rounded-full bg-accent" aria-hidden /> Your quote
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="block h-1 w-4 rounded-full bg-text/40" aria-hidden /> {industryName} benchmark
        </span>
      </div>
    </section>
  );
}

function BiggestDeltaBadge({ delta }: { delta: CategoryDelta }) {
  const positive = delta.delta > 0;
  // For Scrap and Overhead, "above benchmark" is bad; for Materials and Labor, depends.
  const isBadDirection =
    (delta.category === "Scrap" || delta.category === "Overhead") && positive;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
        isBadDirection
          ? "border border-destructive/30 bg-destructive/10 text-destructive"
          : "border border-success/30 bg-success/10 text-success",
      )}
    >
      <Icon className="size-3" aria-hidden />
      {delta.category} {positive ? "+" : "−"}
      {Math.abs(delta.delta).toFixed(1)} pts
    </span>
  );
}
