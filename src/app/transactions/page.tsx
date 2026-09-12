import { AppShell } from "@/components/app-shell";
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
    <AppShell
      title="Mes paiements"
      subtitle={`${rows.length} opérations · cliquez pour catégoriser`}
      action={
        uncategorizedCount > 0 ? (
          <Link
            href="/transactions?uncategorized=1"
            className="inline-flex items-center rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-brand-foreground backdrop-blur-sm transition hover:bg-white/25"
          >
            {uncategorizedCount} à classer
          </Link>
        ) : undefined
      }
    >
      <div className="mx-auto max-w-4xl space-y-4">
        {unknownCount > 0 && <AutoIdentifyButton unknownCount={unknownCount} />}

        <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle className="text-base">Ajouter manuellement</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm categories={categories} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
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
      </div>
    </AppShell>
  );
}
