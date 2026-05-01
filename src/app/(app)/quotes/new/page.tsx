import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NewQuoteForm } from "./new-quote-form";

export default async function NewQuotePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const supabase = createServerSupabaseClient();

  const [products, materials, industries, customers] = await Promise.all([
    supabase
      .from("products")
      .select("id, category, name, base_price_per_sq_in, setup_fee, min_qty")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("materials")
      .select("id, type, name, durability_score")
      .eq("active", true)
      .order("type", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("industries")
      .select("id, name, certification_premium, required_certifications")
      .order("name", { ascending: true }),
    session
      ? supabase
          .from("customers")
          .select("id, name, email, company")
          .eq("estimator_id", session.user.id)
          .order("name", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (products.error || materials.error || industries.error || customers.error) {
    throw new Error(
      `Catalog load failed: ${products.error?.message ?? materials.error?.message ?? industries.error?.message ?? customers.error?.message}`,
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          New quote
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
          Describe the job
        </h1>
        <p className="text-sm text-text-secondary">
          Pick a product, the material, the industry it ships into, and the run size.
          We&apos;ll calculate a base estimate now; the AI complexity score lands on the
          quote detail page.
        </p>
      </header>

      <div className="mt-10">
        <NewQuoteForm
          products={products.data ?? []}
          materials={materials.data ?? []}
          industries={industries.data ?? []}
          customers={customers.data ?? []}
        />
      </div>
    </div>
  );
}
