<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SmartData

Application Next.js de finances personnelles (import CSV bancaire, dashboard, budgets, objectif épargne 30K).

## Commandes utiles

- `npm install` — dépendances
- `npm run dev` — dev server sur http://localhost:3000
- `npm run build` — build production
- `npm run db:generate` — migrations Drizzle

## Base de données

- SQLite locale via `better-sqlite3`, fichier `data/smartdata.db` (gitignored)
- Schéma : `src/lib/db/schema.ts`
- Accès : `getDb()` dans `src/lib/db/index.ts` (migrations auto au démarrage)
- En cloud, la DB démarre vide : catégories par défaut créées automatiquement

## Structure

- `src/app/` — pages App Router (dashboard, transactions, import, budgets)
- `src/lib/stats.ts` — analytics dashboard
- `src/lib/savings-goal.ts` — objectif 30 000 €
- `src/lib/import/` — parsing CSV + catégorisation

## Cursor Cloud specific instructions

- Lancer `npm run dev` dans le terminal configuré ; l'app écoute sur le port **3000**
- Pas de secrets requis pour le dev de base
- La base SQLite est recréée dans `data/` ; les imports CSV se font via la page `/import`
- Ne pas committer `data/` ni `.env*`
- Après des changements de schéma : `npm run db:generate` puis vérifier les migrations dans `drizzle/`
