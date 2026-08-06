"use client";

import { useState, useTransition } from "react";
import { createBudget, createSavingsGoal } from "@/app/actions/budgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Category, SavingsGoal } from "@/lib/db/schema";
import { formatCurrency, getCurrentMonth } from "@/lib/format";
import { MAIN_SAVINGS_GOAL } from "@/lib/savings-goal-constants";

export function SavingsGoalsSection({ goals }: { goals: SavingsGoal[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <form
        action={(formData) => startTransition(async () => createSavingsGoal(formData))}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Objectif d&apos;épargne</Label>
          <Input id="name" name="name" placeholder="Ex: Vacances, Apport immo..." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetAmount">Montant cible (€)</Label>
          <Input id="targetAmount" name="targetAmount" type="number" step="0.01" min="0" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentAmount">Déjà épargné (€)</Label>
          <Input id="currentAmount" name="currentAmount" type="number" step="0.01" min="0" defaultValue="0" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="deadline">Échéance (optionnel)</Label>
          <Input id="deadline" name="deadline" type="date" />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            Ajouter l&apos;objectif
          </Button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isMain = goal.name === MAIN_SAVINGS_GOAL.name;
          return (
            <Card key={goal.id} className={isMain ? "border-emerald-300 bg-emerald-50/30" : undefined}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {goal.name}
                  {isMain && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-normal text-white">
                      Sync auto
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{formatCurrency(goal.currentAmount)}</span>
                  <span className="text-muted-foreground">sur {formatCurrency(goal.targetAmount)}</span>
                </div>
                <Progress value={progress} className={isMain ? "h-3 [&>div]:bg-emerald-600" : undefined} />
                {isMain && (
                  <p className="text-xs text-muted-foreground">
                    Mis à jour depuis vos revenus − dépenses (toutes transactions)
                  </p>
                )}
                {goal.deadline && (
                  <p className="text-xs text-muted-foreground">
                    Échéance : {new Date(goal.deadline).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function BudgetForm({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState("");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <form
      action={(formData) => startTransition(async () => createBudget(formData))}
      className="grid gap-4 sm:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="month">Mois</Label>
        <Input id="month" name="month" type="month" defaultValue={getCurrentMonth()} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Catégorie</Label>
        <input type="hidden" name="categoryId" value={categoryId} />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="categoryId">
            <SelectValue placeholder="Choisir..." />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Budget (€)</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
      </div>
      <div className="sm:col-span-3">
        <Button type="submit" disabled={pending || !categoryId}>
          Définir le budget
        </Button>
      </div>
    </form>
  );
}
