import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { CategoryBreakdown } from "@/lib/types";
import { ChevronRight } from "lucide-react";

export function CategoryBars({ data, totalExpenses }: { data: CategoryBreakdown[]; totalExpenses: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dépenses par catégorie</CardTitle>
        <CardDescription>
          {totalExpenses > 0
            ? `${formatCurrency(totalExpenses)} · cliquez pour voir les paiements`
            : "Aucune dépense ce mois-ci"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Les catégories apparaîtront après import ou saisie.
          </p>
        ) : (
          data.slice(0, 8).map((cat) => (
            <Link
              key={cat.categoryId}
              href={`/transactions?category=${cat.categoryId}`}
              className="group block space-y-2 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium group-hover:text-brand">{cat.categoryName}</span>
                  <span className="text-muted-foreground">({cat.count})</span>
                </div>
                <div className="flex items-center gap-1 text-right">
                  <span className="font-semibold">{formatCurrency(cat.total)}</span>
                  <span className="text-muted-foreground">{cat.percent.toFixed(0)} %</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
              <Progress value={cat.percent} className="h-2" />
            </Link>
          ))
        )}
        {data.length > 0 && (
          <Link href="/transactions" className="block pt-2 text-center text-sm font-semibold text-brand hover:underline">
            Gérer tous les paiements →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
