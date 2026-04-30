import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { currency } from "@/lib/quote-helpers";
import { QuoteStatusBadge } from "@/components/quote-status-badge";
import { cn } from "@/lib/utils";
import {
  CategoryBarChart,
  WeeklyLineChart,
  StatusDistributionChart,
  StatusLegend,
  type CategoryDatum,
  type WeekDatum,
  type StatusByMonthDatum,
} from "./reports-charts";

const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  nameplate: "Nameplates",
  overlay: "Overlays",
  info_label: "Info labels",
  membrane_switch: "Membrane",
  die_cut_gasket: "Gaskets",
  emi_rfi: "EMI/RFI",
  thermal_management: "Thermal",
};

type QuoteRow = {
  id: string;
  customer_name: string;
  status: string;
  base_estimate: number;
  final_price: number | null;
  ai_complexity_score: number | null;
  created_at: string;
  product: { name: string; category: string } | null;
};

export default async function ReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `id, customer_name, status, base_estimate, final_price,
       ai_complexity_score, created_at,
       product:products(name, category)`,
    )
    .eq("estimator_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load quotes: ${error.message}`);
  }

  const quotes: QuoteRow[] = (data ?? []).map((q) => ({
    id: String(q.id),
    customer_name: q.customer_name,
    status: q.status,
    base_estimate: Number(q.base_estimate),
    final_price: q.final_price !== null ? Number(q.final_price) : null,
    ai_complexity_score:
      q.ai_complexity_score !== null ? Number(q.ai_complexity_score) : null,
    created_at: q.created_at,
    product: Array.isArray(q.product) ? q.product[0] ?? null : q.product,
  }));

  const kpis = computeReportKpis(quotes);
  const categoryData = buildCategoryData(quotes);
  const weeklyData = buildWeeklyData(quotes);
  const statusByMonth = buildStatusByMonth(quotes);
  const topPipeline = buildTopPipeline(quotes);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          Reporting
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
          Pipeline overview
        </h1>
        <p className="text-sm text-text-secondary">
          Where your quotes are this month, how often they convert, and what the AI
          is calling complex.
        </p>
      </header>

      <section
        aria-label="Reporting KPIs"
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <ReportKpi
          label="Total pipeline value"
          value={
            kpis.pipelineValue > 0 ? currency.format(kpis.pipelineValue) : "—"
          }
          sub={`${kpis.pipelineCount} active quote${kpis.pipelineCount === 1 ? "" : "s"}`}
        />
        <ReportKpi
          label="Quotes this month"
          value={String(kpis.quotesThisMonth)}
          sub={`vs ${kpis.quotesLastMonth} last`}
        />
        <ReportKpi
          label="Conversion rate"
          value={
            kpis.conversionRate === null
              ? "—"
              : `${Math.round(kpis.conversionRate * 100)}%`
          }
          sub={
            kpis.conversionRate === null
              ? "no decisions yet"
              : `${kpis.acceptedCount} accepted / ${kpis.acceptedCount + kpis.declinedCount} closed`
          }
          accent={kpis.conversionRate !== null && kpis.conversionRate >= 0.5}
        />
        <ReportKpi
          label="Avg AI complexity"
          value={
            kpis.avgComplexity === null ? "—" : `${kpis.avgComplexity.toFixed(1)} / 10`
          }
          sub={
            kpis.avgComplexity === null
              ? "no analyses yet"
              : `${kpis.analyzedCount} of ${quotes.length} analysed`
          }
        />
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Quote volume by product category"
          subtitle="Last 30 days"
        >
          {categoryData.length === 0 ? (
            <ChartEmpty message="No quotes in the last 30 days." />
          ) : (
            <CategoryBarChart data={categoryData} />
          )}
        </ChartCard>

        <ChartCard
          title="Weekly quote volume"
          subtitle="Last 12 weeks"
        >
          {weeklyData.every((d) => d.count === 0) ? (
            <ChartEmpty message="No quotes in the last 12 weeks." />
          ) : (
            <WeeklyLineChart data={weeklyData} />
          )}
        </ChartCard>
      </div>

      <ChartCard
        className="mt-6"
        title="Status distribution by month"
        subtitle="Last 6 months · stacked"
        footer={<StatusLegend />}
      >
        {statusByMonth.every(
          (m) => m.draft + m.sent + m.accepted + m.declined + m.expired === 0,
        ) ? (
          <ChartEmpty message="No status activity in the last 6 months." />
        ) : (
          <StatusDistributionChart data={statusByMonth} />
        )}
      </ChartCard>

      <section
        aria-label="Top pipeline quotes"
        className="mt-10 overflow-hidden rounded-lg border border-border"
      >
        <div className="border-b border-border bg-surface-3 px-5 py-3">
          <h2 className="font-heading text-sm font-semibold text-text">
            Top 10 pipeline quotes
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Sent &amp; accepted, ranked by base estimate.
          </p>
        </div>
        {topPipeline.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-secondary">
              No quotes are currently in the active pipeline.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Product</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topPipeline.map((q) => (
                  <tr key={q.id} className="bg-card hover:bg-surface-3">
                    <td className="px-4 py-3">
                      <Link
                        href={`/quotes/${q.id}`}
                        className="font-medium text-text hover:text-accent"
                      >
                        {q.customer_name}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-text-secondary sm:table-cell">
                      {q.product?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {currency.format(q.base_estimate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// =====================================================================
// KPI computation
// =====================================================================

type ReportKpis = {
  pipelineValue: number;
  pipelineCount: number;
  quotesThisMonth: number;
  quotesLastMonth: number;
  conversionRate: number | null;
  acceptedCount: number;
  declinedCount: number;
  avgComplexity: number | null;
  analyzedCount: number;
};

function computeReportKpis(quotes: QuoteRow[]): ReportKpis {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let pipelineValue = 0;
  let pipelineCount = 0;
  let quotesThisMonth = 0;
  let quotesLastMonth = 0;
  let acceptedCount = 0;
  let declinedCount = 0;
  let complexitySum = 0;
  let analyzedCount = 0;

  for (const q of quotes) {
    const created = new Date(q.created_at);
    if (q.status === "sent" || q.status === "accepted") {
      pipelineValue += q.base_estimate;
      pipelineCount++;
    }
    if (created >= startOfMonth) quotesThisMonth++;
    else if (created >= startOfLastMonth) quotesLastMonth++;
    if (q.status === "accepted") acceptedCount++;
    if (q.status === "declined") declinedCount++;
    if (q.ai_complexity_score !== null) {
      complexitySum += q.ai_complexity_score;
      analyzedCount++;
    }
  }

  const conversionRate =
    acceptedCount + declinedCount > 0
      ? acceptedCount / (acceptedCount + declinedCount)
      : null;
  const avgComplexity = analyzedCount > 0 ? complexitySum / analyzedCount : null;

  return {
    pipelineValue,
    pipelineCount,
    quotesThisMonth,
    quotesLastMonth,
    conversionRate,
    acceptedCount,
    declinedCount,
    avgComplexity,
    analyzedCount,
  };
}

// =====================================================================
// Chart aggregations
// =====================================================================

function buildCategoryData(quotes: QuoteRow[]): CategoryDatum[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const byCategory = new Map<string, number>();

  for (const q of quotes) {
    if (new Date(q.created_at) < cutoff) continue;
    const category = q.product?.category ?? "other";
    byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
  }

  return Array.from(byCategory.entries())
    .map(([category, count]) => ({
      category: PRODUCT_CATEGORY_LABELS[category] ?? category,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildWeeklyData(quotes: QuoteRow[]): WeekDatum[] {
  const weeks: WeekDatum[] = [];
  const now = new Date();
  // Start of current week (Mon)
  const day = now.getDay() || 7;
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setHours(0, 0, 0, 0);
  startOfThisWeek.setDate(now.getDate() - day + 1);

  for (let i = 11; i >= 0; i--) {
    const start = new Date(startOfThisWeek);
    start.setDate(startOfThisWeek.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const count = quotes.filter((q) => {
      const c = new Date(q.created_at);
      return c >= start && c < end;
    }).length;
    weeks.push({
      week: `${start.getMonth() + 1}/${start.getDate()}`,
      count,
    });
  }
  return weeks;
}

function buildStatusByMonth(quotes: QuoteRow[]): StatusByMonthDatum[] {
  const months: StatusByMonthDatum[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const slot: StatusByMonthDatum = {
      month: start.toLocaleString(undefined, { month: "short" }),
      draft: 0,
      sent: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
    };
    for (const q of quotes) {
      const c = new Date(q.created_at);
      if (c < start || c >= end) continue;
      if (
        q.status === "draft" ||
        q.status === "sent" ||
        q.status === "accepted" ||
        q.status === "declined" ||
        q.status === "expired"
      ) {
        slot[q.status]++;
      }
    }
    months.push(slot);
  }
  return months;
}

function buildTopPipeline(quotes: QuoteRow[]): QuoteRow[] {
  return quotes
    .filter((q) => q.status === "sent" || q.status === "accepted")
    .sort((a, b) => b.base_estimate - a.base_estimate)
    .slice(0, 10);
}

// =====================================================================
// Presentational components
// =====================================================================

function ReportKpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
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
      <p
        className={cn(
          "mt-2 font-heading text-2xl font-semibold tracking-tight",
          accent ? "text-accent" : "text-text",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-text-muted">{sub}</p>
    </article>
  );
}

function ChartCard({
  title,
  subtitle,
  footer,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("rounded-lg border border-border bg-card p-5", className)}>
      <header className="space-y-1">
        <h3 className="font-heading text-sm font-semibold text-text">{title}</h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          {subtitle}
        </p>
      </header>
      <div className="mt-5">{children}</div>
      {footer && <div className="mt-4 border-t border-border pt-3">{footer}</div>}
    </article>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-text-muted">
      {message}
    </div>
  );
}
