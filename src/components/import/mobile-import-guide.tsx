"use client";

import { Smartphone, Share, SquarePlus, Upload } from "lucide-react";

export function MobileImportGuide() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-brand">
          <Smartphone className="h-5 w-5" />
          <h3 className="font-semibold">Installer sur iPhone (30 s)</h3>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">1.</strong> Ouvre SmartData dans{" "}
            <strong>Safari</strong> (pas Chrome)
          </li>
          <li>
            <strong className="text-foreground">2.</strong> Touche{" "}
            <Share className="inline h-4 w-4 align-text-bottom" /> Partager en bas
          </li>
          <li>
            <strong className="text-foreground">3.</strong>{" "}
            <SquarePlus className="inline h-4 w-4 align-text-bottom" /> Sur l&apos;écran d&apos;accueil
          </li>
          <li>
            <strong className="text-foreground">4.</strong> L&apos;icône SmartData ouvre directement
            l&apos;import
          </li>
        </ol>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Export Crédit Agricole sur iPhone</h3>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">1.</strong> App <strong>Ma Banque</strong> ou{" "}
            <strong>crédit-agricole.fr</strong> dans Safari
          </li>
          <li>
            <strong className="text-foreground">2.</strong> Compte courant →{" "}
            <strong>Historique / Opérations</strong>
          </li>
          <li>
            <strong className="text-foreground">3.</strong> Exporter → <strong>CSV</strong> (3 derniers
            mois suffisent)
          </li>
          <li>
            <strong className="text-foreground">4.</strong> Enregistrer dans <strong>Fichiers</strong>
          </li>
          <li>
            <strong className="text-foreground">5.</strong> Revenir ici →{" "}
            <strong>Choisir mon CSV</strong> → Fichiers → ton export
          </li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          Astuce : coche <strong>Ajouter sans remplacer</strong> pour une mise à jour hebdo rapide
          (seules les nouvelles lignes sont importées).
        </p>
      </div>
    </div>
  );
}
