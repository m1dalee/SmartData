"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronDown,
  CreditCard,
  PiggyBank,
  Settings2,
  Wallet,
} from "lucide-react";
import {
  updateMonthlyBudgetSettings,
  updateProvisionalCardSpending,
} from "@/app/actions/monthly-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { MonthlyPlan } from "@/lib/monthly-plan";

export function MonthlyPlanCard(plan: MonthlyPlan) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(false);
  const [salaryInput, setSalaryInput] = useState(String(plan.monthlySalaryNet));
  const [voucherInput, setVoucherInput] = useState(String(plan.mealVoucherAmount));
  const [savingsInput, setSavingsInput] = useState(String(plan.monthlySavingsTarget));
  const [paydayStartInput, setPaydayStartInput] = useState(String(plan.paydayStartDay));
  const [paydayEndInput, setPaydayEndInput] = useState(String(plan.paydayEndDay));
  const [cardInput, setCardInput] = useState(
    String(plan.cardSpending.cardManualOverride ?? (plan.cardSpending.cardProvisional || "")),
  );

  const { cardSpending } = plan;
  const remaining = plan.remainingBeforePayday;
  const remainingPositive = remaining >= 0;
  const spentPercent =
    plan.spendingEnvelope > 0
      ? Math.min(100, (plan.expenses / plan.spendingEnvelope) * 100)
      : 0;

  const cardAmount =
    cardSpending.cardManualOverride ??
    (cardSpending.cardSettled > 0
      ? cardSpending.cardSettled
      : cardSpending.cardProvisional > 0
        ? cardSpending.cardProvisional
        : null);

  const paydayHint = plan.isPaydayWindow
    ? "Fenêtre de paye"
    : plan.daysUntilPayday === 0
      ? `Paye : ${plan.nextPaydayLabel}`
      : `Paye dans ${plan.daysUntilPayday} j · ${plan.nextPaydayLabel}`;

  const handleSaveSettings = () => {
    const formData = new FormData();
    formData.set("monthlySalaryNet", salaryInput);
    formData.set("mealVoucherAmount", voucherInput);
    formData.set("monthlySavingsTarget", savingsInput);
    formData.set("paydayStartDay", paydayStartInput);
    formData.set("paydayEndDay", paydayEndInput);
    formData.set("provisionalCardSpending", cardInput);
    startTransition(async () => {
      const result = await updateMonthlyBudgetSettings(formData);
      if (result.success) setSettingsOpen(false);
      router.refresh();
    });
  };

  const handleSaveCard = () => {
    const formData = new FormData();
    formData.set("provisionalCardSpending", cardInput);
    startTransition(async () => {
      await updateProvisionalCardSpending(formData);
      setEditingCard(false);
      router.refresh();
    });
  };

  return (
    <article className="animate-fade-up overflow-hidden rounded-2xl bg-surface-hero text-surface-hero-foreground shadow-xl shadow-[oklch(0.21_0.045_275/0.35)] ring-1 ring-white/10">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-hero-foreground/65">
            Budget · {plan.payCycleLabel}
          </p>
          <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium">
            {paydayHint}
          </span>
        </div>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-surface-hero-foreground/80">
              {remainingPositive ? "Reste à vivre avant la paye" : "Dépassement"}
            </p>
            <p className="mt-1 text-5xl font-extrabold tracking-tight sm:text-6xl">
              {formatCurrency(Math.abs(remaining))}
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <div className="mb-2 flex justify-between text-xs text-surface-hero-foreground/70">
              <span>Enveloppe consommée</span>
              <span>{spentPercent.toFixed(0)} %</span>
            </div>
            <Progress
              value={spentPercent}
              className={`h-2.5 bg-white/12 ${plan.isOverBudget ? "[&>div]:bg-money-out" : "[&>div]:bg-[oklch(0.72_0.12_285)]"}`}
            />
            <p className="mt-2 text-right text-xs text-surface-hero-foreground/65">
              {formatCurrency(plan.expenses)} / {formatCurrency(plan.spendingEnvelope)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-white/8 bg-white/6 p-3 text-center">
            <Wallet className="mx-auto h-4 w-4 text-surface-hero-foreground/75" />
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-surface-hero-foreground/55">
              À vivre
            </p>
            <p className="mt-0.5 text-base font-bold sm:text-lg">
              {formatCurrency(plan.spendingEnvelope)}
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/6 p-3 text-center">
            <PiggyBank className="mx-auto h-4 w-4 text-surface-hero-foreground/75" />
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-surface-hero-foreground/55">
              Épargne
            </p>
            <p className="mt-0.5 text-base font-bold sm:text-lg">
              {formatCurrency(plan.monthlySavingsTarget)}
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/6 p-3 text-center">
            <CreditCard className="mx-auto h-4 w-4 text-surface-hero-foreground/75" />
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-surface-hero-foreground/55">
              Carte CB
            </p>
            <p className="mt-0.5 text-base font-bold sm:text-lg">
              {cardAmount != null ? formatCurrency(cardAmount) : "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {editingCard ? (
            <div className="flex flex-1 gap-2">
              <Input
                type="number"
                min="0"
                step="1"
                value={cardInput}
                onChange={(e) => setCardInput(e.target.value)}
                placeholder="Prévisionnel app CA"
                className="border-white/30 bg-white/95 text-foreground"
              />
              <Button
                size="sm"
                onClick={handleSaveCard}
                disabled={pending}
                className="shrink-0 bg-white text-surface-hero hover:bg-white/90"
              >
                OK
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingCard(false)}
                className="text-surface-hero-foreground hover:bg-white/10"
              >
                Annuler
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditingCard(true)}
              className="w-full border border-white/15 bg-white/10 text-surface-hero-foreground hover:bg-white/15 sm:w-auto"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {cardAmount != null ? "Modifier en cours carte" : "Saisir en cours carte"}
            </Button>
          )}

          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-hero-foreground/90 transition hover:bg-white/10"
          >
            <Settings2 className="h-4 w-4" />
            Réglages salaire & paye
            <ChevronDown
              className={`h-4 w-4 transition ${settingsOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {settingsOpen && (
          <div className="rounded-xl border border-white/20 bg-black/10 p-4 backdrop-blur-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <label className="space-y-1 text-xs">
                <span>Paye du (jour)</span>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={paydayStartInput}
                  onChange={(e) => setPaydayStartInput(e.target.value)}
                  className="border-white/30 bg-white/90 text-foreground"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span>Paye au (jour)</span>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={paydayEndInput}
                  onChange={(e) => setPaydayEndInput(e.target.value)}
                  className="border-white/30 bg-white/90 text-foreground"
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveSettings}
                disabled={pending}
                className="bg-white text-surface-hero hover:bg-white/90"
              >
                {pending ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSettingsOpen(false)}
                className="text-surface-hero-foreground hover:bg-white/10"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
