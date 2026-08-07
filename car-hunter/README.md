# Car Hunter

Alertes **Telegram** pour BMW **M140i** (≤ 30 000 €) et **M4 F82** (≤ 40 000 €, sans cabrio / F83).

Tourne **automatiquement sur GitHub** — rien à installer sur ton PC.

## Déploiement GitHub (5 min)

### 1. Créer le repo

Sur [github.com/new](https://github.com/new) :
- Nom : `car-hunter`
- Public ou privé
- **Sans** README / .gitignore (déjà inclus ici)

### 2. Pousser ce code

```bash
cd car-hunter
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_USER/car-hunter.git
git push -u origin main
```

### 3. Ajouter les secrets Telegram

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Valeur |
|--------|--------|
| `TELEGRAM_BOT_TOKEN` | ton token BotFather |
| `TELEGRAM_CHAT_ID` | `5252735871` |

### 4. Tester

Actions → **Car Hunter** → **Run workflow**

Tu reçois le message sur Telegram en ~1 min.

## Planification

Automatique **2×/jour** (8h et 20h, Paris) via GitHub Actions.

Lancement manuel : onglet **Actions** → **Run workflow**.

## Message reçu (exemple)

```
🚗 Car Hunter
🕐 ven. 07 août, 08:00

✨ 2 nouvelles annonces

━━ BMW M140i (1) ━━
🆕 BMW Série 1 M140i
💰 27 500 € · 📍 Lyon, FR
👉 Voir l'annonce
```

Seules les **nouvelles** annonces sont marquées 🆕.

## Sites surveillés

| Site | GitHub Actions |
|------|----------------|
| AutoScout24 FR + DE | ✅ fiable |
| leboncoin | ⚠️ captcha fréquent |
| La Centrale | ⚠️ captcha fréquent |
| mobile.de | ⚠️ captcha fréquent |

Sur GitHub, AutoScout24 couvre déjà pas mal d’annonces FR/DE. Les 3 autres peuvent renvoyer 0 selon les protections anti-bot.

## Critères (`config.json`)

- M140i ≤ 30 000 €
- M4 F82 ≤ 40 000 €
- Exclus : cabriolet, cabrio, convertible, F83, X3…
- Pas de limite zone / km

## Test local (optionnel)

```bash
cp .env.example .env
# remplir TELEGRAM_*
npm install
npm run install-browser
npm run hunt
```

## Sécurité

Ne commite **jamais** le token Telegram. Utilise uniquement les **GitHub Secrets**.
