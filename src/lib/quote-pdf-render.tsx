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
 * Builds the branded PDF for a quote and returns the binary buffer plus the
 * rendered data. Reads line items from quote_lines (one row per product /
 * material / dimension combination) and preserves the per-quote setup-fee
 * line for transparency.
 *
 * Caller is responsible for auth + ownership checks before invoking.
 */
export async function buildQuotePdfBuffer(
  quoteId: string,
  fromEmail?: string,
): Promise<QuotePdfBuildResult> {
  const supabase = createServerSupabaseClient();

  const [quoteRes, linesRes] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        `id, customer_name, customer_email, status, base_estimate, final_price,
         certifications, notes,
         ai_complexity_score, ai_suggested_price_low, ai_suggested_price_high, ai_rationale,
         created_at,
         industries ( name, certification_premium )`,
      )
      .eq("id", quoteId)
      .single(),
    supabase
      .from("quote_lines")
      .select(
        `id, position, width_inches, height_inches, quantity, line_estimate,
         products ( name, category, base_price_per_sq_in, setup_fee ),
         materials ( name, type )`,
      )
      .eq("quote_id", quoteId)
      .order("position", { ascending: true }),
  ]);

  const { data: quote, error } = quoteRes;
  if (error || !quote) {
    return { ok: false, error: "Quote not found", status: 404 };
  }
  if (linesRes.error) {
    return { ok: false, error: linesRes.error.message, status: 500 };
  }
  const lines = linesRes.data ?? [];

  const industry = Array.isArray(quote.industries) ? quote.industries[0] : quote.industries;
  const baseEstimate = Number(quote.base_estimate);

  const items: QuotePdfLineItem[] = [];
  let setupFeeTotal = 0;

  for (const line of lines) {
    const product = Array.isArray(line.products) ? line.products[0] : line.products;
    const material = Array.isArray(line.materials) ? line.materials[0] : line.materials;

    const widthIn = Number(line.width_inches);
    const heightIn = Number(line.height_inches);
    const qty = Number(line.quantity);
    const area = pieceArea(widthIn, heightIn);

    const lineEstimate = Number(line.line_estimate);
    const setupFee = Number(product?.setup_fee ?? 0);
    const variableTotal = Math.max(lineEstimate - setupFee, 0);
    const unitPrice = qty > 0 ? variableTotal / qty : 0;

    items.push({
      description: product?.name ?? "Product",
      subDescription: [
        material?.name,
        `${widthIn} × ${heightIn} in (${area.toFixed(2)} sq in / piece)`,
      ]
        .filter(Boolean)
        .join(" · "),
      quantity: qty,
      unitPrice,
      lineTotal: variableTotal,
    });

    setupFeeTotal += setupFee;
  }

  if (setupFeeTotal > 0) {
    items.push({
      description: lines.length > 1 ? "Setup & tooling (all lines)" : "Setup & tooling",
      subDescription: "One-time per run",
      quantity: 1,
      unitPrice: setupFeeTotal,
      lineTotal: setupFeeTotal,
    });
  }

  // Append a per-quote summary line for industry + certifications so the PDF
  // still shows that context without cluttering each line.
  const certs = Array.isArray(quote.certifications) ? quote.certifications : [];
  const summaryBits = [
    industry?.name ? `Industry: ${industry.name}` : null,
    certs.length > 0 ? `Certifications: ${certs.join(", ")}` : null,
  ].filter(Boolean);

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

    terms: [
      "Quote valid for 30 days from issue date. Prices in USD. Production lead time confirmed on PO receipt. Standard shipping terms FOB origin unless otherwise specified.",
      summaryBits.length > 0 ? summaryBits.join(" · ") : "",
    ]
      .filter(Boolean)
      .join(" "),
  };

  const buffer = (await renderToBuffer(<QuotePdfDocument data={data} />)) as Buffer;
  return { ok: true, buffer, quoteNumber: data.quoteNumber, data };
}
