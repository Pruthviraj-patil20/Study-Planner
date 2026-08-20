/* ==========================================================================
   StudyFlow — Theme Management
   Light / dark / rainbow mode via [data-theme] on <html>, persisted to LocalStorage.
   ========================================================================== */

(function () {
  'use strict';

  const KEY = 'studyflow_theme';
  const THEMES = ['light', 'dark', 'rainbow'];

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
    const cur = current();
    if (cur === 'light') apply('dark');
    else if (cur === 'dark') apply('rainbow');
    else apply('light');
  }

  function syncButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const theme = current();
    if (theme === 'dark') {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
      btn.setAttribute('aria-label', 'Switch to rainbow mode');
      btn.title = 'Switch to rainbow mode';
    } else if (theme === 'rainbow') {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17a10 10 0 0 0-20 0"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M10 17a2 2 0 0 1 4 0"/></svg>';
      btn.setAttribute('aria-label', 'Switch to light mode');
      btn.title = 'Switch to light mode';
    } else {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      btn.setAttribute('aria-label', 'Switch to dark mode');
      btn.title = 'Switch to dark mode';
    }
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