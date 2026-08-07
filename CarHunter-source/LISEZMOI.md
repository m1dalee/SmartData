# ⚠️ Ce dossier sert à récupérer le code pour le repo CarHunter

Ce n'est **pas** une partie de SmartData. Copie tout le contenu de `CarHunter-source/`
dans ton repo **m1dalee/CarHunter** sur GitHub.

## Méthode la plus simple (GitHub Desktop)

1. Télécharge ce dossier (Code → Download ZIP sur la branche `car-hunter-export`)
2. Extrais le ZIP
3. Ouvre **GitHub Desktop** → File → Add local repository → choisis le dossier extrait
4. Publish repository → **m1dalee/CarHunter** (ou push si déjà lié)

## Méthode terminal

```bash
cd CarHunter-source
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/m1dalee/CarHunter.git
git push -u origin main
```

Si le push échoue : utilise un **Personal Access Token** GitHub comme mot de passe.

## Ensuite

Sur **CarHunter** → Settings → Secrets :
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID` = `5252735871`

Actions → Car Hunter → Run workflow
