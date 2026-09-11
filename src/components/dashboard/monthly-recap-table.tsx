import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatShortMonth } from "@/lib/format";
import type { MonthlySummary } from "@/lib/types";

export function MonthlyRecapTable({ data }: { data: MonthlySummary[] }) {
  const rows = [...data].reverse();
  const hasData = data.some((m) => m.income > 0 || m.expenses > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Récapitulatif 12 mois</CardTitle>
        <CardDescription>Vue mensuelle détaillée, style relevé bancaire enrichi</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucune donnée sur la période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Mois</th>
                  <th className="pb-3 pr-4 font-medium text-right">Revenus</th>
                  <th className="pb-3 pr-4 font-medium text-right">Dépenses</th>
                  <th className="pb-3 pr-4 font-medium text-right">Épargne</th>
                  <th className="pb-3 font-medium text-right">Taux</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.month} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4 font-medium capitalize">{formatShortMonth(row.month)}</td>
                    <td className="py-3 pr-4 text-right text-emerald-600">{formatCurrency(row.income)}</td>
                    <td className="py-3 pr-4 text-right text-rose-600">{formatCurrency(row.expenses)}</td>
                    <td
                      className={`py-3 pr-4 text-right font-medium ${row.savings >= 0 ? "text-money-in" : "text-money-out"}`}
                    >
                      {formatCurrency(row.savings)}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">{row.savingsRate.toFixed(0)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
