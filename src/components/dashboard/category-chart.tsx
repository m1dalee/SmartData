"use client";

import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";
import type { CategoryBreakdown } from "@/lib/types";

export function CategoryChart({
  data,
  income,
  expenses,
}: {
  data: CategoryBreakdown[];
  income: number;
  expenses: number;
}) {
  const top = data.slice(0, 5);

  return (
    <article className="animate-fade-up stagger-3 flex h-full flex-col rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">Mon budget</h2>
          <p className="text-sm text-muted-foreground">Répartition du mois</p>
        </div>
        <Link href="/budgets" className="text-xs font-semibold text-brand hover:underline">
          Gérer
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-muted/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">Mes revenus</p>
          <p className="font-bold text-money-in">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-xl bg-muted/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">Mes dépenses</p>
          <p className="font-bold text-money-out">{formatCurrency(expenses)}</p>
        </div>
      </div>

      {top.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Aucune dépense ce mois-ci.
        </div>
      ) : (
        <div className="grid flex-1 items-center gap-4 sm:grid-cols-[1fr_1.1fr]">
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={top}
                  dataKey="total"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {top.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} €`, ""]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </span>
              <span className="text-sm font-bold">{formatCurrency(expenses)}</span>
            </div>
          </div>

          <ul className="space-y-2.5">
            {top.map((cat) => (
              <li key={cat.categoryId}>
                <Link
                  href={`/transactions?category=${cat.categoryId}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-1 py-0.5 transition hover:bg-muted/60"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate text-sm font-medium">{cat.categoryName}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatCurrency(cat.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
