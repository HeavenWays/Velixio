/* ════════════════════════════════════════════════════════════════════
   config.js — Configuration Velixio Admin
   ⚠️  Les identifiants sont gérés par Firebase Authentication.
       Créez le compte admin depuis Firebase Console :
       Authentication → Ajouter un utilisateur
   ════════════════════════════════════════════════════════════════════ */

const TARGET  = 'https://velixio.com';
const MSG_KEY = 'contacts';  /* Nom de la collection Firestore */

/* Plans disponibles — synchronisés avec le formulaire du site */
const PLANS = {
  creation: [
    { id: 'starter',    label: 'Starter',    price: '3 900 MAD',   category: 'Création' },
    { id: 'business',   label: 'Business',   price: '6 900 MAD',   category: 'Création' },
    { id: 'ecommerce',  label: 'E-Commerce', price: '10 900 MAD',  category: 'Création' },
  ],
  maintenance: [
    { id: 'essentiel',  label: 'Essentiel',  price: '390 MAD/mois',   category: 'Maintenance' },
    { id: 'pro',        label: 'Pro',        price: '790 MAD/mois',   category: 'Maintenance' },
    { id: 'growth',     label: 'Growth',     price: '1 490 MAD/mois', category: 'Maintenance' },
  ]
};

function getPlanInfo(planId) {
  if (!planId) return null;
  const all = [...PLANS.creation, ...PLANS.maintenance];
  return all.find(p => p.id === planId) || null;
}
