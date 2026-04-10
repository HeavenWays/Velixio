/* ════════════════════════════════════════════════════════════════════
   firebase-config.js — Configuration Firebase Velixio
   ════════════════════════════════════════════════════════════════════ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyALVJwS4PXZPE2iQXetCYuFHTxG4veUmSI",
  authDomain:        "velixio-31be3.firebaseapp.com",
  projectId:         "velixio-31be3",
  storageBucket:     "velixio-31be3.firebasestorage.app",
  messagingSenderId: "114412115995",
  appId:             "1:114412115995:web:2603c97c009f211d2440be"
};

/* ─── Initialisation Firebase (SDK v9 compat) ─── */
const firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
var db          = firebase.firestore();
var auth        = firebase.auth();

/* ─── Collection principale ─── */
var CONTACTS_COL = 'contacts';

/* ─── Rate limiting côté client (anti-spam) ─── */
const RATE_LIMIT = {
  maxPerHour : 3,
  storageKey : 'vx_rl'
};

function checkRateLimit() {
  try {
    const now  = Date.now();
    const data = JSON.parse(sessionStorage.getItem(RATE_LIMIT.storageKey) || '{"attempts":[]}');
    data.attempts = (data.attempts || []).filter(t => now - t < 3600000);
    if (data.attempts.length >= RATE_LIMIT.maxPerHour) {
      return { allowed: false, remaining: Math.ceil((data.attempts[0] + 3600000 - now) / 60000) };
    }
    data.attempts.push(now);
    sessionStorage.setItem(RATE_LIMIT.storageKey, JSON.stringify(data));
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

/* ─── Sanitisation des entrées ─── */
function sanitizeInput(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, maxLen);
}
