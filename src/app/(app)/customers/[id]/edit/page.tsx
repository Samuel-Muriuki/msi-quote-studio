import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EditCustomerForm } from "./edit-customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const supabase = createServerSupabaseClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, name, email, company, phone, notes, estimator_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load customer: ${error.message}`);
  }
  if (!customer || customer.estimator_id !== session.user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-5 py-10 sm:px-8 sm:py-14">
      <div>
        <Link
          href={`/customers/${customer.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text"
        >
          <ArrowLeft className="size-3.5" />
          Back to {customer.name}
        </Link>
      </div>

      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          Edit customer
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
          {customer.name}
        </h1>
      </header>

      <EditCustomerForm customer={customer} />
    </div>
  );
}
