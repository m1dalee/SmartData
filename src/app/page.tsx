import { AppShell } from "@/components/app-shell";
import { BalanceHero } from "@/components/dashboard/balance-hero";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { MainGoalCard } from "@/components/dashboard/main-goal-card";
import { MonthlyRecapTable } from "@/components/dashboard/monthly-recap-table";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { StatusTiles } from "@/components/dashboard/status-tiles";
import { TopExpenses } from "@/components/dashboard/top-expenses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCategories, getTransactions, getUncategorizedCount } from "@/app/actions/transactions";
import { getDashboardStats } from "@/lib/stats";
import { syncMainGoalWithSavings } from "@/lib/savings-goal";
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
  const uncategorizedCount = await getUncategorizedCount();

  return (
    <AppShell
      title="Ma synthèse"
      subtitle="Vue d'ensemble de vos finances"
      action={<MonthPicker month={stats.month} />}
    >
      <div className="space-y-4">
        <BalanceHero
          totalBalance={stats.totalBalance}
          income={stats.income}
          expenses={stats.expenses}
          savings={stats.savings}
          savingsRate={stats.savingsRate}
          comparison={stats.comparison}
        />

        <StatusTiles insights={stats.insights} uncategorizedCount={uncategorizedCount} />

        <div className="grid gap-4 lg:grid-cols-2">
          <CategoryChart
            data={stats.categoryBreakdown}
            income={stats.income}
            expenses={stats.expenses}
          />
          <SpendingChart data={stats.last12Months} />
        </div>

        <CashflowChart data={stats.last12Months} />

        <div className="grid gap-4 lg:grid-cols-2">
          <MainGoalCard {...mainGoal} />
          <InsightsPanel insights={stats.insights} averages={stats.averages} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TopExpenses expenses={stats.topExpenses} />
          {(stats.monthBudgets.length > 0 || stats.goals.length > 0) && (
            <div className="space-y-4">
              {stats.monthBudgets.length > 0 && (
                <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
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
                            <span className={over ? "font-medium text-money-out" : "text-muted-foreground"}>
                              {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                            </span>
                          </div>
                          <Progress value={progress} className={over ? "[&>div]:bg-money-out" : "[&>div]:bg-brand"} />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {stats.goals.length > 0 && (
                <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
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
                          <Progress value={progress} className="[&>div]:bg-money-in" />
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
        </div>

        <MonthlyRecapTable data={stats.last12Months} />

        <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Cliquez pour catégoriser un paiement</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity rows={recentTransactions} categories={categories} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
