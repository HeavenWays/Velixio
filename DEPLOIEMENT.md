# 🚀 Guide de déploiement Velixio

## Structure à uploader

```
velixio.com/              ← racine du domaine
├── index.html
├── css/styles.css
├── js/main.js
├── js/modal.js
├── asset/                ← images
├── sections/             ← sections HTML (optionnel si non utilisé par le serveur)
└── admin/                ← ⚠️ DOIT être dans ce sous-dossier
    ├── index.html        → velixio.com/admin/
    ├── css/styles.css
    └── js/
        ├── config.js
        ├── auth.js
        ├── messages.js
        ├── monitoring.js
        ├── ui.js
        └── main.js
```

## ⚠️ Règle critique — Même origine obligatoire

Le site et l'admin communiquent via `localStorage` (clé : `velixio_contacts`).
Le localStorage est **isolé par domaine**. Pour que la connexion fonctionne :

| ✅ Correct | ❌ Incorrect |
|---|---|
| `velixio.com` + `velixio.com/admin/` | `velixio.com` + `admin.velixio.com` |
| `velixio.com` + `velixio.com/admin/` | `velixio.com` + `velixio-admin.netlify.app` |

**L'admin DOIT être un sous-dossier du site, pas un sous-domaine ni un hébergement séparé.**

## Accès à l'admin

URL : `https://velixio.com/admin/`  
Login : `admin`  
Mot de passe : `velixio2025`

Le lien ⚙ discret est aussi présent en bas de page du site.

## Hébergeurs recommandés

- **Hostinger / OVH / Infomaniak** : uploader tout le dossier via FTP/cPanel
- **Netlify** : déployer le dossier `velixio-deploy/` entier (le dossier `admin/` sera automatiquement servi à `/admin/`)
- **Vercel** : idem, dossier racine = `velixio-deploy/`

## Corrections appliquées

1. ✅ **Champ `plan` sauvegardé** dans `js/main.js` — les formules choisies depuis le formulaire de contact apparaissent maintenant dans l'admin
2. ✅ **Réinitialisation du sélecteur de plan** après envoi du formulaire
3. ✅ **Lien admin discret** ajouté dans le footer (icône ⚙, quasi invisible)
4. ✅ **Dossier `{css,js}` parasite** supprimé de l'admin (artefact de l'archive)
5. ✅ **Synchronisation temps réel** active : l'admin se met à jour automatiquement dès qu'un visiteur soumet le formulaire (via `window.storage` event)
