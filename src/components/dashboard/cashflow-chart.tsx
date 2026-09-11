"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatShortMonth } from "@/lib/format";
import type { MonthlySummary } from "@/lib/types";

export function CashflowChart({ data }: { data: MonthlySummary[] }) {
  const last6 = data.slice(-6);
  const chartData = last6.map((item) => ({
    ...item,
    label: formatShortMonth(item.month),
    balance: item.income - item.expenses,
  }));

  const hasData = last6.some((m) => m.income > 0 || m.expenses > 0);
  const best = chartData.reduce(
    (acc, m) => (m.savings > acc.savings ? m : acc),
    chartData[0] ?? { month: "", savings: 0, label: "" },
  );
  const worst = chartData.reduce(
    (acc, m) => (m.savings < acc.savings ? m : acc),
    chartData[0] ?? { month: "", savings: 0, label: "" },
  );

  return (
    <article className="animate-fade-up stagger-5 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight">Total de mes comptes</h2>
          <p className="text-sm text-muted-foreground">Évolution de l&apos;épargne mensuelle</p>
        </div>
        {hasData ? (
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-money-in">Meilleur mois</p>
              <p className="font-bold text-money-in">{formatCurrency(best.savings)}</p>
              <p className="text-xs text-muted-foreground">{best.label}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-money-out">Plus mauvais mois</p>
              <p className="font-bold text-money-out">{formatCurrency(worst.savings)}</p>
              <p className="text-xs text-muted-foreground">{worst.label}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="h-[260px]">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Importez vos transactions pour voir l&apos;évolution.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} €`, "Épargne"]}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
              />
              <Bar
                dataKey="savings"
                name="Épargne"
                radius={[6, 6, 0, 0]}
                fill="var(--brand)"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}
