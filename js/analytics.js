/* ==========================================================================
   StudyFlow — Analytics
   Charts & statistics for study habits, subjects, and tasks.
   ========================================================================== */

(function () {
  'use strict';

  const U = StudyFlow.Utils;
  const S = StudyFlow.Storage;

  const chartInstances = {};

  /* ---------- Theme-aware chart colors ---------- */

  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      textColor: isDark ? '#a0a8ba' : '#5b6475',
      headingColor: isDark ? '#e7eaf3' : '#1b2130',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
      tooltipBg: isDark ? '#191e2b' : '#ffffff',
      tooltipBorder: isDark ? '#333c52' : '#e4e6f0',
      tooltipText: isDark ? '#e7eaf3' : '#1b2130',
      primary: isDark ? '#818cf8' : '#6366f1',
      primarySoft: isDark ? 'rgba(129, 140, 248, 0.18)' : 'rgba(99, 102, 241, 0.12)',
      info: isDark ? '#38bdf8' : '#0ea5e9',
      infoSoft: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 165, 233, 0.12)',
      success: isDark ? '#34d399' : '#10b981',
      warning: isDark ? '#fbbf24' : '#f59e0b',
      muted: isDark ? '#64748b' : '#94a3b8'
    };
  }

  /* ---------- Stat Cards ---------- */

  function renderStats(subjects, tasks, sessions, focus) {
    const container = document.getElementById('analytics-stats');
    if (!container) return;

    const today = U.todayISO();
    const settings = S.getSettings();
    const weekStart = U.startOfWeek(new Date(), settings.weekStart);
    const weekISO = U.toISODate(weekStart);

    /* Total minutes */
    let totalMinutes = 0;
    focus.forEach((f) => { totalMinutes += Number(f.duration || 0); });
    sessions.forEach((s) => {
      if (s.completed) totalMinutes += Number(s.duration || 0);
    });

    /* This week minutes */
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

    /* Tasks completed */
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === 'done').length;
    const taskRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    /* Streak */
    const streak = U.currentStreak(focus, sessions);

    container.innerHTML =
      '<div class="stat-card">' +
        '<span class="stat-icon ic-primary">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
        '</span>' +
        '<div class="stat-info">' +
          '<div class="stat-value">' + U.escapeHTML(U.formatMinutes(totalMinutes)) + '</div>' +
          '<div class="stat-label">Total study time</div>' +
          '<div class="stat-trend">All-time tracked sessions</div>' +
        '</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<span class="stat-icon ic-info">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' +
        '</span>' +
        '<div class="stat-info">' +
          '<div class="stat-value">' + U.escapeHTML(U.formatMinutes(weekMinutes)) + '</div>' +
          '<div class="stat-label">This week</div>' +
          '<div class="stat-trend">Daily avg: ' + U.escapeHTML(U.formatMinutes(Math.round(weekMinutes / 7))) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<span class="stat-icon ic-success">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
        '</span>' +
        '<div class="stat-info">' +
          '<div class="stat-value">' + doneTasks + ' <small style="font-size:14px;color:var(--text-muted);font-weight:500">/ ' + totalTasks + '</small></div>' +
          '<div class="stat-label">Tasks completed</div>' +
          '<div class="stat-trend">' + taskRate + '% completion rate</div>' +
        '</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<span class="stat-icon ic-warning">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>' +
        '</span>' +
        '<div class="stat-info">' +
          '<div class="stat-value">' + streak + ' <small style="font-size:14px;color:var(--text-muted);font-weight:500">days</small></div>' +
          '<div class="stat-label">Study streak</div>' +
          '<div class="stat-trend">' + (streak > 0 ? 'Keep the momentum going 🔥' : 'Log a session to begin') + '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------- Weekly Study Hours Chart ---------- */

  function renderWeeklyChart(focus, sessions, settings) {
    const canvas = document.getElementById('chart-weekly');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartInstances.weekly) chartInstances.weekly.destroy();

    const colors = getThemeColors();
    const weekStart = U.startOfWeek(new Date(), settings.weekStart);
    const dayLabels = [];
    const hoursData = [];
    const rawMinutes = [];
    const todayISO = U.todayISO();
    const barColors = [];
    const barBorders = [];

    for (let i = 0; i < 7; i++) {
      const d = U.addDays(weekStart, i);
      const iso = U.toISODate(d);
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      dayLabels.push(label);

      const mins = U.studyMinutesForDay(iso, focus, sessions);
      rawMinutes.push(mins);
      hoursData.push(Number((mins / 60).toFixed(1)));

      if (iso === todayISO) {
        barColors.push(colors.primary);
        barBorders.push(colors.primary);
      } else {
        barColors.push(colors.primarySoft);
        barBorders.push(colors.primary);
      }
    }

    chartInstances.weekly = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [{
          label: 'Study Hours',
          data: hoursData,
          backgroundColor: barColors,
          borderColor: barBorders,
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 42
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.headingColor,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                const mins = rawMinutes[ctx.dataIndex];
                return ' ' + U.formatMinutes(mins) + ' (' + ctx.raw + ' hrs)';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Inter', size: 12 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { family: 'Inter', size: 11 },
              callback: (val) => val + 'h'
            }
          }
        }
      }
    });
  }

  /* ---------- Time by Subject Chart ---------- */

  function renderSubjectsChart(subjects, focus, sessions) {
    const canvas = document.getElementById('chart-subjects');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartInstances.subjects) chartInstances.subjects.destroy();

    const colors = getThemeColors();
    const container = canvas.parentElement;

    const dataList = subjects.map((s) => {
      const mins = U.subjectStudyMinutes(s.id, focus, sessions);
      return {
        name: s.name,
        color: s.color || colors.primary,
        minutes: mins,
        hours: Number((mins / 60).toFixed(1))
      };
    });

    const totalMinutes = dataList.reduce((a, b) => a + b.minutes, 0);

    // If zero time logged across all subjects, show equal placeholder or actual zero
    const labels = dataList.map((d) => d.name);
    const data = dataList.map((d) => d.hours);
    const bgColors = dataList.map((d) => d.color);

    // Remove any existing empty notice
    const existingEmpty = container.querySelector('.chart-empty');
    if (existingEmpty) existingEmpty.remove();

    if (totalMinutes === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'chart-empty';
      emptyNotice.textContent = 'No study time logged yet';
      container.appendChild(emptyNotice);
    }

    chartInstances.subjects = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: totalMinutes === 0 ? dataList.map(() => 1) : data,
          backgroundColor: totalMinutes === 0 ? dataList.map(() => colors.muted) : bgColors,
          borderWidth: 2,
          borderColor: colors.tooltipBg,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.textColor,
              font: { family: 'Inter', size: 12 },
              padding: 14,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.headingColor,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                if (totalMinutes === 0) return ' No study time recorded';
                const item = dataList[ctx.dataIndex];
                const pct = totalMinutes > 0 ? Math.round((item.minutes / totalMinutes) * 100) : 0;
                return ' ' + item.name + ': ' + U.formatMinutes(item.minutes) + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

  /* ---------- Monthly Study Trend Chart ---------- */

  function renderMonthlyChart(focus, sessions) {
    const canvas = document.getElementById('chart-monthly');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartInstances.monthly) chartInstances.monthly.destroy();

    const colors = getThemeColors();
    const today = new Date();
    const labels = [];
    const hoursData = [];
    const rawMinutes = [];

    /* Build 4 weekly intervals (past 4 weeks) */
    for (let w = 3; w >= 0; w--) {
      const endOffset = w * 7;
      const startOffset = endOffset + 6;
      const startDate = U.addDays(today, -startOffset);
      const endDate = U.addDays(today, -endOffset);

      const startISO = U.toISODate(startDate);
      const endISO = U.toISODate(endDate);

      const label = w === 0 ? 'This week' : w === 1 ? 'Last week' : w + ' wks ago';
      labels.push(label);

      let mins = 0;
      focus.forEach((f) => {
        const d = String(f.date || '').slice(0, 10);
        if (d >= startISO && d <= endISO) mins += Number(f.duration || 0);
      });
      sessions.forEach((s) => {
        if (s.completed) {
          const d = String(s.date || '').slice(0, 10);
          if (d >= startISO && d <= endISO) mins += Number(s.duration || 0);
        }
      });

      rawMinutes.push(mins);
      hoursData.push(Number((mins / 60).toFixed(1)));
    }

    chartInstances.monthly = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Study Hours',
          data: hoursData,
          borderColor: colors.info,
          backgroundColor: colors.infoSoft,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: colors.info,
          pointBorderColor: colors.tooltipBg,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.headingColor,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                const mins = rawMinutes[ctx.dataIndex];
                return ' ' + U.formatMinutes(mins) + ' (' + ctx.raw + ' hrs)';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Inter', size: 12 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { family: 'Inter', size: 11 },
              callback: (val) => val + 'h'
            }
          }
        }
      }
    });
  }

  /* ---------- Task Completion Chart ---------- */

  function renderTasksChart(tasks) {
    const canvas = document.getElementById('chart-tasks');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartInstances.tasks) chartInstances.tasks.destroy();

    const colors = getThemeColors();
    const container = canvas.parentElement;

    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const todo = tasks.filter((t) => t.status === 'todo' || !t.status).length;
    const total = tasks.length;

    const existingEmpty = container.querySelector('.chart-empty');
    if (existingEmpty) existingEmpty.remove();

    if (total === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'chart-empty';
      emptyNotice.textContent = 'No tasks captured yet';
      container.appendChild(emptyNotice);
    }

    chartInstances.tasks = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'To Do'],
        datasets: [{
          data: total === 0 ? [1, 0, 0] : [done, inProgress, todo],
          backgroundColor: total === 0 ? [colors.muted, colors.muted, colors.muted] : [colors.success, colors.warning, colors.primary],
          borderWidth: 2,
          borderColor: colors.tooltipBg,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.textColor,
              font: { family: 'Inter', size: 12 },
              padding: 14,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.headingColor,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                if (total === 0) return ' No tasks';
                const val = ctx.raw;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ' ' + ctx.label + ': ' + val + ' tasks (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

  /* ---------- Main Render ---------- */

  function render() {
    const subjects = S.getSubjects();
    const tasks = S.getTasks();
    const sessions = S.getSessions();
    const focus = S.getFocusSessions();
    const settings = S.getSettings();

    renderStats(subjects, tasks, sessions, focus);
    renderWeeklyChart(focus, sessions, settings);
    renderSubjectsChart(subjects, focus, sessions);
    renderMonthlyChart(focus, sessions);
    renderTasksChart(tasks);
  }

  /* ---------- Events ---------- */

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('studyflow:themechange', () => {
    // Re-render charts with updated theme colors
    render();
  });
})();
