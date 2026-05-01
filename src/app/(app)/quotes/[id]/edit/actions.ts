"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { moderateQuoteInputs } from "@/lib/moderation";

export type UpdateQuoteInput = {
  id: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  notes: string | null;
};

export type UpdateQuoteResult = { ok: true } | { ok: false; error: string };

/**
 * Edit-quote scope: customer info + notes only. Line items are immutable
 * post-creation so the AI prediction and base_estimate stay coherent. To
 * change a line, recreate the quote.
 */
export async function updateQuoteAction(
  input: UpdateQuoteInput,
): Promise<UpdateQuoteResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "You must be signed in to edit a quote." };
  }

  if (!input.customerName.trim()) {
    return { ok: false, error: "Customer name is required." };
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

  const { data: existing, error: fetchError } = await supabase
    .from("quotes")
    .select("id, estimator_id, status")
    .eq("id", input.id)
    .maybeSingle();
  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }
  if (!existing || existing.estimator_id !== session.user.id) {
    return { ok: false, error: "Quote not found." };
  }
  if (existing.status === "accepted") {
    return {
      ok: false,
      error: "Accepted quotes are locked. Re-open via the actions panel to edit.",
    };
  }

  // Validate the picked customer still belongs to this user, if one was picked.
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

  const { error: updateError } = await supabase
    .from("quotes")
    .update({
      customer_id: customerId,
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .eq("id", input.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath(`/quotes/${input.id}`);
  revalidatePath("/quotes");
  redirect(`/quotes/${input.id}`);
}
