"use client";

import { Fragment } from "react";
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

function prettyLabelFor(segment: string, parent: string | undefined): string {
  if (STATIC_LABELS[segment]) return STATIC_LABELS[segment];
  if (LOOKS_LIKE_UUID.test(segment)) {
    // Context-aware UUID formatting: only Q- for /quotes/[id]; other UUIDs
    // (like /customers/[id]) get a neutral 8-char slug.
    const slug = segment.slice(0, 8).toUpperCase();
    if (parent === "quotes") return `Q-${slug}`;
    if (parent === "customers") return slug;
    return slug;
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
    const parent = i > 0 ? segments[i - 1] : undefined;
    const label = isLast && leafLabel ? leafLabel : prettyLabelFor(seg, parent);
    return { href, label, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.href}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {i < crumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
