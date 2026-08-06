import { AppNav } from "@/components/app-nav";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionsExplorer } from "@/components/transactions/transactions-explorer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoIdentifyButton } from "@/components/transactions/auto-identify-button";
import { getCategories, getTransactions, getUncategorizedCount } from "@/app/actions/transactions";
import { getUnknownPaymentCount } from "@/app/actions/categorize";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ category?: string; q?: string; uncategorized?: string; id?: string }>;
};

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categories = await getCategories();
  const rows = await getTransactions(1000);
  const uncategorizedCount = await getUncategorizedCount();
  const unknownCount = await getUnknownPaymentCount();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 to-background">
      <AppNav currentPath="/transactions" />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
            <p className="text-muted-foreground">
              Cliquez sur un paiement pour le catégoriser · {rows.length} opérations
            </p>
          </div>
          {uncategorizedCount > 0 && (
            <Link
              href="/transactions?uncategorized=1"
              className="inline-flex items-center rounded-lg bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-500/25"
            >
              {uncategorizedCount} à classer →
            </Link>
          )}
        </div>

        {unknownCount > 0 && <AutoIdentifyButton unknownCount={unknownCount} />}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ajouter manuellement</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm categories={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tous vos paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionsExplorer
              rows={rows}
              categories={categories}
              initialCategory={params.category}
              initialSearch={params.q ?? ""}
              uncategorizedOnly={params.uncategorized === "1"}
              initialTransactionId={params.id ? Number.parseInt(params.id, 10) : undefined}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
