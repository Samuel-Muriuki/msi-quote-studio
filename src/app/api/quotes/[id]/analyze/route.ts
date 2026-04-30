import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { analyzeQuote } from "@/lib/groq";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select(
      `
      id, width_inches, height_inches, quantity, certifications, base_estimate,
      products!inner ( name, category ),
      materials!inner ( name, durability_score ),
      industries!inner ( name )
    `,
    )
    .eq("id", id)
    .single();

  if (quoteError || !quote) {
    return NextResponse.json(
      { error: "Quote not found" },
      { status: 404 },
    );
  }

  const product = Array.isArray(quote.products) ? quote.products[0] : quote.products;
  const material = Array.isArray(quote.materials) ? quote.materials[0] : quote.materials;
  const industry = Array.isArray(quote.industries) ? quote.industries[0] : quote.industries;

  if (!product || !material || !industry) {
    return NextResponse.json(
      { error: "Quote is missing related catalog rows" },
      { status: 422 },
    );
  }

  let result;
  try {
    result = await analyzeQuote({
      productName: product.name,
      productCategory: product.category,
      materialName: material.name,
      materialDurability: Number(material.durability_score),
      widthInches: Number(quote.width_inches),
      heightInches: Number(quote.height_inches),
      quantity: Number(quote.quantity),
      industryName: industry.name,
      certifications: quote.certifications ?? [],
      baseEstimate: Number(quote.base_estimate),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze]", id, message);
    return NextResponse.json(
      { error: "AI analysis failed", detail: message },
      { status: 502 },
    );
  }

  const { analysis, modelUsed, latencyMs, promptInputHash } = result;

  // Persist results: update the quote and insert the audit row in parallel.
  const [updateResult, insertResult] = await Promise.all([
    supabase
      .from("quotes")
      .update({
        ai_complexity_score: analysis.complexity_score,
        ai_suggested_price_low: analysis.suggested_price_low,
        ai_suggested_price_high: analysis.suggested_price_high,
        ai_rationale: analysis.rationale,
      })
      .eq("id", id),
    supabase.from("ai_predictions").insert({
      quote_id: id,
      model_used: modelUsed,
      prompt_input_hash: promptInputHash,
      predicted_complexity: analysis.complexity_score,
      predicted_price_low: analysis.suggested_price_low,
      predicted_price_high: analysis.suggested_price_high,
      rationale: analysis.rationale,
      latency_ms: latencyMs,
    }),
  ]);

  if (updateResult.error) {
    console.error("[analyze] quote update failed", id, updateResult.error.message);
  }
  if (insertResult.error) {
    console.error("[analyze] ai_predictions insert failed", id, insertResult.error.message);
  }

  return NextResponse.json({
    complexity_score: analysis.complexity_score,
    suggested_price_low: analysis.suggested_price_low,
    suggested_price_high: analysis.suggested_price_high,
    rationale: analysis.rationale,
    model_used: modelUsed,
    latency_ms: latencyMs,
  });
}
