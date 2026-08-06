"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  categorizeSimilarPayments,
  countSimilarTransactions,
  deleteTransaction,
  updateTransactionCategory,
  type TransactionRow,
} from "@/app/actions/transactions";
import { identifySingleTransaction } from "@/app/actions/categorize";
import { extractKeyword } from "@/lib/import/label-utils";
import { PROVIDER_LABELS } from "@/lib/import/payment-lookup";
import { MONEY_MOVEMENT_CATEGORY } from "@/lib/import/transfer-detector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Category } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/format";
import { Tags, Trash2, Search } from "lucide-react";

type Props = {
  row: TransactionRow | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TransactionSheet({ row, categories, open, onOpenChange }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [similarCount, setSimilarCount] = useState(0);
  const [applyToAll, setApplyToAll] = useState(true);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!row) return;
    setLookupMessage(null);
    setCategoryId(row.transaction.categoryId ? String(row.transaction.categoryId) : "");
    setApplyToAll(true);
    const kw = extractKeyword(row.transaction.label);
    setKeyword(kw);
    startTransition(async () => {
      setSimilarCount(await countSimilarTransactions(kw));
    });
  }, [row]);

  if (!row) return null;

  const filteredCategories = categories.filter(
    (c) => c.type === row.transaction.type || c.name === MONEY_MOVEMENT_CATEGORY,
  );
  const canApplyToAll = keyword.trim().length >= 2;

  const handleSave = () => {
    if (!categoryId) return;
    const catId = Number.parseInt(categoryId, 10);

    startTransition(async () => {
      if (applyToAll && canApplyToAll) {
        await categorizeSimilarPayments(keyword.trim(), catId, true);
      } else {
        await updateTransactionCategory(row.transaction.id, catId);
      }
      router.refresh();
      onOpenChange(false);
    });
  };

  const handleLookup = () => {
    startTransition(async () => {
      const result = await identifySingleTransaction(row.transaction.id);
      if (result.success && result.categoryName) {
        const via = result.provider ? PROVIDER_LABELS[result.provider as keyof typeof PROVIDER_LABELS] : "";
        setLookupMessage(`Identifié : ${result.categoryName}${via ? ` via ${via}` : ""}`);
        const cat = categories.find((c) => c.name === result.categoryName);
        if (cat) setCategoryId(String(cat.id));
        router.refresh();
      } else {
        setLookupMessage(result.message ?? "Recherche sans résultat.");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTransaction(row.transaction.id);
      router.refresh();
      onOpenChange(false);
    });
  };

  const saveLabel =
    applyToAll && canApplyToAll && similarCount > 0
      ? `Appliquer à ${similarCount} paiement${similarCount > 1 ? "s" : ""}`
      : "Enregistrer ce paiement";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="pr-8 text-left leading-snug">{row.transaction.label}</SheetTitle>
          <SheetDescription asChild>
            <div className="space-y-1 text-left">
              <p>{new Date(row.transaction.date).toLocaleDateString("fr-FR", { dateStyle: "full" })}</p>
              <p
                className={`text-lg font-bold ${row.transaction.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {formatCurrency(row.transaction.amount)}
              </p>
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{row.transaction.source === "import" ? "Import banque" : "Manuel"}</Badge>
            <Badge variant="outline">{row.transaction.type === "expense" ? "Dépense" : "Revenu"}</Badge>
            {row.category && (
              <Badge style={{ backgroundColor: row.category.color }} className="border-0 text-white">
                {row.category.name}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie..." />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="w-full" onClick={handleLookup} disabled={pending}>
            <Search className="mr-2 h-4 w-4" />
            {pending ? "Recherche..." : "Rechercher l'origine du paiement"}
          </Button>
          {lookupMessage && (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{lookupMessage}</p>
          )}

          <div
            className={`space-y-3 rounded-xl border-2 p-4 transition-colors ${
              applyToAll && canApplyToAll
                ? "border-indigo-300 bg-indigo-50/80"
                : "border-border bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-indigo-600" />
              <Label htmlFor="keyword" className="text-base font-semibold">
                Mot-clé
              </Label>
            </div>
            <input
              id="keyword"
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm font-medium"
              value={keyword}
              placeholder="Ex: CARREFOUR, NETFLIX, SNCF..."
              onChange={(e) => {
                setKeyword(e.target.value);
                startTransition(async () => {
                  setSimilarCount(await countSimilarTransactions(e.target.value));
                });
              }}
            />
            <p className="text-sm text-muted-foreground">
              <strong>{similarCount}</strong> paiement{similarCount > 1 ? "s" : ""} contien
              {similarCount > 1 ? "nent" : "t"} « <strong>{keyword || "…"}</strong> »
            </p>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-indigo-400 accent-indigo-600"
              />
              <div>
                <p className="text-sm font-semibold">Appliquer à tous les paiements avec ce mot-clé</p>
                <p className="text-xs text-muted-foreground">
                  Met à jour tous les paiements correspondants et mémorise la règle pour les futurs imports.
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={pending || !categoryId}>
              {pending ? "Enregistrement..." : saveLabel}
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete} disabled={pending}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
