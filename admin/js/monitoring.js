/* ════════════════════════════════════════════
   monitoring.js — Surveillance du site
════════════════════════════════════════════ */

let monHistory = [];
let ovChart    = null;
let monChart   = null;
let monInterval = null;

/* ── Check principal (fetch navigateur) ── */
async function doSiteCheck() {
  const start = Date.now();
  let record;
  try {
    await fetch(TARGET, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
    const rt = Date.now() - start;
    record = { status: 'online', response_time: rt, error: null, checked_at: new Date().toISOString() };
  } catch (err) {
    const rt = Date.now() - start;
    const isNetworkErr = err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'));
    record = {
      status:        isNetworkErr ? 'offline' : 'online',
      response_time: rt,
      error:         isNetworkErr ? 'Erreur réseau' : null,
      checked_at:    new Date().toISOString()
    };
  }
  monHistory.unshift(record);
  if (monHistory.length > 200) monHistory.pop();
  updateMonitorUI();
  updateNavBadge();
  return record;
}

/* ── Mise à jour de l'UI monitoring ── */
function updateMonitorUI() {
  if (!monHistory.length) return;
  const latest = monHistory[0];
  const online = monHistory.filter(r => r.status === 'online');
  const rts    = online.map(r => r.response_time).filter(Boolean);

  /* Pulse dot couleur */
  const pulse = document.querySelector('.pulse-dot');
  if (pulse) pulse.style.background = latest.status === 'online' ? 'var(--green)' : 'var(--red)';

  /* Overview */
  const ovStatusEl = document.getElementById('ov-status');
  if (ovStatusEl) {
    ovStatusEl.textContent = { online:'En ligne', offline:'Hors ligne', unknown:'–' }[latest.status] || '–';
    ovStatusEl.style.color = { online:'var(--green)', offline:'var(--red)' }[latest.status] || '';
  }
  _setText('ov-resp',   latest.response_time != null ? latest.response_time + ' ms' : '–');
  _setText('ov-last',   fmtDatetime(latest.checked_at));
  _setText('ov-min',    rts.length ? Math.min(...rts) + ' ms' : '–');
  _setText('ov-max',    rts.length ? Math.max(...rts) + ' ms' : '–');
  _setText('ov-checks', monHistory.length);

  /* Monitor view */
  const monIcon = document.getElementById('mon-icon');
  if (monIcon) {
    monIcon.className = 'status-icon ' + (latest.status === 'online' ? 'online' : 'offline');
    monIcon.innerHTML = latest.status === 'online'
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  }
  _setText('mon-status',    latest.status === 'online' ? 'En ligne ✓' : 'Hors ligne ✗');
  _setText('mon-sub',       `Réponse : ${latest.response_time ?? '–'} ms · ${fmtDatetime(latest.checked_at)}`);
  const avg = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
  _setText('mon-avg',       avg != null ? avg + ' ms' : '–');
  _setText('mon-count-lbl', monHistory.length + ' vérification(s)');
  _setText('mon-log-count', monHistory.length + ' entrée(s)');
}

/* ── Overview ── */
function loadOverview() {
  updateMonitorUI();
  updateNavBadge();
  renderOvChart();
  const contacts = getContacts();
  _setText('ov-total', contacts.length);
  const newCount = contacts.filter(c => c.status === 'new').length;
  const ovNew    = document.getElementById('ov-new');
  if (newCount > 0) { ovNew.textContent = newCount + ' nouveau' + (newCount > 1 ? 'x' : ''); ovNew.style.display = 'inline'; }
  else ovNew.style.display = 'none';
}

function renderOvChart() {
  const ctx = document.getElementById('ov-chart');
  if (!ctx) return;
  const data    = [...monHistory].reverse().slice(-24);
  const labels  = data.map(r => fmtTime(r.checked_at));
  const vals    = data.map(r => r.response_time ?? 0);
  const colors  = data.map(r => r.status === 'online' ? 'rgba(46,204,143,0.15)' : 'rgba(232,85,85,0.15)');
  const borders = data.map(r => r.status === 'online' ? '#2ECC8F' : '#E85555');
  if (ovChart) ovChart.destroy();
  ovChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Réponse (ms)', data: vals, backgroundColor: colors, borderColor: borders, borderWidth: 1.5, borderRadius: 4 }] },
    options: chartOpts('ms')
  });
}

/* ── Monitor view ── */
function loadMonitorView() {
  updateMonitorUI();
  renderMonChart();
  renderMonLog();
}

function renderMonChart() {
  const ctx = document.getElementById('mon-chart');
  if (!ctx) return;
  const data    = [...monHistory].reverse();
  const labels  = data.map(r => fmtTime(r.checked_at));
  const vals    = data.map(r => r.response_time ?? 0);
  const ptColors= data.map(r => r.status === 'online' ? '#2ECC8F' : '#E85555');
  if (monChart) monChart.destroy();
  monChart = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{
      label: 'Réponse (ms)', data: vals,
      borderColor: '#C8A020', backgroundColor: 'rgba(200,160,32,0.08)',
      borderWidth: 2, pointRadius: 3, pointBackgroundColor: ptColors, tension: 0.35, fill: true
    }] },
    options: chartOpts('ms')
  });
}

function renderMonLog() {
  const tbody = document.getElementById('mon-tbody');
  if (!tbody) return;
  if (!monHistory.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">Aucune vérification effectuée.</td></tr>`;
    return;
  }
  tbody.innerHTML = monHistory.map((r, i) => `
    <tr>
      <td class="td-mono" style="color:var(--muted2)">${monHistory.length - i}</td>
      <td class="td-mono">${fmtDatetime(r.checked_at)}</td>
      <td><span class="badge badge-${r.status}">${r.status}</span></td>
      <td class="td-mono" style="color:${r.response_time < 800 ? 'var(--green)' : r.response_time < 2000 ? 'var(--orange)' : 'var(--red)'}">${r.response_time != null ? r.response_time + ' ms' : '–'}</td>
      <td style="color:var(--muted2);font-size:12px">${r.error || ''}</td>
    </tr>`).join('');
}

async function triggerCheck() {
  const btn = document.getElementById('check-btn');
  btn.disabled = true;
  btn.innerHTML = `<span class="loader"></span> Vérification…`;
  await doSiteCheck();
  loadMonitorView();
  showToast('Vérification effectuée ✓', 'success');
  btn.disabled = false;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.96"/></svg> Vérifier maintenant`;
}

function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
