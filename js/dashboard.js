/* ==========================================================================
   StudyFlow — Dashboard
   ========================================================================== */

(function () {
  'use strict';
  const U = StudyFlow.Utils;
  const S = StudyFlow.Storage;

  function render() {
    const today = U.todayISO();
    const subjects = S.getSubjects();
    const tasks = S.getTasks();
    const sessions = S.getSessions();
    const exams = S.getExams();
    const focus = S.getFocusSessions();

    /* Welcome */
    document.getElementById('welcome-greeting').textContent =
      U.greeting() + ', welcome back!';
    document.getElementById('welcome-date').textContent =
      new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    /* Study hours this week */
    const settings = S.getSettings();
    const weekStart = U.startOfWeek(new Date(), settings.weekStart);
    const weekISO = U.toISODate(weekStart);
    let weekMinutes = 0;
    focus.forEach((f) => {
      const d = String(f.date || '').slice(0, 10);
      if (d >= weekISO && d <= today) weekMinutes += Number(f.duration || 0);
    });
    sessions.forEach((s) => {
      if (s.completed) {
        const d = String(s.date || '').slice(0, 10);
        if (d >= weekISO && d <= today) weekMinutes += Number(s.duration || 0);
      }
    });

    const lastWeekISO = U.addDaysISO(weekISO, -7);
    let lastWeekMinutes = 0;
    focus.forEach((f) => {
      const d = String(f.date || '').slice(0, 10);
      if (d >= lastWeekISO && d < weekISO) lastWeekMinutes += Number(f.duration || 0);
    });
    sessions.forEach((s) => {
      if (s.completed) {
        const d = String(s.date || '').slice(0, 10);
        if (d >= lastWeekISO && d < weekISO) lastWeekMinutes += Number(s.duration || 0);
      }
    });

    document.getElementById('stat-hours').textContent = U.formatMinutes(weekMinutes);
    const trendEl = document.getElementById('stat-hours-trend');
    if (lastWeekMinutes > 0) {
      const pct = Math.round(((weekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100);
      trendEl.innerHTML = pct >= 0
        ? '<span class="up">&#9650; ' + pct + '%</span> vs last week'
        : '<span class="down">&#9660; ' + Math.abs(pct) + '%</span> vs last week';
    } else {
      trendEl.textContent = 'Track your focus sessions';
    }

    /* Tasks completed */
    const doneTasks = tasks.filter((t) => t.status === 'done').length;
    const totalTasks = tasks.length;
    document.getElementById('stat-tasks').textContent = doneTasks;
    const pending = tasks.filter((t) => t.status !== 'done').length;
    document.getElementById('stat-tasks-trend').textContent =
      doneTasks + ' done · ' + pending + ' pending';

    /* Study Sessions completed */
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.completed).length;

    /* Overall Tasks & Study Sessions Completion Progress Bar */
    const totalItems = totalTasks + totalSessions;
    const totalCompleted = doneTasks + completedSessions;
    const completionPct = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

    const summaryEl = document.getElementById('completion-summary');
    const taskChipEl = document.getElementById('task-completion-text');
    const sessionChipEl = document.getElementById('session-completion-text');
    const badgeEl = document.getElementById('completion-pct-badge');
    const fillEl = document.getElementById('completion-progress-fill');
    const progressBar = document.getElementById('completion-progressbar');

    if (summaryEl) {
      summaryEl.textContent = totalItems > 0
        ? totalCompleted + ' of ' + totalItems + ' items completed (' + completionPct + '%)'
        : 'No tasks or sessions added yet';
    }
    if (taskChipEl) {
      taskChipEl.textContent = doneTasks + '/' + totalTasks + ' Tasks';
    }
    if (sessionChipEl) {
      sessionChipEl.textContent = completedSessions + '/' + totalSessions + ' Sessions';
    }
    if (badgeEl) {
      badgeEl.textContent = completionPct + '%';
    }
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', String(completionPct));
    }
    if (fillEl) {
      requestAnimationFrame(() => {
        fillEl.style.width = completionPct + '%';
      });
    }

    /* Streak */
    document.getElementById('stat-streak').textContent = U.currentStreak(focus, sessions);

    /* Overall progress */
    const withChapters = subjects.filter((s) => (s.chapters || []).length > 0);
    const overall = withChapters.length
      ? Math.round(withChapters.reduce((acc, s) => acc + U.subjectProgress(s), 0) / withChapters.length)
      : 0;
    document.getElementById('stat-progress').textContent = overall + '%';

    renderTodaySchedule(sessions, today);
    renderSubjectProgress(subjects, focus, sessions);
    renderUpcomingExams(exams);
  }

  /* ---------- Today's schedule ---------- */

  function renderTodaySchedule(sessions, today) {
    const container = document.getElementById('today-schedule');
    const list = sessions
      .filter((s) => String(s.date || '').slice(0, 10) === today)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    if (!list.length) {
      container.innerHTML = '<div class="inline-empty">No study sessions planned today.<br><a href="planner.html" style="color:var(--primary);font-weight:600">Plan one now</a></div>';
      return;
    }

    container.innerHTML = list.map((s) => {
      const color = U.subjectColor(s.subjectId);
      const statusBadge = s.completed
        ? '<span class="badge badge-success">Completed</span>'
        : '<span class="badge badge-muted">Scheduled</span>';
      return (
        '<div class="session-item">' +
          '<div class="session-time">' + U.escapeHTML(s.startTime || '--:--') + '</div>' +
          '<div style="width:10px;height:10px;border-radius:999px;background:' + color + ';flex-shrink:0"></div>' +
          '<div class="session-info">' +
            '<strong>' + U.escapeHTML(U.subjectName(s.subjectId)) + (s.topic ? ' — ' + U.escapeHTML(s.topic) : '') + '</strong>' +
            '<small>' + U.formatMinutes(s.duration) + ' · ' + U.escapeHTML(s.priority || 'Medium') + ' priority</small>' +
          '</div>' +
          statusBadge +
        '</div>'
      );
    }).join('');
  }

  /* ---------- Subject progress ---------- */

  function renderSubjectProgress(subjects, focus, sessions) {
    const container = document.getElementById('subject-progress');
    const list = subjects
      .map((s) => ({ s, pct: U.subjectProgress(s) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 6);

    if (!list.length) {
      container.innerHTML = '<div class="inline-empty">Add subjects to track progress.<br><a href="subjects.html" style="color:var(--primary);font-weight:600">Add a subject</a></div>';
      return;
    }

    container.innerHTML = list.map(({ s, pct }) => {
      const cls = U.progressClass(pct);
      return (
        '<div class="subject-row">' +
          '<span class="dot" style="background:' + U.escapeHTML(s.color) + '"></span>' +
          '<span class="subject-name" title="' + U.escapeHTML(s.name) + '">' + U.escapeHTML(s.name) + '</span>' +
          '<div class="progress"><div class="progress-bar ' + cls + '" style="width:' + pct + '%"></div></div>' +
          '<span class="subject-pct">' + pct + '%</span>' +
        '</div>'
      );
    }).join('');
  }

  /* ---------- Upcoming exams ---------- */

  function renderUpcomingExams(exams) {
    const container = document.getElementById('upcoming-exams');
    const today = U.todayISO();
    const upcoming = exams
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);

    if (!upcoming.length) {
      container.innerHTML = '<div class="inline-empty">No upcoming exams.<br><a href="exams.html" style="color:var(--primary);font-weight:600">Add an exam</a></div>';
      return;
    }

    container.innerHTML = upcoming.map((e) => {
      const days = U.daysBetween(today, e.date);
      const date = U.parseISODate(e.date);
      const badge = days <= 2
        ? '<span class="badge badge-danger">' + days + 'd left</span>'
        : days <= 7
          ? '<span class="badge badge-warning">' + days + 'd left</span>'
          : '<span class="badge badge-info">' + days + 'd left</span>';
      return (
        '<div class="exam-item">' +
          '<div class="exam-date-badge">' +
            '<span class="d">' + date.getDate() + '</span>' +
            '<span class="m">' + date.toLocaleDateString(undefined, { month: 'short' }) + '</span>' +
          '</div>' +
          '<div class="exam-info">' +
            '<strong>' + U.escapeHTML(e.name) + '</strong>' +
            '<small>' + U.escapeHTML(U.subjectName(e.subjectId)) + '</small>' +
          '</div>' +
          badge +
        '</div>'
      );
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', render);
})();