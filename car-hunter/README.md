# Car Hunter

Alertes auto sur mobile pour **BMW M140i** (≤ 30 000 €) et **BMW M4 F82** (≤ 40 000 €, sans cabrio / F83).

Tu reçois un **message bien formaté** sur ton téléphone — pas de rapport HTML à ouvrir.

## Ce que tu reçois (exemple Telegram)

```
🚗 Car Hunter
🕐 ven. 07 août, 08:00

✨ 2 nouvelles annonces

━━ BMW M140i (1) ━━

🆕 BMW Série 1 M140i
💰 27 500 € · 📍 Bruxelles, BE
🛣 62 000 km · 📅 2018
🏷 AutoScout24
👉 Voir l'annonce

━━ BMW M4 F82 (1) ━━
...
```

Seules les **nouvelles** annonces sont marquées 🆕.

## Installation

```bash
cd car-hunter
npm install
npm run install-browser
cp .env.example .env
```

## Option 1 — Telegram (recommandé sur mobile)

1. Parle à [@BotFather](https://t.me/BotFather) → `/newbot` → récupère le **token**
2. Envoie un message à ton bot
3. Récupère ton **chat_id** :
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Remplis `.env` :

```env
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=987654321
```

5. Lance :

```bash
npm run hunt
```

Le message arrive directement dans Telegram.

## Option 2 — ntfy (encore plus simple)

1. Installe [ntfy](https://ntfy.sh) sur ton téléphone
2. Abonne-toi à un topic perso (ex. `bmw-hunt-guillaume-xyz`)
3. Dans `.env` :

```env
NTFY_TOPIC=bmw-hunt-guillaume-xyz
```

Tu peux activer **Telegram + ntfy** en même temps.

## Planification (matin + soir)

Cron Linux / cloud :

```cron
0 8 * * * cd /workspace/car-hunter && npm run hunt
0 20 * * * cd /workspace/car-hunter && npm run hunt
```

Sur Windows : Planificateur de tâches → 8h et 20h → `npm run hunt`.

## Sites surveillés

| Site | Source |
|------|--------|
| AutoScout24 FR + DE | ✅ fiable |
| leboncoin | Playwright (captcha possible) |
| La Centrale | Playwright (captcha possible) |
| mobile.de | Playwright (captcha possible) |

Si leboncoin / La Centrale / mobile.de bloquent, lance une fois avec un profil navigateur :

```bash
BROWSER_PROFILE_DIR=./data/browser-profile npm run hunt
```

Valide les captchas si demandé ; les runs suivants réutiliseront la session.

## Critères (config.json)

- M140i ≤ 30 000 €
- M4 F82 ≤ 40 000 €
- Exclus : cabriolet, cabrio, convertible, F83
- Pas de limite zone / km
