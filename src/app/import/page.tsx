import { AppNav } from "@/components/app-nav";
import { CsvImportForm } from "@/components/import/csv-import-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getImportStats } from "@/app/actions/import";

export default async function ImportPage() {
  const { importedCount } = await getImportStats();

  return (
    <div className="min-h-screen">
      <AppNav currentPath="/import" />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import banque</h1>
          <p className="text-muted-foreground">
            Importez un CSV : il reste en base jusqu&apos;au prochain fichier (qui remplace
            l&apos;ancien)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Importer un relevé CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <CsvImportForm importedCount={importedCount} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comment exporter depuis votre banque ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">1.</strong> Connectez-vous à votre espace client bancaire
            </p>
            <p>
              <strong className="text-foreground">2.</strong> Allez dans Relevés / Historique des opérations
            </p>
            <p>
              <strong className="text-foreground">3.</strong> Exportez au format CSV (ou Excel puis converti en CSV)
            </p>
            <p>
              <strong className="text-foreground">4.</strong> Importez le fichier ici — SmartData détecte
              automatiquement les colonnes et catégorise vos dépenses
            </p>
            <p className="pt-2 text-xs">
              Note : la connexion directe via Open Banking (DSP2) pourra être ajoutée dans une prochaine version.
              Pour l&apos;instant, l&apos;export CSV est la méthode la plus fiable et compatible avec toutes les banques.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
