/**
 * Industry benchmark cost breakdowns and a deterministic "your numbers" derivation.
 *
 * Phase 0 keeps this inline rather than in a Postgres table — once Phase 1
 * lands per-org settings + multi-tenancy, this moves to an `industry_benchmarks`
 * table so each org can override its own assumptions.
 *
 * Source: synthetic but informed by IBISWorld and U.S. Census Bureau Annual
 * Survey of Manufactures public data. Numbers are presented for illustration
 * and labelled as benchmarks, not warranties.
 */

export type CostBreakdown = {
  Materials: number; // %
  Labor: number;
  Overhead: number;
  Scrap: number;
};

export type CostBreakdownDelta = CostBreakdown & {
  /** Sum of category percentages — should be 100. */
  total: number;
};

export const COST_CATEGORIES: ReadonlyArray<keyof CostBreakdown> = [
  "Materials",
  "Labor",
  "Overhead",
  "Scrap",
] as const;

const INDUSTRY_BENCHMARKS_BY_NAME: Record<string, CostBreakdown> = {
  "Aerospace":             { Materials: 48, Labor: 28, Overhead: 18, Scrap: 6 },
  "Medical":               { Materials: 52, Labor: 24, Overhead: 19, Scrap: 5 },
  "Military & Government": { Materials: 46, Labor: 30, Overhead: 19, Scrap: 5 },
  "Oil & Gas":             { Materials: 56, Labor: 22, Overhead: 17, Scrap: 5 },
  "Telecommunications":    { Materials: 58, Labor: 20, Overhead: 18, Scrap: 4 },
  "Food & Beverage":       { Materials: 54, Labor: 22, Overhead: 19, Scrap: 5 },
  "Marine":                { Materials: 53, Labor: 24, Overhead: 18, Scrap: 5 },
  "Industrial / OEM":      { Materials: 55, Labor: 22, Overhead: 18, Scrap: 5 },
};

const BASELINE_BENCHMARK: CostBreakdown = {
  Materials: 52,
  Labor: 24,
  Overhead: 18,
  Scrap: 6,
};

/** Look up the benchmark for an industry name; falls back to a sensible default. */
export function benchmarkForIndustry(industryName: string | undefined | null): CostBreakdown {
  if (!industryName) return BASELINE_BENCHMARK;
  return INDUSTRY_BENCHMARKS_BY_NAME[industryName] ?? BASELINE_BENCHMARK;
}

export type DerivedCostInputs = {
  industryName: string | null;
  setupFee: number;
  basePricePerSqIn: number;
  materialCostPerSqIn: number;
  widthInches: number;
  heightInches: number;
  quantity: number;
  certificationsCount: number;
};

/**
 * Derives a plausible cost breakdown for a specific quote from its characteristics.
 *
 * The model:
 * - Materials% scales with material cost / product base price ratio
 * - Labor% scales inversely with quantity (lower volume = more per-piece setup time)
 * - Overhead% scales with certifications + setup fee share of total
 * - Scrap% pulls toward the industry's baseline scrap rate
 *
 * Final values are normalised so they always sum to 100. Same inputs always produce
 * the same outputs — this is deterministic, not a random preview.
 */
export function deriveQuoteBreakdown(inputs: DerivedCostInputs): CostBreakdown {
  const benchmark = benchmarkForIndustry(inputs.industryName);

  const area = Math.max(inputs.widthInches * inputs.heightInches, 0.01);
  const variableTotal = Math.max(inputs.basePricePerSqIn * area * inputs.quantity, 1);
  const setupShare = inputs.setupFee / (inputs.setupFee + variableTotal);

  // Materials: scales with material-vs-product-price ratio, anchored to benchmark
  const materialRatio = inputs.materialCostPerSqIn / Math.max(inputs.basePricePerSqIn, 0.001);
  const materialsRaw = benchmark.Materials * (0.85 + Math.min(materialRatio * 0.6, 0.3));

  // Labor: lower quantity = more labor share per piece
  const qtyFactor = 1 + Math.max(0, (200 - inputs.quantity) / 800); // 1.0 at qty 200+, up to 1.25 at qty 0
  const laborRaw = benchmark.Labor * qtyFactor;

  // Overhead: certs + setup share
  const overheadRaw =
    benchmark.Overhead *
    (1 + 0.05 * inputs.certificationsCount + setupShare * 0.4);

  // Scrap: pull toward industry baseline with a small jitter based on quantity rounding
  const scrapRaw = benchmark.Scrap * (inputs.quantity < 100 ? 1.15 : 0.95);

  const sum = materialsRaw + laborRaw + overheadRaw + scrapRaw;
  const norm = (v: number) => Math.round((v / sum) * 1000) / 10;

  return {
    Materials: norm(materialsRaw),
    Labor: norm(laborRaw),
    Overhead: norm(overheadRaw),
    Scrap: norm(scrapRaw),
  };
}

export type CategoryDelta = {
  category: keyof CostBreakdown;
  yours: number;
  industry: number;
  delta: number;
};

export function deltasVsBenchmark(
  yours: CostBreakdown,
  benchmark: CostBreakdown,
): CategoryDelta[] {
  return COST_CATEGORIES.map((cat) => ({
    category: cat,
    yours: yours[cat],
    industry: benchmark[cat],
    delta: Math.round((yours[cat] - benchmark[cat]) * 10) / 10,
  }));
}
