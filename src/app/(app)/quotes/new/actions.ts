"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateBaseEstimate } from "@/lib/estimator";

export type CreateQuoteInput = {
  customerName: string;
  customerEmail: string | null;
  productId: string;
  materialId: string;
  industryId: string;
  widthInches: number;
  heightInches: number;
  quantity: number;
  certifications: string[];
  notes: string | null;
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
  if (!input.productId || !input.materialId || !input.industryId) {
    return { ok: false, error: "Product, material and industry are required." };
  }
  if (!Number.isFinite(input.widthInches) || input.widthInches <= 0) {
    return { ok: false, error: "Width must be a positive number." };
  }
  if (!Number.isFinite(input.heightInches) || input.heightInches <= 0) {
    return { ok: false, error: "Height must be a positive number." };
  }
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    return { ok: false, error: "Quantity must be a positive whole number." };
  }

  const supabase = createServerSupabaseClient();

  const [{ data: product, error: productError }, { data: industry, error: industryError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("base_price_per_sq_in, setup_fee, min_qty")
        .eq("id", input.productId)
        .single(),
      supabase
        .from("industries")
        .select("certification_premium")
        .eq("id", input.industryId)
        .single(),
    ]);

  if (productError || !product) {
    return { ok: false, error: "Selected product not found." };
  }
  if (industryError || !industry) {
    return { ok: false, error: "Selected industry not found." };
  }
  if (input.quantity < product.min_qty) {
    return {
      ok: false,
      error: `Quantity must be at least ${product.min_qty} for this product.`,
    };
  }

  const baseEstimate = calculateBaseEstimate({
    basePricePerSqIn: Number(product.base_price_per_sq_in),
    setupFee: Number(product.setup_fee),
    widthInches: input.widthInches,
    heightInches: input.heightInches,
    quantity: input.quantity,
    certificationPremium: Number(industry.certification_premium),
  });

  const { data: inserted, error: insertError } = await supabase
    .from("quotes")
    .insert({
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail?.trim() || null,
      product_id: input.productId,
      material_id: input.materialId,
      industry_id: input.industryId,
      width_inches: input.widthInches,
      height_inches: input.heightInches,
      quantity: input.quantity,
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

  redirect(`/quotes/${inserted.id}`);
}
