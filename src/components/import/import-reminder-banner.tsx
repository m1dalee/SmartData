import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeImportDate } from "@/lib/format";

type Props = {
  importedCount: number;
  lastImportedAt: string | null;
};

export function ImportReminderBanner({ importedCount, lastImportedAt }: Props) {
  const needsImport = importedCount === 0;
  const stale =
    !needsImport &&
    lastImportedAt &&
    Date.now() - new Date(lastImportedAt).getTime() > 7 * 24 * 60 * 60 * 1000;

  if (!needsImport && !stale) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex gap-3">
        <Upload className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="text-sm">
          {needsImport ? (
            <>
              <p className="font-semibold">Importez votre CSV pour démarrer</p>
              <p className="mt-0.5 text-amber-900/80">
                Export Crédit Agricole → Fichiers → import ici (1 min).
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">Mise à jour conseillée</p>
              <p className="mt-0.5 text-amber-900/80">
                Dernier import {formatRelativeImportDate(lastImportedAt!)} — réimportez pour le
                prévisionnel carte et les nouvelles dépenses.
              </p>
            </>
          )}
        </div>
      </div>
      <Button asChild size="sm" className="mt-3 w-full bg-amber-900 hover:bg-amber-950 sm:mt-0 sm:w-auto">
        <Link href="/import">Importer</Link>
      </Button>
    </div>
  );
}
