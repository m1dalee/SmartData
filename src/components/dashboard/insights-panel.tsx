import { Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { DashboardStats, Insight } from "@/lib/types";

function InsightIcon({ type }: { type: Insight["type"] }) {
  if (type === "positive") return <TrendingUp className="h-4 w-4 text-money-in" />;
  if (type === "negative") return <TrendingDown className="h-4 w-4 text-money-out" />;
  return <Lightbulb className="h-4 w-4 text-brand" />;
}

export function InsightsPanel({
  insights,
  averages,
}: {
  insights: Insight[];
  averages: DashboardStats["averages"];
}) {
  return (
    <article className="animate-fade-up rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-4">
        <h2 className="text-base font-bold tracking-tight">Analyses</h2>
        <p className="text-sm text-muted-foreground">Résumé intelligent de votre mois</p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/70 p-3 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Moy. revenus</p>
          <p className="text-sm font-semibold text-money-in">{formatCurrency(averages.monthlyIncome)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Moy. dépenses</p>
          <p className="text-sm font-semibold text-money-out">{formatCurrency(averages.monthlyExpenses)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Moy. épargne</p>
          <p className="text-sm font-semibold text-sky-600">{formatCurrency(averages.monthlySavings)}</p>
        </div>
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-muted-foreground">Pas assez de données pour générer des analyses.</p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border/70 p-3">
              <InsightIcon type={insight.type} />
              <div>
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
