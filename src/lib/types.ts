import type { Budget, Category, SavingsGoal } from "@/lib/db/schema";

export type MonthlySummary = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
};

export type CategoryBreakdown = {
  categoryId: number;
  categoryName: string;
  color: string;
  total: number;
  count: number;
  percent: number;
};

export type TopExpense = {
  id: number;
  date: string;
  label: string;
  amount: number;
  categoryName: string | null;
  categoryColor: string | null;
};

export type Insight = {
  type: "positive" | "negative" | "neutral";
  title: string;
  description: string;
};

export type DashboardStats = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  totalBalance: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
  last12Months: MonthlySummary[];
  topExpenses: TopExpense[];
  insights: Insight[];
  averages: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
  };
  comparison: {
    prevMonth: string | null;
    incomeDelta: number;
    expensesDelta: number;
    savingsDelta: number;
  };
  goals: SavingsGoal[];
  monthBudgets: { budget: Budget; category: Category }[];
};
