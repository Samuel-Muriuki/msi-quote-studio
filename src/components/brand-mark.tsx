import { cn } from "@/lib/utils";

/**
 * The MSI Quote Studio shield mark — same shape as `app/icon.svg` so the
 * favicon and in-app brand reads as one identity. Slate fill, white outline,
 * accent-orange dot. Hardcoded colors so the mark stays on-brand in both
 * light and dark modes.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="MSI Quote Studio"
      className={cn("size-6 shrink-0", className)}
    >
      <rect width="64" height="64" rx="12" fill="#0F172A" />
      <g
        transform="translate(13 13)"
        fill="none"
        stroke="#F8FAFC"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.6 2H6.5a4.5 4.5 0 0 0-4.5 4.5v15.1a4.5 4.5 0 0 0 1.32 3.18l13.1 13.1a4.5 4.5 0 0 0 6.36 0L36.88 24a4.5 4.5 0 0 0 0-6.36L23.78 4.54A4.5 4.5 0 0 0 21.6 2z" />
        <circle cx="11" cy="11" r="2.6" fill="#D97706" stroke="none" />
      </g>
    </svg>
  );
}
