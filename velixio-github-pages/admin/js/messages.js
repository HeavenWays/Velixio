/* ════════════════════════════════════════════
   messages.js — Gestion des leads & messages
════════════════════════════════════════════ */

let allMessages = [];
let activeMsg   = null;

/* ── Storage ── */
function getContacts() {
  try { return JSON.parse(localStorage.getItem(MSG_KEY) || '[]'); } catch { return []; }
}
function saveContacts(arr) {
  localStorage.setItem(MSG_KEY, JSON.stringify(arr));
}

function clearAllMessages() {
  if (!confirm('Supprimer tous les messages ? Cette action est irréversible.')) return;
  localStorage.removeItem(MSG_KEY);
  allMessages = [];
  activeMsg   = null;
  renderMsgSummary([]);
  renderMsgList([]);
  document.getElementById('msg-detail').innerHTML = renderMsgEmpty('Boite vide', 'Attendez une nouvelle demande.');
  updateNavBadge();
  showToast('Messages effacés', 'success');
}

/* ── Helpers ── */
const MSG_STATUS_LABELS = { new:'Nouveau', read:'Lu', replied:'Répondu', archived:'Archivé' };

function sortMessages(arr) {
  return [...arr].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}
function getStatusLabel(status) {
  return MSG_STATUS_LABELS[status] || status || 'Nouveau';
}
function getMsgPreview(text, limit = 110) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Aucun contenu.';
  return clean.length > limit ? clean.slice(0, limit - 1) + '…' : clean;
}
function getInitials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase() || '?';
}
function sanitizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
}

/* ── Builders de liens ── */
function buildPhoneHref(phone) {
  const clean = sanitizePhone(phone);
  return clean ? `tel:${clean}` : '';
}
function buildMailto(message) {
  const email = String(message?.email || '').trim();
  if (!email) return '';
  const subject = encodeURIComponent(`Re: ${message.subject || 'Votre demande Velixio'}`);
  const body    = encodeURIComponent(`Bonjour ${message.name || ''},\n\nMerci pour votre message. Nous revenons vers vous rapidement.\n\nVelixio`);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
function buildWhatsApp(phone, text = '') {
  const digits = sanitizePhone(phone).replace(/^\+/, '');
  if (!digits) return '';
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
function buildWaCall(phone) {
  /* Ouvre WhatsApp sur le contact — l'utilisateur peut ensuite appeler via WA */
  const digits = sanitizePhone(phone).replace(/^\+/, '');
  return digits ? `https://wa.me/${digits}` : '';
}
function buildPrefilledWhatsApp(message) {
  const plan    = getPlanInfo(message.plan);
  const planTxt = plan ? `\n\nFormule souhaitée : ${plan.label} (${plan.price})` : '';
  return buildWhatsApp(
    message.phone,
    `Bonjour ${message.name || ''},\n\nNous faisons suite à votre demande${message.subject ? ` concernant "${message.subject}"` : ''}.${planTxt}\n\nPouvez-vous nous préciser vos disponibilités pour un appel ?\n\nVelixio`
  );
}
function buildSmsHref(phone) {
  const clean = sanitizePhone(phone);
  return clean ? `sms:${clean}` : '';
}

function getConversationMessages(message, contacts = getContacts()) {
  const email = String(message?.email || '').trim().toLowerCase();
  const phone = sanitizePhone(message?.phone);
  return sortMessages(contacts.filter(item =>
    item.id === message.id ||
    (email && String(item.email || '').trim().toLowerCase() === email) ||
    (phone && sanitizePhone(item.phone) === phone)
  ));
}

/* ── Copier dans le presse-papier ── */
function copyToClipboard(text, label = 'Copié') {
  navigator.clipboard.writeText(text).then(() => showToast(`${label} copié ✓`, 'success')).catch(() => showToast('Impossible de copier', 'error'));
}

/* ── Rendu liste ── */
function renderMsgEmpty(title = 'Sélectionnez un message', text = "Choisissez un lead pour voir sa fiche et les actions rapides.") {
  return `
    <div class="msg-detail-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <div class="msg-detail-empty-title">${esc(title)}</div>
      <div style="font-size:13px;max-width:320px">${esc(text)}</div>
    </div>`;
}

function renderActionLink(href, label, icon, className = '') {
  if (!href) return `<span class="msg-action disabled ${className}" aria-disabled="true">${icon}<span>${esc(label)}</span></span>`;
  const external = href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : '';
  return `<a class="msg-action ${className}" href="${esc(href)}"${external}>${icon}<span>${esc(label)}</span></a>`;
}

function getFilteredMessages() {
  const q  = (document.getElementById('msg-search').value || '').toLowerCase().trim();
  const st = document.getElementById('msg-filter').value;
  return sortMessages(allMessages.filter(m => {
    const matchStatus   = !st || m.status === st;
    const haystack = [m.name, m.email, m.phone, m.subject, m.message, m.plan].filter(Boolean).join(' ').toLowerCase();
    return matchStatus && (!q || haystack.includes(q));
  }));
}

function updateNavBadge() {
  const n     = getContacts().filter(c => c.status === 'new').length;
  const badge = document.getElementById('nav-badge');
  if (n > 0) { badge.textContent = n; badge.style.display = 'inline'; }
  else badge.style.display = 'none';
}

function loadMessages() {
  allMessages = sortMessages(getContacts());
  const filtered = renderMsgSummary(getFilteredMessages());
  renderMsgList(filtered);
  updateNavBadge();
  if (activeMsg && allMessages.some(m => m.id === activeMsg)) { renderMessageDetail(activeMsg); return; }
  activeMsg = null;
  document.getElementById('msg-detail').innerHTML = renderMsgEmpty(
    filtered.length ? 'Sélectionnez un message' : 'Aucun message',
    filtered.length ? "Affiche la fiche client, l'historique et les actions rapides." : 'Soumettez le formulaire de contact pour alimenter la boite de réception.'
  );
}

function setMsgFilter(status) {
  document.getElementById('msg-filter').value = status;
  filterMsgs();
}

function renderMsgSummary(filtered) {
  const counts = allMessages.reduce((acc, m) => {
    acc.all += 1; acc[m.status] = (acc[m.status] || 0) + 1; return acc;
  }, { all:0, new:0, read:0, replied:0, archived:0 });
  document.getElementById('msg-count-lbl').textContent  = `${filtered.length} message(s)`;
  document.getElementById('msg-new-pill').textContent   = `${counts.new} nouveau${counts.new > 1 ? 'x' : ''}`;
  document.getElementById('msg-stat-all').textContent     = counts.all;
  document.getElementById('msg-stat-new').textContent     = counts.new;
  document.getElementById('msg-stat-read').textContent    = counts.read;
  document.getElementById('msg-stat-replied').textContent = counts.replied;
  document.querySelectorAll('.msg-stat').forEach(btn => {
    btn.classList.toggle('is-active', (btn.dataset.filter || '') === document.getElementById('msg-filter').value);
  });
  return filtered;
}

function filterMsgs() {
  const filtered = renderMsgSummary(getFilteredMessages());
  renderMsgList(filtered);
  if (activeMsg && allMessages.some(m => m.id === activeMsg)) renderMessageDetail(activeMsg);
  else if (!filtered.length) document.getElementById('msg-detail').innerHTML = renderMsgEmpty('Aucun résultat', 'Ajustez les filtres ou attendez une nouvelle demande.');
}

function renderMsgList(messages) {
  const container = document.getElementById('msg-list');
  if (!messages.length) {
    container.innerHTML = `<div class="empty-state" style="padding:36px 24px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <div class="empty-state-title">Aucun message trouvé</div>
      <p>Soumettez le formulaire depuis le site ou changez les filtres.</p>
    </div>`;
    return;
  }
  container.innerHTML = messages.map(m => {
    const plan = getPlanInfo(m.plan);
    return `
    <button type="button" class="msg-item ${m.status === 'new' ? 'unread' : ''} ${activeMsg === m.id ? 'active' : ''}" onclick="openMsg(${m.id})">
      <div class="msg-item-top">
        <div class="msg-item-person">
          <div class="msg-avatar">${esc(getInitials(m.name))}</div>
          <div style="min-width:0">
            <div class="msg-item-name">${esc(m.name || 'Client inconnu')}</div>
            <div class="msg-item-email">${esc(m.email || 'Pas d\'email')}</div>
          </div>
        </div>
        <div class="msg-item-time">${fmtRelative(m.created_at)}</div>
      </div>
      <div class="msg-item-subj">${esc(m.subject || 'Demande sans objet')}</div>
      <div class="msg-item-preview">${esc(getMsgPreview(m.message))}</div>
      <div class="msg-item-bottom">
        <span class="badge badge-${m.status}">${esc(getStatusLabel(m.status))}</span>
        <div class="msg-channel">
          ${plan ? `<span class="msg-plan-pill">⭐ ${esc(plan.label)}</span>` : ''}
          ${m.phone ? '<span class="msg-channel-pill">WhatsApp</span>' : '<span class="msg-channel-pill">Email</span>'}
        </div>
      </div>
    </button>`;
  }).join('');
}

function openMsg(id) {
  activeMsg = id;
  renderMessageDetail(id, true);
  renderMsgList(renderMsgSummary(getFilteredMessages()));
}

/* ════════════════════════════════════════════
   Rendu du détail — interface enrichie
════════════════════════════════════════════ */
function renderMessageDetail(id, markRead = false) {
  const contacts = getContacts();
  const m        = contacts.find(item => item.id === id);
  if (!m) {
    activeMsg = null;
    document.getElementById('msg-detail').innerHTML = renderMsgEmpty('Message introuvable', 'Ce message a peut-être été supprimé.');
    return;
  }

  if (markRead && m.status === 'new') {
    m.status  = 'read';
    m.read_at = new Date().toISOString();
    saveContacts(contacts);
    allMessages = sortMessages(contacts);
    updateNavBadge();
  }

  const history          = getConversationMessages(m, contacts);
  const mailHref         = buildMailto(m);
  const callHref         = buildPhoneHref(m.phone);
  const waHref           = buildWaCall(m.phone);
  const waPrefilledHref  = buildPrefilledWhatsApp(m);
  const smsHref          = buildSmsHref(m.phone);
  const plan             = getPlanInfo(m.plan);
  const firstSeen        = history[history.length - 1];
  const lastSeen         = history[0];

  /* ── Icônes SVG réutilisés ── */
  const icoMail   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
  const icoPhone  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.52 19.52 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.79.62 2.64a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.44-1.28a2 2 0 0 1 2.11-.45c.85.29 1.74.5 2.64.62A2 2 0 0 1 22 16.92z"/></svg>`;
  const icoWa     = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>`;
  const icoSms    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="9" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="15" y1="10" x2="15" y2="10"/></svg>`;
  const icoCopy   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const icoCheck  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
  const icoTrash  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

  document.getElementById('msg-detail').innerHTML = `
    <div class="msg-detail-shell">

      <!-- ── En-tête lead ── -->
      <div class="msg-hero">
        <div class="msg-hero-top">
          <div style="flex:1;min-width:0">
            <div class="msg-hero-kicker">Lead · ${esc(getStatusLabel(m.status))}</div>
            <div class="msg-subj">${esc(m.subject || 'Demande sans objet')}</div>
            <div class="msg-hero-meta">
              <span class="badge badge-${m.status}">${esc(getStatusLabel(m.status))}</span>
              <span class="msg-pill">Reçu ${fmtDatetime(m.created_at)}</span>
              <span class="msg-pill">${history.length} interaction(s)</span>
              ${m.read_at ? `<span class="msg-pill">Ouvert ${fmtRelative(m.read_at)}</span>` : ''}
              ${plan ? `<span class="msg-plan-pill">⭐ ${esc(plan.label)} · ${esc(plan.price)}</span>` : ''}
            </div>
          </div>
          <div class="msg-contact-card">
            <div class="msg-contact-label">Contact principal</div>
            <div class="msg-contact-name">${esc(m.name || 'Client inconnu')}</div>
            <div class="msg-contact-sub">${esc(m.email || 'Pas d\'email')}</div>
            <div class="msg-contact-sub" style="display:flex;align-items:center;gap:6px">
              ${m.phone ? `
                <a href="${esc(callHref)}" style="color:var(--gold2);font-weight:600">${esc(m.phone)}</a>
                <button class="copy-inline" onclick="copyToClipboard('${esc(m.phone)}','Numéro')" title="Copier le numéro">
                  ${icoCopy}
                </button>` : 'Téléphone non renseigné'}
            </div>
          </div>
        </div>

        <!-- ── Actions rapides groupées ── -->
        <div style="margin-top:20px">
          <div class="action-group">
            <div class="action-group-label">Contact direct</div>
            <div class="msg-action-row">
              ${renderActionLink(mailHref, 'Répondre par email', icoMail, 'primary')}
              ${renderActionLink(callHref, 'Appeler', icoPhone, 'call')}
              ${renderActionLink(smsHref, 'SMS', icoSms, '')}
            </div>
          </div>
          <div class="action-group" style="margin-top:12px">
            <div class="action-group-label">WhatsApp</div>
            <div class="msg-action-row">
              ${renderActionLink(waHref, 'Ouvrir WhatsApp', icoWa, 'whatsapp')}
              ${renderActionLink(waPrefilledHref, 'Message pré-rempli', icoWa, 'whatsapp')}
              ${m.phone ? `<button class="msg-action copy-btn" onclick="copyToClipboard('${esc(sanitizePhone(m.phone))}','Numéro WhatsApp')">${icoCopy}<span>Copier le numéro</span></button>` : ''}
              ${m.email ? `<button class="msg-action copy-btn" onclick="copyToClipboard('${esc(m.email)}','Email')">${icoCopy}<span>Copier l'email</span></button>` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Corps ── -->
      <div class="msg-detail-grid">
        <!-- Colonne gauche -->
        <div style="display:grid;gap:20px">

          ${plan ? `
          <div class="msg-card" style="background:linear-gradient(135deg,rgba(200,160,32,.1),rgba(200,160,32,.04));border-color:var(--gold-border)">
            <div class="msg-card-title">Formule souhaitée</div>
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
              <div>
                <div style="font-size:20px;font-weight:700;color:var(--gold2)">${esc(plan.label)}</div>
                <div style="font-size:13px;color:var(--muted);margin-top:2px">${esc(plan.category)} · ${esc(plan.price)}</div>
              </div>
              <span class="msg-plan-pill" style="font-size:12px;padding:6px 14px">⭐ Plan sélectionné</span>
            </div>
          </div>` : ''}

          <div class="msg-card">
            <div class="msg-card-title">Message du client</div>
            <div class="msg-body">${esc(m.message || 'Aucun contenu fourni.')}</div>
            <div class="msg-note">Canal privilégié : ${m.phone ? 'téléphone et WhatsApp disponibles' : 'email uniquement'}.</div>
          </div>

          <div class="msg-card">
            <div class="msg-card-title">Contexte de suivi</div>
            <div class="msg-meta-grid">
              <div class="msg-info-row">
                <div><div class="msg-info-label">Premier contact</div><div class="msg-info-value">${fmtDatetime(firstSeen?.created_at)}</div></div>
                <div style="text-align:right"><div class="msg-info-label">Dernier contact</div><div class="msg-info-value">${fmtDatetime(lastSeen?.created_at)}</div></div>
              </div>
              <div class="msg-info-row">
                <div><div class="msg-info-label">Dernière lecture</div><div class="msg-info-value">${m.read_at ? fmtDatetime(m.read_at) : 'Pas encore'}</div></div>
                <div style="text-align:right"><div class="msg-info-label">Canal de réponse</div><div class="msg-info-value">${m.phone ? 'Téléphone / WhatsApp' : 'Email'}</div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Colonne droite -->
        <div style="display:grid;gap:20px;align-content:start">
          <div class="msg-card">
            <div class="msg-card-title">Fiche client</div>
            <div class="msg-meta-grid">
              <div class="msg-info-row">
                <div><div class="msg-info-label">Nom complet</div><div class="msg-info-value">${esc(m.name || 'Non renseigné')}</div></div>
              </div>
              <div class="msg-info-row">
                <div>
                  <div class="msg-info-label">Email</div>
                  <div class="msg-info-value" style="display:flex;align-items:center;gap:8px">
                    ${m.email ? `<a href="${esc(`mailto:${m.email}`)}">${esc(m.email)}</a>
                      <button class="copy-inline" onclick="copyToClipboard('${esc(m.email)}','Email')" title="Copier">${icoCopy}</button>` : 'Non renseigné'}
                  </div>
                </div>
              </div>
              <div class="msg-info-row">
                <div>
                  <div class="msg-info-label">Téléphone / WhatsApp</div>
                  <div class="msg-info-value" style="display:flex;align-items:center;gap:8px">
                    ${m.phone ? `<a href="${esc(callHref)}" class="phone-link">${icoPhone} ${esc(m.phone)}</a>
                      <button class="copy-inline" onclick="copyToClipboard('${esc(m.phone)}','Numéro')" title="Copier">${icoCopy}</button>` : 'Non renseigné'}
                  </div>
                </div>
              </div>
              ${m.plan ? `<div class="msg-info-row">
                <div><div class="msg-info-label">Formule choisie</div><div class="msg-info-value" style="color:var(--gold2)">${esc(plan ? plan.label + ' · ' + plan.price : m.plan)}</div></div>
              </div>` : ''}
              <div class="msg-info-row">
                <div><div class="msg-info-label">Historique</div><div class="msg-info-value">${history.length} message(s) liés</div></div>
              </div>
            </div>
          </div>

          <div class="msg-card">
            <div class="msg-card-title">Historique client</div>
            <div class="msg-history">
              ${history.length ? history.map(item => `
                <button type="button" class="msg-history-item ${item.id === m.id ? 'current' : ''}" onclick="openMsg(${item.id})">
                  <div class="msg-history-head">
                    <div class="msg-history-subj">${esc(item.subject || 'Demande sans objet')}</div>
                    <div class="msg-item-time">${fmtRelative(item.created_at)}</div>
                  </div>
                  <div class="msg-history-preview">${esc(getMsgPreview(item.message, 96))}</div>
                  <div class="msg-history-meta">
                    <span class="badge badge-${item.status}">${esc(getStatusLabel(item.status))}</span>
                    <span class="msg-item-time">${fmtDatetime(item.created_at)}</span>
                  </div>
                </button>`).join('') : '<div class="msg-history-empty">Aucun historique pour ce contact.</div>'}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Footer actions ── -->
      <div class="msg-actions-footer">
        <div class="msg-status-group">
          <span class="msg-info-label">Statut</span>
          <select class="status-select msg-select" onchange="updateMsgStatus(${m.id}, this.value)">
            <option value="new"      ${m.status==='new'      ? 'selected':''}>Nouveau</option>
            <option value="read"     ${m.status==='read'     ? 'selected':''}>Lu</option>
            <option value="replied"  ${m.status==='replied'  ? 'selected':''}>Répondu</option>
            <option value="archived" ${m.status==='archived' ? 'selected':''}>Archivé</option>
          </select>
          <button class="btn btn-ghost" onclick="updateMsgStatus(${m.id},'replied')">${icoCheck} Marquer répondu</button>
        </div>
        <button class="btn btn-danger" onclick="deleteMsg(${m.id})">${icoTrash} Supprimer</button>
      </div>
    </div>`;
}

/* ── Mise à jour statut ── */
function updateMsgStatus(id, status) {
  const contacts = getContacts();
  const m        = contacts.find(item => item.id === id);
  if (!m) return;
  m.status = status;
  if (status === 'new')     delete m.read_at;
  if (status === 'read' || status === 'replied') m.read_at = m.read_at || new Date().toISOString();
  if (status === 'replied') m.replied_at = new Date().toISOString();
  saveContacts(contacts);
  allMessages = sortMessages(contacts);
  updateNavBadge();
  renderMsgList(renderMsgSummary(getFilteredMessages()));
  if (activeMsg && allMessages.some(item => item.id === activeMsg)) renderMessageDetail(activeMsg);
  showToast('Statut mis à jour ✓', 'success');
}

/* ── Suppression ── */
function deleteMsg(id) {
  if (!confirm('Supprimer ce message définitivement ?')) return;
  const contacts = getContacts().filter(item => item.id !== id);
  saveContacts(contacts);
  allMessages = sortMessages(contacts);
  if (activeMsg === id) activeMsg = null;
  updateNavBadge();
  const filtered = renderMsgSummary(getFilteredMessages());
  renderMsgList(filtered);
  document.getElementById('msg-detail').innerHTML = renderMsgEmpty(
    filtered.length ? 'Sélectionnez un message' : 'Boite vide',
    filtered.length ? 'Choisissez un autre lead.' : 'Soumettez le formulaire de contact pour recevoir un nouveau message.'
  );
  showToast('Message supprimé', 'success');
}

/* ── Écoute temps réel (autre onglet) ── */
window.addEventListener('storage', event => {
  if (event.key !== MSG_KEY) return;
  allMessages = sortMessages(getContacts());
  updateNavBadge();
  if (!document.getElementById('view-messages').classList.contains('active')) return;
  const filtered = renderMsgSummary(getFilteredMessages());
  renderMsgList(filtered);
  if (activeMsg && allMessages.some(m => m.id === activeMsg)) renderMessageDetail(activeMsg);
  else if (!filtered.length) document.getElementById('msg-detail').innerHTML = renderMsgEmpty('Aucun message', '');
});
