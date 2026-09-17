"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { FileUp } from "lucide-react";
import { clearImportedTransactions, importBankCsv } from "@/app/actions/import";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatRelativeImportDate } from "@/lib/format";

type ImportStats = {
  importedCount: number;
  lastImportedAt: string | null;
  latestTransactionDate: string | null;
};

export function CsvImportForm({
  importedCount,
  lastImportedAt,
  latestTransactionDate,
}: ImportStats) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "info" | "error">("success");
  const [pending, startTransition] = useTransition();
  const [clearPending, startClearTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get("shared") === "1") {
      setMessage(
        searchParams.get("success") === "1"
          ? "CSV reçu et importé depuis le partage."
          : "Impossible d'importer le fichier partagé. Utilisez « Choisir mon CSV ».",
      );
      setMessageTone(searchParams.get("success") === "1" ? "success" : "error");
    }
  }, [searchParams]);

  const submitImport = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await importBankCsv(formData);
      setMessage(result.message);
      setMessageTone(result.alreadyImported ? "info" : result.success ? "success" : "error");
      if (result.success && result.imported > 0) {
        form.reset();
        setSelectedFileName(null);
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {importedCount > 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950">
          <p>
            <strong>{importedCount}</strong> transaction(s) en base.
          </p>
          {lastImportedAt && (
            <p className="mt-1 text-emerald-900/80">
              Dernier import : {formatRelativeImportDate(lastImportedAt)}
              {latestTransactionDate ? ` · données jusqu'au ${latestTransactionDate}` : ""}
            </p>
          )}
          <Link href="/" className="mt-2 inline-block font-medium underline">
            Voir le tableau de bord
          </Link>
        </div>
      ) : (
        <p className="rounded-xl border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Importez un CSV Crédit Agricole pour alimenter votre budget et votre objectif 30K.
        </p>
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submitImport(e.currentTarget);
        }}
      >
        <div className="space-y-3">
          <Label htmlFor="file" className="text-base font-semibold">
            Fichier CSV
          </Label>

          <input
            ref={fileInputRef}
            id="file"
            name="file"
            type="file"
            accept=".csv,.CSV,text/csv,text/comma-separated-values"
            required
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setSelectedFileName(file?.name ?? null);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand/30 bg-brand/5 px-4 py-8 text-center transition hover:border-brand/50 hover:bg-brand/10 active:scale-[0.99]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-md">
              <FileUp className="h-7 w-7" />
            </span>
            <span className="text-lg font-bold text-foreground">Choisir mon CSV</span>
            <span className="text-sm text-muted-foreground">
              {selectedFileName ?? "Depuis Fichiers, Mail ou Drive"}
            </span>
          </button>

          <p className="text-xs text-muted-foreground">
            Par défaut, le nouveau CSV <strong>remplace</strong> l&apos;ancien import.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3 text-sm">
          <input type="checkbox" name="keepExisting" className="mt-1 h-4 w-4 rounded border" />
          <span>
            <strong>Ajouter sans remplacer</strong>
            <span className="mt-0.5 block text-muted-foreground">
              Idéal pour une mise à jour hebdo : seules les nouvelles lignes sont importées.
            </span>
          </span>
        </label>

        <Button type="submit" disabled={pending} size="lg" className="h-12 w-full text-base">
          {pending
            ? "Import en cours..."
            : importedCount > 0
              ? "Mettre à jour"
              : "Importer"}
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
          <Button
            type="button"
            variant="outline"
            disabled={clearPending}
            onClick={() => {
              if (
                !window.confirm(
                  "Supprimer toutes les transactions importées ? Cette action est définitive sur Turso.",
                )
              ) {
                return;
              }
              startClearTransition(async () => {
                const result = await clearImportedTransactions();
                setMessage(result.message);
                setMessageTone("info");
                router.refresh();
              });
            }}
          >
            {clearPending ? "Suppression..." : "Supprimer les imports"}
          </Button>
        </div>
      )}
    </div>
  );
}
