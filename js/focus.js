/* ==========================================================================
   StudyFlow — Focus Timer (Pomodoro)
   Deep work timer with presets, custom durations, chime audio, and session logging.
   ========================================================================== */

(function () {
  'use strict';

  const U = StudyFlow.Utils;
  const S = StudyFlow.Storage;

  const MODES = {
    classic: { focus: 25, break: 5, label: 'Classic (25/5)' },
    long: { focus: 50, break: 10, label: 'Deep Work (50/10)' },
    custom: { focus: 30, break: 5, label: 'Custom' }
  };

  const CIRCUMFERENCE = 2 * Math.PI * 88; // ~552.92px

  let currentMode = 'classic';
  let currentPhase = 'focus'; // 'focus' | 'break'
  let timerState = 'idle'; // 'idle' | 'running' | 'paused'
  let timerInterval = null;
  let totalDurationSeconds = 25 * 60;
  let secondsRemaining = 25 * 60;
  let sessionStartTime = null;

  /* ---------- Audio Chime Notification ---------- */

  function playChime(isBreak) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const notes = isBreak ? [440, 554.37, 659.25] : [659.25, 554.37, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);

        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.45);
      });
    } catch (err) {
      /* AudioContext may be blocked before user gesture; gracefully ignore */
    }
  }

  /* ---------- Durations & Phase Calculation ---------- */

  function getPhaseDurationSeconds(phase) {
    if (currentMode === 'custom') {
      const focusInput = document.getElementById('custom-focus');
      const breakInput = document.getElementById('custom-break');
      const focusMin = Math.max(1, Math.min(180, Number(focusInput ? focusInput.value : 30) || 30));
      const breakMin = Math.max(1, Math.min(60, Number(breakInput ? breakInput.value : 5) || 5));
      return (phase === 'focus' ? focusMin : breakMin) * 60;
    }

    const settings = S.getSettings();
    if (currentMode === 'classic') {
      const focusMin = settings.focusDefault || MODES.classic.focus;
      const breakMin = settings.breakDefault || MODES.classic.break;
      return (phase === 'focus' ? focusMin : breakMin) * 60;
    }

    const modeConfig = MODES[currentMode] || MODES.classic;
    return (phase === 'focus' ? modeConfig.focus : modeConfig.break) * 60;
  }

  /* ---------- Display & Ring Updates ---------- */

  function formatTime(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function updateDisplay() {
    const displayEl = document.getElementById('timer-display');
    const phaseEl = document.getElementById('timer-phase');
    const ringEl = document.getElementById('timer-ring');
    const progressCircle = document.getElementById('ring-progress');

    const timeString = formatTime(secondsRemaining);
    if (displayEl) displayEl.textContent = timeString;

    if (phaseEl) {
      phaseEl.textContent = currentPhase === 'focus' ? 'Focus' : 'Break';
    }

    if (ringEl) {
      ringEl.classList.toggle('break', currentPhase === 'break');
      ringEl.classList.toggle('complete', secondsRemaining === 0);
    }

    if (progressCircle) {
      const fraction = totalDurationSeconds > 0 ? secondsRemaining / totalDurationSeconds : 0;
      const offset = CIRCUMFERENCE * (1 - fraction);
      progressCircle.style.strokeDashoffset = String(offset);
    }

    if (timerState === 'running') {
      document.title = (currentPhase === 'break' ? '☕ ' : '⏱️ ') + timeString + ' · Focus · StudyFlow';
    } else {
      document.title = 'Focus · StudyFlow';
    }
  }

  function updateControls() {
    const startBtn = document.getElementById('btn-start');
    const startLabel = document.getElementById('start-label');

    if (!startBtn || !startLabel) return;

    if (timerState === 'running') {
      startBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
        '<span id="start-label">Pause</span>';
    } else {
      const isResume = timerState === 'paused' && secondsRemaining < totalDurationSeconds;
      startBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '<span id="start-label">' + (isResume ? 'Resume' : 'Start') + '</span>';
    }
  }

  /* ---------- Timer Engine ---------- */

  function startTimer() {
    if (timerState === 'running') return;

    if (timerState === 'idle' || !sessionStartTime) {
      sessionStartTime = new Date().toISOString();
    }

    timerState = 'running';
    updateControls();

    timerInterval = setInterval(() => {
      secondsRemaining -= 1;
      if (secondsRemaining <= 0) {
        secondsRemaining = 0;
        updateDisplay();
        handlePhaseComplete();
      } else {
        updateDisplay();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (timerState !== 'running') return;
    clearInterval(timerInterval);
    timerInterval = null;
    timerState = 'paused';
    updateControls();
    updateDisplay();
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerState = 'idle';
    sessionStartTime = null;

    totalDurationSeconds = getPhaseDurationSeconds(currentPhase);
    secondsRemaining = totalDurationSeconds;

    updateControls();
    updateDisplay();
  }

  function skipPhase() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerState = 'idle';
    sessionStartTime = null;

    if (currentPhase === 'focus') {
      currentPhase = 'break';
      StudyFlow.UI.showToast('Skipped to break phase.', 'info');
    } else {
      currentPhase = 'focus';
      StudyFlow.UI.showToast('Skipped to focus phase.', 'info');
    }

    totalDurationSeconds = getPhaseDurationSeconds(currentPhase);
    secondsRemaining = totalDurationSeconds;

    updateControls();
    updateDisplay();
  }

  function handlePhaseComplete() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerState = 'idle';

    if (currentPhase === 'focus') {
      playChime(true);
      logFocusSession();
      StudyFlow.UI.showToast('🎉 Focus session completed! Great job.', 'success');

      currentPhase = 'break';
      totalDurationSeconds = getPhaseDurationSeconds('break');
      secondsRemaining = totalDurationSeconds;
      sessionStartTime = null;
    } else {
      playChime(false);
      StudyFlow.UI.showToast('☕ Break time over! Ready for the next focus session?', 'info');

      currentPhase = 'focus';
      totalDurationSeconds = getPhaseDurationSeconds('focus');
      secondsRemaining = totalDurationSeconds;
      sessionStartTime = null;
    }

    updateControls();
    updateDisplay();
    renderSessionsList();
  }

  /* ---------- Session Storage & Logging ---------- */

  function logFocusSession() {
    const subjectSelect = document.getElementById('focus-subject');
    const subjectId = subjectSelect ? subjectSelect.value : '';
    const durationMinutes = Math.round(totalDurationSeconds / 60);
    const now = new Date();
    const todayISO = U.todayISO();

    const newSession = {
      id: U.uid('fs'),
      subjectId: subjectId || '',
      mode: currentMode,
      duration: durationMinutes,
      completed: true,
      date: todayISO,
      startedAt: sessionStartTime || now.toISOString(),
      endedAt: now.toISOString()
    };

    const list = S.getFocusSessions();
    list.unshift(newSession);
    S.setFocusSessions(list);

    // Update streak in sidebar if available
    const streakEl = document.getElementById('sidebar-streak');
    if (streakEl) {
      streakEl.textContent = U.currentStreak(list, S.getSessions());
    }
  }

  /* ---------- Render Side List & Counters ---------- */

  function renderSessionsList() {
    const today = U.todayISO();
    const allSessions = S.getFocusSessions();
    const todaySessions = allSessions.filter((s) => String(s.date || '').slice(0, 10) === today && s.completed);

    const countEl = document.getElementById('session-count');
    if (countEl) countEl.textContent = String(todaySessions.length);

    const listContainer = document.getElementById('today-focus-list');
    if (!listContainer) return;

    if (!todaySessions.length) {
      listContainer.innerHTML =
        '<div class="inline-empty">' +
          'No focus sessions completed today.<br>' +
          '<span style="color:var(--primary);font-weight:600">Start a timer to begin deep work!</span>' +
        '</div>';
      return;
    }

    listContainer.innerHTML = todaySessions.map((s) => {
      const subj = U.subjectById(s.subjectId);
      const name = subj ? subj.name : 'General Study';
      const color = subj ? subj.color : 'var(--primary)';
      const iconName = subj ? (subj.icon || 'book') : 'book';
      const timeStr = s.endedAt ? String(s.endedAt).slice(11, 16) : '--:--';
      const modeLabel = MODES[s.mode] ? MODES[s.mode].label.split(' ')[0] : 'Focus';

      return (
        '<div class="focus-session">' +
          '<div class="fs-icon" style="background:' + U.escapeHTML(color) + '22;color:' + U.escapeHTML(color) + '">' +
            U.icon(iconName) +
          '</div>' +
          '<div class="fs-info">' +
            '<strong>' + U.escapeHTML(name) + '</strong>' +
            '<small>' + U.escapeHTML(timeStr) + ' · ' + U.escapeHTML(modeLabel) + '</small>' +
          '</div>' +
          '<div class="fs-duration">' + U.formatMinutes(s.duration) + '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ---------- Subject Selector ---------- */

  function populateSubjects() {
    const select = document.getElementById('focus-subject');
    if (!select) return;

    const subjects = S.getSubjects();
    let html = '<option value="">General Study</option>';
    subjects.forEach((s) => {
      html += '<option value="' + U.escapeHTML(s.id) + '">' + U.escapeHTML(s.name) + '</option>';
    });
    select.innerHTML = html;
  }

  /* ---------- Event Bindings ---------- */

  function bindEvents() {
    // Mode tabs
    document.querySelectorAll('.mode-tabs .pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (timerState === 'running') {
          const proceed = confirm('Switching presets will reset the current timer. Continue?');
          if (!proceed) return;
        }

        document.querySelectorAll('.mode-tabs .pill').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');

        currentMode = btn.dataset.mode || 'classic';
        const customFields = document.getElementById('custom-fields');
        if (customFields) {
          customFields.classList.toggle('hidden', currentMode !== 'custom');
        }

        currentPhase = 'focus';
        resetTimer();
      });
    });

    // Custom duration inputs
    const customFocus = document.getElementById('custom-focus');
    const customBreak = document.getElementById('custom-break');
    [customFocus, customBreak].forEach((input) => {
      if (input) {
        input.addEventListener('change', () => {
          if (currentMode === 'custom' && timerState !== 'running') {
            resetTimer();
          }
        });
      }
    });

    // Start / Pause
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (timerState === 'running') {
          pauseTimer();
        } else {
          startTimer();
        }
      });
    }

    // Reset
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetTimer);
    }

    // Skip
    const skipBtn = document.getElementById('btn-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', skipPhase);
    }
  }

  /* ---------- Init ---------- */

  function init() {
    populateSubjects();
    bindEvents();
    resetTimer();
    renderSessionsList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
