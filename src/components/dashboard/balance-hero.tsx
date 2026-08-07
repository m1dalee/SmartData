import { ArrowDownRight, ArrowUpRight, PiggyBank } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

type Props = Pick<
  DashboardStats,
  "totalBalance" | "income" | "expenses" | "savings" | "savingsRate" | "comparison"
>;

function Delta({ value, invert }: { value: number; invert?: boolean }) {
  if (Math.abs(value) < 1) return null;
  const isGood = invert ? value < 0 : value > 0;
  return (
    <span className={`text-xs font-semibold ${isGood ? "text-money-in" : "text-money-out"}`}>
      {formatPercent(value)} vs mois dernier
    </span>
  );
}

export function BalanceHero({ totalBalance, income, expenses, savings, savingsRate, comparison }: Props) {
  return (
    <div className="animate-fade-up grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5 sm:col-span-2 xl:col-span-1">
        <div className="pointer-events-none absolute -right-8 top-0 h-24 w-24 rounded-full bg-brand/10 blur-2xl" />
        <p className="text-sm font-medium text-muted-foreground">Tous mes comptes</p>
        <p
          className={`mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl ${
            totalBalance >= 0 ? "text-money-in" : "text-money-out"
          }`}
        >
          {formatCurrency(totalBalance)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Solde cumulé de vos opérations</p>
      </article>

      <article className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-money-in">
            <ArrowUpRight className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">Mes revenus</span>
        </div>
        <p className="mt-3 text-2xl font-bold text-money-in">{formatCurrency(income)}</p>
        <div className="mt-1">
          <Delta value={comparison.incomeDelta} />
        </div>
      </article>

      <article className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-money-out">
            <ArrowDownRight className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">Mes dépenses</span>
        </div>
        <p className="mt-3 text-2xl font-bold text-money-out">{formatCurrency(expenses)}</p>
        <div className="mt-1">
          <Delta value={comparison.expensesDelta} invert />
        </div>
      </article>

      <article className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <PiggyBank className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">Mon épargne</span>
        </div>
        <p className={`mt-3 text-2xl font-bold ${savings >= 0 ? "text-money-in" : "text-money-out"}`}>
          {formatCurrency(savings)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{savingsRate.toFixed(0)} % du revenu</p>
      </article>
    </div>
  );
}
