import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { CsvImportForm } from "@/components/import/csv-import-form";
import { MobileImportGuide } from "@/components/import/mobile-import-guide";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getImportStats } from "@/app/actions/import";
import { isEphemeralServerlessDatabase } from "@/lib/db";

export default async function ImportPage() {
  const stats = await getImportStats();
  const ephemeralDb = isEphemeralServerlessDatabase();

  return (
    <AppShell
      title="Import banque"
      subtitle="CSV Crédit Agricole · ~1 min depuis l'iPhone"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {ephemeralDb && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
            <p className="font-semibold">Base non persistante sur Vercel</p>
            <p className="mt-1 text-rose-900/90">
              Turso n&apos;est pas configuré : tes imports peuvent disparaître après un redémarrage.
              Vercel → projet smartdata → intégration <strong>Turso</strong> → redeploy.
            </p>
          </div>
        )}
        <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Importer mon CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
              <CsvImportForm {...stats} />
            </Suspense>
          </CardContent>
        </Card>

        <MobileImportGuide />

        <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Routine hebdo (2 min)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Lundi ou vendredi :</strong> export CA → import
              SmartData → mets à jour le prévisionnel carte dans le budget.
            </p>
            <p>
              Coche <strong>Ajouter sans remplacer</strong> pour ne pas tout réimporter à chaque
              fois.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
