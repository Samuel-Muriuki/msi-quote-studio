import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EditQuoteForm } from "./edit-quote-form";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const supabase = createServerSupabaseClient();

  const [quoteRes, customersRes] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, customer_id, customer_name, customer_email, notes, estimator_id, status")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("customers")
      .select("id, name, email, company")
      .eq("estimator_id", session.user.id)
      .order("name", { ascending: true }),
  ]);

  if (quoteRes.error) {
    throw new Error(`Failed to load quote: ${quoteRes.error.message}`);
  }
  if (!quoteRes.data || quoteRes.data.estimator_id !== session.user.id) {
    notFound();
  }

  const quote = quoteRes.data;
  const customers = customersRes.data ?? [];
  const quoteNumber = `Q-${String(quote.id).slice(0, 8).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-5 py-10 sm:px-8 sm:py-14">
      <div>
        <Link
          href={`/quotes/${quote.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text"
        >
          <ArrowLeft className="size-3.5" />
          Back to {quoteNumber}
        </Link>
      </div>

      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          Edit quote · {quoteNumber}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
          {quote.customer_name}
        </h1>
      </header>

      <EditQuoteForm quote={quote} customers={customers} />
    </div>
  );
}
