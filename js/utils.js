/* ==========================================================================
   StudyFlow — Utilities
   Date helpers, formatting, DOM helpers, subject color/icon lookups, icons.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- ID & escaping ---------- */

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /* ---------- Date helpers ---------- */

  const pad2 = (n) => String(n).padStart(2, '0');

  function toISODate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function todayISO() {
    return toISODate(new Date());
  }

  function parseISODate(str) {
    const parts = String(str).split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function addDays(d, n) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy;
  }

  function addDaysISO(iso, n) {
    return toISODate(addDays(parseISODate(iso), n));
  }

  function daysBetween(aISO, bISO) {
    const a = parseISODate(aISO).setHours(0, 0, 0, 0);
    const b = parseISODate(bISO).setHours(0, 0, 0, 0);
    return Math.round((b - a) / 86400000);
  }

  function startOfWeek(d, weekStart) {
    const day = (d.getDay() - weekStart + 7) % 7;
    return addDays(d, -day);
  }

  function formatDate(iso) {
    if (!iso) return '';
    return parseISODate(iso).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }

  function formatDateLong(iso) {
    if (!iso) return '';
    return parseISODate(iso).toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  function formatDateTime(iso) {
    if (!iso) return '';
    return parseISODate(iso.slice(0, 10)).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric'
    }) + ' · ' + iso.slice(11, 16);
  }

  function timeAgo(iso) {
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    if (days < 30) return days + 'd ago';
    return formatDate(iso.slice(0, 10));
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  }

  /* ---------- Duration formatting ---------- */

  function formatMinutes(min) {
    const m = Math.round(Number(min) || 0);
    const h = Math.floor(m / 60);
    const rest = m % 60;
    if (h === 0) return m + 'm';
    if (rest === 0) return h + 'h';
    return h + 'h ' + rest + 'm';
  }

  function formatMinutesShort(min) {
    const m = Math.round(Number(min) || 0);
    if (m < 60) return m + 'm';
    return (m / 60).toFixed(1) + 'h';
  }

  function minutesBetween(startHHMM, endHHMM) {
    const toMin = (t) => {
      const [h, m] = String(t).split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const diff = toMin(endHHMM) - toMin(startHHMM);
    return diff > 0 ? diff : 0;
  }

  /* ---------- Progress / status helpers ---------- */

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function progressClass(pct) {
    if (pct >= 70) return 'success';
    if (pct >= 35) return 'warning';
    return 'danger';
  }

  function subjectById(subjectId) {
    return (StudyFlow.Storage.getSubjects() || []).find((s) => s.id === subjectId) || null;
  }

  function subjectName(subjectId) {
    const s = subjectById(subjectId);
    return s ? s.name : 'General';
  }

  function subjectColor(subjectId) {
    const s = subjectById(subjectId);
    return s ? s.color : '#8b93a5';
  }

  function subjectProgress(s) {
    const total = (s.chapters || []).length;
    if (total === 0) return 0;
    const done = (s.chapters || []).filter((c) => c.completed).length;
    return Math.round((done / total) * 100);
  }

  function subjectStudyMinutes(subjectId, focusList, sessionList) {
    const f = (focusList || []).filter((x) => x.subjectId === subjectId).reduce((a, b) => a + (b.duration || 0), 0);
    const s = (sessionList || []).filter((x) => x.subjectId === subjectId && x.completed).reduce((a, b) => a + (b.duration || 0), 0);
    return f + s;
  }

  /* ---------- Streak ---------- */

  function currentStreak(focusList, sessionList) {
    const studiedDays = new Set();
    (focusList || []).forEach((f) => f.date && studiedDays.add(String(f.date).slice(0, 10)));
    (sessionList || [])
      .filter((s) => s.completed && s.date)
      .forEach((s) => studiedDays.add(String(s.date).slice(0, 10)));

    let streak = 0;
    let cursor = new Date();
    for (;;) {
      const iso = toISODate(cursor);
      if (studiedDays.has(iso)) {
        streak += 1;
        cursor = addDays(cursor, -1);
      } else if (streak === 0) {
        cursor = addDays(cursor, -1);
      } else {
        break;
      }
    }
    return streak;
  }

  function studyMinutesForDay(iso, focusList, sessionList) {
    let total = 0;
    (focusList || []).forEach((f) => {
      if (String(f.date || '').slice(0, 10) === iso) total += Number(f.duration || 0);
    });
    (sessionList || [])
      .filter((s) => s.completed && String(s.date || '').slice(0, 10) === iso)
      .forEach((s) => { total += Number(s.duration || 0); });
    return total;
  }

  /* ---------- Subject palette / icons ---------- */

  const COLORS = [
    '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
    '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#3b82f6', '#84cc16', '#64748b'
  ];

  const ICONS = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    math: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6l4 6 4-6h6"/><path d="M2 21h6l4-6 4 6h6"/><path d="M12 9v6"/></svg>',
    atom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M21.4 12c0 1.9-4.2 3.4-9.4 3.4S2.6 13.9 2.6 12 6.8 8.6 12 8.6s9.4 1.5 9.4 3.4z"/><path d="M17.8 12.5c-.9 1.7-4.8 2.7-8.8 2.3s-6.4-2.3-5.5-4 4.8-2.7 8.8-2.3 6.4 2.3 5.5 4z"/><path d="M17.8 11.5c-.9-1.7-4.8-2.7-8.8-2.3s-6.4 2.3-5.5 4 4.8 2.7 8.8 2.3 6.4-2.3 5.5-4z"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
    database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v6L4.6 17.4A2 2 0 0 0 6.3 20.5h11.4a2 2 0 0 0 1.7-3.1L14 9V3"/><path d="M7.5 14h9"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    language: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4 17.5V15a2.5 2.5 0 0 1-.5-4.97A2.5 2.5 0 0 1 4 5.5A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 20 17.5v-2.5a2.5 2.5 0 0 0 .5-4.97A2.5 2.5 0 0 0 20 5.5A2.5 2.5 0 0 0 14.5 2z"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    'clipboard-list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6M9 16h6M9 8h.01"/></svg>'
  };

  function icon(name) {
    return ICONS[name] || ICONS.book;
  }

  /* ---------- Element builders ---------- */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function iconEl(name, className) {
    const span = document.createElement('span');
    if (className) span.className = className;
    span.innerHTML = icon(name);
    return span;
  }

  StudyFlow.Utils = {
    uid,
    escapeHTML,
    debounce,
    pad2,
    toISODate,
    todayISO,
    parseISODate,
    addDays,
    addDaysISO,
    daysBetween,
    startOfWeek,
    formatDate,
    formatDateLong,
    formatDateTime,
    timeAgo,
    greeting,
    formatMinutes,
    formatMinutesShort,
    minutesBetween,
    clamp,
    progressClass,
    subjectById,
    subjectName,
    subjectColor,
    subjectProgress,
    subjectStudyMinutes,
    currentStreak,
    studyMinutesForDay,
    COLORS,
    ICONS,
    icon,
    el,
    iconEl
  };
})();