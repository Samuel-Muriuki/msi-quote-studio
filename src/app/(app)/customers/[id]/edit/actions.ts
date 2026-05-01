"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isProfane } from "@/lib/moderation";

export type UpdateCustomerInput = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  notes: string | null;
};

export type UpdateCustomerResult = { ok: true } | { ok: false; error: string };

export async function updateCustomerAction(
  input: UpdateCustomerInput,
): Promise<UpdateCustomerResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "You must be signed in to edit a customer." };
  }

  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Customer name is required." };
  }

  const profaneFields: Array<[label: string, value: string | null]> = [
    ["customer name", name],
    ["company", input.company?.trim() ?? null],
    ["notes", input.notes?.trim() ?? null],
  ];
  for (const [label, value] of profaneFields) {
    if (value && isProfane(value)) {
      return { ok: false, error: `Please remove profanity from the ${label} field.` };
    }
  }

  const supabase = createServerSupabaseClient();

  // Ownership check + update in one round trip via the where clause.
  const { data: existing, error: fetchError } = await supabase
    .from("customers")
    .select("id, estimator_id")
    .eq("id", input.id)
    .maybeSingle();
  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }
  if (!existing || existing.estimator_id !== session.user.id) {
    return { ok: false, error: "Customer not found." };
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update({
      name,
      email: input.email?.trim() || null,
      company: input.company?.trim() || null,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .eq("id", input.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  redirect(`/customers/${input.id}`);
}
