/* ════════════════════════════════════════════
   analytics.js — Tracking visiteurs & clics
   Stockage Firestore · Collection : site_analytics
════════════════════════════════════════════ */

(function () {
  /* ── Attendre Firebase ── */
  function waitForFirebase(cb, tries) {
    tries = tries || 0;
    if (tries > 40) return;
    if (window.db) { cb(); }
    else { setTimeout(function () { waitForFirebase(cb, tries + 1); }, 250); }
  }

  /* ── Générer / récupérer un ID visiteur anonyme (sessionStorage) ── */
  function getVisitorId() {
    var key = 'vlx_vid';
    var vid = sessionStorage.getItem(key);
    if (!vid) {
      vid = 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(key, vid);
    }
    return vid;
  }

  /* ── Détection device ── */
  function getDevice() {
    var ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  /* ── Récupérer source UTM ── */
  function getSource() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source:   params.get('utm_source')   || '',
      utm_medium:   params.get('utm_medium')   || '',
      utm_campaign: params.get('utm_campaign') || '',
      referrer:     document.referrer ? new URL(document.referrer).hostname : 'direct',
    };
  }

  /* ── Enregistrer une visite ── */
  var visitDocId = null;
  var pageStart  = Date.now();

  function trackVisit() {
    try {
      var src = getSource();
      db.collection('site_analytics').add({
        type:           'visit',
        visitor_id:     getVisitorId(),
        page:           window.location.pathname,
        device:         getDevice(),
        referrer:       src.referrer,
        utm_source:     src.utm_source,
        utm_medium:     src.utm_medium,
        utm_campaign:   src.utm_campaign,
        screen_w:       screen.width,
        screen_h:       screen.height,
        lang:           navigator.language || '',
        time_on_page:   0,
        created_at:     firebase.firestore.FieldValue.serverTimestamp(),
        created_at_iso: new Date().toISOString(),
      }).then(function (ref) {
        visitDocId = ref.id;
      });
    } catch (e) { /* silencieux */ }
  }

  /* ── Mettre à jour le temps passé sur la page ── */
  function flushDuration() {
    if (!visitDocId) return;
    try {
      var seconds = Math.round((Date.now() - pageStart) / 1000);
      if (seconds < 1) return;
      db.collection('site_analytics').doc(visitDocId).update({
        time_on_page: seconds
      });
    } catch (e) { /* silencieux */ }
  }

  /* ── Tracker la durée via visibilitychange + beforeunload ── */
  function attachDurationTracker() {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') { flushDuration(); }
    });
    window.addEventListener('beforeunload', flushDuration);
    /* Mise à jour périodique toutes les 30s (utilisateurs longue durée) */
    setInterval(flushDuration, 30000);
  }

  /* ── Enregistrer un clic sur élément clé ── */
  function trackClick(label, target) {
    try {
      db.collection('site_analytics').add({
        type:           'click',
        visitor_id:     getVisitorId(),
        label:          label,
        target:         target || '',
        page:           window.location.pathname,
        device:         getDevice(),
        created_at:     firebase.firestore.FieldValue.serverTimestamp(),
        created_at_iso: new Date().toISOString(),
      });
    } catch (e) { /* silencieux */ }
  }

  /* ── Attacher les listeners de clics (une seule fois) ── */
  var clicksAttached = false;
  function attachClickTrackers() {
    if (clicksAttached) return;
    clicksAttached = true;

    var selectors = [
      { sel: '.btn-primary',             label: 'CTA Démarrer projet' },
      { sel: '[href="#pricing"]',        label: 'Clic Tarifs' },
      { sel: '[href="#contact"]',        label: 'Clic Contact' },
      { sel: '.wa-float',                label: 'WhatsApp flottant' },
      { sel: '.modal-card.phone',        label: 'Choix Appel téléphonique' },
      { sel: '.modal-card.whatsapp',     label: 'Choix WhatsApp modal' },
      { sel: '.modal-card.form',         label: 'Choix Formulaire contact' },
      { sel: '[href*="tel:"]',           label: 'Clic numéro téléphone' },
      { sel: '[href*="wa.me"]',          label: 'Clic WhatsApp lien' },
    ];

    selectors.forEach(function (item) {
      document.querySelectorAll(item.sel).forEach(function (el) {
        el.addEventListener('click', function () {
          trackClick(item.label, el.href || el.className || '');
        }, { passive: true });
      });
    });

    /* Clic sur "Démarrer ce plan" — capturer le nom du plan */
    document.querySelectorAll('[onclick*="openStartModal"]').forEach(function (el) {
      el.addEventListener('click', function () {
        var match = (el.getAttribute('onclick') || '').match(/openStartModal\('([^']+)'\)/);
        trackClick('Démarrer plan', match ? match[1] : 'Inconnu');
      }, { passive: true });
    });
  }

  /* ── Démarrage ── */
  waitForFirebase(function () {
    trackVisit();
    attachDurationTracker();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachClickTrackers);
    } else {
      attachClickTrackers();
    }
  });
})();
