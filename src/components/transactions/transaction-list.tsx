"use client";

import { useTransition } from "react";
import { deleteTransaction } from "@/app/actions/transactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

type Row = {
  transaction: {
    id: number;
    date: string;
    label: string;
    amount: number;
    type: "expense" | "income";
    source: "manual" | "import";
  };
  category: { name: string; color: string } | null;
};

export function TransactionList({ rows }: { rows: Row[] }) {
  const [pending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucune transaction. Importez votre relevé bancaire ou ajoutez-en une manuellement.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Libellé</TableHead>
          <TableHead>Catégorie</TableHead>
          <TableHead>Source</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ transaction, category }) => (
          <TableRow key={transaction.id}>
            <TableCell>{new Date(transaction.date).toLocaleDateString("fr-FR")}</TableCell>
            <TableCell className="max-w-xs truncate">{transaction.label}</TableCell>
            <TableCell>
              {category ? (
                <Badge style={{ backgroundColor: category.color }} className="text-white border-0">
                  {category.name}
                </Badge>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{transaction.source === "import" ? "Banque" : "Manuel"}</Badge>
            </TableCell>
            <TableCell
              className={`text-right font-medium ${transaction.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {formatCurrency(transaction.amount)}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteTransaction(transaction.id);
                  })
                }
              >
                Suppr.
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
