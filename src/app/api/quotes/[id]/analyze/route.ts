import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AIError, analyzeQuote, type LineAnalyzeInput } from "@/lib/groq";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const [quoteRes, linesRes] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        `id, certifications, base_estimate,
         industries!inner ( name )`,
      )
      .eq("id", id)
      .single(),
    supabase
      .from("quote_lines")
      .select(
        `id, position, width_inches, height_inches, quantity,
         products!inner ( name, category ),
         materials!inner ( name, durability_score ),
         cad_uploads ( original_filename, path_count )`,
      )
      .eq("quote_id", id)
      .order("position", { ascending: true }),
  ]);

  if (quoteRes.error || !quoteRes.data) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
  if (linesRes.error) {
    return NextResponse.json(
      { error: "Failed to load quote lines", detail: linesRes.error.message },
      { status: 500 },
    );
  }

  const quote = quoteRes.data;
  const linesRaw = linesRes.data ?? [];
  if (linesRaw.length === 0) {
    return NextResponse.json(
      { error: "Quote has no line items to analyze" },
      { status: 422 },
    );
  }

  const industry = Array.isArray(quote.industries) ? quote.industries[0] : quote.industries;
  if (!industry) {
    return NextResponse.json(
      { error: "Quote is missing its industry row" },
      { status: 422 },
    );
  }

  const lines: LineAnalyzeInput[] = linesRaw.map((line) => {
    const product = Array.isArray(line.products) ? line.products[0] : line.products;
    const material = Array.isArray(line.materials) ? line.materials[0] : line.materials;
    const cad = Array.isArray(line.cad_uploads) ? line.cad_uploads[0] : line.cad_uploads;
    return {
      productName: product?.name ?? "Product",
      productCategory: product?.category ?? "unknown",
      materialName: material?.name ?? "Material",
      materialDurability: Number(material?.durability_score ?? 5),
      widthInches: Number(line.width_inches),
      heightInches: Number(line.height_inches),
      quantity: Number(line.quantity),
      cadPathCount: cad?.path_count ?? null,
      cadFilename: cad?.original_filename ?? null,
    };
  });

  let result;
  try {
    result = await analyzeQuote({
      industryName: industry.name,
      certifications: quote.certifications ?? [],
      baseEstimate: Number(quote.base_estimate),
      lines,
    });
  } catch (err) {
    if (err instanceof AIError) {
      console.error("[analyze]", id, err.code, err.message);
      const headers: Record<string, string> = {};
      if (err.retryAfterSeconds) headers["Retry-After"] = String(err.retryAfterSeconds);
      return NextResponse.json(
        {
          error: err.userMessage,
          detail: err.userMessage,
          code: err.code,
          retryable: err.retryable,
          retry_after_seconds: err.retryAfterSeconds,
        },
        { status: err.status, headers },
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze]", id, "uncategorised:", message);
    return NextResponse.json(
      {
        error: "AI analysis failed unexpectedly. Please retry.",
        detail: message,
        code: "unknown",
        retryable: true,
      },
      { status: 502 },
    );
  }

  const { analysis, modelUsed, latencyMs, promptInputHash } = result;

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
