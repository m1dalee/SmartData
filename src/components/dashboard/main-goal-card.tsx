"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setMainGoalTotalSavings } from "@/app/actions/main-goal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import type { MainGoalSnapshot } from "@/lib/savings-goal";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

export function MainGoalCard({
  currentAmount,
  targetAmount,
  progress,
  remaining,
  startingAmount,
  periodSavings,
  monthlySavings,
}: MainGoalSnapshot) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [totalInput, setTotalInput] = useState(
    currentAmount > 0 ? String(currentAmount) : monthlySavings > 0 ? String(monthlySavings) : "",
  );

  const displayAmount = Math.max(0, currentAmount);
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const needsSetup = displayAmount <= 0 && monthlySavings > 0;

  const handleSaveTotal = () => {
    const formData = new FormData();
    formData.set("totalSavings", totalInput);
    startTransition(async () => {
      await setMainGoalTotalSavings(formData);
      setEditing(false);
      router.refresh();
    });
  };

  const applyMonthlyAsTotal = () => {
    setTotalInput(String(monthlySavings));
    const formData = new FormData();
    formData.set("totalSavings", String(monthlySavings));
    startTransition(async () => {
      await setMainGoalTotalSavings(formData);
      setEditing(false);
      router.refresh();
    });
  };

  return (
    <article className="animate-fade-up stagger-6 relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-money-in/10 blur-2xl" />

      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-money-in text-white shadow-sm">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Objectif épargne</p>
              <h2 className="text-xl font-extrabold tracking-tight">30 000 €</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-money-in">{clampedProgress.toFixed(1)} %</p>
            <p className="text-xs text-muted-foreground">Sync auto</p>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={clampedProgress} className="h-3 bg-muted [&>div]:bg-money-in" />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-money-in">{formatCurrency(displayAmount)} épargnés</span>
            <span className="text-muted-foreground">Objectif {formatCurrency(targetAmount)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="text-xs text-muted-foreground">Épargne ce mois</p>
            <p className={`font-bold ${monthlySavings >= 0 ? "text-money-in" : "text-money-out"}`}>
              {formatCurrency(monthlySavings)}
            </p>
          </div>
          <div className="rounded-xl bg-muted/70 p-3">
            <p className="text-xs text-muted-foreground">Depuis vos imports</p>
            <p className={`font-bold ${periodSavings >= 0 ? "text-money-in" : "text-money-out"}`}>
              {formatCurrency(periodSavings)}
            </p>
          </div>
        </div>

        {remaining > 0 ? (
          <p className="text-sm text-muted-foreground">
            Plus que <strong className="text-foreground">{formatCurrency(remaining)}</strong> pour les 30K
          </p>
        ) : (
          <p className="text-sm font-semibold text-money-in">Objectif 30 000 € atteint !</p>
        )}

        <div className="space-y-2 rounded-xl border border-border/80 bg-background/60 p-3">
          {needsSetup && !editing && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p>
                Vous épargnez <strong>{formatCurrency(monthlySavings)}</strong> ce mois, mais l&apos;objectif
                30K suit votre <strong>épargne totale</strong>.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-amber-300 bg-white"
                onClick={applyMonthlyAsTotal}
                disabled={pending}
              >
                J&apos;ai {formatCurrency(monthlySavings)} d&apos;épargne au total
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Indiquez combien vous avez épargné au total. L&apos;app ajuste automatiquement le point de départ
            par rapport à vos imports bancaires.
          </p>

          {editing ? (
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                placeholder="Ex: 826"
              />
              <Button size="sm" onClick={handleSaveTotal} disabled={pending}>
                OK
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Épargne totale : {formatCurrency(displayAmount)} — modifier
            </Button>
          )}

          {startingAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Ajustement interne : {formatCurrency(startingAmount)} avant le suivi importé
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
