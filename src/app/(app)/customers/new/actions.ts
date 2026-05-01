"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isProfane } from "@/lib/moderation";

export type CreateCustomerInput = {
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  notes: string | null;
};

export type CreateCustomerResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createCustomerAction(
  input: CreateCustomerInput,
): Promise<CreateCustomerResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "You must be signed in to add a customer." };
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
  const { data: inserted, error } = await supabase
    .from("customers")
    .insert({
      name,
      email: input.email?.trim() || null,
      company: input.company?.trim() || null,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      estimator_id: session.user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Failed to create customer." };
  }

  redirect("/customers");
}
