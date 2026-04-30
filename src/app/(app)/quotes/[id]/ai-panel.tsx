"use client";

import { useState } from "react";
import { Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export type AIAnalysisResult = {
  complexity_score: number;
  suggested_price_low: number;
  suggested_price_high: number;
  rationale: string;
  model_used: string;
  latency_ms: number;
};

type Props = {
  quoteId: string;
  initial: AIAnalysisResult | null;
};

export function AIPanel({ quoteId, initial }: Props) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        throw new Error(body.detail || body.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as AIAnalysisResult;
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

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
            Real Groq inference on the live job spec. Returns a complexity score,
            a calibrated price range, and the reasoning behind it. Every prediction
            is logged to the audit trail.
          </p>
        </div>
        {!loading && (
          <Button
            type="button"
            onClick={run}
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {analysis ? (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="size-3.5" />
                Re-run
              </span>
            ) : (
              "Run AI Analysis"
            )}
          </Button>
        )}
      </div>

      {loading && <SkeletonGroup />}

      {!loading && error && (
        <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Analysis failed</p>
              <p className="mt-1 text-destructive/80">{error}</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={run}
            size="sm"
            variant="outline"
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      )}

      {!loading && !error && analysis && <Result analysis={analysis} />}

      {!loading && !error && !analysis && <PlaceholderRows />}
    </section>
  );
}

function Result({ analysis }: { analysis: AIAnalysisResult }) {
  const score = Math.max(1, Math.min(10, analysis.complexity_score));
  const fillPct = score * 10;
  return (
    <div className="mt-6 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
            Complexity score
          </p>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700 ease-out"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-5xl font-semibold tracking-tight text-text">
              {score}
            </span>
            <span className="font-mono text-sm text-text-muted">/ 10</span>
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-4 sm:min-w-[220px]">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
            Suggested price range
          </p>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-text">
            {currency.format(analysis.suggested_price_low)} –{" "}
            {currency.format(analysis.suggested_price_high)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
          Rationale
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text">{analysis.rationale}</p>
      </div>

      <p className="mt-6 font-mono text-xs text-text-muted">
        Model <span className="text-text">{analysis.model_used}</span> · Latency{" "}
        <span className="text-text">{(analysis.latency_ms / 1000).toFixed(2)}s</span>
      </p>
    </div>
  );
}

function PlaceholderRows() {
  return (
    <div className="mt-6 grid gap-4 rounded-md border border-dashed border-border p-6 sm:grid-cols-3">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-text-muted">
          Complexity
        </p>
        <div className="mt-2 h-7 w-3/4 rounded bg-surface-3" />
      </div>
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-text-muted">
          Suggested low
        </p>
        <div className="mt-2 h-7 w-3/4 rounded bg-surface-3" />
      </div>
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-text-muted">
          Suggested high
        </p>
        <div className="mt-2 h-7 w-3/4 rounded bg-surface-3" />
      </div>
    </div>
  );
}

function SkeletonGroup() {
  return (
    <div className="mt-6 space-y-4 animate-pulse">
      <div>
        <div className="h-3 w-1/3 rounded bg-surface-3" />
        <div className="mt-3 h-3 w-full rounded-full bg-surface-3" />
        <div className="mt-3 h-9 w-24 rounded bg-surface-3" />
      </div>
      <div className="h-20 w-full rounded-md border border-dashed border-border bg-surface-3/40" />
      <div className="h-3 w-2/3 rounded bg-surface-3" />
      <div className="h-3 w-1/2 rounded bg-surface-3" />
    </div>
  );
}

export function deriveInitialAnalysis(quote: {
  ai_complexity_score: number | null;
  ai_suggested_price_low: number | null;
  ai_suggested_price_high: number | null;
  ai_rationale: string | null;
}): AIAnalysisResult | null {
  if (
    quote.ai_complexity_score == null ||
    quote.ai_suggested_price_low == null ||
    quote.ai_suggested_price_high == null ||
    !quote.ai_rationale
  ) {
    return null;
  }
  return {
    complexity_score: Number(quote.ai_complexity_score),
    suggested_price_low: Number(quote.ai_suggested_price_low),
    suggested_price_high: Number(quote.ai_suggested_price_high),
    rationale: quote.ai_rationale,
    // Server-stored quote fields don't keep model/latency; we'll show "saved analysis" instead.
    model_used: "saved",
    latency_ms: 0,
  };
}
