/* ════════════════════════════════════════════
   analytics-admin.js — Vue Analytics admin
════════════════════════════════════════════ */

let analyticsData = [];
let analyticsChart = null;
let analyticsRange = 7; // jours par défaut

/* ── Charger les données ── */
async function loadAnalytics() {
  const container = document.getElementById('view-analytics');
  if (!container) return;

  const since = new Date();
  since.setDate(since.getDate() - analyticsRange);
  const sinceIso = since.toISOString();

  try {
    const snap = await db.collection('site_analytics')
      .where('created_at_iso', '>=', sinceIso)
      .orderBy('created_at_iso', 'desc')
      .get();

    analyticsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAnalytics();
  } catch (e) {
    console.error('Analytics load error:', e);
    document.getElementById('analytics-body').innerHTML =
      '<div style="padding:2rem;color:rgba(255,255,255,.4);text-align:center">Erreur de chargement des données.</div>';
  }
}

/* ── Calculer les métriques ── */
function computeMetrics(data) {
  const visits  = data.filter(d => d.type === 'visit');
  const clicks  = data.filter(d => d.type === 'click');
  const vids    = [...new Set(visits.map(d => d.visitor_id))];
  const devices = { mobile: 0, desktop: 0, tablet: 0 };
  visits.forEach(v => { if (devices[v.device] !== undefined) devices[v.device]++; });

  // Fréquence : visites par visiteur unique
  const freq = {};
  visits.forEach(v => { freq[v.visitor_id] = (freq[v.visitor_id] || 0) + 1; });
  const freqVals = Object.values(freq);
  const avgFreq = freqVals.length ? (freqVals.reduce((a,b)=>a+b,0)/freqVals.length).toFixed(1) : 0;
  const returning = freqVals.filter(v => v > 1).length;

  // Top clics
  const clickMap = {};
  clicks.forEach(c => { clickMap[c.label] = (clickMap[c.label] || 0) + 1; });
  const topClicks = Object.entries(clickMap).sort((a,b) => b[1]-a[1]).slice(0, 6);

  // Sources
  const srcMap = {};
  visits.forEach(v => { const s = v.referrer || 'direct'; srcMap[s] = (srcMap[s]||0)+1; });
  const topSources = Object.entries(srcMap).sort((a,b) => b[1]-a[1]).slice(0, 5);

  // Visites par jour
  const dayMap = {};
  visits.forEach(v => {
    const day = (v.created_at_iso || '').slice(0,10);
    if (day) dayMap[day] = (dayMap[day]||0)+1;
  });

  return { visits, clicks, vids, devices, avgFreq, returning, topClicks, topSources, dayMap };
}

/* ── Rendre la vue Analytics ── */
function renderAnalytics() {
  const m = computeMetrics(analyticsData);

  const kpis = [
    { label: 'Visiteurs uniques',   val: m.vids.length,      icon: '👤', color: '#e8bf45' },
    { label: 'Total visites',       val: m.visits.length,    icon: '👁',  color: '#7dd3fc' },
    { label: 'Clics trackés',       val: m.clicks.length,    icon: '🖱️', color: '#86efac' },
    { label: 'Visites / visiteur',  val: m.avgFreq,          icon: '🔄', color: '#c4b5fd' },
    { label: 'Visiteurs récurrents',val: m.returning,        icon: '↩️', color: '#fdba74' },
    { label: 'Desktop / Mobile',    val: `${m.devices.desktop} / ${m.devices.mobile}`, icon: '📱', color: '#f9a8d4' },
  ];

  // Construire les jours pour le graphique
  const days = [];
  for (let i = analyticsRange - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0,10));
  }
  const dayLabels = days.map(d => {
    const [,m,day] = d.split('-');
    return `${day}/${m}`;
  });
  const dayValues = days.map(d => m.dayMap[d] || 0);

  document.getElementById('analytics-body').innerHTML = `
    <!-- KPIs -->
    <div class="an-kpis">
      ${kpis.map(k => `
        <div class="an-kpi">
          <div class="an-kpi-icon">${k.icon}</div>
          <div class="an-kpi-val" style="color:${k.color}">${k.val}</div>
          <div class="an-kpi-label">${k.label}</div>
        </div>`).join('')}
    </div>

    <!-- Graphique visites -->
    <div class="panel" style="padding:1.5rem;margin-bottom:1.5rem">
      <div class="panel-title" style="margin-bottom:1rem">Visites par jour (${analyticsRange}j)</div>
      <div style="height:220px;position:relative">
        <canvas id="an-chart"></canvas>
      </div>
    </div>

    <!-- Ligne : Top clics + Sources -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;margin-bottom:1.5rem">
      <div class="panel" style="padding:1.5rem">
        <div class="panel-title" style="margin-bottom:1rem">Top clics</div>
        ${m.topClicks.length ? m.topClicks.map(([label, count]) => `
          <div class="an-row">
            <span class="an-row-label">${label}</span>
            <span class="an-row-val">${count}</span>
          </div>`).join('') : '<div class="an-empty">Aucun clic enregistré</div>'}
      </div>
      <div class="panel" style="padding:1.5rem">
        <div class="panel-title" style="margin-bottom:1rem">Sources de trafic</div>
        ${m.topSources.length ? m.topSources.map(([src, count]) => `
          <div class="an-row">
            <span class="an-row-label">${src}</span>
            <span class="an-row-val">${count}</span>
          </div>`).join('') : '<div class="an-empty">Aucune source enregistrée</div>'}
      </div>
    </div>

    <!-- Dernières visites -->
    <div class="panel" style="padding:1.5rem">
      <div class="panel-title" style="margin-bottom:1rem">Dernières visites</div>
      <div style="overflow-x:auto">
        <table class="an-table">
          <thead><tr>
            <th>Heure</th><th>Visiteur</th><th>Appareil</th><th>Source</th><th>Type</th>
          </tr></thead>
          <tbody>
            ${analyticsData.slice(0,30).map(d => `
              <tr>
                <td>${fmtDatetime(d.created_at_iso)}</td>
                <td style="font-family:monospace;font-size:.75rem;color:rgba(255,255,255,.4)">${(d.visitor_id||'').slice(0,12)}…</td>
                <td>${d.device || '—'}</td>
                <td>${d.referrer || d.utm_source || 'direct'}</td>
                <td><span class="badge badge-${d.type === 'visit' ? 'new' : 'read'}">${d.type === 'visit' ? 'Visite' : d.label || 'Clic'}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Chart.js
  setTimeout(() => {
    const ctx = document.getElementById('an-chart');
    if (!ctx) return;
    if (analyticsChart) analyticsChart.destroy();
    analyticsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [{
          label: 'Visites',
          data: dayValues,
          backgroundColor: 'rgba(200,160,32,.55)',
          borderColor: 'rgba(200,160,32,.9)',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        ...chartOpts('Visites'),
        plugins: { ...chartOpts('Visites').plugins, legend: { display: false } }
      }
    });
  }, 50);
}
