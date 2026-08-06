import { ArrowDownRight, ArrowUpRight, PiggyBank, TrendingUp } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

type Props = Pick<
  DashboardStats,
  "totalBalance" | "income" | "expenses" | "savings" | "savingsRate" | "comparison"
>;

function DeltaBadge({ value, invert }: { value: number; invert?: boolean }) {
  if (Math.abs(value) < 1) return null;
  const isGood = invert ? value < 0 : value > 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isGood ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"
      }`}
    >
      {formatPercent(value)} vs mois dernier
    </span>
  );
}

export function BalanceHero({ totalBalance, income, expenses, savings, savingsRate, comparison }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-indigo-500/20">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative space-y-6">
        <div>
          <p className="text-sm font-medium text-indigo-100">Solde cumulé</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">{formatCurrency(totalBalance)}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-indigo-100">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-xs font-medium">Revenus</span>
            </div>
            <p className="mt-2 text-xl font-semibold">{formatCurrency(income)}</p>
            <DeltaBadge value={comparison.incomeDelta} />
          </div>

          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-indigo-100">
              <ArrowDownRight className="h-4 w-4" />
              <span className="text-xs font-medium">Dépenses</span>
            </div>
            <p className="mt-2 text-xl font-semibold">{formatCurrency(expenses)}</p>
            <DeltaBadge value={comparison.expensesDelta} invert />
          </div>

          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-indigo-100">
              <PiggyBank className="h-4 w-4" />
              <span className="text-xs font-medium">Épargne</span>
            </div>
            <p className="mt-2 text-xl font-semibold">{formatCurrency(savings)}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-indigo-100">
              <TrendingUp className="h-3 w-3" />
              {savingsRate.toFixed(0)} % du revenu
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
