"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortMonth } from "@/lib/format";
import type { MonthlySummary } from "@/lib/types";

export function CashflowChart({ data }: { data: MonthlySummary[] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatShortMonth(item.month),
  }));

  const hasData = data.some((m) => m.income > 0 || m.expenses > 0);

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Flux de trésorerie</CardTitle>
        <CardDescription>Revenus, dépenses et épargne sur 12 mois</CardDescription>
      </CardHeader>
      <CardContent className="h-[340px]">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Importez vos transactions pour voir l&apos;évolution sur 12 mois.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} €`, ""]}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                name="Revenus"
                stroke="#22c55e"
                fill="url(#incomeGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Dépenses"
                stroke="#f43f5e"
                fill="url(#expenseGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="savings"
                name="Épargne"
                stroke="#6366f1"
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
