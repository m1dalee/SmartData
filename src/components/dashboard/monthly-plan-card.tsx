"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDownRight, ArrowUpRight, PartyPopper, PiggyBank, Sparkles } from "lucide-react";
import { updateMonthlySavingsTarget } from "@/app/actions/monthly-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { MonthlyPlan } from "@/lib/monthly-plan";

export function MonthlyPlanCard(plan: MonthlyPlan) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [targetInput, setTargetInput] = useState(
    plan.monthlySavingsTarget > 0 ? String(plan.monthlySavingsTarget) : "",
  );

  const hasIncome = plan.income > 0;
  const pleasuresPositive = plan.pleasuresRemaining >= 0;
  const spentShare = plan.income > 0 ? (plan.expenses / plan.income) * 100 : 0;
  const savingsShare = plan.income > 0 ? (plan.monthlySavingsTarget / plan.income) * 100 : 0;
  const pleasuresShare = plan.income > 0 ? Math.max(0, (plan.pleasuresRemaining / plan.income) * 100) : 0;

  const handleSaveTarget = () => {
    const formData = new FormData();
    formData.set("monthlySavingsTarget", targetInput || "0");
    startTransition(async () => {
      await updateMonthlySavingsTarget(formData);
      setEditing(false);
      router.refresh();
    });
  };

  return (
    <article className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand to-[oklch(0.48_0.2_25)] p-6 text-brand-foreground shadow-lg shadow-brand/25">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-foreground/70">
              Mon mois · hors virements
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Budget du mois</h2>
            {plan.transfersExcluded > 0 && (
              <p className="mt-1 text-xs text-brand-foreground/75">
                {plan.transfersExcluded} virement{plan.transfersExcluded > 1 ? "s" : ""} exclu
                {plan.transfersExcluded > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
            {hasIncome ? (
              pleasuresPositive ? (
                <>
                  <div className="flex items-center gap-2 text-brand-foreground/90">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">Plaisirs restants</span>
                  </div>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight">
                    {formatCurrency(plan.pleasuresRemaining)}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-brand-foreground/90">
                    <PartyPopper className="h-4 w-4" />
                    <span className="text-sm font-medium">Budget dépassé</span>
                  </div>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight">
                    {formatCurrency(Math.abs(plan.pleasuresRemaining))}
                  </p>
                  <p className="text-xs text-brand-foreground/80">au-delà de votre enveloppe</p>
                </>
              )
            ) : (
              <p className="text-sm text-brand-foreground/85">
                Importez vos transactions pour voir votre budget plaisirs.
              </p>
            )}
          </div>
        </div>

        {hasIncome && (
          <p className="text-sm text-brand-foreground/90">
            {pleasuresPositive ? (
              <>
                Il vous reste <strong>{formatCurrency(plan.pleasuresRemaining)}</strong> pour les plaisirs du
                mois, après épargne et dépenses.
              </>
            ) : (
              <>
                Vous avez dépassé votre enveloppe de{" "}
                <strong>{formatCurrency(Math.abs(plan.pleasuresRemaining))}</strong> ce mois-ci.
              </>
            )}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-brand-foreground/85">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-xs font-medium">Entrées</span>
            </div>
            <p className="mt-2 text-xl font-bold">{formatCurrency(plan.income)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-brand-foreground/85">
              <ArrowDownRight className="h-4 w-4" />
              <span className="text-xs font-medium">Sorties</span>
            </div>
            <p className="mt-2 text-xl font-bold">{formatCurrency(plan.expenses)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-brand-foreground/85">
              <PiggyBank className="h-4 w-4" />
              <span className="text-xs font-medium">Épargne réelle</span>
            </div>
            <p className={`mt-2 text-xl font-bold ${plan.actualSavings >= 0 ? "" : "text-rose-200"}`}>
              {formatCurrency(plan.actualSavings)}
            </p>
          </div>
        </div>

        {hasIncome && plan.income > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-brand-foreground/80">
              <span>Dépenses {spentShare.toFixed(0)} %</span>
              <span>Objectif épargne {savingsShare.toFixed(0)} %</span>
              <span>Plaisirs {pleasuresShare.toFixed(0)} %</span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="bg-rose-300/90 transition-all"
                style={{ width: `${Math.min(100, spentShare)}%` }}
              />
              <div
                className="bg-emerald-300/90 transition-all"
                style={{ width: `${Math.min(100 - spentShare, savingsShare)}%` }}
              />
              <div
                className="bg-amber-200/90 transition-all"
                style={{ width: `${Math.max(0, pleasuresShare)}%` }}
              />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Objectif d&apos;épargne mensuel</p>
              <p className="text-xs text-brand-foreground/75">
                Montant à mettre de côté avant les plaisirs
              </p>
            </div>
            {editing ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="10"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="Ex: 300"
                  className="w-28 border-white/30 bg-white/90 text-foreground"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSaveTarget}
                  disabled={pending}
                  className="bg-white text-brand hover:bg-white/90"
                >
                  OK
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditing(true)}
                className="bg-white/20 text-brand-foreground hover:bg-white/30"
              >
                {plan.monthlySavingsTarget > 0
                  ? `${formatCurrency(plan.monthlySavingsTarget)} / mois — modifier`
                  : "Définir mon objectif"}
              </Button>
            )}
          </div>

          {plan.monthlySavingsTarget > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-brand-foreground/80">Progression épargne</span>
                <span className="font-semibold">
                  {formatCurrency(Math.max(0, plan.actualSavings))} /{" "}
                  {formatCurrency(plan.monthlySavingsTarget)}
                </span>
              </div>
              <Progress
                value={Math.min(
                  100,
                  plan.monthlySavingsTarget > 0
                    ? (Math.max(0, plan.actualSavings) / plan.monthlySavingsTarget) * 100
                    : 0,
                )}
                className="h-2 bg-white/20 [&>div]:bg-emerald-300"
              />
              {plan.savingsTargetMet ? (
                <p className="text-xs text-emerald-200">Objectif d&apos;épargne atteint ce mois-ci</p>
              ) : plan.actualSavings > 0 ? (
                <p className="text-xs text-brand-foreground/75">
                  Plus que {formatCurrency(plan.monthlySavingsTarget - plan.actualSavings)} pour l&apos;objectif
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
