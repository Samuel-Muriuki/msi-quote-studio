"use client";

import { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IndustryKey =
  | "aerospace"
  | "medical"
  | "defense"
  | "oilgas"
  | "telecom"
  | "industrial";

type Benchmark = {
  label: string;
  Materials: number;
  Labor: number;
  Overhead: number;
  Scrap: number;
};

const INDUSTRY_BENCHMARKS: Record<IndustryKey, Benchmark> = {
  aerospace:    { label: "Aerospace",    Materials: 48, Labor: 28, Overhead: 18, Scrap: 6 },
  medical:      { label: "Medical",      Materials: 52, Labor: 24, Overhead: 19, Scrap: 5 },
  defense:      { label: "Defense",      Materials: 46, Labor: 30, Overhead: 19, Scrap: 5 },
  oilgas:       { label: "Oil & Gas",    Materials: 56, Labor: 22, Overhead: 17, Scrap: 5 },
  telecom:      { label: "Telecom",      Materials: 58, Labor: 20, Overhead: 18, Scrap: 4 },
  industrial:   { label: "Industrial",   Materials: 55, Labor: 22, Overhead: 18, Scrap: 5 },
};

// Simulated "your numbers" that look distinct from each industry's benchmark
const YOUR_NUMBERS: Record<IndustryKey, Benchmark> = {
  aerospace:  { label: "You", Materials: 31, Labor: 52, Overhead: 11, Scrap: 6 },
  medical:    { label: "You", Materials: 43, Labor: 35, Overhead: 16, Scrap: 6 },
  defense:    { label: "You", Materials: 38, Labor: 41, Overhead: 15, Scrap: 6 },
  oilgas:     { label: "You", Materials: 49, Labor: 27, Overhead: 18, Scrap: 6 },
  telecom:    { label: "You", Materials: 51, Labor: 26, Overhead: 17, Scrap: 6 },
  industrial: { label: "You", Materials: 50, Labor: 27, Overhead: 17, Scrap: 6 },
};

const CATEGORY_KEYS: (keyof Omit<Benchmark, "label">)[] = [
  "Materials",
  "Labor",
  "Overhead",
  "Scrap",
];

const CATEGORY_COLOURS: Record<string, string> = {
  Materials: "bg-primary",
  Labor: "bg-accent",
  Overhead: "bg-info",
  Scrap: "bg-destructive",
};

export function BenchmarkTeaser() {
  const [industry, setIndustry] = useState<IndustryKey>("aerospace");
  const benchmark = INDUSTRY_BENCHMARKS[industry];
  const yours = YOUR_NUMBERS[industry];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            Live preview
          </p>
          <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight text-text">
            Your numbers vs industry benchmark
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            Industry
          </span>
          <Select value={industry} onValueChange={(v) => v && setIndustry(v as IndustryKey)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(INDUSTRY_BENCHMARKS) as IndustryKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {INDUSTRY_BENCHMARKS[k].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[110px_1fr_60px] gap-x-4 gap-y-3 text-sm">
        <div className="col-span-3 grid grid-cols-[110px_1fr_60px] gap-x-4 border-b border-border pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          <span>Category</span>
          <span>Yours · Industry</span>
          <span className="text-right">Δ</span>
        </div>
        {CATEGORY_KEYS.map((cat) => {
          const yoursVal = yours[cat];
          const benchVal = benchmark[cat];
          const delta = yoursVal - benchVal;
          const deltaPositive = delta > 0;
          const deltaWord = deltaPositive ? "above" : "below";
          return (
            <div key={cat} className="contents">
              <span className="flex items-center gap-2 text-text">
                <span className={cn("size-2.5 rounded-full", CATEGORY_COLOURS[cat])} aria-hidden />
                {cat}
              </span>
              <div className="flex flex-col gap-1">
                <div className="relative h-2 rounded-full bg-surface-3">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-text/40"
                    style={{ width: `${benchVal}%` }}
                    aria-label={`Industry ${benchVal}%`}
                  />
                  <div
                    className={cn("absolute inset-y-0 left-0 rounded-full", CATEGORY_COLOURS[cat])}
                    style={{ width: `${yoursVal}%` }}
                    aria-label={`Yours ${yoursVal}%`}
                  />
                </div>
                <span className="font-mono text-[11px] text-text-muted">
                  {yoursVal}% · {benchVal}%
                </span>
              </div>
              <span
                className={cn(
                  "text-right font-mono text-xs",
                  deltaPositive ? "text-destructive" : "text-success",
                )}
                title={`${Math.abs(delta).toFixed(1)} pts ${deltaWord} industry`}
              >
                {deltaPositive ? "+" : "−"}
                {Math.abs(delta).toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="flex items-center gap-1.5 text-xs text-text-muted">
          <Lock className="size-3.5" aria-hidden />
          Synthetic preview. Sign in to see real benchmark deltas on your quotes.
        </p>
        <Link
          href="/sign-up"
          className={cn(
            buttonVariants({ size: "sm" }),
            "gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90",
          )}
        >
          Get my benchmark
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
