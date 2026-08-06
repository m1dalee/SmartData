"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TransactionRow } from "@/app/actions/transactions";
import type { Category } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/format";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertCircle, ChevronRight, Search } from "lucide-react";

type Props = {
  rows: TransactionRow[];
  categories: Category[];
  initialCategory?: string;
  initialSearch?: string;
  uncategorizedOnly?: boolean;
  initialTransactionId?: number;
};

type GroupMode = "date" | "category";

export function TransactionsExplorer({
  rows,
  categories,
  initialCategory,
  initialSearch = "",
  uncategorizedOnly = false,
  initialTransactionId,
}: Props) {
  const [search, setSearch] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory ?? "all");
  const [showUncategorized, setShowUncategorized] = useState(uncategorizedOnly);
  const [groupMode, setGroupMode] = useState<GroupMode>("date");
  const [selected, setSelected] = useState<TransactionRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const uncategorizedCount = rows.filter((r) => !r.transaction.categoryId).length;

  const filtered = useMemo(() => {
    return rows.filter(({ transaction, category }) => {
      if (showUncategorized && transaction.categoryId) return false;
      if (categoryFilter !== "all" && String(transaction.categoryId) !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!transaction.label.toLowerCase().includes(q) && !category?.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [rows, search, categoryFilter, showUncategorized]);

  const grouped = useMemo(() => {
    const groups = new Map<string, TransactionRow[]>();

    for (const row of filtered) {
      let key: string;
      if (groupMode === "category") {
        key = row.category?.name ?? "Non catégorisé";
      } else {
        key = new Date(row.transaction.date).toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        });
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    return [...groups.entries()];
  }, [filtered, groupMode]);

  const openRow = (row: TransactionRow) => {
    setSelected(row);
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!initialTransactionId) return;
    const row = rows.find((r) => r.transaction.id === initialTransactionId);
    if (row) openRow(row);
  }, [initialTransactionId, rows]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un paiement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGroupMode("date")}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                groupMode === "date" && "border-indigo-500 bg-indigo-500/10 text-indigo-700",
              )}
            >
              Par mois
            </button>
            <button
              type="button"
              onClick={() => setGroupMode("category")}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                groupMode === "category" && "border-indigo-500 bg-indigo-500/10 text-indigo-700",
              )}
            >
              Par catégorie
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter("all");
              setShowUncategorized(false);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              categoryFilter === "all" && !showUncategorized && "border-indigo-500 bg-indigo-500 text-white",
            )}
          >
            Tous ({rows.length})
          </button>
          {uncategorizedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setShowUncategorized(true);
                setCategoryFilter("all");
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
                showUncategorized && "border-amber-500 bg-amber-500 text-white",
              )}
            >
              <AlertCircle className="h-3 w-3" />
              Non catégorisés ({uncategorizedCount})
            </button>
          )}
          {categories.map((cat) => {
            const count = rows.filter((r) => r.transaction.categoryId === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoryFilter(String(cat.id));
                  setShowUncategorized(false);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  categoryFilter === String(cat.id) && !showUncategorized && "text-white",
                )}
                style={
                  categoryFilter === String(cat.id) && !showUncategorized
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : undefined
                }
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground">
          {filtered.length} paiement(s) · Cliquez sur une ligne pour identifier la catégorie
        </p>

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">Aucun paiement ne correspond à vos filtres.</p>
        ) : (
          <div className="space-y-6">
            {grouped.map(([groupName, groupRows]) => {
              const groupTotal = groupRows.reduce((s, r) => s + r.transaction.amount, 0);
              return (
                <div key={groupName}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold capitalize text-muted-foreground">{groupName}</h3>
                    <span
                      className={`text-sm font-medium ${groupTotal >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {formatCurrency(groupTotal)}
                    </span>
                  </div>
                  <div className="divide-y rounded-xl border bg-card">
                    {groupRows.map((row) => (
                      <button
                        key={row.transaction.id}
                        type="button"
                        onClick={() => openRow(row)}
                        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: row.category?.color ?? "#94a3b8" }}
                        >
                          {row.category?.name?.slice(0, 2).toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{row.transaction.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(row.transaction.date).toLocaleDateString("fr-FR")}
                            {!row.category && (
                              <Badge variant="outline" className="ml-2 border-amber-400 text-amber-700">
                                À classer
                              </Badge>
                            )}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 font-semibold ${row.transaction.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {formatCurrency(row.transaction.amount)}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransactionSheet
        row={selected}
        categories={categories}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
