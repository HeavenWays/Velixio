/* ════════════════════════════════════════════
   analytics-admin.js — Vue Analytics admin
════════════════════════════════════════════ */

let analyticsData  = [];
let analyticsChart = null;
let deviceChart    = null;
let analyticsRange = 7;

/* ═══════════════════════════════════════════
   PÉRIODE & CHARGEMENT
═══════════════════════════════════════════ */
function setAnalyticsRange(days) {
  analyticsRange = days;
  document.querySelectorAll('.btn-period[data-range]').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.range) === days);
  });
  loadAnalytics();
}

async function loadAnalytics() {
  const body = document.getElementById('analytics-body');
  if (!body) return;
  body.innerHTML = buildSkeleton();

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
    body.innerHTML = `<div class="an-empty"><div class="an-empty-ico">⚠️</div>
      Erreur de chargement : ${esc(e.message || 'inconnue')}<br>
      <small style="color:var(--muted2);margin-top:.3rem;display:block">Vérifiez les index Firestore dans la console Firebase.</small></div>`;
  }
}

/* ═══════════════════════════════════════════
   MÉTRIQUES
═══════════════════════════════════════════ */
function computeMetrics(data) {
  const visits = data.filter(d => d.type === 'visit');
  const clicks = data.filter(d => d.type === 'click');
  const vids   = [...new Set(visits.map(d => d.visitor_id))];

  // Devices
  const devices = { mobile:0, desktop:0, tablet:0 };
  visits.forEach(v => { if (devices[v.device] !== undefined) devices[v.device]++; });

  // Fréquence / récurrence
  const freq = {};
  visits.forEach(v => { freq[v.visitor_id] = (freq[v.visitor_id] || 0) + 1; });
  const freqVals  = Object.values(freq);
  const avgFreq   = freqVals.length ? (freqVals.reduce((a,b)=>a+b,0)/freqVals.length).toFixed(1) : 0;
  const returning = freqVals.filter(v => v > 1).length;

  // Durée moyenne
  const durations  = visits.map(v => v.time_on_page || 0).filter(t => t > 0);
  const avgDuration = durations.length
    ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length) : 0;

  // Taux de clic (clics / visites)
  const ctr = visits.length ? ((clicks.length / visits.length) * 100).toFixed(1) : 0;

  // Top clics
  const clickMap = {};
  clicks.forEach(c => { clickMap[c.label] = (clickMap[c.label]||0)+1; });
  const topClicks = Object.entries(clickMap).sort((a,b)=>b[1]-a[1]).slice(0,8);

  // Sources de trafic
  const srcMap = {};
  visits.forEach(v => { const s = v.referrer||'direct'; srcMap[s]=(srcMap[s]||0)+1; });
  const topSources = Object.entries(srcMap).sort((a,b)=>b[1]-a[1]).slice(0,6);

  // Visites par jour
  const dayMap = {};
  visits.forEach(v => {
    const day = (v.created_at_iso||'').slice(0,10);
    if (day) dayMap[day] = (dayMap[day]||0)+1;
  });

  // Clics par heure (0–23)
  const hourMap = Array(24).fill(0);
  visits.forEach(v => {
    if (v.created_at_iso) {
      const h = new Date(v.created_at_iso).getHours();
      hourMap[h]++;
    }
  });

  // Funnel : visites → clics trackés → clics contact
  const contactClicks = clicks.filter(c =>
    c.label && (c.label.toLowerCase().includes('contact') ||
                c.label.toLowerCase().includes('whatsapp') ||
                c.label.toLowerCase().includes('appel') ||
                c.label.toLowerCase().includes('formulaire'))
  ).length;
  const planClicks = clicks.filter(c => c.label && c.label.toLowerCase().includes('plan')).length;

  return {
    visits, clicks, vids, devices, avgFreq, returning,
    avgDuration, ctr, topClicks, topSources, dayMap, hourMap,
    contactClicks, planClicks
  };
}

/* ═══════════════════════════════════════════
   UTILITAIRES
═══════════════════════════════════════════ */
function fmtDuration(s) {
  if (!s || s < 1) return '–';
  if (s < 60) return s + 's';
  return Math.floor(s/60) + 'm ' + (s%60) + 's';
}

function buildSkeleton() {
  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">
    ${Array(8).fill(`<div class="an-skeleton" style="height:90px"></div>`).join('')}
  </div>
  <div class="an-skeleton" style="height:240px;margin-bottom:1.2rem"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.2rem">
    <div class="an-skeleton" style="height:200px"></div>
    <div class="an-skeleton" style="height:200px"></div>
  </div>`;
}

function exportCSV() {
  if (!analyticsData.length) return;
  const headers = ['Date','Type','Visiteur','Appareil','Source','Label','Durée (s)'];
  const rows = analyticsData.map(d => [
    fmtDatetime(d.created_at_iso),
    d.type||'',
    (d.visitor_id||'').slice(0,12),
    d.device||'',
    d.referrer||d.utm_source||'direct',
    d.label||'',
    d.time_on_page||''
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `velixio-analytics-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

/* ═══════════════════════════════════════════
   RENDU PRINCIPAL
═══════════════════════════════════════════ */
function renderAnalytics() {
  const m  = computeMetrics(analyticsData);
  const total = m.visits.length;

  // ── KPIs ──
  const kpis = [
    { label:'Visiteurs uniques',    val:m.vids.length,           icon:'👤', color:'#e8bf45', bg:'rgba(232,191,69,.1)' },
    { label:'Total visites',        val:m.visits.length,         icon:'👁',  color:'#7dd3fc', bg:'rgba(125,211,252,.1)' },
    { label:'Clics trackés',        val:m.clicks.length,         icon:'🖱️', color:'#86efac', bg:'rgba(134,239,172,.1)' },
    { label:'Durée moy./visite',    val:fmtDuration(m.avgDuration), icon:'⏱️', color:'#fb923c', bg:'rgba(251,146,60,.1)' },
    { label:'Visites/visiteur',     val:m.avgFreq,               icon:'🔄', color:'#c4b5fd', bg:'rgba(196,181,253,.1)' },
    { label:'Visiteurs récurrents', val:m.returning,             icon:'↩️', color:'#fdba74', bg:'rgba(253,186,116,.1)' },
    { label:'Taux de clic',         val:m.ctr+'%',               icon:'🎯', color:'#f9a8d4', bg:'rgba(249,168,212,.1)' },
    { label:'Clics contact',        val:m.contactClicks,         icon:'💬', color:'#6ee7b7', bg:'rgba(110,231,183,.1)' },
  ];

  // ── Jours pour graphique ──
  const days = [];
  for (let i = analyticsRange-1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days.push(d.toISOString().slice(0,10));
  }
  const dayLabels = days.map(d => { const [,mo,dy]=d.split('-'); return `${dy}/${mo}`; });
  const dayValues = days.map(d => m.dayMap[d]||0);

  // ── Funnel ──
  const funnelSteps = [
    { icon:'🌐', label:'Visites totales',       count:m.visits.length,   pct:100 },
    { icon:'🖱️', label:'Clics sur CTA',         count:m.clicks.length,   pct:m.visits.length ? Math.round(m.clicks.length/m.visits.length*100) : 0 },
    { icon:'💬', label:'Clics contact/WhatsApp', count:m.contactClicks,   pct:m.visits.length ? Math.round(m.contactClicks/m.visits.length*100) : 0 },
    { icon:'📋', label:'Clics sur un plan',      count:m.planClicks,      pct:m.visits.length ? Math.round(m.planClicks/m.visits.length*100) : 0 },
  ];

  // ── Heatmap heures ──
  const maxHour = Math.max(...m.hourMap, 1);
  const heatCells = m.hourMap.map((v,h) => {
    const intensity = v / maxHour;
    const alpha = 0.08 + intensity * 0.72;
    return `<div class="an-heat-cell" style="background:rgba(200,160,32,${alpha.toFixed(2)})"
      title="${h}h : ${v} visite${v>1?'s':''} "></div>`;
  }).join('');
  const heatLabels = Array.from({length:24},(_,h)=>
    `<span>${h%3===0?h+'h':''}</span>`
  ).join('');

  // ── Device breakdown text ──
  const devTotal = m.devices.desktop + m.devices.mobile + m.devices.tablet || 1;
  const devPct   = {
    desktop: Math.round(m.devices.desktop/devTotal*100),
    mobile:  Math.round(m.devices.mobile/devTotal*100),
    tablet:  Math.round(m.devices.tablet/devTotal*100),
  };

  // ── Sources (barres) ──
  const maxSrc = m.topSources.length ? m.topSources[0][1] : 1;
  const srcBars = m.topSources.length
    ? m.topSources.map(([src,cnt]) => `
        <div class="an-bar-row">
          <div class="an-bar-meta">
            <span class="an-bar-label">${esc(src)}</span>
            <span class="an-bar-val">${cnt}</span>
          </div>
          <div class="an-bar-track"><div class="an-bar-fill" style="width:${Math.round(cnt/maxSrc*100)}%"></div></div>
        </div>`).join('')
    : `<div class="an-empty"><div class="an-empty-ico">📭</div>Aucune source</div>`;

  // ── Clics (barres) ──
  const maxClk = m.topClicks.length ? m.topClicks[0][1] : 1;
  const clkBars = m.topClicks.length
    ? m.topClicks.map(([label,cnt],i) => `
        <div class="an-bar-row">
          <div class="an-bar-meta">
            <span class="an-bar-label">${esc(label)}</span>
            <span class="an-bar-val">${cnt}</span>
          </div>
          <div class="an-bar-track"><div class="an-bar-fill ${i%3===1?'blue':i%3===2?'green':''}" style="width:${Math.round(cnt/maxClk*100)}%"></div></div>
        </div>`).join('')
    : `<div class="an-empty"><div class="an-empty-ico">🖱️</div>Aucun clic enregistré</div>`;

  // ── Tableau 30 derniers événements ──
  const tableRows = analyticsData.slice(0,40).map(d => `
    <tr>
      <td class="muted">${fmtDatetime(d.created_at_iso)}</td>
      <td><span class="mono">${(d.visitor_id||'').slice(0,10)}…</span></td>
      <td>${d.device||'—'}</td>
      <td class="muted">${d.type==='visit' ? fmtDuration(d.time_on_page||0) : '—'}</td>
      <td class="muted">${esc(d.referrer||d.utm_source||'direct')}</td>
      <td><span class="badge badge-${d.type==='visit'?'new':'read'}">${d.type==='visit'?'Visite':esc(d.label||'Clic')}</span></td>
    </tr>`).join('');

  /* ════════ HTML FINAL ════════ */
  document.getElementById('analytics-body').innerHTML = `

    <!-- ─── KPI CARDS ─── -->
    <div class="an-kpis">
      ${kpis.map(k=>`
        <div class="an-kpi">
          <div class="an-kpi-icon-wrap" style="background:${k.bg}">
            <span style="font-size:1.05rem">${k.icon}</span>
          </div>
          <div class="an-kpi-body">
            <div class="an-kpi-val" style="color:${k.color}">${k.val}</div>
            <div class="an-kpi-label">${k.label}</div>
          </div>
        </div>`).join('')}
    </div>

    <!-- ─── GRAPHIQUE VISITES PAR JOUR ─── -->
    <div class="an-panel" style="margin-bottom:1.2rem">
      <div class="an-panel-head">
        <div>
          <div class="an-panel-title">Visites par jour</div>
          <div class="an-panel-sub">${analyticsRange} derniers jours · ${total} visite${total>1?'s':''} au total</div>
        </div>
      </div>
      <div class="an-panel-body">
        <div class="an-chart-wrap" style="height:210px">
          <canvas id="an-chart-visits"></canvas>
        </div>
      </div>
    </div>

    <!-- ─── DEVICES + HEATMAP HEURES ─── -->
    <div class="an-grid-2">
      <div class="an-panel">
        <div class="an-panel-head">
          <div class="an-panel-title">Répartition des appareils</div>
        </div>
        <div class="an-panel-body" style="display:flex;align-items:center;gap:1.5rem">
          <div style="position:relative;width:140px;height:140px;flex-shrink:0">
            <canvas id="an-chart-devices"></canvas>
          </div>
          <div style="flex:1">
            ${[
              ['Desktop','💻',m.devices.desktop,devPct.desktop,'#7dd3fc'],
              ['Mobile','📱',m.devices.mobile,devPct.mobile,'#e8bf45'],
              ['Tablette','📟',m.devices.tablet,devPct.tablet,'#c4b5fd'],
            ].map(([lbl,ico,cnt,pct,col])=>`
              <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.7rem">
                <span>${ico}</span>
                <span style="flex:1;font-size:.82rem;color:var(--white)">${lbl}</span>
                <span style="font-size:.8rem;font-weight:700;color:${col}">${cnt} <span style="color:var(--muted);font-weight:400">(${pct}%)</span></span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="an-panel">
        <div class="an-panel-head">
          <div class="an-panel-title">Heures de pointe</div>
          <div class="an-panel-sub">Visites par heure</div>
        </div>
        <div class="an-panel-body">
          <div class="an-heat-grid">${heatCells}</div>
          <div class="an-heat-labels">${heatLabels}</div>
          <div style="display:flex;align-items:center;gap:.5rem;margin-top:.8rem">
            <span style="font-size:.7rem;color:var(--muted2)">Faible</span>
            <div style="flex:1;height:4px;border-radius:99px;background:linear-gradient(90deg,rgba(200,160,32,.1),rgba(200,160,32,.9))"></div>
            <span style="font-size:.7rem;color:var(--muted2)">Élevé</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── TOP CLICS + SOURCES ─── -->
    <div class="an-grid-2">
      <div class="an-panel">
        <div class="an-panel-head">
          <div class="an-panel-title">Top clics</div>
          <div class="an-panel-sub">${m.clicks.length} clics totaux</div>
        </div>
        <div class="an-panel-body">${clkBars}</div>
      </div>
      <div class="an-panel">
        <div class="an-panel-head">
          <div class="an-panel-title">Sources de trafic</div>
          <div class="an-panel-sub">${m.topSources.length} source${m.topSources.length>1?'s':''} identifiée${m.topSources.length>1?'s':''}</div>
        </div>
        <div class="an-panel-body">${srcBars}</div>
      </div>
    </div>

    <!-- ─── FUNNEL DE CONVERSION ─── -->
    <div class="an-panel" style="margin-top:1.2rem;margin-bottom:1.2rem">
      <div class="an-panel-head">
        <div>
          <div class="an-panel-title">Funnel de conversion</div>
          <div class="an-panel-sub">Du visiteur au contact — sur les ${analyticsRange} derniers jours</div>
        </div>
      </div>
      <div class="an-panel-body">
        <div class="an-funnel">
          ${funnelSteps.map((s,i) => `
            ${i>0?`<div class="an-funnel-arrow">▼</div>`:''}
            <div class="an-funnel-step">
              <div class="an-funnel-fill" style="width:${s.pct}%"></div>
              <span class="an-funnel-icon">${s.icon}</span>
              <span class="an-funnel-label">${s.label}</span>
              <span class="an-funnel-count">${s.count}</span>
              <span class="an-funnel-rate">${s.pct}%</span>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- ─── JOURNAL DES ÉVÉNEMENTS ─── -->
    <div class="an-panel">
      <div class="an-panel-head">
        <div>
          <div class="an-panel-title">Journal des événements</div>
          <div class="an-panel-sub">40 derniers enregistrements · ${analyticsData.length} total</div>
        </div>
        <button class="btn-export" onclick="exportCSV()">
          ⬇ Exporter CSV
        </button>
      </div>
      <div class="an-table-wrap">
        <table class="an-table">
          <thead><tr>
            <th>Date / Heure</th>
            <th>Visiteur</th>
            <th>Appareil</th>
            <th>Durée</th>
            <th>Source</th>
            <th>Événement</th>
          </tr></thead>
          <tbody>
            ${tableRows || `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted)">Aucune donnée pour cette période</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  /* ════════ CHARTS ════════ */
  setTimeout(() => {
    // Chart visites/jour
    const ctx1 = document.getElementById('an-chart-visits');
    if (ctx1) {
      if (analyticsChart) analyticsChart.destroy();
      analyticsChart = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: dayLabels,
          datasets: [{
            label: 'Visites',
            data: dayValues,
            backgroundColor: ctx1.getContext('2d') ? (() => {
              const g = ctx1.getContext('2d').createLinearGradient(0,0,0,210);
              g.addColorStop(0,'rgba(200,160,32,.7)');
              g.addColorStop(1,'rgba(200,160,32,.15)');
              return g;
            })() : 'rgba(200,160,32,.5)',
            borderColor: 'rgba(200,160,32,.9)',
            borderWidth: 1.5,
            borderRadius: 5,
            borderSkipped: false,
          }]
        },
        options: {
          ...chartOpts('Visites'),
          plugins: { ...chartOpts('Visites').plugins, legend:{ display:false } }
        }
      });
    }

    // Chart devices donut
    const ctx2 = document.getElementById('an-chart-devices');
    if (ctx2) {
      if (deviceChart) deviceChart.destroy();
      deviceChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Desktop','Mobile','Tablette'],
          datasets: [{
            data: [m.devices.desktop, m.devices.mobile, m.devices.tablet],
            backgroundColor: ['rgba(125,211,252,.8)','rgba(232,191,69,.8)','rgba(196,181,253,.8)'],
            borderColor: ['#7dd3fc','#e8bf45','#c4b5fd'],
            borderWidth: 1.5,
          }]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          cutout:'72%',
          plugins:{
            legend:{ display:false },
            tooltip:{
              backgroundColor:'#141419', borderColor:'rgba(255,255,255,.1)', borderWidth:1,
              titleColor:'#F9F9F7', bodyColor:'rgba(249,249,247,.6)', padding:10
            }
          }
        }
      });
    }
  }, 60);
}
