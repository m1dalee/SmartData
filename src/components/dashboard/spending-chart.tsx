"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlySummary } from "@/lib/types";

export function SpendingChart({ data }: { data: MonthlySummary[] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: item.month.slice(5) + "/" + item.month.slice(2, 4),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution sur 6 mois</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={(v) => `${v}€`} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} €`, ""]} />
            <Legend />
            <Bar dataKey="income" name="Revenus" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Dépenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="savings" name="Épargne" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
