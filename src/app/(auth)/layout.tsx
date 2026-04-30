import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
            <span className="text-text">MSI</span>{" "}
            <span className="text-accent">Quote</span>{" "}
            <span className="text-text">Studio</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
