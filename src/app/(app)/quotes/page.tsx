import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, FilePlus2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { QuoteStatusBadge } from "@/components/quote-status-badge";
import { cn } from "@/lib/utils";
import {
  computeKpis,
  currency,
  dateRangeCutoff,
  isDateRange,
  isQuoteStatus,
  type DateRange,
  type QuoteStatus,
} from "@/lib/quote-helpers";
import { KpiValueAnimated, type KpiFormat } from "@/components/kpi-value-animated";
import { DemoExpiryBadge } from "@/components/demo-expiry-badge";
import { QuotesFilterBar } from "./quotes-filter-bar";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function QuotesPipelinePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const params = await searchParams;
  const statusParam = typeof params.status === "string" ? params.status : "all";
  const rangeParam = typeof params.range === "string" ? params.range : "all";

  const status: QuoteStatus | "all" = isQuoteStatus(statusParam) ? statusParam : "all";
  const range: DateRange = isDateRange(rangeParam) ? rangeParam : "all";

  const supabase = createServerSupabaseClient();
  const { data: quotesData, error } = await supabase
    .from("quotes")
    .select(
      `id, customer_name, customer_email, status, base_estimate, final_price,
       width_inches, height_inches, quantity, ai_complexity_score,
       ai_suggested_price_low, ai_suggested_price_high, created_at, is_demo_sample,
       product:products(name, category),
       industry:industries(name)`,
    )
    .eq("estimator_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load quotes: ${error.message}`);
  }

  const allQuotes = quotesData ?? [];
  const kpis = computeKpis(allQuotes);

  // Apply filters in JS (data volume is small for the demo)
  const cutoff = dateRangeCutoff(range);
  const filtered = allQuotes.filter((q) => {
    if (status !== "all" && q.status !== status) return false;
    if (cutoff && new Date(q.created_at) < cutoff) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            Quotes pipeline
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
            Your quotes
          </h1>
          <p className="text-sm text-text-secondary">
            Drafts, sent, accepted and declined &mdash; all your quotes in one place.
          </p>
        </div>
        <Link
          href="/quotes/new"
          className={cn(
            buttonVariants({ size: "default" }),
            "bg-accent text-accent-foreground hover:bg-accent/90 gap-2",
          )}
        >
          <FilePlus2 className="size-4" />
          New quote
        </Link>
      </header>

      <section
        aria-label="Pipeline KPIs"
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard label="Quotes (30d)" value={kpis.totalQuotes30d} format="count" />
        <KpiCard
          label="Avg quote value"
          value={kpis.avgQuoteValue > 0 ? kpis.avgQuoteValue : null}
          format="currency"
        />
        <KpiCard
          label="Win rate"
          value={kpis.winRate === null ? null : kpis.winRate * 100}
          format="percent"
          accent={kpis.winRate !== null && kpis.winRate >= 0.5}
        />
        <KpiCard label="Pending" value={kpis.pendingQuotes} format="count" />
      </section>

      <div className="mt-8">
        <QuotesFilterBar status={status} range={range} />
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-border">
        {filtered.length === 0 ? (
          <EmptyState filtered={status !== "all" || range !== "all"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-3 text-xs uppercase tracking-[0.12em] text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Dimensions</th>
                  <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Base</th>
                  <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">AI range</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((q) => {
                  const product = Array.isArray(q.product) ? q.product[0] : q.product;
                  const industry = Array.isArray(q.industry) ? q.industry[0] : q.industry;
                  return (
                    <tr key={q.id} className="bg-card hover:bg-surface-3">
                      <td className="px-4 py-3">
                        <Link
                          href={`/quotes/${q.id}`}
                          className="block font-medium text-text hover:text-accent"
                        >
                          {q.customer_name}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {industry?.name && (
                            <span className="text-xs text-text-muted">{industry.name}</span>
                          )}
                          <DemoExpiryBadge
                            createdAt={q.created_at}
                            isSample={q.is_demo_sample}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-text">{product?.name ?? "—"}</span>
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-xs text-text-secondary md:table-cell">
                        {Number(q.width_inches)}&quot; × {Number(q.height_inches)}&quot;
                        {" · "}
                        {q.quantity.toLocaleString()} pcs
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono md:table-cell">
                        {currency.format(Number(q.base_estimate))}
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-xs text-text-secondary lg:table-cell">
                        {q.ai_suggested_price_low !== null && q.ai_suggested_price_high !== null
                          ? `${currency.format(Number(q.ai_suggested_price_low))}–${currency.format(Number(q.ai_suggested_price_high))}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <QuoteStatusBadge status={q.status} />
                      </td>
                      <td className="hidden px-4 py-3 text-right text-xs text-text-muted sm:table-cell">
                        {new Date(q.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs text-text-muted">
        Showing {filtered.length} of {allQuotes.length} quote{allQuotes.length === 1 ? "" : "s"}.
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  format,
  accent,
}: {
  label: string;
  value: number | null;
  format: KpiFormat;
  accent?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-5",
        accent ? "border-accent/40" : "border-border",
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <KpiValueAnimated
        value={value}
        format={format}
        className={cn(
          "mt-2 block font-heading text-2xl font-semibold tracking-tight",
          accent ? "text-accent" : "text-text",
        )}
      />
    </article>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  if (filtered) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-heading text-lg text-text">No quotes match these filters.</p>
        <p className="mt-2 text-sm text-text-secondary">
          Adjust the status or date range above to widen the search.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-heading text-lg text-text">No quotes yet.</p>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        Start your first quote and the AI complexity score will follow.
      </p>
      <Link
        href="/quotes/new"
        className={cn(
          buttonVariants({ size: "default" }),
          "mt-6 bg-accent text-accent-foreground hover:bg-accent/90 gap-2",
        )}
      >
        <FilePlus2 className="size-4" />
        New quote
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
