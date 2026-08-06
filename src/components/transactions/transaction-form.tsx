"use client";

import { useState, useTransition } from "react";
import { createTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/db/schema";

export function TransactionForm({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState("");

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await createTransaction(formData);
          setCategoryId("");
        });
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <input type="hidden" name="type" value={type} />
        <Select value={type} onValueChange={(v) => setType(v as "expense" | "income")}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Dépense</SelectItem>
            <SelectItem value="income">Revenu</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="label">Libellé</Label>
        <Input id="label" name="label" placeholder="Ex: Courses Carrefour" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Montant (€)</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Catégorie</Label>
        <input type="hidden" name="categoryId" value={categoryId} />
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger id="categoryId">
            <SelectValue placeholder="Choisir..." />
          </SelectTrigger>
          <SelectContent>
            {categories
              .filter((c) => c.type === type)
              .map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending || !categoryId}>
          {pending ? "Ajout..." : "Ajouter la transaction"}
        </Button>
      </div>
    </form>
  );
}
