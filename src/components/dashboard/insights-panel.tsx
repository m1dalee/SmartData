import { Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { DashboardStats, Insight } from "@/lib/types";

function InsightIcon({ type }: { type: Insight["type"] }) {
  if (type === "positive") return <TrendingUp className="h-4 w-4 text-emerald-600" />;
  if (type === "negative") return <TrendingDown className="h-4 w-4 text-rose-600" />;
  return <Lightbulb className="h-4 w-4 text-indigo-600" />;
}

export function InsightsPanel({
  insights,
  averages,
}: {
  insights: Insight[];
  averages: DashboardStats["averages"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyses</CardTitle>
        <CardDescription>Ce que Bankin&apos; ou Revolut afficheraient en résumé</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/60 p-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Moy. revenus</p>
            <p className="text-sm font-semibold text-emerald-600">{formatCurrency(averages.monthlyIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Moy. dépenses</p>
            <p className="text-sm font-semibold text-rose-600">{formatCurrency(averages.monthlyExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Moy. épargne</p>
            <p className="text-sm font-semibold text-indigo-600">{formatCurrency(averages.monthlySavings)}</p>
          </div>
        </div>

        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas assez de données pour générer des analyses.</p>
        ) : (
          insights.map((insight, i) => (
            <div key={i} className="flex gap-3 rounded-lg border p-3">
              <InsightIcon type={insight.type} />
              <div>
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
