import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  QuotePdfDocument,
  type QuotePdfData,
  type QuotePdfLineItem,
} from "@/lib/quote-pdf";
import { pieceArea, calculateBaseEstimate } from "@/lib/estimator";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

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
    .eq("id", id)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  // Reuse the same single-array unwrap pattern the detail page uses
  const product = Array.isArray(quote.products) ? quote.products[0] : quote.products;
  const material = Array.isArray(quote.materials) ? quote.materials[0] : quote.materials;
  const industry = Array.isArray(quote.industries) ? quote.industries[0] : quote.industries;

  const widthIn = Number(quote.width_inches);
  const heightIn = Number(quote.height_inches);
  const qty = Number(quote.quantity);
  const area = pieceArea(widthIn, heightIn);

  // Compute unit price as the per-piece equivalent of the base estimate minus the
  // setup fee — this is illustrative for the line-item display only.
  const setupFee = Number(product?.setup_fee ?? 0);
  const baseEstimate = Number(quote.base_estimate);
  const variableTotal = Math.max(baseEstimate - setupFee, 0);
  const unitPrice = qty > 0 ? variableTotal / qty : 0;

  // Pre-Phase-1.1 we have one line per quote — synthesise from current schema.
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

  // Setup fee shown as a separate line for transparency
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

  // 30 days validity from issue
  const createdAt = new Date(quote.created_at);
  const validUntil = new Date(createdAt);
  validUntil.setDate(validUntil.getDate() + 30);

  const pdfData: QuotePdfData = {
    quoteNumber: `Q-${String(quote.id).slice(0, 8).toUpperCase()}`,
    status: quote.status,
    createdAt,
    validUntil,

    fromCompanyName: "MSI Quote Studio",
    fromAddress: ["Demo workspace", "Live URL: msi-quote-studio.vercel.app"],
    fromEmail: session.user.email ?? undefined,

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

  const buffer = await renderToBuffer(<QuotePdfDocument data={pdfData} />);

  // Suppress unused warning from estimator import (re-export safeguard for future use)
  void calculateBaseEstimate;

  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfData.quoteNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
