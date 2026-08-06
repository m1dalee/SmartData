import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { TopExpense } from "@/lib/types";
import { ChevronRight } from "lucide-react";

export function TopExpenses({ expenses }: { expenses: TopExpense[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Plus grosses dépenses</CardTitle>
          <CardDescription>Top 5 du mois · cliquez pour classer</CardDescription>
        </div>
        <Link href="/transactions" className="text-sm font-semibold text-brand hover:underline">
          Tout voir
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {expenses.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucune dépense ce mois.</p>
        ) : (
          expenses.map((expense, index) => (
            <Link
              key={expense.id}
              href={`/transactions?id=${expense.id}`}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-brand/30 hover:bg-brand/5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-600">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{expense.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString("fr-FR")}
                  {expense.categoryName && (
                    <>
                      {" · "}
                      <span style={{ color: expense.categoryColor ?? undefined }}>{expense.categoryName}</span>
                    </>
                  )}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-rose-600">-{formatCurrency(expense.amount)}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
