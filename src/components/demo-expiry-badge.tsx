import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const RETENTION_HOURS = 48;

/**
 * Renders a small clock pill telling the viewer how long until this row's
 * data is swept by the demo cleanup cron. Server-component-safe (computes
 * on render, no client state). Pass `isSample` so curated samples can opt
 * out of the badge entirely.
 *
 * Sizes:
 *   sm — table row inline
 *   md — card / detail header
 */
export function DemoExpiryBadge({
  createdAt,
  isSample,
  size = "sm",
  className,
}: {
  createdAt: string;
  isSample: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  if (isSample) return null;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return null;

  const expiresAt = created + RETENTION_HOURS * 60 * 60 * 1000;
  const msLeft = expiresAt - Date.now();
  const hoursLeft = Math.floor(msLeft / (60 * 60 * 1000));
  const minutesLeft = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));

  const overdue = msLeft <= 0;
  const text = overdue
    ? "due for cleanup"
    : hoursLeft >= 1
      ? `deletes in ${hoursLeft}h ${minutesLeft}m`
      : `deletes in ${minutesLeft}m`;

  const baseClasses =
    size === "sm"
      ? "gap-1 px-1.5 py-0.5 text-[10px]"
      : "gap-1.5 px-2.5 py-1 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-mono uppercase tracking-[0.12em]",
        overdue
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-warning/40 bg-warning/10 text-warning",
        baseClasses,
        className,
      )}
      title="Data created via the shared demo account auto-deletes after 48 hours."
    >
      <Clock className={size === "sm" ? "size-2.5" : "size-3"} aria-hidden />
      {text}
    </span>
  );
}
