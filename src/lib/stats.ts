import "server-only";

import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { budgets, categories, savingsGoals, transactions } from "@/lib/db/schema";
import { calcDelta, getCurrentMonth, getMonthRange, shiftMonth } from "@/lib/format";
import { getMonthlyPlan, summarizeRealMonth } from "@/lib/monthly-plan";
import { MONEY_MOVEMENT_CATEGORY } from "@/lib/import/transfer-detector";
import { filterRealTransactions, isTransferTransaction } from "@/lib/transaction-filters";
import type {
  CategoryBreakdown,
  DashboardStats,
  Insight,
  MonthlySummary,
  TopExpense,
} from "@/lib/types";

async function loadTransactionsWithCategories() {
  const db = getDb();
  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      label: transactions.label,
      date: transactions.date,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id));

  return rows.map((row) => ({
    ...row,
    type: row.type as "expense" | "income",
  }));
}

function buildInsights(
  current: MonthlySummary,
  previous: MonthlySummary | null,
  averages: DashboardStats["averages"],
  topCategory: CategoryBreakdown | undefined,
): Insight[] {
  const insights: Insight[] = [];

  if (previous && previous.expenses > 0) {
    const expenseDelta = calcDelta(current.expenses, previous.expenses);
    if (Math.abs(expenseDelta) >= 5) {
      insights.push({
        type: expenseDelta > 0 ? "negative" : "positive",
        title: expenseDelta > 0 ? "Dépenses en hausse" : "Dépenses en baisse",
        description: `${Math.abs(expenseDelta).toFixed(0)} % par rapport au mois dernier (${previous.expenses.toFixed(0)} € → ${current.expenses.toFixed(0)} €)`,
      });
    }
  }

  if (current.savingsRate >= 0) {
    insights.push({
      type: current.savingsRate >= 20 ? "positive" : current.savingsRate >= 10 ? "neutral" : "negative",
      title: "Taux d'épargne",
      description: `${current.savingsRate.toFixed(0)} % de vos revenus épargnés ce mois-ci (hors virements)`,
    });
  }

  if (topCategory) {
    insights.push({
      type: "neutral",
      title: "Poste principal",
      description: `${topCategory.categoryName} représente ${topCategory.percent.toFixed(0)} % de vos dépenses (${topCategory.total.toFixed(0)} €)`,
    });
  }

  if (averages.monthlyExpenses > 0 && current.expenses > 0) {
    const vsAvg = calcDelta(current.expenses, averages.monthlyExpenses);
    if (Math.abs(vsAvg) >= 8) {
      insights.push({
        type: vsAvg > 0 ? "negative" : "positive",
        title: vsAvg > 0 ? "Au-dessus de votre moyenne" : "Sous votre moyenne",
        description: `Moyenne 12 mois : ${averages.monthlyExpenses.toFixed(0)} €/mois (${vsAvg > 0 ? "+" : ""}${vsAvg.toFixed(0)} % ce mois)`,
      });
    }
  }

  return insights.slice(0, 4);
}

export async function getDashboardStats(month = getCurrentMonth()): Promise<DashboardStats> {
  const db = getDb();
  const { start, end } = getMonthRange(month);

  const allWithCategories = await loadTransactionsWithCategories();
  const allTransactions = await db.select().from(transactions);
  const monthTransactions = allWithCategories.filter((t) => t.date >= start && t.date <= end);
  const realMonthTransactions = filterRealTransactions(monthTransactions);

  const income = realMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = realMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const totalBalance = allTransactions.reduce((sum, t) => sum + t.amount, 0);

  const categoryRows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      color: categories.color,
      total: sql<number>`sum(abs(${transactions.amount}))`.as("total"),
      count: sql<number>`count(${transactions.id})`.as("count"),
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.type, "expense"),
        gte(transactions.date, start),
        lte(transactions.date, end),
        ne(categories.name, MONEY_MOVEMENT_CATEGORY),
      ),
    )
    .groupBy(categories.id)
    .orderBy(desc(sql`total`));

  const categoryBreakdown: CategoryBreakdown[] = categoryRows.map((row) => ({
    ...row,
    percent: expenses > 0 ? (row.total / expenses) * 100 : 0,
  }));

  const last12Months: MonthlySummary[] = [];
  for (let i = 11; i >= 0; i--) {
    last12Months.push(summarizeRealMonth(allWithCategories, shiftMonth(month, -i)));
  }

  const monthsWithData = last12Months.filter((m) => m.income > 0 || m.expenses > 0);
  const divisor = monthsWithData.length || 1;
  const averages = {
    monthlyIncome: monthsWithData.reduce((s, m) => s + m.income, 0) / divisor,
    monthlyExpenses: monthsWithData.reduce((s, m) => s + m.expenses, 0) / divisor,
    monthlySavings: monthsWithData.reduce((s, m) => s + m.savings, 0) / divisor,
  };

  const prevMonth = shiftMonth(month, -1);
  const prevSummary = summarizeRealMonth(allWithCategories, prevMonth);
  const hasPrevData = prevSummary.income > 0 || prevSummary.expenses > 0;

  const topExpenseRows = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      label: transactions.label,
      amount: transactions.amount,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.type, "expense"),
        gte(transactions.date, start),
        lte(transactions.date, end),
      ),
    )
    .orderBy(transactions.amount)
    .limit(20);

  const topExpenses: TopExpense[] = topExpenseRows
    .filter((row) => !isTransferTransaction({ label: row.label, categoryName: row.categoryName }))
    .slice(0, 5)
    .map((row) => ({
      ...row,
      amount: Math.abs(row.amount),
    }));

  const goals = await db.select().from(savingsGoals);
  const monthBudgets = await db
    .select({ budget: budgets, category: categories })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(eq(budgets.month, month));

  const currentSummary: MonthlySummary = { month, income, expenses, savings, savingsRate };
  const monthlyPlan = await getMonthlyPlan();

  return {
    month,
    income,
    expenses,
    savings,
    savingsRate,
    totalBalance,
    transactionCount: monthTransactions.length,
    categoryBreakdown,
    last12Months,
    topExpenses,
    insights: buildInsights(currentSummary, hasPrevData ? prevSummary : null, averages, categoryBreakdown[0]),
    averages,
    comparison: {
      prevMonth: hasPrevData ? prevMonth : null,
      incomeDelta: hasPrevData ? calcDelta(income, prevSummary.income) : 0,
      expensesDelta: hasPrevData ? calcDelta(expenses, prevSummary.expenses) : 0,
      savingsDelta: hasPrevData ? calcDelta(savings, prevSummary.savings) : 0,
    },
    goals,
    monthBudgets,
    monthlyPlan,
  };
}
