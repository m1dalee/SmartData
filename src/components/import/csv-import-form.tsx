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
      {importedCount > 0 ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950">
          <p>
            <strong>{importedCount}</strong> transaction(s) bancaire(s) enregistrée(s) en base.
          </p>
          <p className="mt-1 text-emerald-900/80">
            Elles restent disponibles jusqu&apos;à ce que vous importiez un nouveau CSV (qui remplacera
            l&apos;ancien).
          </p>
          <Link href="/transactions" className="mt-2 inline-block font-medium underline">
            Voir l&apos;historique
          </Link>
        </div>
      ) : (
        <p className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Aucun import en base pour l&apos;instant. Importez un CSV pour remplir le tableau de bord.
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
            Par défaut, ce fichier <strong>remplace</strong> l&apos;import précédent et reste en base
            jusqu&apos;au prochain CSV.
          </p>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="keepExisting" className="mt-0.5 rounded border" />
          <span>
            Ajouter sans remplacer
            <span className="block text-muted-foreground">
              Garde l&apos;ancien import et ajoute seulement les nouvelles lignes (dédoublonnage
              automatique).
            </span>
          </span>
        </label>

        <Button type="submit" disabled={pending}>
          {pending
            ? "Import en cours..."
            : importedCount > 0
              ? "Mettre à jour avec ce CSV"
              : "Importer les transactions"}
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
            Vider totalement la base d&apos;imports (sans importer de nouveau fichier) ?
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
