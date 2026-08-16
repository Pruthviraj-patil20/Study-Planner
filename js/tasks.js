/* ==========================================================================
   StudyFlow — Tasks
   Full task CRUD with search, filter, sort and overdue detection.
   ========================================================================== */

(function () {
  'use strict';
  const U = StudyFlow.Utils;
  const S = StudyFlow.Storage;

  const CATEGORIES = ['Assignment', 'Homework', 'Project', 'Revision', 'Practice', 'Other'];
  let statusFilter = 'all';
  let searchTerm = '';
  let sortBy = 'deadline';
  let editingId = null;

  /* ---------- Overdue detection ---------- */

  function isOverdue(task) {
    return task.status !== 'done' && task.deadline && String(task.deadline) < U.todayISO();
  }

  /* ---------- Stats ---------- */

  function renderStats() {
    const tasks = S.getTasks();
    const today = U.todayISO();
    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter(isOverdue).length
    };

    document.getElementById('tasks-stats').innerHTML =
      '<div class="stat-card">' +
        '<span class="stat-icon ic-primary"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>' +
        '<div class="stat-info"><div class="stat-value">' + stats.total + '</div><div class="stat-label">Total tasks</div></div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<span class="stat-icon ic-warning"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>' +
        '<div class="stat-info"><div class="stat-value">' + (stats.todo + stats.inProgress) + '</div><div class="stat-label">In progress</div></div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<span class="stat-icon ic-success"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>' +
        '<div class="stat-info"><div class="stat-value">' + stats.done + '</div><div class="stat-label">Completed</div></div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<span class="stat-icon ic-danger"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>' +
        '<div class="stat-info"><div class="stat-value">' + stats.overdue + '</div><div class="stat-label">Overdue</div></div>' +
      '</div>';

    document.querySelectorAll('#status-filters .pill').forEach((p) => {
      p.classList.toggle('active', p.dataset.status === statusFilter);
    });
  }

  /* ---------- Filtering ---------- */

  function getFiltered() {
    let list = S.getTasks();
    const term = searchTerm.toLowerCase();

    if (statusFilter === 'overdue') list = list.filter(isOverdue);
    else if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);

    if (term) {
      list = list.filter((t) =>
        (t.title || '').toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term) ||
        (t.category || '').toLowerCase().includes(term) ||
        U.subjectName(t.subjectId).toLowerCase().includes(term)
      );
    }

    const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };
    const STATUS_ORDER = { todo: 0, 'in-progress': 1, done: 2 };

    switch (sortBy) {
      case 'priority':
        list.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));
        break;
      case 'created':
        list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        break;
      case 'subject':
        list.sort((a, b) => U.subjectName(a.subjectId).localeCompare(U.subjectName(b.subjectId)));
        break;
      case 'deadline':
      default:
        list.sort((a, b) => {
          const ov = Number(isOverdue(b)) - Number(isOverdue(a));
          if (ov !== 0) return ov;
          const ad = String(a.deadline || '9999');
          const bd = String(b.deadline || '9999');
          if (ad !== bd) return ad.localeCompare(bd);
          return (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
        });
        break;
    }
    return list;
  }

  /* ---------- Render table ---------- */

  function render() {
    renderStats();
    const list = getFiltered();
    const body = document.getElementById('tasks-body');
    const emptyEl = document.getElementById('tasks-empty');

    if (!list.length) {
      body.innerHTML = '';
      emptyEl.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>' +
          '<h3>No tasks found</h3>' +
          '<p>' + (searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first task to get started.') + '</p>' +
          '<button class="btn btn-primary" id="empty-add-task">Add Task</button>' +
        '</div>';
      const btn = document.getElementById('empty-add-task');
      btn && btn.addEventListener('click', () => openForm(null));
      return;
    }

    emptyEl.innerHTML = '';
    body.innerHTML = list.map((t) => {
      const overdue = isOverdue(t);
      const color = U.subjectColor(t.subjectId);

      const priorityBadge =
        t.priority === 'High' ? '<span class="badge badge-danger">High</span>' :
        t.priority === 'Low' ? '<span class="badge badge-muted">Low</span>' :
        '<span class="badge badge-warning">Medium</span>';

      const statusBadge =
        t.status === 'done' ? '<span class="badge badge-success">Done</span>' :
        t.status === 'in-progress' ? '<span class="badge badge-info">In Progress</span>' :
        overdue ? '<span class="badge badge-danger">Overdue</span>' :
        '<span class="badge badge-outline">To Do</span>';

      const deadlineCell = t.deadline
        ? '<div class="row" style="gap:6px">' + U.formatDate(t.deadline) + (overdue ? '<span class="overdue-mark">!</span>' : '') + '</div>'
        : '<span class="muted">—</span>';

      return (
        '<tr class="task-row' + (t.status === 'done' ? ' done' : '') + '">' +
          '<td><input type="checkbox" class="task-check" data-toggle="' + t.id + '"' + (t.status === 'done' ? ' checked' : '') + ' aria-label="Complete ' + U.escapeHTML(t.title) + '"></td>' +
          '<td class="task-title-cell">' +
            '<div class="t-title">' + U.escapeHTML(t.title) + '</div>' +
            (t.description ? '<div class="t-desc">' + U.escapeHTML(t.description) + '</div>' : '') +
          '</td>' +
          '<td><span class="subject-tag"><span class="dot" style="background:' + color + '"></span>' + U.escapeHTML(U.subjectName(t.subjectId)) + '</span></td>' +
          '<td><span class="muted">' + U.escapeHTML(t.category || 'Other') + '</span></td>' +
          '<td>' + priorityBadge + '</td>' +
          '<td>' + deadlineCell + '</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td><div class="row-actions">' +
            (t.status !== 'done'
              ? '<button class="icon-btn" data-action="start" data-id="' + t.id + '" title="Move to in progress" aria-label="Move to in progress">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>'
              : '') +
            '<button class="icon-btn" data-action="edit" data-id="' + t.id + '" title="Edit" aria-label="Edit task">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg></button>' +
            '<button class="icon-btn" data-action="delete" data-id="' + t.id + '" title="Delete" aria-label="Delete task">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
          '</div></td>' +
        '</tr>'
      );
    }).join('');
  }

  /* ---------- Form ---------- */

  function openForm(id) {
    editingId = id || null;
    const task = editingId ? (S.getTasks().find((t) => t.id === editingId) || null) : null;
    const subjects = S.getSubjects();

    const subjectOpts = subjects.map((s) =>
      '<option value="' + s.id + '"' + (task && task.subjectId === s.id ? ' selected' : '') + '>' + U.escapeHTML(s.name) + '</option>'
    ).join('');

    const categoryOpts = CATEGORIES.map((c) =>
      '<option value="' + c + '"' + (task && task.category === c ? ' selected' : '') + '>' + c + '</option>'
    ).join('');

    StudyFlow.Modal.openModal({
      title: task ? 'Edit Task' : 'Add Task',
      body:
        '<form id="task-form" novalidate>' +
          '<div class="form-field">' +
            '<label for="task-title">Title <span class="required-mark">*</span></label>' +
            '<input type="text" id="task-title" class="input" value="' + U.escapeHTML(task ? task.title : '') + '" placeholder="e.g. Complete OS assignment" required>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="task-desc">Description</label>' +
            '<textarea id="task-desc" class="textarea" placeholder="Optional details...">' + U.escapeHTML(task ? task.description : '') + '</textarea>' +
          '</div>' +
          '<div class="grid grid-cols-2">' +
            '<div class="form-field">' +
              '<label for="task-subject">Subject</label>' +
              '<select class="select" id="task-subject">' + subjectOpts + '</select>' +
            '</div>' +
            '<div class="form-field">' +
              '<label for="task-category">Category</label>' +
              '<select class="select" id="task-category">' + categoryOpts + '</select>' +
            '</div>' +
          '</div>' +
          '<div class="grid grid-cols-2">' +
            '<div class="form-field">' +
              '<label for="task-priority">Priority</label>' +
              '<select class="select" id="task-priority">' +
                '<option value="Low"' + (task && task.priority === 'Low' ? ' selected' : '') + '>Low</option>' +
                '<option value="Medium"' + (!task || task.priority === 'Medium' ? ' selected' : '') + '>Medium</option>' +
                '<option value="High"' + (task && task.priority === 'High' ? ' selected' : '') + '>High</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-field">' +
              '<label for="task-deadline">Deadline</label>' +
              '<input type="date" id="task-deadline" class="input" value="' + (task && task.deadline ? task.deadline : '') + '">' +
            '</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="task-status">Status</label>' +
            '<select class="select" id="task-status">' +
              '<option value="todo"' + ((!task || task.status === 'todo') ? ' selected' : '') + '>To Do</option>' +
              '<option value="in-progress"' + (task && task.status === 'in-progress' ? ' selected' : '') + '>In Progress</option>' +
              '<option value="done"' + (task && task.status === 'done' ? ' selected' : '') + '>Done</option>' +
            '</select>' +
          '</div>' +
        '</form>',
      actions: [
        { label: 'Cancel', class: 'btn-ghost', onClick: () => StudyFlow.Modal.closeModal() },
        { label: task ? 'Save Changes' : 'Add Task', class: 'btn-primary', onClick: saveTask }
      ],
      focus: '#task-title'
    });
  }

  function saveTask() {
    const title = document.getElementById('task-title');
    if (!title.value.trim()) {
      title.classList.add('invalid');
      StudyFlow.UI.showToast('Please enter a task title.', 'error');
      return;
    }

    const data = {
      title: title.value.trim(),
      description: document.getElementById('task-desc').value.trim(),
      subjectId: document.getElementById('task-subject').value,
      category: document.getElementById('task-category').value,
      priority: document.getElementById('task-priority').value,
      deadline: document.getElementById('task-deadline').value || '',
      status: document.getElementById('task-status').value
    };

    const tasks = S.getTasks();
    if (editingId) {
      const t = tasks.find((x) => x.id === editingId);
      if (t) {
        Object.assign(t, data);
        t.completedAt = data.status === 'done' ? (t.completedAt || new Date().toISOString()) : null;
        S.setTasks(tasks);
        StudyFlow.UI.showToast('Task updated successfully.');
      }
    } else {
      tasks.push(Object.assign({
        id: U.uid('task'),
        createdAt: new Date().toISOString(),
        completedAt: data.status === 'done' ? new Date().toISOString() : null
      }, data));
      S.setTasks(tasks);
      StudyFlow.UI.showToast('Task added successfully.');
    }
    StudyFlow.Modal.closeModal();
    render();
  }

  /* ---------- Actions ---------- */

  function toggleComplete(id) {
    const tasks = S.getTasks();
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const nowDone = t.status !== 'done';
    t.status = nowDone ? 'done' : 'todo';
    t.completedAt = nowDone ? new Date().toISOString() : null;
    S.setTasks(tasks);
    StudyFlow.UI.showToast(nowDone ? 'Task marked as completed.' : 'Task reopened.');
    render();
  }

  function startTask(id) {
    const tasks = S.getTasks();
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.status = 'in-progress';
    S.setTasks(tasks);
    StudyFlow.UI.showToast('Task moved to in progress.');
    render();
  }

  function deleteTask(id) {
    const tasks = S.getTasks();
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    StudyFlow.Modal.confirmDialog({
      title: 'Delete task?',
      message: 'Delete "' + t.title + '"? This cannot be undone.',
      confirmText: 'Delete',
      danger: true
    }).then((ok) => {
      if (!ok) return;
      S.setTasks(tasks.filter((x) => x.id !== id));
      StudyFlow.UI.showToast('Task deleted successfully.');
      render();
    });
  }

  /* ---------- Events ---------- */

  function bindEvents() {
    document.getElementById('btn-add-task').addEventListener('click', () => openForm(null));

    document.querySelectorAll('#status-filters .pill').forEach((p) => {
      p.addEventListener('click', () => {
        statusFilter = p.dataset.status;
        render();
      });
    });

    document.getElementById('task-search').addEventListener('input', U.debounce((e) => {
      searchTerm = e.target.value;
      render();
    }, 180));

    document.getElementById('task-sort').addEventListener('change', (e) => {
      sortBy = e.target.value;
      render();
    });

    document.getElementById('tasks-body').addEventListener('click', (e) => {
      const cb = e.target.closest('.task-check');
      if (cb) { toggleComplete(cb.dataset.toggle); return; }
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'edit') openForm(id);
      else if (action === 'delete') deleteTask(id);
      else if (action === 'start') startTask(id);
    });
  }

  /* ---------- Init ---------- */

  function init() {
    bindEvents();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();