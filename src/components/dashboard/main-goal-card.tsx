"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
  savingsTransfersInPeriod,
  livretDeposits,
  livretWithdrawals,
  livretNetInPeriod,
  needsBaseline,
}: MainGoalSnapshot) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [totalInput, setTotalInput] = useState(String(currentAmount > 0 ? currentAmount : 4000));

  useEffect(() => {
    if (needsBaseline && !editing) {
      setEditing(true);
    }
  }, [needsBaseline, editing]);

  const displayAmount = Math.max(0, currentAmount);
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const handleSaveTotal = () => {
    const formData = new FormData();
    formData.set("totalSavings", totalInput);
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
            <p className="text-xs text-muted-foreground">Total épargne</p>
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

        {livretDeposits > 0 && (
          <div className="rounded-xl border border-sky-200/80 bg-sky-50/80 p-3 text-xs text-sky-950">
            <p>
              Virements Livret détectés :{" "}
              <strong>{formatCurrency(livretDeposits)}</strong> vers ton Livret
              {livretWithdrawals > 0 && (
                <>
                  , <strong>{formatCurrency(livretWithdrawals)}</strong> revenus
                </>
              )}
              .
            </p>
            <p className="mt-1 text-sky-800">
              Net période : {formatCurrency(livretNetInPeriod)} — le solde Livret (ex. 4 000 €) n&apos;est
              pas dans le CSV, indique-le ci-dessous.
            </p>
          </div>
        )}

        {remaining > 0 ? (
          <p className="text-sm text-muted-foreground">
            Plus que <strong className="text-foreground">{formatCurrency(remaining)}</strong> pour les 30K
          </p>
        ) : (
          <p className="text-sm font-semibold text-money-in">Objectif 30 000 € atteint !</p>
        )}

        <div className="space-y-2 rounded-xl border border-border/80 bg-background/60 p-3">
          {needsBaseline && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Ton Livret n&apos;apparaît pas dans le CSV du compte courant. Indique ton{" "}
              <strong>solde épargne total</strong> (ex. 4 000 €) pour un suivi correct.
            </div>
          )}

          {editing ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Mon épargne totale (Livret + LDD…)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalInput}
                  onChange={(e) => setTotalInput(e.target.value)}
                  placeholder="Ex: 4000"
                />
                <Button size="sm" onClick={handleSaveTotal} disabled={pending}>
                  Enregistrer
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Mon épargne totale : {formatCurrency(displayAmount)} — corriger
            </Button>
          )}

          {startingAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Dont {formatCurrency(startingAmount)} déjà épargnés avant le suivi CSV +{" "}
              {formatCurrency(periodSavings)} calculés depuis l&apos;import
            </p>
          )}

          {savingsTransfersInPeriod > 0 && livretDeposits === 0 && (
            <p className="text-xs text-muted-foreground">
              Versements épargne détectés : {formatCurrency(savingsTransfersInPeriod)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
