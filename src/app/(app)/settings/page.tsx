import { headers } from "next/headers";
import {
  CheckCircle2,
  ExternalLink,
  Mail,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { brevoIsConfigured } from "@/lib/brevo";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const supabase = createServerSupabaseClient();

  // Workspace stats — quote counts split into seeded vs user-created so the
  // estimator sees what the daily cleanup cron will leave behind.
  const [{ count: totalQuotes }, { count: sampleQuotes }, { count: customers }] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("estimator_id", session.user.id),
      supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("estimator_id", session.user.id)
        .eq("is_demo_sample", true),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("estimator_id", session.user.id),
    ]);

  const userCreatedQuotes = (totalQuotes ?? 0) - (sampleQuotes ?? 0);

  const integrations: IntegrationStatus[] = [
    {
      key: "groq",
      name: "Groq AI",
      description: "Powers complexity scoring and price recommendations on every quote.",
      configured: Boolean(process.env.GROQ_API_KEY),
      docsUrl: "https://console.groq.com/keys",
      docsLabel: "Generate at console.groq.com",
    },
    {
      key: "brevo",
      name: "Brevo (transactional email)",
      description: "Sends branded quote PDFs to customers from the quote detail page.",
      configured: brevoIsConfigured(),
      docsUrl: "https://app.brevo.com/settings/keys/api",
      docsLabel: "Generate at app.brevo.com",
    },
    {
      key: "cron",
      name: "Vercel Cron — daily demo cleanup",
      description:
        "Authorizes the daily 03:00 UTC route that deletes demo-created quotes older than 7 days, keeping the seeded sample.",
      configured: Boolean(process.env.CRON_SECRET),
      docsUrl: "https://vercel.com/docs/cron-jobs",
      docsLabel: "Vercel Cron docs",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-5 py-10 sm:px-8 sm:py-14">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          Settings
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text">
          Workspace &amp; integrations
        </h1>
        <p className="text-sm text-text-secondary">
          A quick read on who&apos;s signed in, what your data looks like, and which
          integrations are live.
        </p>
      </header>

      <section
        aria-label="Account"
        className="rounded-lg border border-border bg-card p-6"
      >
        <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-text-secondary">
          Account
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name" icon={UserIcon}>
            {session.user.name || session.user.email?.split("@")[0] || "—"}
          </Field>
          <Field label="Email" icon={Mail}>
            <span className="font-mono text-text">{session.user.email}</span>
          </Field>
        </div>
        <p className="mt-4 text-xs text-text-muted">
          Profile fields are managed by the Better Auth provider. Editing lands in a
          follow-up PR — not blocking the demo.
        </p>
      </section>

      <section aria-label="Workspace">
        <header className="flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-semibold text-text">Workspace</h2>
        </header>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatCard label="Customers" value={String(customers ?? 0)} />
          <StatCard
            label="Quotes total"
            value={String(totalQuotes ?? 0)}
            sub={`${sampleQuotes ?? 0} sample · ${userCreatedQuotes} user-created`}
          />
          <StatCard label="Sample quotes (kept forever)" value={String(sampleQuotes ?? 0)} />
        </div>
        <p className="mt-3 text-xs text-text-muted">
          The daily cleanup cron deletes user-created quotes older than{" "}
          <span className="font-mono">48 hours</span>. Sample quotes are tagged{" "}
          <span className="font-mono">is_demo_sample=true</span> and stay forever so the
          demo stays predictable. Same 48-hour window applies if the database grows beyond
          ~100 MB.
        </p>
      </section>

      <section aria-label="Integrations">
        <header className="flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-semibold text-text">Integrations</h2>
        </header>
        <ul className="mt-4 space-y-3">
          {integrations.map((it) => {
            const { key, ...rest } = it;
            return <IntegrationCard key={key} {...rest} />;
          })}
        </ul>
        <p className="mt-3 text-xs text-text-muted">
          Each integration reads its credentials from environment variables on the
          server. Edit them in the Vercel project settings and redeploy to flip the
          status here.
        </p>
      </section>
    </div>
  );
}

type IntegrationStatus = {
  key: string;
  name: string;
  description: string;
  configured: boolean;
  docsUrl: string;
  docsLabel: string;
};

function IntegrationCard({
  name,
  description,
  configured,
  docsUrl,
  docsLabel,
}: IntegrationStatus) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-start">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-3">
        {configured ? (
          <CheckCircle2 className="size-5 text-success" />
        ) : (
          <XCircle className="size-5 text-text-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-base font-semibold text-text">{name}</h3>
          {configured ? (
            <span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-success">
              Live
            </span>
          ) : (
            <span className="rounded-full border border-border bg-surface-3 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              Not configured
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary">{description}</p>
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted underline-offset-2 hover:text-text hover:underline"
        >
          {docsLabel}
          <ExternalLink className="size-3" />
        </a>
      </div>
    </li>
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

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-text">{value}</p>
      {sub && <p className="mt-1 font-mono text-[10px] text-text-muted">{sub}</p>}
    </div>
  );
}

