"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  RefreshCw,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Synthèse", icon: LayoutDashboard },
  { href: "/transactions", label: "Paiements", icon: ArrowLeftRight },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
];

type AppShellProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, subtitle, action, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-40 hidden h-screen w-[72px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <Link
          href="/"
          className="flex h-16 items-center justify-center border-b border-sidebar-border"
          aria-label="SmartData"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-lg font-extrabold tracking-tight text-brand-foreground shadow-sm shadow-brand/30 transition-transform duration-300 hover:scale-105">
            S
          </span>
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-1 py-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  "group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
                  active
                    ? "bg-brand text-brand-foreground shadow-md shadow-brand/25"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform duration-200", active && "scale-110")} />
                <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-lg transition group-hover:opacity-100 xl:block">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Red page header */}
        <header className="sticky top-0 z-30 bg-brand text-brand-foreground shadow-md shadow-brand/20">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-foreground/70">
                SmartData
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
              {subtitle ? (
                <p className="mt-0.5 truncate text-sm text-brand-foreground/80">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {action}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-brand-foreground transition hover:bg-white/20"
                aria-label="Actualiser"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 px-2 py-2 backdrop-blur md:hidden">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-brand" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 pb-24 sm:px-5 sm:py-6 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
