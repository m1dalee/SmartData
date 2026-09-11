import { AppShell } from "@/components/app-shell";
import { BudgetForm, SavingsGoalsSection } from "@/components/budgets/savings-goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategories } from "@/app/actions/transactions";
import { getSavingsGoals } from "@/app/actions/budgets";

export default async function BudgetsPage() {
  const categories = await getCategories();
  const goals = await getSavingsGoals();

  return (
    <AppShell title="Budgets & épargne" subtitle="Planifiez vos dépenses et suivez vos objectifs">
      <div className="mx-auto max-w-6xl space-y-4">
        <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Budget mensuel par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetForm categories={categories} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Objectifs d&apos;épargne</CardTitle>
          </CardHeader>
          <CardContent>
            <SavingsGoalsSection goals={goals} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
