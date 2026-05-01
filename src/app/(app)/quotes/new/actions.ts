"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateBaseEstimate } from "@/lib/estimator";
import { moderateQuoteInputs } from "@/lib/moderation";

export type LineInput = {
  productId: string;
  materialId: string;
  widthInches: number;
  heightInches: number;
  quantity: number;
  /** Optional CAD upload that produced this line's dimensions. */
  cadUploadId?: string | null;
};

export type CreateQuoteInput = {
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  industryId: string;
  certifications: string[];
  notes: string | null;
  lines: LineInput[];
};

export type CreateQuoteResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createQuoteAction(
  input: CreateQuoteInput,
): Promise<CreateQuoteResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "You must be signed in to create a quote." };
  }

  if (!input.customerName.trim()) {
    return { ok: false, error: "Customer name is required." };
  }
  if (!input.industryId) {
    return { ok: false, error: "Industry is required." };
  }
  if (!input.lines || input.lines.length === 0) {
    return { ok: false, error: "Add at least one line item." };
  }

  for (const [i, line] of input.lines.entries()) {
    const where = `Line ${i + 1}`;
    if (!line.productId || !line.materialId) {
      return { ok: false, error: `${where}: product and material are required.` };
    }
    if (!Number.isFinite(line.widthInches) || line.widthInches <= 0) {
      return { ok: false, error: `${where}: width must be a positive number.` };
    }
    if (!Number.isFinite(line.heightInches) || line.heightInches <= 0) {
      return { ok: false, error: `${where}: height must be a positive number.` };
    }
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      return { ok: false, error: `${where}: quantity must be a positive whole number.` };
    }
  }

  const moderation = moderateQuoteInputs({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    notes: input.notes,
  });
  if (!moderation.ok) {
    return { ok: false, error: moderation.reason };
  }

  const supabase = createServerSupabaseClient();

  const productIds = Array.from(new Set(input.lines.map((l) => l.productId)));
  const [{ data: products, error: productsError }, { data: industry, error: industryError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, base_price_per_sq_in, setup_fee, min_qty")
        .in("id", productIds),
      supabase
        .from("industries")
        .select("certification_premium")
        .eq("id", input.industryId)
        .single(),
    ]);

  if (productsError || !products) {
    return { ok: false, error: "Failed to load product details." };
  }
  if (industryError || !industry) {
    return { ok: false, error: "Selected industry not found." };
  }

  const productById = new Map(products.map((p) => [p.id, p]));
  const certificationPremium = Number(industry.certification_premium);

  const lineEstimates: number[] = [];
  for (const [i, line] of input.lines.entries()) {
    const product = productById.get(line.productId);
    if (!product) {
      return { ok: false, error: `Line ${i + 1}: selected product not found.` };
    }
    if (line.quantity < product.min_qty) {
      return {
        ok: false,
        error: `Line ${i + 1}: quantity must be at least ${product.min_qty} for this product.`,
      };
    }
    const lineEstimate = calculateBaseEstimate({
      basePricePerSqIn: Number(product.base_price_per_sq_in),
      setupFee: Number(product.setup_fee),
      widthInches: line.widthInches,
      heightInches: line.heightInches,
      quantity: line.quantity,
      certificationPremium,
    });
    lineEstimates.push(lineEstimate);
  }

  const baseEstimate = lineEstimates.reduce((sum, e) => sum + e, 0);

  let customerId: string | null = null;
  if (input.customerId) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, estimator_id")
      .eq("id", input.customerId)
      .maybeSingle();
    if (customerError) {
      return { ok: false, error: customerError.message };
    }
    if (!customer || customer.estimator_id !== session.user.id) {
      return { ok: false, error: "Selected customer not found." };
    }
    customerId = customer.id;
  }

  // Insert the parent quote first. Inline product/material/dimensions/quantity
  // columns are populated from the FIRST line for backwards compat — they'll
  // be dropped in a follow-up migration once nothing reads them.
  const firstLine = input.lines[0];
  const { data: inserted, error: insertError } = await supabase
    .from("quotes")
    .insert({
      customer_id: customerId,
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail?.trim() || null,
      product_id: firstLine.productId,
      material_id: firstLine.materialId,
      industry_id: input.industryId,
      width_inches: firstLine.widthInches,
      height_inches: firstLine.heightInches,
      quantity: firstLine.quantity,
      certifications: input.certifications,
      notes: input.notes?.trim() || null,
      status: "draft",
      base_estimate: baseEstimate,
      estimator_id: session.user.id,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? "Failed to create quote." };
  }

  // Bulk-insert lines. If this fails we delete the parent so we don't leave a
  // headless quote with zero lines (which would 500 the detail page).
  const lineRows = input.lines.map((line, i) => ({
    quote_id: inserted.id,
    position: i,
    product_id: line.productId,
    material_id: line.materialId,
    width_inches: line.widthInches,
    height_inches: line.heightInches,
    quantity: line.quantity,
    line_estimate: lineEstimates[i],
    cad_upload_id: line.cadUploadId ?? null,
  }));

  const { error: linesError } = await supabase.from("quote_lines").insert(lineRows);
  if (linesError) {
    await supabase.from("quotes").delete().eq("id", inserted.id);
    return { ok: false, error: `Failed to save line items: ${linesError.message}` };
  }

  redirect(`/quotes/${inserted.id}`);
}
