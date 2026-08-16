/* ==========================================================================
   StudyFlow — Planner
   Day / Week views with full session CRUD.
   ========================================================================== */

(function () {
  'use strict';
  const U = StudyFlow.Utils;
  const S = StudyFlow.Storage;

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let view = 'week';
  let anchor = new Date(); // reference date for the visible week/day
  let selectedDate = U.toISODate(new Date());
  let editingId = null;

  /* ---------- Navigation ---------- */

  function shiftPeriod(dir) {
    const settings = S.getSettings();
    if (view === 'week') {
      anchor = U.addDays(anchor, dir * 7);
    } else {
      anchor = U.addDays(anchor, dir);
    }
    selectedDate = U.toISODate(anchor);
    render();
  }

  function goToday() {
    anchor = new Date();
    selectedDate = U.toISODate(anchor);
    render();
  }

  /* ---------- Session helpers ---------- */

  function sessionsForDate(iso) {
    return S.getSessions()
      .filter((s) => String(s.date || '').slice(0, 10) === iso)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }

  function priorityColor(p) {
    return p === 'High' ? 'var(--danger)' : p === 'Low' ? 'var(--success)' : 'var(--warning)';
  }

  function sessionChipHTML(s) {
    const color = U.subjectColor(s.subjectId);
    return (
      '<button class="session-chip' + (s.completed ? ' done' : '') + '" data-session-id="' + s.id + '" style="background:' + color + '22" aria-label="Session: ' + U.escapeHTML(s.topic || U.subjectName(s.subjectId)) + '">' +
        '<span class="chip-time">' + U.escapeHTML(s.startTime || '') + '–' + U.escapeHTML(s.endTime || '') + '</span>' +
        '<span class="chip-topic">' + U.escapeHTML(s.topic || 'Study session') + '</span>' +
        '<span class="chip-subject"><span class="dot" style="background:' + color + '"></span>' + U.escapeHTML(U.subjectName(s.subjectId)) + '</span>' +
      '</button>'
    );
  }

  /* ---------- Week view ---------- */

  function renderWeek() {
    const settings = S.getSettings();
    const weekStart = U.startOfWeek(anchor, settings.weekStart);
    const todayISO = U.todayISO();
    const days = [];
    for (let i = 0; i < 7; i++) days.push(U.addDays(weekStart, i));

    const headEl = document.getElementById('week-head');
    headEl.innerHTML = days.map((d) => {
      const iso = U.toISODate(d);
      const cls = ['week-head-cell'];
      if (iso === todayISO) cls.push('is-today');
      if (iso === selectedDate) cls.push('is-selected');
      return (
        '<div class="' + cls.join(' ') + '" data-date="' + iso + '" role="button" tabindex="0" aria-label="' + DAY_NAMES_FULL[d.getDay()] + ' ' + iso + '">' +
          '<div class="wd">' + DAY_NAMES[d.getDay()] + '</div>' +
          '<div class="dn">' + d.getDate() + '</div>' +
        '</div>'
      );
    }).join('');

    const gridEl = document.getElementById('week-grid');
    gridEl.innerHTML = days.map((d) => {
      const iso = U.toISODate(d);
      const list = sessionsForDate(iso);
      const cls = ['week-day'];
      if (iso === todayISO) cls.push('is-today');
      const body = list.length
        ? list.map(sessionChipHTML).join('')
        : '<div class="empty-day">No sessions</div>';
      return '<div class="' + cls.join(' ') + '" data-date="' + iso + '">' + body + '</div>';
    }).join('');

    const rangeLabel = document.getElementById('planner-range');
    const from = weekStart;
    const to = days[6];
    if (from.getMonth() === to.getMonth()) {
      rangeLabel.textContent = from.toLocaleDateString(undefined, { month: 'long' }) + ' ' + from.getDate() + ' – ' + to.getDate() + ', ' + to.getFullYear();
    } else {
      rangeLabel.textContent = from.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' – ' + to.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  /* ---------- Day view ---------- */

  function renderDay() {
    document.getElementById('planner-range').textContent =
      U.formatDateLong(selectedDate);

    const titleEl = document.getElementById('day-title-text');
    const d = U.parseISODate(selectedDate);
    const suffix = d.getDate() % 10 === 1 && d.getDate() !== 11 ? 'st' : d.getDate() % 10 === 2 && d.getDate() !== 12 ? 'nd' : d.getDate() % 10 === 3 && d.getDate() !== 13 ? 'rd' : 'th';
    titleEl.textContent = DAY_NAMES_FULL[d.getDay()] + ', ' + d.toLocaleDateString(undefined, { month: 'long' }) + ' ' + d.getDate() + suffix;

    const timeline = document.getElementById('day-timeline');
    const list = sessionsForDate(selectedDate);

    if (!list.length) {
      timeline.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">' + U.icon('calendar') + '</div>' +
          '<h3>No sessions this day</h3>' +
          '<p>Plan a study session to get started.</p>' +
          '<button class="btn btn-primary" id="day-empty-add">Add Study Session</button>' +
        '</div>';
      const btn = document.getElementById('day-empty-add');
      btn && btn.addEventListener('click', () => openForm(null));
      return;
    }

    timeline.innerHTML = list.map((s) => {
      const color = U.subjectColor(s.subjectId);
      const statusBadge = s.completed
        ? '<span class="badge badge-success">Done</span>'
        : '<span class="badge badge-outline">Open</span>';
      return (
        '<div class="day-session' + (s.completed ? ' done' : '') + '" data-session-id="' + s.id + '">' +
          '<div class="ds-time">' + U.escapeHTML(s.startTime || '') + '–' + U.escapeHTML(s.endTime || '') + '<br><span class="muted">' + U.formatMinutes(s.duration) + '</span></div>' +
          '<div class="ds-color" style="background:' + color + '"></div>' +
          '<div class="ds-main">' +
            '<div class="ds-title"><span class="priority-dot" style="background:' + priorityColor(s.priority) + '"></span>' + U.escapeHTML(U.subjectName(s.subjectId)) + (s.topic ? ' — ' + U.escapeHTML(s.topic) : '') + '</div>' +
            (s.notes ? '<div class="ds-notes">' + U.escapeHTML(s.notes) + '</div>' : '') +
          '</div>' +
          '<div class="ds-actions">' +
            statusBadge +
            '<button class="icon-btn" data-action="toggle" data-id="' + s.id + '" aria-label="Toggle completion" title="Toggle complete">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
            '</button>' +
            '<button class="icon-btn" data-action="edit" data-id="' + s.id + '" aria-label="Edit session" title="Edit">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>' +
            '</button>' +
            '<button class="icon-btn" data-action="delete" data-id="' + s.id + '" aria-label="Delete session" title="Delete">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ---------- Render ---------- */

  function render() {
    document.getElementById('week-view').classList.toggle('hidden', view !== 'week');
    document.getElementById('day-view').classList.toggle('hidden', view !== 'day');
    document.getElementById('view-week').classList.toggle('active', view === 'week');
    document.getElementById('view-day').classList.toggle('active', view === 'day');

    if (view === 'week') renderWeek();
    else renderDay();
  }

  /* ---------- Session form ---------- */

  function subjectOptions() {
    const subjects = S.getSubjects();
    const opts = subjects.map((s) =>
      '<option value="' + s.id + '">' + U.escapeHTML(s.name) + '</option>'
    ).join('');
    return opts || '<option value="">No subjects — add one first</option>';
  }

  function openForm(id) {
    editingId = id || null;
    const session = editingId
      ? (S.getSessions().find((s) => s.id === editingId) || null)
      : null;
    const dateValue = session ? session.date : selectedDate;
    const subjectId = session ? session.subjectId : (S.getSubjects()[0] || {}).id || '';

    StudyFlow.Modal.openModal({
      title: session ? 'Edit Study Session' : 'Add Study Session',
      body:
        '<form id="session-form" novalidate>' +
          '<div class="form-field">' +
            '<label for="sess-subject">Subject <span class="required-mark">*</span></label>' +
            '<select class="select" id="sess-subject" required>' + subjectOptions() + '</select>' +
            '<div class="form-error hidden" id="sess-subject-err">Please add a subject first.</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="sess-topic">Topic <span class="required-mark">*</span></label>' +
            '<input type="text" id="sess-topic" class="input" value="' + U.escapeHTML(session ? session.topic : '') + '" placeholder="e.g. Integration by parts" required>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="sess-date">Date <span class="required-mark">*</span></label>' +
            '<input type="date" id="sess-date" class="input" value="' + (session ? session.date : dateValue) + '" required>' +
          '</div>' +
          '<div class="grid grid-cols-2">' +
            '<div class="form-field">' +
              '<label for="sess-start">Start time <span class="required-mark">*</span></label>' +
              '<input type="time" id="sess-start" class="input" value="' + U.escapeHTML(session ? session.startTime : '09:00') + '" required>' +
            '</div>' +
            '<div class="form-field">' +
              '<label for="sess-end">End time <span class="required-mark">*</span></label>' +
              '<input type="time" id="sess-end" class="input" value="' + U.escapeHTML(session ? session.endTime : '10:00') + '" required>' +
            '</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label>Duration</label>' +
            '<div class="form-hint" id="sess-duration">Calculated automatically</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="sess-priority">Priority</label>' +
            '<select class="select" id="sess-priority">' +
              '<option value="Low"' + (session && session.priority === 'Low' ? ' selected' : '') + '>Low</option>' +
              '<option value="Medium"' + (!session || session.priority === 'Medium' ? ' selected' : '') + '>Medium</option>' +
              '<option value="High"' + (session && session.priority === 'High' ? ' selected' : '') + '>High</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="sess-notes">Notes</label>' +
            '<textarea id="sess-notes" class="textarea" placeholder="Optional notes...">' + U.escapeHTML(session ? session.notes : '') + '</textarea>' +
          '</div>' +
          '<div class="form-field">' +
            '<label class="checkbox-row">' +
              '<input type="checkbox" id="sess-completed"' + (session && session.completed ? ' checked' : '') + '>' +
              'Mark as completed' +
            '</label>' +
          '</div>' +
        '</form>',
      actions: [
        { label: 'Cancel', class: 'btn-ghost', onClick: () => StudyFlow.Modal.closeModal() },
        { label: session ? 'Save Changes' : 'Add Session', class: 'btn-primary', onClick: saveSession }
      ],
      focus: '#sess-topic'
    });

    const start = document.getElementById('sess-start');
    const end = document.getElementById('sess-end');
    const durEl = document.getElementById('sess-duration');

    function updateDuration() {
      const mins = U.minutesBetween(start.value, end.value);
      durEl.textContent = mins > 0
        ? 'Duration: ' + U.formatMinutes(mins) + ' (' + mins + ' minutes)'
        : 'End time must be after start time';
      durEl.style.color = mins > 0 ? '' : 'var(--danger)';
    }
    start.addEventListener('change', updateDuration);
    end.addEventListener('change', updateDuration);
    updateDuration();
  }

  function validateSession() {
    const subject = document.getElementById('sess-subject');
    const topic = document.getElementById('sess-topic');
    const date = document.getElementById('sess-date');
    const start = document.getElementById('sess-start');
    const end = document.getElementById('sess-end');
    const err = document.getElementById('sess-subject-err');

    let ok = true;
    const mark = (el, valid) => {
      el.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    };

    if (!subject.value) {
      err.classList.remove('hidden');
      ok = false;
    } else {
      err.classList.add('hidden');
    }
    mark(topic, topic.value.trim().length > 0);
    mark(date, date.value.length > 0);
    mark(start, start.value.length > 0);
    mark(end, end.value.length > 0 && U.minutesBetween(start.value, end.value) > 0);
    return ok;
  }

  function saveSession() {
    if (!validateSession()) {
      StudyFlow.UI.showToast('Please fix the highlighted fields.', 'error');
      return;
    }
    const subjectId = document.getElementById('sess-subject').value;
    const topic = document.getElementById('sess-topic').value.trim();
    const date = document.getElementById('sess-date').value;
    const startTime = document.getElementById('sess-start').value;
    const endTime = document.getElementById('sess-end').value;
    const duration = U.minutesBetween(startTime, endTime);
    const priority = document.getElementById('sess-priority').value;
    const notes = document.getElementById('sess-notes').value.trim();
    const completed = document.getElementById('sess-completed').checked;

    const sessions = S.getSessions();
    if (editingId) {
      const s = sessions.find((x) => x.id === editingId);
      if (s) {
        Object.assign(s, { subjectId, topic, date, startTime, endTime, duration, priority, notes, completed });
        S.setSessions(sessions);
        selectedDate = date;
        StudyFlow.UI.showToast('Session updated successfully.');
      }
    } else {
      sessions.push({
        id: U.uid('sess'),
        subjectId, topic, date, startTime, endTime, duration, priority, notes, completed,
        createdAt: new Date().toISOString()
      });
      S.setSessions(sessions);
      selectedDate = date;
      StudyFlow.UI.showToast('Study session added successfully.');
    }
    StudyFlow.Modal.closeModal();
    anchor = U.parseISODate(selectedDate);
    render();
  }

  /* ---------- Actions ---------- */

  function toggleComplete(id) {
    const sessions = S.getSessions();
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    s.completed = !s.completed;
    S.setSessions(sessions);
    StudyFlow.UI.showToast(s.completed ? 'Session marked as completed.' : 'Session reopened.');
    render();
  }

  function deleteSession(id) {
    const sessions = S.getSessions();
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    StudyFlow.Modal.confirmDialog({
      title: 'Delete session?',
      message: 'Delete the study session "' + (s.topic || U.subjectName(s.subjectId)) + '" on ' + U.formatDate(s.date) + '?',
      confirmText: 'Delete',
      danger: true
    }).then((ok) => {
      if (!ok) return;
      S.setSessions(sessions.filter((x) => x.id !== id));
      StudyFlow.UI.showToast('Session deleted successfully.');
      render();
    });
  }

  function bindViewEvents() {
    document.getElementById('btn-prev').addEventListener('click', () => shiftPeriod(-1));
    document.getElementById('btn-next').addEventListener('click', () => shiftPeriod(1));
    document.getElementById('btn-today').addEventListener('click', goToday);
    document.getElementById('btn-add-session').addEventListener('click', () => openForm(null));
    document.getElementById('view-week').addEventListener('click', () => { view = 'week'; render(); });
    document.getElementById('view-day').addEventListener('click', () => { view = 'day'; render(); });

    document.getElementById('week-head').addEventListener('click', (e) => {
      const cell = e.target.closest('.week-head-cell');
      if (!cell) return;
      selectedDate = cell.dataset.date;
      anchor = U.parseISODate(selectedDate);
      view = 'day';
      render();
    });

    document.getElementById('week-head').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const cell = e.target.closest('.week-head-cell');
      if (!cell) return;
      selectedDate = cell.dataset.date;
      anchor = U.parseISODate(selectedDate);
      view = 'day';
      render();
    });

    document.getElementById('week-grid').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-session-id]');
      if (chip) {
        openForm(chip.dataset.sessionId);
        return;
      }
      const day = e.target.closest('.week-day');
      if (day) {
        selectedDate = day.dataset.date;
        anchor = U.parseISODate(selectedDate);
        view = 'day';
        render();
      }
    });

    document.getElementById('day-timeline').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') openForm(id);
      else if (action === 'delete') deleteSession(id);
      else if (action === 'toggle') toggleComplete(id);
    });
  }

  /* ---------- Init ---------- */

  function init() {
    selectedDate = U.toISODate(anchor);
    bindViewEvents();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();