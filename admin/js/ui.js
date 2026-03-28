/* ════════════════════════════════════════════
   ui.js — Utilitaires UI, navigation, horloge, charts
════════════════════════════════════════════ */

/* ── Horloge ── */
function startClock() {
  function tick() {
    document.getElementById('clock').textContent =
      new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  }
  tick(); setInterval(tick, 1000);
}

/* ── Navigation ── */
const VIEW_TITLES = { overview:'Vue d\'ensemble', monitor:'Monitoring du site', messages:'Messages de contact', settings:'Paramètres' };

function gotoView(v, el) {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');
  el.classList.add('active');
  document.getElementById('topbar-title').textContent = VIEW_TITLES[v] || v;
  if (v === 'overview')  loadOverview();
  if (v === 'monitor')   loadMonitorView();
  if (v === 'messages')  loadMessages();
  if (v === 'settings')  loadSettings();
}

/* ── Paramètres ── */
function loadSettings() {
  document.getElementById('cfg-user').textContent = currentUser?.email || currentUser?.username || '–';
}

/* ── Toast ── */
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── Chart options ── */
function chartOpts(yLabel) {
  return {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode:'index', intersect:false },
    plugins: {
      legend: { display:false },
      tooltip: {
        backgroundColor:'#141419', borderColor:'rgba(255,255,255,.1)', borderWidth:1,
        titleColor:'#F9F9F7', bodyColor:'rgba(249,249,247,.6)', padding:10
      }
    },
    scales: {
      x: { ticks: { color:'rgba(249,249,247,.35)', font:{ family:"'DM Mono'", size:10 }, maxTicksLimit:10 }, grid: { color:'rgba(255,255,255,.05)' } },
      y: { ticks: { color:'rgba(249,249,247,.35)', font:{ family:"'DM Mono'", size:10 } }, grid: { color:'rgba(255,255,255,.05)' },
           title: { display:true, text:yLabel, color:'rgba(249,249,247,.3)', font:{ size:11 } }, beginAtZero:true }
    }
  };
}

/* ── Formatters ── */
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtDatetime(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}
function fmtRelative(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return 'À l\'instant';
  if (diff < 3600)  return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
  return fmtDatetime(iso).split(' ')[0];
}
