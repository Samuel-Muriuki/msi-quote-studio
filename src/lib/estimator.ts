/**
 * Rule-based base estimate calculator.
 *
 * Per the project brief Section 7.3:
 *
 *   base_estimate = (base_price_per_sq_in × width × height × quantity × certification_premium)
 *                 + setup_fee
 *
 * Setup fee is a one-time cost and is NOT multiplied by the certification premium.
 * The result is rounded to 2 decimal places.
 */

export type EstimateInputs = {
  /** Product's per-square-inch base price (USD). */
  basePricePerSqIn: number;
  /** Product's one-time setup fee (USD). */
  setupFee: number;
  /** Width in inches. */
  widthInches: number;
  /** Height in inches. */
  heightInches: number;
  /** Quantity (must be a positive integer). */
  quantity: number;
  /** Industry certification premium multiplier (e.g. 1.000, 1.450). */
  certificationPremium: number;
};

export function calculateBaseEstimate(inputs: EstimateInputs): number {
  const {
    basePricePerSqIn,
    setupFee,
    widthInches,
    heightInches,
    quantity,
    certificationPremium,
  } = inputs;

  if (
    !Number.isFinite(basePricePerSqIn) ||
    !Number.isFinite(setupFee) ||
    !Number.isFinite(widthInches) ||
    !Number.isFinite(heightInches) ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(certificationPremium)
  ) {
    throw new Error("All estimate inputs must be finite numbers");
  }

  if (widthInches <= 0 || heightInches <= 0 || quantity <= 0) {
    throw new Error("widthInches, heightInches and quantity must be positive");
  }

  const pieceArea = widthInches * heightInches;
  const variable = basePricePerSqIn * pieceArea * quantity * certificationPremium;
  const total = variable + setupFee;

  return Math.round(total * 100) / 100;
}

/** Compute square inches per piece — handy for the AI prompt. */
export function pieceArea(widthInches: number, heightInches: number): number {
  return Math.round(widthInches * heightInches * 1000) / 1000;
}
