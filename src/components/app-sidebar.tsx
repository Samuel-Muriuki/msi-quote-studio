"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  ListChecks,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** match exact path, otherwise prefix-match. */
  exact?: boolean;
  /** Disabled (route not built yet) — visible but not clickable. */
  comingSoon?: boolean;
  /** Optional sub-items rendered under the parent when prefix-matched. */
  children?: { href: string; label: string }[];
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    href: "/quotes",
    label: "Quotes",
    icon: ListChecks,
    children: [{ href: "/quotes/new", label: "New quote" }],
  },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

const SECONDARY_NAV: NavItem[] = [];

function isActive(href: string, pathname: string, exact: boolean | undefined) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const pathname = usePathname() ?? "";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-1.5 font-heading text-base font-semibold tracking-tight"
        >
          <BrandMark className="size-7" />
          <span className="group-data-[collapsible=icon]:hidden">
            <span className="text-text">MSI</span>{" "}
            <span className="text-accent">Quote</span>{" "}
            <span className="text-text">Studio</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PRIMARY_NAV.map((item) => {
                const active = isActive(item.href, pathname, item.exact);
                const Icon = item.icon;
                // Show sub-items when the parent prefix is matched OR a child is active.
                const hasActiveChild = item.children?.some((c) =>
                  isActive(c.href, pathname, true),
                );
                const showChildren = Boolean(
                  item.children && (active || hasActiveChild),
                );
                // Parent is highlighted only when the user is on the parent itself,
                // never when they're on a child route (the child gets its own
                // highlight). exact-match catches /quotes; the prefix match would
                // otherwise also highlight on /quotes/new.
                const parentActive = item.children
                  ? pathname === item.href
                  : active;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={parentActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                      className={
                        parentActive
                          ? "bg-accent/15 text-accent font-semibold shadow-[inset_2px_0_0_0_var(--accent)] hover:bg-accent/20 data-active:bg-accent/15 data-active:text-accent"
                          : undefined
                      }
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {showChildren && (
                      <SidebarMenuSub>
                        {item.children!.map((child) => {
                          const childActive = isActive(child.href, pathname, true);
                          return (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton
                                isActive={childActive}
                                render={<Link href={child.href} />}
                                className={
                                  childActive
                                    ? "bg-accent/15 text-accent font-semibold shadow-[inset_2px_0_0_0_var(--accent)] hover:bg-accent/20 data-active:bg-accent/15 data-active:text-accent"
                                    : undefined
                                }
                              >
                                <span>{child.label}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {SECONDARY_NAV.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Coming next</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {SECONDARY_NAV.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          tooltip={`${item.label} — coming next`}
                          disabled
                          className="cursor-not-allowed opacity-60"
                        >
                          <Icon />
                          <span>{item.label}</span>
                          <span className="ml-auto rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted group-data-[collapsible=icon]:hidden">
                            Soon
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-medium text-text">{user.name}</p>
            <p className="truncate text-[10px] text-text-muted">{user.email}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
