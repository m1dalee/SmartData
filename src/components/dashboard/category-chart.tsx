"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryBreakdown } from "@/lib/types";

export function CategoryChart({ data }: { data: CategoryBreakdown[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dépenses par catégorie</CardTitle>
        </CardHeader>
        <CardContent className="flex h-80 items-center justify-center text-muted-foreground">
          Aucune dépense ce mois-ci. Importez un CSV ou ajoutez une transaction.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dépenses par catégorie</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="categoryName"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} €`, "Total"]} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
