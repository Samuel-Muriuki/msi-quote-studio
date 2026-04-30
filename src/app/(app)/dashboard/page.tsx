import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, FilePlus2, LayoutDashboard, LineChart } from "lucide-react";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Layout already redirects if session is null; this is just for type narrowing.
  if (!session) return null;

  const supabase = createServerSupabaseClient();
  const { data: recent } = await supabase
    .from("quotes")
    .select("id, customer_name, status, base_estimate, created_at")
    .eq("estimator_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentQuotes = recent ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
        Estimator console
      </p>
      <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">
        Welcome, {session.user.name || session.user.email.split("@")[0]}.
      </h1>
      <p className="mt-3 max-w-2xl text-base text-text-secondary">
        Start a new quote or jump into one of your drafts. AI complexity scoring runs from the quote
        detail page once a quote exists.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          href="/quotes/new"
          icon={FilePlus2}
          title="New Quote"
          body="Describe a job, get a base estimate now and an AI complexity score next."
          cta="Start a quote"
          accent
        />
        <ActionCard
          href="/quotes"
          icon={LayoutDashboard}
          title="Quotes Pipeline"
          body="Drafts, sent, accepted and declined — all your quotes in one place."
          cta="Open pipeline"
        />
        <ActionCard
          href="/reports"
          icon={LineChart}
          title="Reporting"
          body="Pipeline value, win rate, AI confidence trend over time."
          cta="Coming next"
          disabled
        />
      </div>

      {recentQuotes.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-text">Recent quotes</h2>
            <p className="text-xs text-text-muted">Last 5 you created.</p>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-3 text-xs uppercase tracking-[0.12em] text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Base estimate</th>
                  <th className="px-4 py-3 text-right font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentQuotes.map((q) => (
                  <tr key={q.id} className="bg-card hover:bg-surface-3">
                    <td className="px-4 py-3">
                      <Link
                        href={`/quotes/${q.id}`}
                        className="font-medium text-text hover:text-accent"
                      >
                        {q.customer_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-text-secondary">
                      {q.status}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {currency.format(Number(q.base_estimate))}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-text-muted">
                      {new Date(q.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

type ActionCardProps = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta: string;
  accent?: boolean;
  disabled?: boolean;
};

function ActionCard({
  href,
  icon: Icon,
  title,
  body,
  cta,
  accent,
  disabled,
}: ActionCardProps) {
  const content = (
    <article
      className={cn(
        "h-full rounded-lg border bg-card p-6 transition-colors",
        accent && "border-accent/40 hover:border-accent",
        !accent && !disabled && "border-border hover:border-border-strong",
        disabled && "border-border opacity-70",
      )}
    >
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-md",
          accent ? "bg-accent/15 text-accent" : "bg-surface-3 text-text-secondary",
        )}
      >
        <Icon className="size-5" />
      </div>
      <h2 className="mt-5 font-heading text-lg font-semibold text-text">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
      <p
        className={cn(
          "mt-5 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.16em]",
          accent && "text-accent",
          !accent && !disabled && "text-text-secondary",
          disabled && "text-text-muted",
        )}
      >
        {cta}
        {!disabled && <ArrowRight className="size-3.5" />}
      </p>
    </article>
  );

  if (disabled) {
    return content;
  }
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
