import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12 text-center sm:px-8">
      <div className="space-y-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          Error 404
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-text sm:text-5xl">
          That page <span className="text-accent">doesn&apos;t exist.</span>
        </h1>
        <p className="mx-auto max-w-md text-sm text-text-secondary">
          The link may be broken, or the resource has moved. Head back to the landing
          page or sign in to continue.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "default" }),
              "bg-accent text-accent-foreground hover:bg-accent/90 gap-2",
            )}
          >
            Back to landing
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: "outline", size: "default" }))}
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
