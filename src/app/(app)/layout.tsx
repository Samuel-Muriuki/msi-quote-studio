import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link
            href="/dashboard"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            <span className="text-text">MSI</span>{" "}
            <span className="text-accent">Quote</span>{" "}
            <span className="text-text">Studio</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-text-secondary sm:inline">
              {session.user.name || session.user.email}
            </span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
