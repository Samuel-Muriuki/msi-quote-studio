import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type QuoteStatus, isQuoteStatus } from "@/lib/quote-helpers";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<QuoteStatus, string> = {
  draft:
    "bg-surface-3 text-text-secondary border-transparent",
  sent:
    "bg-info/10 text-info border-info/20",
  accepted:
    "bg-success/10 text-success border-success/20",
  declined:
    "bg-destructive/10 text-destructive border-destructive/20",
  expired:
    "bg-surface-3 text-text-muted border-transparent",
};

export function QuoteStatusBadge({ status }: { status: string }) {
  const safe: QuoteStatus = isQuoteStatus(status) ? status : "draft";
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.14em]",
        STATUS_STYLES[safe],
      )}
    >
      {STATUS_LABELS[safe]}
    </Badge>
  );
}
