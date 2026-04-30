"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dollar2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type Inputs = {
  materialCostPerUnit: number; // $
  laborHourlyRate: number; // $/hr
  laborHoursPerUnit: number; // hrs
  monthlyVolume: number; // units
  sellingPricePerUnit: number; // $
};

const DEFAULTS: Inputs = {
  materialCostPerUnit: 25,
  laborHourlyRate: 28,
  laborHoursPerUnit: 1.5,
  monthlyVolume: 5000,
  sellingPricePerUnit: 150,
};

const OVERHEAD_PCT = 0.18; // 18% overhead share of variable cost
const SCRAP_PCT = 0.04; // 4% scrap

export function FreeCalculator() {
  const [v, setV] = useState<Inputs>(DEFAULTS);

  const materialCost = v.materialCostPerUnit;
  const laborCost = v.laborHourlyRate * v.laborHoursPerUnit;
  const variableCost = materialCost + laborCost;
  const overheadCost = variableCost * OVERHEAD_PCT;
  const scrapCost = variableCost * SCRAP_PCT;
  const totalUnitCost = variableCost + overheadCost + scrapCost;

  const monthlyTotalCost = totalUnitCost * v.monthlyVolume;
  const monthlyRevenue = v.sellingPricePerUnit * v.monthlyVolume;
  const grossMargin =
    v.sellingPricePerUnit > 0
      ? ((v.sellingPricePerUnit - totalUnitCost) / v.sellingPricePerUnit) * 100
      : 0;
  const profitPerUnit = v.sellingPricePerUnit - totalUnitCost;

  const segments = [
    { label: "Materials", value: materialCost, colour: "bg-primary" },
    { label: "Labor", value: laborCost, colour: "bg-accent" },
    { label: "Overhead", value: overheadCost, colour: "bg-info" },
    { label: "Scrap", value: scrapCost, colour: "bg-destructive" },
  ];

  return (
    <div className="grid gap-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:grid-cols-[1fr_1fr]">
      {/* Inputs */}
      <div className="space-y-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
            Free tool · No sign-up
          </p>
          <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight text-text">
            Manufacturing cost calculator
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Drag the sliders. The unit cost, monthly total, and profit margin update live.
          </p>
        </div>

        <SliderRow
          label="Material cost per unit"
          value={`${dollar.format(v.materialCostPerUnit)}`}
          min={5}
          max={120}
          step={1}
          current={v.materialCostPerUnit}
          onChange={(n) => setV((s) => ({ ...s, materialCostPerUnit: n }))}
        />
        <SliderRow
          label="Labor hourly rate"
          value={`${dollar.format(v.laborHourlyRate)}/hr`}
          min={15}
          max={80}
          step={1}
          current={v.laborHourlyRate}
          onChange={(n) => setV((s) => ({ ...s, laborHourlyRate: n }))}
        />
        <SliderRow
          label="Labor hours per unit"
          value={`${v.laborHoursPerUnit.toFixed(1)} hrs`}
          min={0.1}
          max={6}
          step={0.1}
          current={v.laborHoursPerUnit}
          onChange={(n) => setV((s) => ({ ...s, laborHoursPerUnit: n }))}
        />
        <SliderRow
          label="Monthly volume"
          value={`${v.monthlyVolume.toLocaleString()} units`}
          min={100}
          max={50000}
          step={100}
          current={v.monthlyVolume}
          onChange={(n) => setV((s) => ({ ...s, monthlyVolume: n }))}
        />
        <SliderRow
          label="Selling price per unit"
          value={`${dollar.format(v.sellingPricePerUnit)}`}
          min={20}
          max={500}
          step={5}
          current={v.sellingPricePerUnit}
          onChange={(n) => setV((s) => ({ ...s, sellingPricePerUnit: n }))}
        />
      </div>

      {/* Outputs */}
      <div className="space-y-6 rounded-lg border border-border bg-surface-3/40 p-6">
        <div className="grid grid-cols-2 gap-4">
          <Metric
            label="Cost per unit"
            value={dollar2.format(totalUnitCost)}
            sub="materials + labor + overhead + scrap"
          />
          <Metric
            label="Monthly total cost"
            value={dollar.format(monthlyTotalCost)}
            sub={`${v.monthlyVolume.toLocaleString()} units / month`}
          />
          <Metric
            label="Profit per unit"
            value={dollar2.format(profitPerUnit)}
            sub={profitPerUnit < 0 ? "negative — you'd lose money" : `at ${dollar.format(v.sellingPricePerUnit)} sell price`}
            tone={profitPerUnit < 0 ? "destructive" : profitPerUnit > 0 ? "accent" : "default"}
          />
          <Metric
            label="Gross margin"
            value={`${grossMargin.toFixed(1)}%`}
            sub={
              grossMargin >= 25
                ? "above industry baseline (25–35%)"
                : grossMargin >= 15
                  ? "near industry baseline"
                  : "below industry baseline"
            }
            tone={grossMargin >= 25 ? "accent" : grossMargin < 15 ? "destructive" : "default"}
          />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Cost structure breakdown
          </p>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-3">
            {segments.map((s) => (
              <div
                key={s.label}
                className={cn("h-full", s.colour)}
                style={{ width: `${(s.value / totalUnitCost) * 100}%` }}
                title={`${s.label}: ${dollar2.format(s.value)} (${((s.value / totalUnitCost) * 100).toFixed(1)}%)`}
                aria-label={s.label}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-text-muted">
            {segments.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", s.colour)} aria-hidden />
                {s.label} {((s.value / totalUnitCost) * 100).toFixed(1)}%
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-text-muted">
            Want this on every quote, with AI complexity scoring and your industry&apos;s
            benchmark deltas?
          </p>
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: "sm" }),
              "mt-3 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90",
            )}
          >
            Get it on every quote
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-text">{label}</span>
        <span className="font-mono text-sm text-accent">{value}</span>
      </div>
      <Slider
        value={[current]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => {
          const next = Array.isArray(vals) ? vals[0] : vals;
          if (typeof next === "number") onChange(next);
        }}
      />
      <div className="flex justify-between font-mono text-[10px] text-text-muted">
        <span>{typeof min === "number" && min < 100 ? min : min.toLocaleString()}</span>
        <span>{typeof max === "number" && max < 100 ? max : max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "accent" | "destructive";
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-heading text-2xl font-semibold tabular-nums",
          tone === "accent" && "text-accent",
          tone === "destructive" && "text-destructive",
          tone === "default" && "text-text",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-text-muted">{sub}</p>
    </div>
  );
}
