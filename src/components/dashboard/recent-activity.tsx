"use client";

import { useState } from "react";
import Link from "next/link";
import type { TransactionRow } from "@/app/actions/transactions";
import type { Category } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/format";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { ChevronRight } from "lucide-react";

export function RecentActivity({
  rows,
  categories,
}: {
  rows: TransactionRow[];
  categories: Category[];
}) {
  const [selected, setSelected] = useState<TransactionRow | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="divide-y">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune transaction.</p>
        ) : (
          rows.map((row) => (
            <button
              key={row.transaction.id}
              type="button"
              onClick={() => {
                setSelected(row);
                setOpen(true);
              }}
              className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-muted/40 first:pt-0 last:pb-0"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: row.category?.color ?? "#64748b" }}
              >
                {row.category?.name?.slice(0, 2).toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.transaction.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(row.transaction.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                  {row.category ? ` · ${row.category.name}` : " · À classer"}
                </p>
              </div>
              <span
                className={`shrink-0 font-semibold ${row.transaction.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {formatCurrency(row.transaction.amount)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))
        )}
      </div>

      <div className="mt-4 text-center">
        <Link href="/transactions" className="text-sm font-semibold text-brand hover:underline">
          Voir tous les paiements →
        </Link>
      </div>

      <TransactionSheet row={selected} categories={categories} open={open} onOpenChange={setOpen} />
    </>
  );
}
