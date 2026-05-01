import Link from "next/link";
import { headers } from "next/headers";
import { Building2, Mail, Phone, UserPlus, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function CustomersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const supabase = createServerSupabaseClient();

  const [customersRes, quoteCountsRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, email, company, phone, created_at")
      .eq("estimator_id", session.user.id)
      .order("name", { ascending: true }),
    supabase
      .from("quotes")
      .select("customer_id")
      .eq("estimator_id", session.user.id)
      .not("customer_id", "is", null),
  ]);

  if (customersRes.error) {
    throw new Error(`Failed to load customers: ${customersRes.error.message}`);
  }
  if (quoteCountsRes.error) {
    throw new Error(`Failed to load quote counts: ${quoteCountsRes.error.message}`);
  }

  const customers = customersRes.data ?? [];
  const quoteCounts = (quoteCountsRes.data ?? []).reduce<Record<string, number>>((acc, row) => {
    if (row.customer_id) acc[row.customer_id] = (acc[row.customer_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            Customers
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
            Your contacts
          </h1>
          <p className="text-sm text-text-secondary">
            Save the buyers, plant engineers and procurement folks you quote against often.
          </p>
        </div>
        <Link
          href="/customers/new"
          className={cn(
            buttonVariants({ size: "default" }),
            "bg-accent text-accent-foreground hover:bg-accent/90 gap-2",
          )}
        >
          <UserPlus className="size-4" />
          New customer
        </Link>
      </header>

      <section className="mt-10">
        {customers.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/customers/${c.id}`}
                  className="block rounded-lg border border-border bg-surface-1 p-5 shadow-sm transition-shadow hover:border-border-strong hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h2 className="truncate font-heading text-base font-semibold text-text">
                        {c.name}
                      </h2>
                      {c.company && (
                        <p className="flex items-center gap-1.5 truncate text-xs text-text-secondary">
                          <Building2 className="size-3.5 shrink-0" />
                          <span className="truncate">{c.company}</span>
                        </p>
                      )}
                    </div>
                    <span className="rounded bg-surface-3 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                      {quoteCounts[c.id] ?? 0} quotes
                    </span>
                  </div>

                  <dl className="mt-4 space-y-1.5 text-xs text-text-secondary">
                    {c.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="size-3.5 shrink-0 text-text-muted" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3.5 shrink-0 text-text-muted" />
                        <span className="truncate">{c.phone}</span>
                      </div>
                    )}
                  </dl>

                  <p className="mt-4 text-[10px] text-text-muted">
                    Added {dateFormatter.format(new Date(c.created_at))}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface-1 px-6 py-16 text-center">
      <Users className="size-8 text-text-muted" />
      <h2 className="font-heading text-lg font-semibold text-text">No customers yet</h2>
      <p className="max-w-md text-sm text-text-secondary">
        Once you save a customer, you can pick them when building a new quote and the email
        flow knows where to send the PDF.
      </p>
      <Link
        href="/customers/new"
        className={cn(
          buttonVariants({ size: "sm" }),
          "mt-2 bg-accent text-accent-foreground hover:bg-accent/90 gap-2",
        )}
      >
        <UserPlus className="size-4" />
        Add your first customer
      </Link>
    </div>
  );
}
