import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  FilePlus2,
  Mail,
  Pencil,
  Phone,
  StickyNote,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { QuoteStatusBadge } from "@/components/quote-status-badge";
import { DemoExpiryBadge } from "@/components/demo-expiry-badge";
import { BackToTop } from "@/components/back-to-top";
import { currencyDetailed as currency } from "@/lib/quote-helpers";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const supabase = createServerSupabaseClient();

  const [customerRes, quotesRes] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, name, email, company, phone, notes, created_at, estimator_id, is_demo_sample",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("quotes")
      .select(
        `id, status, base_estimate, final_price, customer_name, created_at,
         industries ( name )`,
      )
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (customerRes.error) {
    throw new Error(`Failed to load customer: ${customerRes.error.message}`);
  }
  if (!customerRes.data || customerRes.data.estimator_id !== session.user.id) {
    notFound();
  }

  const customer = customerRes.data;
  const quotes = quotesRes.data ?? [];

  // Quote-level totals across this customer's pipeline.
  const totalValue = quotes.reduce(
    (sum, q) => sum + Number(q.final_price ?? q.base_estimate ?? 0),
    0,
  );
  const acceptedValue = quotes
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + Number(q.final_price ?? q.base_estimate ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:px-8 sm:py-14">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text"
        >
          <ArrowLeft className="size-3.5" />
          Back to customers
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            Customer · {String(customer.id).slice(0, 8)}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
            {customer.name}
          </h1>
          {customer.company && (
            <p className="text-sm text-text-secondary">{customer.company}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/customers/${customer.id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <Pencil className="size-3.5" />
              Edit
            </Link>
            <Link
              href="/quotes/new"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5",
              )}
            >
              <FilePlus2 className="size-4" />
              Quote this customer
            </Link>
          </div>
          <DemoExpiryBadge
            createdAt={customer.created_at}
            isSample={customer.is_demo_sample}
            size="md"
          />
        </div>
      </header>

      <section
        aria-label="Contact"
        className="grid gap-4 rounded-lg border border-border bg-card p-6 sm:grid-cols-2"
      >
        <Field label="Email" icon={Mail}>
          {customer.email ? (
            <a
              href={`mailto:${customer.email}`}
              className="text-text underline-offset-2 hover:underline"
            >
              {customer.email}
            </a>
          ) : (
            <span className="text-text-muted">—</span>
          )}
        </Field>
        <Field label="Phone" icon={Phone}>
          {customer.phone ? (
            <span className="text-text">{customer.phone}</span>
          ) : (
            <span className="text-text-muted">—</span>
          )}
        </Field>
        <Field label="Company" icon={Building2}>
          <span className="text-text">{customer.company ?? "—"}</span>
        </Field>
        <Field label="Added" icon={StickyNote}>
          <span className="text-text">{dateFormatter.format(new Date(customer.created_at))}</span>
        </Field>
      </section>

      {customer.notes && (
        <section
          aria-label="Notes"
          className="rounded-lg border border-border bg-card p-6"
        >
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-text-secondary">
            Standing notes
          </h2>
          <p className="mt-3 text-sm whitespace-pre-line text-text">{customer.notes}</p>
        </section>
      )}

      <section
        aria-label="Quote stats"
        className="grid gap-3 sm:grid-cols-3"
      >
        <StatCard label="Quotes" value={quotes.length.toString()} />
        <StatCard label="Pipeline value" value={currency.format(totalValue)} />
        <StatCard label="Accepted value" value={currency.format(acceptedValue)} />
      </section>

      <section aria-label="Quotes for this customer">
        <header className="flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-semibold text-text">Quotes</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            All quotes linked to {customer.name}
          </p>
        </header>

        <div className="mt-4">
          {quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface-1 px-6 py-12 text-center">
              <FilePlus2 className="size-8 text-text-muted" />
              <h3 className="font-heading text-base font-semibold text-text">
                No quotes yet for {customer.name}
              </h3>
              <p className="max-w-md text-sm text-text-secondary">
                Pick this customer on the new-quote form and the link is set automatically.
              </p>
              <Link
                href="/quotes/new"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "mt-2 bg-accent text-accent-foreground hover:bg-accent/90 gap-2",
                )}
              >
                <FilePlus2 className="size-4" />
                Create the first one
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {quotes.map((q) => {
                const industry = Array.isArray(q.industries) ? q.industries[0] : q.industries;
                const value = Number(q.final_price ?? q.base_estimate ?? 0);
                return (
                  <li key={q.id}>
                    <Link
                      href={`/quotes/${q.id}`}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-1"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
                            Q-{String(q.id).slice(0, 8).toUpperCase()}
                          </p>
                          <QuoteStatusBadge status={q.status} />
                        </div>
                        <p className="mt-1 truncate text-sm text-text">
                          {industry?.name ?? "—"}
                          <span className="ml-2 text-xs text-text-muted">
                            {dateFormatter.format(new Date(q.created_at))}
                          </span>
                        </p>
                      </div>
                      <p className="font-mono text-sm font-semibold tabular-nums text-text">
                        {currency.format(value)}
                      </p>
                      <ArrowRight className="size-3.5 shrink-0 text-text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
      <BackToTop />
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-text-muted">
        <Icon className="size-3.5" />
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-text">{value}</p>
    </div>
  );
}
