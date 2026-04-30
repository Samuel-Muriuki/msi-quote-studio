import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, ArrowLeft } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pieceArea } from "@/lib/estimator";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-surface-3 text-text-secondary border border-border",
  sent: "bg-info/10 text-info border border-info/30",
  accepted: "bg-success/10 text-success border border-success/30",
  declined: "bg-destructive/10 text-destructive border border-destructive/30",
  expired: "bg-surface-3 text-text-muted border border-border",
};

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: quote, error } = await supabase
    .from("quotes")
    .select(
      `
      id, customer_name, customer_email, status, base_estimate,
      width_inches, height_inches, quantity, certifications, notes,
      ai_complexity_score, ai_suggested_price_low, ai_suggested_price_high, ai_rationale,
      created_at, updated_at,
      products ( name, category, base_price_per_sq_in, setup_fee ),
      materials ( name, type ),
      industries ( name, certification_premium, required_certifications )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !quote) {
    notFound();
  }

  const product = Array.isArray(quote.products) ? quote.products[0] : quote.products;
  const material = Array.isArray(quote.materials) ? quote.materials[0] : quote.materials;
  const industry = Array.isArray(quote.industries) ? quote.industries[0] : quote.industries;
  const area = pieceArea(Number(quote.width_inches), Number(quote.height_inches));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:px-8 sm:py-14">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text"
        >
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            Quote · {String(quote.id).slice(0, 8)}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
            {quote.customer_name}
          </h1>
          {quote.customer_email && (
            <p className="text-sm text-text-secondary">{quote.customer_email}</p>
          )}
        </div>
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.16em]",
            STATUS_STYLES[quote.status] ?? STATUS_STYLES.draft,
          )}
        >
          {quote.status}
        </span>
      </header>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-text-secondary">
          Summary
        </h2>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <DetailRow label="Product" value={product?.name ?? "—"} sub={product?.category} />
          <DetailRow label="Material" value={material?.name ?? "—"} sub={material?.type} />
          <DetailRow
            label="Dimensions"
            value={`${Number(quote.width_inches)} × ${Number(quote.height_inches)} in`}
            sub={`${area} sq in / piece`}
          />
          <DetailRow label="Quantity" value={Number(quote.quantity).toLocaleString()} />
          <DetailRow
            label="Industry"
            value={industry?.name ?? "—"}
            sub={
              industry
                ? `Certification premium ×${Number(industry.certification_premium).toFixed(2)}`
                : undefined
            }
          />
          {quote.certifications && quote.certifications.length > 0 && (
            <DetailRow
              label="Certifications"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {quote.certifications.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-border bg-surface-3 px-2.5 py-0.5 font-mono text-xs text-text"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              }
            />
          )}
        </div>

        {quote.notes && (
          <div className="mt-6 border-t border-border pt-6">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
              Notes
            </p>
            <p className="mt-2 text-sm text-text">{quote.notes}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
              Base estimate (rule-based)
            </p>
            <p className="mt-1 font-heading text-4xl font-semibold tracking-tight text-text">
              {currency.format(Number(quote.base_estimate))}
            </p>
          </div>
          <p className="text-xs text-text-muted">
            Setup fee {currency.format(Number(product?.setup_fee ?? 0))} included.
          </p>
        </div>
      </section>

      <AIPanel quoteId={quote.id} />
    </div>
  );
}

function DetailRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>
      <div className="text-base text-text">{value}</div>
      {sub && <p className="text-xs text-text-secondary">{sub}</p>}
    </div>
  );
}

function AIPanel({ quoteId }: { quoteId: string }) {
  return (
    <section className="rounded-lg border border-accent/30 bg-accent/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              AI Complexity & Pricing
            </h2>
          </div>
          <p className="mt-2 max-w-xl text-sm text-text-secondary">
            Real Groq inference returns a complexity score (1–10), a calibrated price range, and the
            reasoning behind it. Every prediction is logged to the audit trail.
          </p>
        </div>
        <span
          className={cn(
            buttonVariants({ size: "sm" }),
            "pointer-events-none cursor-not-allowed bg-accent/40 text-accent-foreground",
          )}
          aria-disabled
          title="Coming next"
        >
          Run AI Analysis
        </span>
      </div>
      <div className="mt-6 grid gap-4 rounded-md border border-dashed border-border p-6 sm:grid-cols-3">
        <SkeletonRow label="Complexity" />
        <SkeletonRow label="Suggested low" />
        <SkeletonRow label="Suggested high" />
      </div>
      <p className="mt-4 font-mono text-xs text-text-muted">
        Quote id <span className="text-text">{String(quoteId)}</span> · ready for analysis once the
        Groq route lands in the next iteration.
      </p>
    </section>
  );
}

function SkeletonRow({ label }: { label: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <div className="mt-2 h-7 w-3/4 rounded bg-surface-3" />
    </div>
  );
}
