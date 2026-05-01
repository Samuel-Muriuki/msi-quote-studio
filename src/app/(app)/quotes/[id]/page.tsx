import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pieceArea } from "@/lib/estimator";
import { currencyDetailed as currency } from "@/lib/quote-helpers";
import { QuoteStatusBadge } from "@/components/quote-status-badge";
import { QuoteBenchmarkCard } from "@/components/quote-benchmark-card";
import {
  benchmarkForIndustry,
  deriveQuoteBreakdown,
  deltasVsBenchmark,
} from "@/lib/cost-breakdown";
import { brevoIsConfigured } from "@/lib/brevo";
import { DemoExpiryBadge } from "@/components/demo-expiry-badge";
import { AIPanel, type AIAnalysisResult } from "./ai-panel";
import { QuoteActions } from "./quote-actions";
import { EmailQuoteButton } from "./email-quote-button";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const [quoteRes, linesRes] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        `
        id, customer_name, customer_email, status, base_estimate,
        certifications, notes, is_demo_sample,
        ai_complexity_score, ai_suggested_price_low, ai_suggested_price_high, ai_rationale,
        created_at, updated_at,
        industries ( name, certification_premium, required_certifications )
      `,
      )
      .eq("id", id)
      .single(),
    supabase
      .from("quote_lines")
      .select(
        `id, position, width_inches, height_inches, quantity, line_estimate,
         products ( name, category, base_price_per_sq_in, setup_fee ),
         materials ( name, type, cost_per_sq_in ),
         cad_uploads ( id, original_filename, mime_type, path_count, storage_path )`,
      )
      .eq("quote_id", id)
      .order("position", { ascending: true }),
  ]);

  if (quoteRes.error || !quoteRes.data) {
    notFound();
  }
  const quote = quoteRes.data;
  const lines = linesRes.data ?? [];

  const industry = Array.isArray(quote.industries) ? quote.industries[0] : quote.industries;

  // Pull the latest AI prediction for model + latency metadata if the quote has been analyzed.
  let initialAnalysis: AIAnalysisResult | null = null;
  if (
    quote.ai_complexity_score != null &&
    quote.ai_suggested_price_low != null &&
    quote.ai_suggested_price_high != null &&
    quote.ai_rationale
  ) {
    const { data: latest } = await supabase
      .from("ai_predictions")
      .select("model_used, latency_ms")
      .eq("quote_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    initialAnalysis = {
      complexity_score: Number(quote.ai_complexity_score),
      suggested_price_low: Number(quote.ai_suggested_price_low),
      suggested_price_high: Number(quote.ai_suggested_price_high),
      rationale: quote.ai_rationale,
      model_used: latest?.model_used ?? "saved",
      latency_ms: latest?.latency_ms ?? 0,
    };
  }

  // For the benchmark block, use the first line as the representative
  // product/material; multi-line cost analysis is a Phase 2 deliverable.
  const firstLine = lines[0];
  const firstProduct = firstLine
    ? Array.isArray(firstLine.products)
      ? firstLine.products[0]
      : firstLine.products
    : null;
  const firstMaterial = firstLine
    ? Array.isArray(firstLine.materials)
      ? firstLine.materials[0]
      : firstLine.materials
    : null;

  const totalQty = lines.reduce((sum, l) => sum + Number(l.quantity), 0);

  // Generate one-hour signed URLs for any line that has a CAD upload, so the
  // preview can render the SVG inline (or offer a download for DXF). We do
  // this in parallel and key by line.id for easy lookup in the render.
  type CadLink = {
    filename: string;
    mimeType: string;
    pathCount: number | null;
    signedUrl: string | null;
  };
  const cadByLineId = new Map<string, CadLink>();
  await Promise.all(
    lines.map(async (line) => {
      const cad = Array.isArray(line.cad_uploads) ? line.cad_uploads[0] : line.cad_uploads;
      if (!cad) return;
      const { data: signed } = await supabase.storage
        .from("cad-uploads")
        .createSignedUrl(cad.storage_path, 3600);
      cadByLineId.set(line.id, {
        filename: cad.original_filename,
        mimeType: cad.mime_type,
        pathCount: cad.path_count,
        signedUrl: signed?.signedUrl ?? null,
      });
    }),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:px-8 sm:py-14">
      <div>
        <Link
          href="/quotes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text"
        >
          <ArrowLeft className="size-3.5" />
          Back to pipeline
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
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <QuoteStatusBadge status={quote.status} />
          <DemoExpiryBadge
            createdAt={quote.created_at}
            isSample={quote.is_demo_sample}
            size="md"
          />
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-text-secondary">
            Line items
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {lines.length} {lines.length === 1 ? "line" : "lines"}
            {" · "}
            {totalQty.toLocaleString()} pcs total
          </p>
        </div>

        <ul className="mt-4 divide-y divide-border">
          {lines.map((line) => {
            const product = Array.isArray(line.products) ? line.products[0] : line.products;
            const material = Array.isArray(line.materials)
              ? line.materials[0]
              : line.materials;
            const widthIn = Number(line.width_inches);
            const heightIn = Number(line.height_inches);
            const area = pieceArea(widthIn, heightIn);
            const cad = cadByLineId.get(line.id);
            return (
              <li key={line.id} className="space-y-3 py-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div className="space-y-1">
                    <p className="font-heading text-base font-semibold text-text">
                      {product?.name ?? "Product"}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {[
                        material?.name,
                        `${widthIn} × ${heightIn} in (${area} sq in / piece)`,
                        `${Number(line.quantity).toLocaleString()} pcs`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-semibold tabular-nums text-text sm:text-right">
                    {currency.format(Number(line.line_estimate))}
                  </p>
                </div>
                {cad && <CadPreview cad={cad} />}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 grid gap-4 border-t border-border pt-6 md:grid-cols-2">
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
            Sum of {lines.length} {lines.length === 1 ? "line" : "lines"} including setup fees.
          </p>
        </div>
      </section>

      <AIPanel quoteId={String(quote.id)} initial={initialAnalysis} />

      {industry && firstLine && (
        <BenchmarkBlock
          industryName={industry.name}
          product={firstProduct}
          material={firstMaterial}
          widthInches={Number(firstLine.width_inches)}
          heightInches={Number(firstLine.height_inches)}
          quantity={Number(firstLine.quantity)}
          certificationsCount={quote.certifications?.length ?? 0}
        />
      )}

      <section
        aria-label="Quote actions"
        className="rounded-lg border border-border bg-card p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-text-secondary">
              Actions
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Move this quote through your pipeline. Status changes are reflected in the
              dashboard and pipeline KPIs immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/quotes/${quote.id}/pdf`}
              download
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:border-border-strong hover:text-text"
            >
              <Download className="size-3" aria-hidden />
              Download PDF
            </a>
            <EmailQuoteButton
              quoteId={String(quote.id)}
              defaultRecipient={quote.customer_email}
              customerName={quote.customer_name}
              quoteNumber={`Q-${String(quote.id).slice(0, 8).toUpperCase()}`}
              emailConfigured={brevoIsConfigured()}
            />
          </div>
        </div>
        <div className="mt-4">
          <QuoteActions quoteId={String(quote.id)} status={quote.status} />
        </div>
      </section>
    </div>
  );
}

function BenchmarkBlock({
  industryName,
  product,
  material,
  widthInches,
  heightInches,
  quantity,
  certificationsCount,
}: {
  industryName: string;
  product: { base_price_per_sq_in: number; setup_fee: number } | null | undefined;
  material: { cost_per_sq_in: number } | null | undefined;
  widthInches: number;
  heightInches: number;
  quantity: number;
  certificationsCount: number;
}) {
  const yours = deriveQuoteBreakdown({
    industryName,
    setupFee: Number(product?.setup_fee ?? 0),
    basePricePerSqIn: Number(product?.base_price_per_sq_in ?? 0),
    materialCostPerSqIn: Number(material?.cost_per_sq_in ?? 0.012),
    widthInches,
    heightInches,
    quantity,
    certificationsCount,
  });
  const benchmark = benchmarkForIndustry(industryName);
  const deltas = deltasVsBenchmark(yours, benchmark);
  return (
    <QuoteBenchmarkCard
      industryName={industryName}
      yours={yours}
      industry={benchmark}
      deltas={deltas}
    />
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

function CadPreview({
  cad,
}: {
  cad: {
    filename: string;
    mimeType: string;
    pathCount: number | null;
    signedUrl: string | null;
  };
}) {
  const isSvg = cad.mimeType === "image/svg+xml";
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface-1 p-3 sm:flex-row sm:items-center">
      {isSvg && cad.signedUrl ? (
        <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded border border-border bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cad.signedUrl}
            alt={`Drawing for ${cad.filename}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded border border-border bg-surface-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          {isSvg ? "preview off" : "DXF"}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-center gap-1.5 truncate text-xs">
          <span className="font-mono text-text-muted">CAD:</span>
          <span className="truncate font-mono text-text">{cad.filename}</span>
        </p>
        {cad.pathCount != null && (
          <p className="text-[11px] text-text-secondary">
            {cad.pathCount} drawing element{cad.pathCount === 1 ? "" : "s"} extracted —
            fed into the AI complexity prompt as a density signal.
          </p>
        )}
        {cad.signedUrl && (
          <p className="text-[10px] text-text-muted">
            <a
              href={cad.signedUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="underline-offset-2 hover:text-text hover:underline"
            >
              Open original ↗
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
