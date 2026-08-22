/* ==========================================================================
   StudyFlow — Settings
   Appearance, study preferences, and data reset.
   ========================================================================== */

(function () {
  'use strict';

  const S = StudyFlow.Storage;
  const T = StudyFlow.Theme;

  /* ---------- Appearance / Theme ---------- */

  function syncThemeButtons() {
    const current = T.current();
    const lightBtn = document.getElementById('theme-light');
    const darkBtn = document.getElementById('theme-dark');
    const rainbowBtn = document.getElementById('theme-rainbow');

    if (lightBtn) {
      const isLight = current === 'light';
      lightBtn.classList.toggle('is-active', isLight);
      lightBtn.classList.toggle('active', isLight);
      lightBtn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    }

    if (darkBtn) {
      const isDark = current === 'dark';
      darkBtn.classList.toggle('is-active', isDark);
      darkBtn.classList.toggle('active', isDark);
      darkBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }

    if (rainbowBtn) {
      const isRainbow = current === 'rainbow';
      rainbowBtn.classList.toggle('is-active', isRainbow);
      rainbowBtn.classList.toggle('active', isRainbow);
      rainbowBtn.setAttribute('aria-pressed', isRainbow ? 'true' : 'false');
    }

    if (T.syncButton) T.syncButton();
  }

  function bindAppearance() {
    const lightBtn = document.getElementById('theme-light');
    const darkBtn = document.getElementById('theme-dark');
    const rainbowBtn = document.getElementById('theme-rainbow');

    if (lightBtn) {
      lightBtn.addEventListener('click', () => {
        T.apply('light');
        syncThemeButtons();
        StudyFlow.UI.showToast('Light theme applied.', 'info');
      });
    }

    if (darkBtn) {
      darkBtn.addEventListener('click', () => {
        T.apply('dark');
        syncThemeButtons();
        StudyFlow.UI.showToast('Dark theme applied.', 'info');
      });
    }

    if (rainbowBtn) {
      rainbowBtn.addEventListener('click', () => {
        T.apply('rainbow');
        syncThemeButtons();
        StudyFlow.UI.showToast('Rainbow theme applied! 🌈', 'info');
      });
    }

    document.addEventListener('studyflow:themechange', syncThemeButtons);
  }

  /* ---------- Study Preferences ---------- */

  function loadPreferences() {
    const settings = S.getSettings();

    const dailyGoalInput = document.getElementById('daily-goal');
    const focusDefaultInput = document.getElementById('focus-default');
    const breakDefaultInput = document.getElementById('break-default');
    const weekStartSelect = document.getElementById('week-start');

    if (dailyGoalInput) dailyGoalInput.value = settings.dailyGoal ?? 120;
    if (focusDefaultInput) focusDefaultInput.value = settings.focusDefault ?? 25;
    if (breakDefaultInput) breakDefaultInput.value = settings.breakDefault ?? 5;
    if (weekStartSelect) weekStartSelect.value = String(settings.weekStart ?? 0);
  }

  function savePreferences() {
    const dailyGoalInput = document.getElementById('daily-goal');
    const focusDefaultInput = document.getElementById('focus-default');
    const breakDefaultInput = document.getElementById('break-default');
    const weekStartSelect = document.getElementById('week-start');

    const dailyGoal = Number(dailyGoalInput ? dailyGoalInput.value : 120);
    const focusDefault = Number(focusDefaultInput ? focusDefaultInput.value : 25);
    const breakDefault = Number(breakDefaultInput ? breakDefaultInput.value : 5);
    const weekStart = Number(weekStartSelect ? weekStartSelect.value : 0);

    if (isNaN(dailyGoal) || dailyGoal < 15 || dailyGoal > 720) {
      dailyGoalInput && dailyGoalInput.classList.add('invalid');
      StudyFlow.UI.showToast('Daily goal must be between 15 and 720 minutes.', 'error');
      dailyGoalInput && dailyGoalInput.focus();
      return;
    }

    if (isNaN(focusDefault) || focusDefault < 1 || focusDefault > 180) {
      focusDefaultInput && focusDefaultInput.classList.add('invalid');
      StudyFlow.UI.showToast('Focus duration must be between 1 and 180 minutes.', 'error');
      focusDefaultInput && focusDefaultInput.focus();
      return;
    }

    if (isNaN(breakDefault) || breakDefault < 1 || breakDefault > 60) {
      breakDefaultInput && breakDefaultInput.classList.add('invalid');
      StudyFlow.UI.showToast('Break duration must be between 1 and 60 minutes.', 'error');
      breakDefaultInput && breakDefaultInput.focus();
      return;
    }

    [dailyGoalInput, focusDefaultInput, breakDefaultInput].forEach((el) => {
      if (el) el.classList.remove('invalid');
    });

    S.setSettings({
      dailyGoal,
      focusDefault,
      breakDefault,
      weekStart
    });

    StudyFlow.UI.showToast('Settings saved successfully.', 'success');
  }

  function bindPreferences() {
    const saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', savePreferences);
    }

    ['daily-goal', 'focus-default', 'break-default'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => {
          if (input.classList.contains('invalid')) input.classList.remove('invalid');
        });
      }
    });
  }

  /* ---------- Academic Level & Curriculum ---------- */

  function loadClassInfo() {
    const user = StudyFlow.Auth ? StudyFlow.Auth.currentUser() : null;
    const nameEl = document.getElementById('settings-class-name');
    const descEl = document.getElementById('settings-class-desc');
    if (!nameEl || !descEl) return;

    if (user && user.selectedClass && window.StudyFlow.ClassPresets) {
      const preset = window.StudyFlow.ClassPresets.getPreset(user.selectedClass);
      if (preset) {
        nameEl.textContent = preset.name;
        descEl.textContent = preset.category + ' · ' + (preset.badge || 'Standard Track') + ' (' + (preset.subjects || []).length + ' Recommended Subjects)';
        return;
      }
    }
    nameEl.textContent = (user && user.selectedClass) || 'Class 10';
    descEl.textContent = 'Curriculum and subject track';
  }

  function bindClassSection() {
    const reseedBtn = document.getElementById('btn-reseed-class');
    if (!reseedBtn) return;

    reseedBtn.addEventListener('click', async () => {
      const user = StudyFlow.Auth ? StudyFlow.Auth.currentUser() : null;
      const classKey = (user && user.selectedClass) || 'class-10';
      const preset = window.StudyFlow.ClassPresets
        ? window.StudyFlow.ClassPresets.getPreset(classKey)
        : { name: classKey };

      const confirmed = await StudyFlow.Modal.confirmDialog({
        title: 'Reload ' + preset.name + ' Subjects?',
        message: 'This will reset your planner with default subjects, chapters, timetable sessions, and sample tasks for ' + preset.name + '. Continue?',
        confirmText: 'Reload Subjects',
        danger: false
      });

      if (confirmed) {
        S.seedForClass(user ? user.id : null, classKey);
        loadPreferences();
        StudyFlow.UI.showToast('Subjects and study timetable reloaded for ' + preset.name + '.', 'success');
      }
    });
  }

  /* ---------- Danger Zone / Reset All Data ---------- */

  function bindDangerZone() {
    const resetBtn = document.getElementById('btn-reset-all');
    if (!resetBtn) return;

    resetBtn.addEventListener('click', async () => {
      const confirmed = await StudyFlow.Modal.confirmDialog({
        title: 'Reset All Data',
        message: 'Are you sure you want to reset all data? This will restore initial sample subjects, tasks, sessions, and notes.',
        confirmText: 'Reset Everything',
        danger: true
      });

      if (confirmed) {
        S.clearAllData();
        S.seedIfNeeded();
        loadPreferences();
        loadClassInfo();
        syncThemeButtons();
        StudyFlow.UI.showToast('All data has been reset to default.', 'info');
      }
    });
  }

  /* ---------- Init ---------- */

  function init() {
    syncThemeButtons();
    bindAppearance();
    loadPreferences();
    bindPreferences();
    loadClassInfo();
    bindClassSection();
    bindDangerZone();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
