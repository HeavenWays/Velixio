# Velixio — Structure du projet

## Arborescence

```
velixio/
├── index.html              ← Page principale (point d'entrée)
│
├── css/
│   └── styles.css          ← Tous les styles (variables, nav, hero, sections…)
│
├── js/
│   ├── modal.js            ← Fonctions globales : openStartModal / closeStartModal
│   └── main.js             ← Tous les scripts d'animation et d'interaction
│
└── sections/               ← Morceaux HTML de chaque section de la page
    ├── nav.html            ← Barre de navigation fixe
    ├── modal.html          ← Modal "Démarrer un projet"
    ├── hero.html           ← Section Hero (titre, CTA, illustration)
    ├── services.html       ← Grille des services
    ├── portfolio.html      ← Portfolio + modal plein écran
    ├── why.html            ← Pourquoi Velixio (métriques, arguments)
    ├── vs-how.html         ← Comparaison VS + Comment ça marche
    ├── pricing.html        ← Tarifs (Création + Maintenance)
    ├── clients.html        ← Références / logos clients
    ├── faq.html            ← Questions fréquentes (accordéon)
    ├── cta.html            ← Appel à l'action principal
    ├── contact.html        ← Formulaire de contact
    └── footer.html         ← Pied de page + WhatsApp flottant
```

## Utilisation

### Option A — Fichier unique (original)
Ouvrir `velixio_v18_fixed.html` directement dans un navigateur.

### Option B — Projet décomposé (cette structure)
Pour assembler les sections dans `index.html`, deux approches :

**1. Avec un serveur local (recommandé)**
```bash
# Python 3
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```
Utiliser `fetch()` ou un système de templating (PHP, Vite, Astro…) pour inclure les sections.

**2. Copier-coller**
Copier le contenu de chaque fichier `sections/*.html` dans `index.html`
aux emplacements indiqués par les commentaires `<!-- Inclure : sections/xxx.html -->`.

## Modifications courantes

| Quoi modifier | Où |
|---|---|
| Couleurs, typographie, espacements | `css/styles.css` → variables `:root` (lignes 1–47) |
| Texte du hero, titre principal | `sections/hero.html` |
| Offres et tarifs | `sections/pricing.html` |
| Projets portfolio | `sections/portfolio.html` |
| Questions FAQ | `sections/faq.html` |
| Numéro WhatsApp | `sections/footer.html` + `js/modal.js` |
| Animations et interactions | `js/main.js` |
| Fonctions modal | `js/modal.js` |

## Notes techniques

- **Particules canvas** : gérées dans `js/main.js` (section 15)
- **Cursor glow** : `js/main.js` (section 2)
- **Scroll reveal** : IntersectionObserver dans `js/main.js` (section 3)
- **Barre de progression** : `js/main.js` (section 1)
- **Tilt 3D cartes** : `js/main.js` (sections 7 et 16)
- Le fichier `main.js` est tronqué à la section 18 (fichier source incomplet)
