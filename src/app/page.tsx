import { AppNav } from "@/components/app-nav";
import { BalanceHero } from "@/components/dashboard/balance-hero";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { CategoryBars } from "@/components/dashboard/category-bars";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { MonthlyRecapTable } from "@/components/dashboard/monthly-recap-table";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TopExpenses } from "@/components/dashboard/top-expenses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCategories, getTransactions } from "@/app/actions/transactions";
import { getDashboardStats } from "@/lib/stats";
import { syncMainGoalWithSavings } from "@/lib/savings-goal";
import { MainGoalCard } from "@/components/dashboard/main-goal-card";
import { formatCurrency, getCurrentMonth } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : getCurrentMonth();
  const stats = await getDashboardStats(month);
  const mainGoal = await syncMainGoalWithSavings();
  const categories = await getCategories();
  const recentTransactions = await getTransactions(6);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-background">
      <AppNav currentPath="/" />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-muted-foreground">Vue d&apos;ensemble de vos finances</p>
          </div>
          <MonthPicker month={stats.month} />
        </div>

        <BalanceHero
          totalBalance={stats.totalBalance}
          income={stats.income}
          expenses={stats.expenses}
          savings={stats.savings}
          savingsRate={stats.savingsRate}
          comparison={stats.comparison}
        />

        <MainGoalCard {...mainGoal} />

        <div className="grid gap-6 lg:grid-cols-3">
          <CashflowChart data={stats.last12Months} />
          <InsightsPanel insights={stats.insights} averages={stats.averages} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryBars data={stats.categoryBreakdown} totalExpenses={stats.expenses} />
          <TopExpenses expenses={stats.topExpenses} />
        </div>

        <MonthlyRecapTable data={stats.last12Months} />

        {(stats.monthBudgets.length > 0 || stats.goals.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {stats.monthBudgets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Budgets du mois</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.monthBudgets.map(({ budget, category }) => {
                    const spent =
                      stats.categoryBreakdown.find((c) => c.categoryId === category.id)?.total ?? 0;
                    const progress = Math.min(100, (spent / budget.amount) * 100);
                    const over = spent > budget.amount;
                    return (
                      <div key={budget.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{category.name}</span>
                          <span className={over ? "font-medium text-rose-600" : "text-muted-foreground"}>
                            {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                          </span>
                        </div>
                        <Progress value={progress} className={over ? "[&>div]:bg-rose-500" : undefined} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {stats.goals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Objectifs d&apos;épargne</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.goals.map((goal) => {
                    const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-muted-foreground">{progress.toFixed(0)} %</span>
                        </div>
                        <Progress value={progress} />
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(goal.currentAmount)} sur {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Cliquez pour catégoriser un paiement</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity rows={recentTransactions} categories={categories} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
