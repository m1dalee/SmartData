import Link from "next/link";
import { LayoutDashboard, ArrowLeftRight, Upload, PiggyBank, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/import", label: "Import banque", icon: Upload },
  { href: "/budgets", label: "Budgets & épargne", icon: PiggyBank },
];

export function AppNav({ currentPath }: { currentPath: string }) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">SmartData</span>
            <p className="hidden text-xs text-muted-foreground sm:block">Finances personnelles</p>
          </div>
        </Link>
        <nav className="hidden gap-1 md:flex">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                currentPath === href && "bg-indigo-500/10 text-indigo-700",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              currentPath === href && "bg-indigo-500/10 text-indigo-700",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
