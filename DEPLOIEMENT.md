# Velixio — Guide de Déploiement

## 🔥 Configuration Firebase (OBLIGATOIRE)

### 1. Créer le projet Firebase
1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Cliquez **Créer un projet** → donnez un nom (ex: `velixio-prod`)
3. Désactivez Google Analytics (optionnel) → **Créer le projet**

### 2. Activer Firestore Database
1. Dans le menu gauche → **Firestore Database**
2. Cliquez **Créer une base de données**
3. Choisissez **Mode production** → sélectionnez une région (ex: `europe-west3`)
4. Dans l'onglet **Règles**, remplacez tout par le contenu du fichier `firestore.rules`
5. Publiez les règles

### 3. Activer l'authentification
1. Dans le menu gauche → **Authentication** → **Commencer**
2. Onglet **Méthode de connexion** → activez **E-mail/Mot de passe**
3. Onglet **Utilisateurs** → **Ajouter un utilisateur**
   - Email : `admin@velixio.com` (ou autre)
   - Mot de passe : choisissez un mot de passe fort (12+ caractères)

### 4. Récupérer la configuration
1. ⚙️ **Paramètres du projet** → onglet **Vos applications**
2. Cliquez l'icône **Web** (`</>`) → donnez un nom → **Enregistrer**
3. Copiez les valeurs du bloc `firebaseConfig`

### 5. Remplir `js/firebase-config.js`
Remplacez les valeurs dans le fichier :
```js
const FIREBASE_CONFIG = {
  apiKey:            "votre-vraie-api-key",
  authDomain:        "votre-projet.firebaseapp.com",
  projectId:         "votre-projet-id",
  storageBucket:     "votre-projet.appspot.com",
  messagingSenderId: "votre-sender-id",
  appId:             "votre-app-id"
};
```

---

## 🚀 Déploiement GitHub Pages

1. Poussez tous les fichiers sur votre dépôt GitHub
2. **Settings** → **Pages** → Source : `main` branch → `/root`
3. Votre site est en ligne sur `https://votre-compte.github.io/votre-repo`

---

## 🔒 Sécurité mise en place

### Formulaire contact (site public)
- ✅ **Honeypot anti-bot** : champ caché qui piège les bots
- ✅ **Rate limiting** : max 3 soumissions par heure par navigateur
- ✅ **Sanitisation XSS** : toutes les entrées sont nettoyées
- ✅ **Validation renforcée** : email, longueur minimale du message
- ✅ **Règles Firestore** : seule l'écriture est autorisée en public, jamais la lecture

### Admin panel
- ✅ **Firebase Authentication** : mots de passe gérés par Google, jamais en clair
- ✅ **Protection brute-force** : blocage 15 min après 5 tentatives échouées
- ✅ **Session Firebase** : vérification côté serveur à chaque chargement
- ✅ **Temps réel Firestore** : messages synchronisés sans localStorage

### Pour changer le mot de passe admin
Firebase Console → Authentication → ⋮ à côté de l'utilisateur → Réinitialiser le mot de passe

---

## 📂 Structure des fichiers modifiés

```
js/
  firebase-config.js    ← ⭐ NOUVEAU — config Firebase (à remplir)
  main.js               ← formulaire contact → Firestore
sections/
  contact.html          ← honeypot ajouté
admin/
  js/
    auth.js             ← Firebase Authentication (plus de CREDS en clair)
    config.js           ← credentials supprimés
    messages.js         ← Firestore onSnapshot temps réel
firestore.rules         ← ⭐ NOUVEAU — règles de sécurité (à copier dans Firebase)
```
