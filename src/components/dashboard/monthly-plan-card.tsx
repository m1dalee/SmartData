"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDownRight, CalendarClock, PiggyBank, Wallet } from "lucide-react";
import { updateMonthlyBudgetSettings } from "@/app/actions/monthly-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { MonthlyPlan } from "@/lib/monthly-plan";

export function MonthlyPlanCard(plan: MonthlyPlan) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [salaryInput, setSalaryInput] = useState(String(plan.monthlySalaryNet));
  const [voucherInput, setVoucherInput] = useState(String(plan.mealVoucherAmount));
  const [savingsInput, setSavingsInput] = useState(String(plan.monthlySavingsTarget));

  const remainingPositive = plan.remainingBeforePayday >= 0;
  const spentPercent =
    plan.spendingEnvelope > 0
      ? Math.min(100, (plan.expenses / plan.spendingEnvelope) * 100)
      : 0;

  const handleSave = () => {
    const formData = new FormData();
    formData.set("monthlySalaryNet", salaryInput);
    formData.set("mealVoucherAmount", voucherInput);
    formData.set("monthlySavingsTarget", savingsInput);
    startTransition(async () => {
      const result = await updateMonthlyBudgetSettings(formData);
      if (result.success) setEditing(false);
      router.refresh();
    });
  };

  return (
    <article className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand to-[oklch(0.48_0.2_25)] p-6 text-brand-foreground shadow-lg shadow-brand/25">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-foreground/70">
              Avant la prochaine paye
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight">Mon budget du mois</h2>
            <p className="text-sm leading-relaxed text-brand-foreground/90">
              Sur vos <strong>{formatCurrency(plan.monthlySalaryNet)}</strong> de salaire net
              {plan.mealVoucherAmount > 0 && (
                <>
                  {" "}
                  (+ <strong>{formatCurrency(plan.mealVoucherAmount)}</strong> tickets resto)
                </>
              )}
              , vous avez dépensé <strong>{formatCurrency(plan.expenses)}</strong> ce mois.
              <br />
              <strong>{formatCurrency(plan.monthlySavingsTarget)}</strong> sont réservés pour
              l&apos;épargne.
            </p>
            {plan.transfersExcluded > 0 && (
              <p className="text-xs text-brand-foreground/70">
                {plan.transfersExcluded} virement{plan.transfersExcluded > 1 ? "s" : ""} exclu
                {plan.transfersExcluded > 1 ? "s" : ""} du calcul
              </p>
            )}
          </div>

          <div className="shrink-0 rounded-xl bg-white/15 px-5 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-brand-foreground/90">
              <CalendarClock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {remainingPositive ? "Il vous reste" : "Dépassement de"}
              </span>
            </div>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">
              {formatCurrency(Math.abs(plan.remainingBeforePayday))}
            </p>
            <p className="mt-1 text-xs text-brand-foreground/80">
              {remainingPositive
                ? "avant la prochaine paye"
                : "par rapport à votre enveloppe du mois"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-brand-foreground/85">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">Salaire net</span>
            </div>
            <p className="mt-2 text-xl font-bold">{formatCurrency(plan.monthlySalaryNet)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-brand-foreground/85">
              <PiggyBank className="h-4 w-4" />
              <span className="text-xs font-medium">Épargne réservée</span>
            </div>
            <p className="mt-2 text-xl font-bold">{formatCurrency(plan.monthlySavingsTarget)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-brand-foreground/85">
              <ArrowDownRight className="h-4 w-4" />
              <span className="text-xs font-medium">Dépensé ce mois</span>
            </div>
            <p className="mt-2 text-xl font-bold">{formatCurrency(plan.expenses)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-brand-foreground/85">Enveloppe du mois</p>
            <p className="mt-2 text-xl font-bold">{formatCurrency(plan.spendingEnvelope)}</p>
            <p className="mt-1 text-[11px] text-brand-foreground/70">
              après épargne ({formatCurrency(plan.totalMonthlyIncome)} −{" "}
              {formatCurrency(plan.monthlySavingsTarget)})
            </p>
          </div>
        </div>

        {plan.spendingEnvelope > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-brand-foreground/80">
              <span>Dépensé {spentPercent.toFixed(0)} % de l&apos;enveloppe</span>
              <span>
                {formatCurrency(plan.expenses)} / {formatCurrency(plan.spendingEnvelope)}
              </span>
            </div>
            <Progress
              value={spentPercent}
              className={`h-2.5 bg-white/20 ${plan.isOverBudget ? "[&>div]:bg-rose-300" : "[&>div]:bg-amber-200"}`}
            />
          </div>
        )}

        <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Mes revenus & objectif épargne</p>
            {!editing && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditing(true)}
                className="bg-white/20 text-brand-foreground hover:bg-white/30"
              >
                Modifier
              </Button>
            )}
          </div>

          {editing ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1 text-xs">
                <span>Salaire net (€)</span>
                <Input
                  type="number"
                  min="0"
                  step="10"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  className="border-white/30 bg-white/90 text-foreground"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span>Tickets resto (€)</span>
                <Input
                  type="number"
                  min="0"
                  step="10"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  className="border-white/30 bg-white/90 text-foreground"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span>Épargne / mois (€)</span>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={savingsInput}
                  onChange={(e) => setSavingsInput(e.target.value)}
                  className="border-white/30 bg-white/90 text-foreground"
                />
              </label>
              <div className="flex gap-2 sm:col-span-3">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={pending}
                  className="bg-white text-brand hover:bg-white/90"
                >
                  {pending ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  className="text-brand-foreground hover:bg-white/10"
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brand-foreground/85">
              {formatCurrency(plan.monthlySalaryNet)} salaire +{" "}
              {formatCurrency(plan.mealVoucherAmount)} tickets −{" "}
              {formatCurrency(plan.monthlySavingsTarget)} épargne ={" "}
              <strong>{formatCurrency(plan.spendingEnvelope)}</strong> pour vivre ce mois.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
