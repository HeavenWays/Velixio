/* ════════════════════════════════════════════
   auth.js — Authentification & session
════════════════════════════════════════════ */

let currentUser = null;

function doLogin() {
  const user  = document.getElementById('l-user').value.trim();
  const pass  = document.getElementById('l-pass').value;
  const errEl = document.getElementById('login-err');
  const btn   = document.getElementById('l-btn');

  if (!user || !pass) { showLoginErr('Veuillez remplir tous les champs.'); return; }

  if (user === CREDS.username && pass === CREDS.password) {
    errEl.classList.remove('show');
    currentUser = { username: user };
    sessionStorage.setItem('velixio_session', JSON.stringify(currentUser));
    enterDashboard();
  } else {
    showLoginErr('Identifiants incorrects. Veuillez réessayer.');
    btn.disabled = false;
  }
}

function showLoginErr(msg) {
  const errEl = document.getElementById('login-err');
  errEl.textContent = msg;
  errEl.classList.add('show');
}

function doLogout() {
  sessionStorage.removeItem('velixio_session');
  currentUser = null;
  clearInterval(monInterval);
  document.getElementById('dashboard').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  showToast('Déconnexion réussie', 'success');
}

function enterDashboard() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('dashboard').classList.add('active');
  const u = currentUser.username;
  document.getElementById('sb-uname').textContent = u;
  document.getElementById('sb-av').textContent    = u[0].toUpperCase();
  startClock();
  loadOverview();
  clearInterval(monInterval);
  doSiteCheck();
  monInterval = setInterval(doSiteCheck, 5 * 60 * 1000);
}

/* Init au chargement */
function initAuth() {
  const saved = sessionStorage.getItem('velixio_session');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      enterDashboard();
      return;
    } catch {}
  }
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('l-user').focus();
}
