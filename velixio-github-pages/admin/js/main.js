/* ════════════════════════════════════════════
   main.js — Point d'entrée & initialisation
════════════════════════════════════════════ */

/* Touche Entrée sur le login */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('login-screen').classList.contains('active')) doLogin();
});

/* ── Lancement ── */
initAuth();
