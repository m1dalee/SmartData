"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatShortMonth } from "@/lib/format";
import type { MonthlySummary } from "@/lib/types";

export function SpendingChart({ data }: { data: MonthlySummary[] }) {
  const last6 = data.slice(-6);
  const chartData = last6.map((item) => ({
    ...item,
    label: formatShortMonth(item.month),
    spent: item.expenses,
    saved: Math.max(0, item.savings),
  }));

  const avgSavings =
    last6.length > 0 ? last6.reduce((s, m) => s + m.savings, 0) / last6.length : 0;
  const hasData = last6.some((m) => m.income > 0 || m.expenses > 0);

  return (
    <article className="animate-fade-up stagger-4 flex h-full flex-col rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">Mon épargne</h2>
          <p className="text-sm text-muted-foreground">6 derniers mois</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Moyenne / mois</p>
          <p className={`text-sm font-bold ${avgSavings >= 0 ? "text-money-in" : "text-money-out"}`}>
            {formatCurrency(avgSavings)}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-money-out" /> Dépenses
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-money-in" /> Épargne
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded bg-sky-500" /> Tendance
        </span>
      </div>

      <div className="mt-3 h-[240px] flex-1">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Importez vos transactions pour voir l&apos;épargne.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={36}
              />
              <Tooltip
                formatter={(value, name) => [
                  `${Number(value).toLocaleString("fr-FR")} €`,
                  name === "spent" ? "Dépenses" : name === "saved" ? "Épargne" : "Tendance",
                ]}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
              />
              <Bar dataKey="spent" stackId="a" fill="var(--money-out)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="saved" stackId="a" fill="var(--money-in)" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
                name="trend"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}
