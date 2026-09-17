import Link from "next/link";
import { AlertTriangle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportPersistenceStatus } from "@/lib/db/import-persistence";

type Props = Pick<
  ImportPersistenceStatus,
  | "databaseHostMismatch"
  | "dataLossSuspected"
  | "ephemeralWarning"
  | "lastRecordedImportCount"
  | "recordedDatabaseHost"
  | "currentDatabaseHost"
>;

export function PersistenceAlertBanner({
  databaseHostMismatch,
  dataLossSuspected,
  ephemeralWarning,
  lastRecordedImportCount,
  recordedDatabaseHost,
  currentDatabaseHost,
}: Props) {
  if (!databaseHostMismatch && !dataLossSuspected && !ephemeralWarning) {
    return null;
  }

  const isCritical = databaseHostMismatch || dataLossSuspected || ephemeralWarning;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 sm:flex sm:items-start sm:justify-between sm:gap-4 ${
        isCritical
          ? "border-rose-200 bg-rose-50 text-rose-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="flex gap-3">
        {ephemeralWarning ? (
          <Database className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <div className="space-y-2 text-sm">
          {ephemeralWarning && (
            <div>
              <p className="font-semibold">Données non persistantes sur Vercel</p>
              <p className="mt-0.5 opacity-90">
                Turso n&apos;est pas configuré : chaque redémarrage peut effacer la base. Ajoute
                l&apos;intégration Turso au projet Vercel avant d&apos;importer.
              </p>
            </div>
          )}
          {databaseHostMismatch && (
            <div>
              <p className="font-semibold">Autre base Turso détectée</p>
              <p className="mt-0.5 opacity-90">
                Dernier import sur <strong>{recordedDatabaseHost}</strong>, aujourd&apos;hui{" "}
                <strong>{currentDatabaseHost}</strong>. Vercel pointe probablement vers une base
                vide — remets la même URL Turso ou réimporte une fois sur la bonne base.
              </p>
            </div>
          )}
          {dataLossSuspected && !databaseHostMismatch && (
            <div>
              <p className="font-semibold">Import précédent introuvable</p>
              <p className="mt-0.5 opacity-90">
                Nous avions enregistré{" "}
                <strong>{lastRecordedImportCount ?? "?"} transactions</strong>, la base en contient 0.
                Réimporte ton CSV ; si ça se reproduit, vérifie que l&apos;URL Turso ne change pas
                dans Vercel.
              </p>
            </div>
          )}
        </div>
      </div>
      <Button
        asChild
        size="sm"
        variant={isCritical ? "destructive" : "secondary"}
        className="mt-3 w-full sm:mt-0 sm:w-auto"
      >
        <Link href="/import">Import / diagnostic</Link>
      </Button>
    </div>
  );
}
