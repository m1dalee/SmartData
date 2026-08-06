"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clearImportedTransactions, importBankCsv } from "@/app/actions/import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CsvImportForm({ importedCount }: { importedCount: number }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "info" | "error">("success");
  const [pending, startTransition] = useTransition();
  const [clearPending, startClearTransition] = useTransition();

  return (
    <div className="space-y-6">
      {importedCount > 0 && (
        <p className="rounded-md border bg-muted/50 px-4 py-3 text-sm">
          <strong>{importedCount}</strong> transaction(s) bancaire(s) déjà en base.
          {importedCount > 0 && (
            <>
              {" "}
              <Link href="/transactions" className="underline">
                Voir l&apos;historique
              </Link>
            </>
          )}
        </p>
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          startTransition(async () => {
            const result = await importBankCsv(formData);
            setMessage(result.message);
            setMessageTone(
              result.alreadyImported ? "info" : result.success ? "success" : "error",
            );
            if (result.success && result.imported > 0) {
              form.reset();
            }
            router.refresh();
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="file">Fichier CSV exporté par votre banque</Label>
          <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
          <p className="text-sm text-muted-foreground">
            Compatible avec la plupart des banques françaises. Format attendu : date, libellé,
            débit/crédit ou montant.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="replaceExisting" className="rounded border" />
          Remplacer les imports existants avant d&apos;importer
        </label>

        <Button type="submit" disabled={pending}>
          {pending ? "Import en cours..." : "Importer les transactions"}
        </Button>

        {message && (
          <p
            className={`text-sm whitespace-pre-wrap ${
              messageTone === "success"
                ? "text-emerald-600"
                : messageTone === "info"
                  ? "text-blue-600"
                  : "text-rose-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>

      {importedCount > 0 && (
        <div className="border-t pt-4">
          <p className="mb-2 text-sm text-muted-foreground">
            Les données semblent incorrectes ou vous voulez tout réimporter ?
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={clearPending}
            onClick={() =>
              startClearTransition(async () => {
                const result = await clearImportedTransactions();
                setMessage(result.message);
                setMessageTone("info");
                router.refresh();
              })
            }
          >
            {clearPending ? "Suppression..." : "Supprimer les imports bancaires"}
          </Button>
        </div>
      )}
    </div>
  );
}
