"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Auto-derived breadcrumb based on the current pathname.
 *
 * - `/dashboard` → Dashboard
 * - `/quotes` → Quotes
 * - `/quotes/new` → Quotes / New
 * - `/quotes/[id]` → Quotes / Q-XXXXXXXX
 * - `/reports` → Reports
 *
 * Pages that need a different label for the leaf can pass `leafLabel` explicitly
 * (e.g. customer name on a customer detail page).
 */

const STATIC_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  quotes: "Quotes",
  reports: "Reports",
  customers: "Customers",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

const LOOKS_LIKE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function prettyLabelFor(segment: string): string {
  if (STATIC_LABELS[segment]) return STATIC_LABELS[segment];
  if (LOOKS_LIKE_UUID.test(segment)) {
    return `Q-${segment.slice(0, 8).toUpperCase()}`;
  }
  // Default: title-case the segment with hyphens replaced by spaces
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AppBreadcrumb({ leafLabel }: { leafLabel?: string }) {
  const pathname = usePathname() ?? "/";

  // Strip route group parens, drop empties, drop trailing slashes
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((seg) => !seg.startsWith("("));

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const isLast = i === segments.length - 1;
    const label = isLast && leafLabel ? leafLabel : prettyLabelFor(seg);
    return { href, label, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb) => (
          <BreadcrumbItem key={crumb.href}>
            {crumb.isLast ? (
              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
