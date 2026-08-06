import { AppNav } from "@/components/app-nav";
import { BudgetForm, SavingsGoalsSection } from "@/components/budgets/savings-goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategories } from "@/app/actions/transactions";
import { getSavingsGoals } from "@/app/actions/budgets";

export default async function BudgetsPage() {
  const categories = await getCategories();
  const goals = await getSavingsGoals();

  return (
    <div className="min-h-screen">
      <AppNav currentPath="/budgets" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets & épargne</h1>
          <p className="text-muted-foreground">Planifiez vos dépenses et suivez vos objectifs</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Budget mensuel par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetForm categories={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objectifs d&apos;épargne</CardTitle>
          </CardHeader>
          <CardContent>
            <SavingsGoalsSection goals={goals} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
