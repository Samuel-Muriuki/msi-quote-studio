import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Layout already redirects if session is null; this is just for the type narrowing.
  if (!session) return null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
        Estimator console
      </p>
      <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-text sm:text-4xl">
        Welcome, {session.user.name || session.user.email.split("@")[0]}.
      </h1>
      <p className="mt-3 max-w-2xl text-base text-text-secondary">
        You&apos;re signed in. The quote workflow lands in the next iteration —
        new quote form, AI complexity scoring, and the reporting dashboard.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard
          title="New Quote"
          body="Describe a job, get a complexity score and price band in seconds."
          status="Coming next"
        />
        <PlaceholderCard
          title="Quotes Pipeline"
          body="Your draft, sent, accepted and declined quotes."
          status="Coming next"
        />
        <PlaceholderCard
          title="Reporting"
          body="Pipeline value, win rate, AI confidence trend."
          status="Coming next"
        />
      </div>
    </div>
  );
}

function PlaceholderCard({
  title,
  body,
  status,
}: {
  title: string;
  body: string;
  status: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-6">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
        {status}
      </p>
      <h2 className="mt-3 font-heading text-lg font-semibold text-text">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
    </article>
  );
}
