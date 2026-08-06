# SmartData

Application web de suivi de finances personnelles — dépenses, épargne et statistiques détaillées.

## Fonctionnalités

- **Import CSV bancaire** — compatible avec la plupart des banques françaises
- **Catégorisation automatique** — détection intelligente (Carrefour → Alimentation, etc.)
- **Tableau de bord** — revenus, dépenses, épargne, graphiques sur 6 mois
- **Budgets mensuels** — suivi par catégorie avec alertes visuelles
- **Objectifs d'épargne** — vacances, apport immobilier, etc.
- **Saisie manuelle** — pour les opérations non bancaires

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Import banque

1. Exportez vos opérations en CSV depuis votre espace client bancaire
2. Allez sur **Import banque** dans l'app
3. Uploadez le fichier — les colonnes sont détectées automatiquement

## Stack

- Next.js 16 + TypeScript
- SQLite (Drizzle ORM)
- shadcn/ui + Recharts

## Cursor Cloud (mobile)

Pour modifier le projet depuis votre téléphone via l'app Cursor ou [cursor.com/agents](https://cursor.com/agents) :

1. Poussez ce repo sur **GitHub** (voir ci-dessous)
2. Connectez GitHub dans [Cursor Settings → Integrations](https://cursor.com/dashboard?tab=integrations)
3. Créez un environnement Cloud Agent : [dashboard Cloud Agents](https://cursor.com/dashboard/cloud-agents#environments) → sélectionnez ce repo
4. Sur iPhone : app **Cursor** → choisissez le repo → lancez un agent **Cloud**

La config cloud est dans `.cursor/environment.json` (`npm install` + serveur dev).

### Premier push GitHub

```bash
git add .
git commit -m "Initial commit — SmartData"
git branch -M main
git remote add origin https://github.com/VOTRE_USER/SmartData.git
git push -u origin main
```

Remplacez `VOTRE_USER` par votre compte GitHub. Créez le repo vide sur github.com/new avant le push.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build production
- `npm run db:generate` — générer les migrations
