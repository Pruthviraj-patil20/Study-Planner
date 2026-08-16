/* ==========================================================================
   StudyFlow — Theme Management
   Light / dark mode via [data-theme] on <html>, persisted to LocalStorage.
   ========================================================================== */

(function () {
  'use strict';

  const KEY = 'studyflow_theme';
  const THEMES = ['light', 'dark'];

  function current() {
    const saved = StudyFlow.Storage.loadData(KEY, null);
    return THEMES.indexOf(saved) !== -1 ? saved : 'light';
  }

  function apply(theme) {
    if (THEMES.indexOf(theme) === -1) theme = 'light';
    document.documentElement.setAttribute('data-theme', theme);
    StudyFlow.Storage.saveData(KEY, theme);
    document.dispatchEvent(new CustomEvent('studyflow:themechange', { detail: { theme } }));
  }

  function toggle() {
    apply(current() === 'light' ? 'dark' : 'light');
  }

  function syncButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = current() === 'dark';
    btn.innerHTML = isDark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  function init() {
    apply(current());
    syncButton();
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        toggle();
        syncButton();
      });
    }
  }

  StudyFlow.Theme = { current, apply, toggle, syncButton, init };
})();