"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isQuoteStatus, type QuoteStatus } from "@/lib/quote-helpers";
import type { TablesUpdate } from "@/types/supabase";

type ActionResult = { ok: true } | { ok: false; error: string };

const VALID_TRANSITIONS: Record<QuoteStatus, readonly QuoteStatus[]> = {
  draft: ["sent", "accepted", "declined"],
  sent: ["accepted", "declined", "expired"],
  accepted: [],
  declined: ["draft"], // allow re-open as draft
  expired: ["draft"],
};

async function transitionStatus(
  quoteId: string,
  next: QuoteStatus,
  options?: { finalPrice?: number },
): Promise<ActionResult> {
  if (!isQuoteStatus(next)) {
    return { ok: false, error: "Invalid target status." };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }

  const supabase = createServerSupabaseClient();
  const { data: existing, error: fetchError } = await supabase
    .from("quotes")
    .select("status, estimator_id, base_estimate, final_price")
    .eq("id", quoteId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: "Quote not found." };
  }
  if (existing.estimator_id !== session.user.id) {
    return { ok: false, error: "You don't own this quote." };
  }

  const current = existing.status;
  if (!isQuoteStatus(current)) {
    return { ok: false, error: `Quote is in unknown state: ${current}` };
  }
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    return {
      ok: false,
      error: `Can't move quote from ${current} to ${next}.`,
    };
  }

  const update: TablesUpdate<"quotes"> = { status: next };
  if (next === "accepted") {
    update.final_price =
      options?.finalPrice ??
      (existing.final_price !== null ? Number(existing.final_price) : Number(existing.base_estimate));
  } else if (next === "declined") {
    if (options?.finalPrice !== undefined) {
      update.final_price = options.finalPrice;
    }
  }

  const { error: updateError } = await supabase
    .from("quotes")
    .update(update)
    .eq("id", quoteId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markQuoteAsSent(quoteId: string): Promise<ActionResult> {
  return transitionStatus(quoteId, "sent");
}

export async function markQuoteAsAccepted(
  quoteId: string,
  finalPrice?: number,
): Promise<ActionResult> {
  return transitionStatus(quoteId, "accepted", { finalPrice });
}

export async function markQuoteAsDeclined(quoteId: string): Promise<ActionResult> {
  return transitionStatus(quoteId, "declined");
}

export async function reopenQuoteAsDraft(quoteId: string): Promise<ActionResult> {
  return transitionStatus(quoteId, "draft");
}
