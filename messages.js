/* ════════════════════════════════════════════════════════════════════
   auth.js — Authentification Firebase (Email/Password)
   Sécurité : mots de passe gérés par Firebase, jamais en clair
   ════════════════════════════════════════════════════════════════════ */

let currentUser = null;

/* ── Protection brute-force ── */
const BRUTE = { max: 5, window: 15 * 60 * 1000, key: 'vx_bf' };

function getBruteData() {
  try { return JSON.parse(sessionStorage.getItem(BRUTE.key) || '{"attempts":[],"blockedUntil":0}'); }
  catch { return { attempts: [], blockedUntil: 0 }; }
}
function saveBruteData(d) {
  try { sessionStorage.setItem(BRUTE.key, JSON.stringify(d)); } catch {}
}
function isBruteBlocked() {
  const d = getBruteData();
  if (d.blockedUntil && Date.now() < d.blockedUntil) return Math.ceil((d.blockedUntil - Date.now()) / 60000);
  return false;
}
function recordFailedAttempt() {
  const d = getBruteData();
  const now = Date.now();
  d.attempts = (d.attempts || []).filter(t => now - t < BRUTE.window);
  d.attempts.push(now);
  if (d.attempts.length >= BRUTE.max) {
    d.blockedUntil = now + BRUTE.window;
    d.attempts = [];
  }
  saveBruteData(d);
}
function clearBruteData() { sessionStorage.removeItem(BRUTE.key); }

/* ── Firebase Auth : connexion ── */
async function doLogin() {
  const emailEl = document.getElementById('l-user');
  const passEl  = document.getElementById('l-pass');
  const btn     = document.getElementById('l-btn');

  const email = (emailEl ? emailEl.value : '').trim();
  const pass  = passEl ? passEl.value : '';

  if (!email || !pass) { showLoginErr('Veuillez remplir tous les champs.'); return; }

  const blocked = isBruteBlocked();
  if (blocked) { showLoginErr('Trop de tentatives. Réessayez dans ' + blocked + ' min.'); return; }

  btn.disabled    = true;
  btn.textContent = 'Connexion…';
  document.getElementById('login-err').classList.remove('show');

  try {
    const cred = await auth.signInWithEmailAndPassword(email, pass);
    clearBruteData();
    currentUser = { uid: cred.user.uid, email: cred.user.email, username: cred.user.email.split('@')[0] };
    sessionStorage.setItem('velixio_session', JSON.stringify(currentUser));
    enterDashboard();
  } catch (err) {
    recordFailedAttempt();
    const msgs = {
      'auth/user-not-found':         'Identifiants incorrects.',
      'auth/wrong-password':         'Identifiants incorrects.',
      'auth/invalid-credential':     'Identifiants incorrects.',
      'auth/invalid-email':          'Adresse email invalide.',
      'auth/user-disabled':          'Ce compte a été désactivé.',
      'auth/too-many-requests':      'Trop de tentatives. Réessayez plus tard.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
    };
    showLoginErr(msgs[err.code] || 'Erreur de connexion. Réessayez.');
    btn.disabled    = false;
    btn.textContent = 'Se connecter';
  }
}

/* ── Firebase Auth : déconnexion ── */
async function doLogout() {
  try { await auth.signOut(); } catch {}
  sessionStorage.removeItem('velixio_session');
  currentUser = null;
  clearInterval(monInterval);
  document.getElementById('dashboard').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  const p = document.getElementById('l-pass'); if (p) p.value = '';
  showToast('Déconnexion réussie', 'success');
}

function showLoginErr(msg) {
  const errEl = document.getElementById('login-err');
  if (!errEl) return;
  errEl.textContent = msg;
  errEl.classList.add('show');
}

function enterDashboard() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('dashboard').classList.add('active');
  const u = currentUser.username || 'Admin';
  document.getElementById('sb-uname').textContent = u;
  document.getElementById('sb-av').textContent    = u[0].toUpperCase();
  const btn = document.getElementById('l-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Se connecter'; }
  startClock();
  loadOverview();
  clearInterval(monInterval);
  doSiteCheck();
  monInterval = setInterval(doSiteCheck, 5 * 60 * 1000);
}

/* ── Init : Firebase Auth state observer ── */
function initAuth() {
  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = { uid: user.uid, email: user.email, username: user.email.split('@')[0] };
      sessionStorage.setItem('velixio_session', JSON.stringify(currentUser));
      if (document.getElementById('login-screen').classList.contains('active')) {
        enterDashboard();
      }
    } else {
      currentUser = null;
      sessionStorage.removeItem('velixio_session');
      document.getElementById('login-screen').classList.add('active');
      document.getElementById('dashboard').classList.remove('active');
      const u = document.getElementById('l-user'); if (u) u.focus();
    }
  });
}
