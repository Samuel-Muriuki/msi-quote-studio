import { renderToBuffer } from "@react-pdf/renderer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  QuotePdfDocument,
  type QuotePdfData,
  type QuotePdfLineItem,
} from "@/lib/quote-pdf";
import { pieceArea } from "@/lib/estimator";

export type QuotePdfBuildResult =
  | { ok: true; buffer: Buffer; quoteNumber: string; data: QuotePdfData }
  | { ok: false; error: string; status: 401 | 404 | 500 };

/**
 * Builds the branded PDF for a quote and returns the binary buffer plus
 * the rendered data. Used by both the GET /api/quotes/[id]/pdf route
 * (download) and the email-quote-to-customer server action (attachment).
 *
 * Caller is responsible for auth + ownership checks before invoking.
 */
export async function buildQuotePdfBuffer(
  quoteId: string,
  fromEmail?: string,
): Promise<QuotePdfBuildResult> {
  const supabase = createServerSupabaseClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .select(
      `id, customer_name, customer_email, status, base_estimate, final_price,
       width_inches, height_inches, quantity, certifications, notes,
       ai_complexity_score, ai_suggested_price_low, ai_suggested_price_high, ai_rationale,
       created_at,
       products ( name, category, base_price_per_sq_in, setup_fee ),
       materials ( name, type ),
       industries ( name, certification_premium )`,
    )
    .eq("id", quoteId)
    .single();

  if (error || !quote) {
    return { ok: false, error: "Quote not found", status: 404 };
  }

  const product = Array.isArray(quote.products) ? quote.products[0] : quote.products;
  const material = Array.isArray(quote.materials) ? quote.materials[0] : quote.materials;
  const industry = Array.isArray(quote.industries) ? quote.industries[0] : quote.industries;

  const widthIn = Number(quote.width_inches);
  const heightIn = Number(quote.height_inches);
  const qty = Number(quote.quantity);
  const area = pieceArea(widthIn, heightIn);

  const setupFee = Number(product?.setup_fee ?? 0);
  const baseEstimate = Number(quote.base_estimate);
  const variableTotal = Math.max(baseEstimate - setupFee, 0);
  const unitPrice = qty > 0 ? variableTotal / qty : 0;

  const items: QuotePdfLineItem[] = [
    {
      description: product?.name ?? "Product",
      subDescription: [
        material?.name,
        `${widthIn} × ${heightIn} in (${area.toFixed(2)} sq in / piece)`,
        industry?.name,
        Array.isArray(quote.certifications) && quote.certifications.length > 0
          ? `Certifications: ${quote.certifications.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      quantity: qty,
      unitPrice,
      lineTotal: variableTotal,
    },
  ];

  if (setupFee > 0) {
    items.push({
      description: "Setup & tooling",
      subDescription: "One-time per run",
      quantity: 1,
      unitPrice: setupFee,
      lineTotal: setupFee,
    });
  }

  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const total = baseEstimate;

  const createdAt = new Date(quote.created_at);
  const validUntil = new Date(createdAt);
  validUntil.setDate(validUntil.getDate() + 30);

  const data: QuotePdfData = {
    quoteNumber: `Q-${String(quote.id).slice(0, 8).toUpperCase()}`,
    status: quote.status,
    createdAt,
    validUntil,

    fromCompanyName: "MSI Quote Studio",
    fromAddress: ["Demo workspace", "Live URL: msi-quote-studio.vercel.app"],
    fromEmail,

    toCustomerName: quote.customer_name,
    toEmail: quote.customer_email ?? undefined,

    items,
    subtotal,
    total,

    aiRationale: quote.ai_rationale ?? undefined,
    aiComplexityScore: quote.ai_complexity_score,
    aiSuggestedRange:
      quote.ai_suggested_price_low !== null && quote.ai_suggested_price_high !== null
        ? {
            low: Number(quote.ai_suggested_price_low),
            high: Number(quote.ai_suggested_price_high),
          }
        : undefined,

    terms:
      "Quote valid for 30 days from issue date. Prices in USD. Production lead time confirmed on PO receipt. Standard shipping terms FOB origin unless otherwise specified.",
  };

  const buffer = (await renderToBuffer(<QuotePdfDocument data={data} />)) as Buffer;
  return { ok: true, buffer, quoteNumber: data.quoteNumber, data };
}
