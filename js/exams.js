/* ==========================================================================
   StudyFlow — Exams
   Full CRUD for exams and their topic readiness checklists.
   ========================================================================== */

(function () {
  'use strict';

  const U = StudyFlow.Utils;
  const S = StudyFlow.Storage;

  let editingId = null;

  /* ---------- Status helpers ---------- */

  function examDaysLeft(exam) {
    return U.daysBetween(U.todayISO(), exam.date);
  }

  function examStatus(exam) {
    const topics = exam.topics || [];
    if (topics.length && topics.every((t) => t.done)) return 'completed';
    const days = examDaysLeft(exam);
    if (days <= 2) return 'very-near';
    if (days <= 7) return 'near';
    return 'upcoming';
  }

  function statusLabel(status) {
    return {
      'upcoming': '<span class="badge badge-info">Upcoming</span>',
      'near': '<span class="badge badge-warning">Coming soon</span>',
      'very-near': '<span class="badge badge-danger">Very soon</span>',
      'completed': '<span class="badge badge-success">Completed</span>'
    }[status] || '';
  }

  function progressOf(exam) {
    const topics = exam.topics || [];
    const done = topics.filter((t) => t.done).length;
    const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
    return { done, total: topics.length, pct };
  }

  /* ---------- Render ---------- */

  function render() {
    const grid = document.getElementById('exam-grid');
    const exams = S.getExams()
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!exams.length) {
      grid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1">' +
          '<div class="empty-icon">' + U.icon('clipboard-list') + '</div>' +
          '<h3>No exams yet</h3>' +
          '<p>Add an exam to start tracking your countdown and topic readiness.</p>' +
          '<button class="btn btn-primary" id="exam-empty-add">Add Exam</button>' +
        '</div>';
      const btn = document.getElementById('exam-empty-add');
      if (btn) btn.addEventListener('click', () => openForm(null));
      return;
    }

    grid.innerHTML = exams.map((exam) => {
      const status = examStatus(exam);
      const { done, total, pct } = progressOf(exam);
      const days = Math.max(0, examDaysLeft(exam));
      const color = U.subjectColor(exam.subjectId);

      const topicsHTML = (exam.topics || []).map((t) => (
        '<label class="topic-item' + (t.done ? ' done' : '') + '" data-exam-id="' + exam.id + '" data-topic-id="' + t.id + '">' +
          '<input type="checkbox" data-action="toggle-topic"' + (t.done ? ' checked' : '') + ' aria-label="Mark topic done">' +
          '<span class="topic-name">' + U.escapeHTML(t.name) + '</span>' +
          '<button type="button" class="topic-del" data-action="delete-topic" aria-label="Remove topic" title="Remove topic">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</label>'
      )).join('') || '<div class="form-hint">No topics yet — add a few below.</div>';

      return (
        '<div class="exam-card status-' + status + '" data-exam-id="' + exam.id + '">' +
          '<div class="exam-card-top">' +
            '<div class="exam-card-title">' +
              '<h3>' + U.escapeHTML(exam.name) + '</h3>' +
              '<div class="exam-date">' +
                '<span class="dot" style="background:' + color + ';display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px"></span>' +
                U.formatDate(exam.date) + ' · ' + U.escapeHTML(U.subjectName(exam.subjectId)) +
              '</div>' +
            '</div>' +
            '<div class="exam-countdown">' +
              '<div class="cd-num">' + days + '</div>' +
              '<div class="cd-label">' + (days === 1 ? 'day left' : 'days left') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="exam-body">' +
            '<div class="exam-card-status">' + statusLabel(status) + '</div>' +
            (exam.description ? '<p class="exam-desc">' + U.escapeHTML(exam.description) + '</p>' : '') +
            '<div class="exam-progress-head">' +
              '<span class="label">Topic readiness</span>' +
              '<span class="value">' + done + '/' + total + ' · ' + pct + '%</span>' +
            '</div>' +
            '<div class="progress"><div class="progress-bar ' + U.progressClass(pct) + '" style="width:' + pct + '%"></div></div>' +
            '<div class="exam-topics">' + topicsHTML + '</div>' +
            '<div class="exam-actions">' +
              '<div class="topic-add">' +
                '<input type="text" class="input" data-action="add-topic-input" placeholder="Add topic…" aria-label="New topic name">' +
                '<button class="btn btn-soft btn-sm" data-action="add-topic">Add</button>' +
              '</div>' +
              '<button class="btn btn-ghost btn-sm" data-action="edit">Edit</button>' +
              '<button class="btn btn-danger-ghost btn-sm" data-action="delete">Delete</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ---------- Mutations ---------- */

  function persist(updater) {
    const exams = S.getExams();
    const next = updater(exams);
    S.setExams(next);
    render();
  }

  function toggleTopic(examId, topicId) {
    persist((exams) => {
      const exam = exams.find((e) => e.id === examId);
      const topic = exam && (exam.topics || []).find((t) => t.id === topicId);
      if (exam && topic) {
        topic.done = !topic.done;
        StudyFlow.UI.showToast(topic.done ? 'Topic marked as prepared.' : 'Topic marked as not prepared.');
      }
      return exams;
    });
  }

  function deleteTopic(examId, topicId) {
    persist((exams) => {
      const exam = exams.find((e) => e.id === examId);
      if (exam) {
        exam.topics = (exam.topics || []).filter((t) => t.id !== topicId);
        StudyFlow.UI.showToast('Topic removed.');
      }
      return exams;
    });
  }

  function addTopic(examId, name) {
    const clean = String(name || '').trim();
    if (!clean) return;
    persist((exams) => {
      const exam = exams.find((e) => e.id === examId);
      if (exam) {
        if (!Array.isArray(exam.topics)) exam.topics = [];
        exam.topics.push({ id: U.uid('tp'), name: clean, done: false });
        StudyFlow.UI.showToast('Topic added.');
      }
      return exams;
    });
  }

  function deleteExam(id) {
    const exam = S.getExams().find((e) => e.id === id);
    if (!exam) return;
    StudyFlow.Modal.confirmDialog({
      title: 'Delete exam?',
      message: 'Delete "' + exam.name + '" and its ' + (exam.topics || []).length + ' topic(s)?',
      confirmText: 'Delete',
      danger: true
    }).then((ok) => {
      if (!ok) return;
      persist((exams) => exams.filter((e) => e.id !== id));
      StudyFlow.UI.showToast('Exam deleted.');
    });
  }

  /* ---------- Form ---------- */

  function subjectOptions() {
    return S.getSubjects().map((s) =>
      '<option value="' + s.id + '">' + U.escapeHTML(s.name) + '</option>'
    ).join('');
  }

  function openForm(id) {
    editingId = id || null;
    const exam = editingId ? (S.getExams().find((e) => e.id === editingId) || null) : null;
    const topicsText = exam ? (exam.topics || []).map((t) => t.name).join(', ') : '';

    StudyFlow.Modal.openModal({
      title: exam ? 'Edit Exam' : 'Add Exam',
      body:
        '<form id="exam-form" novalidate>' +
          '<div class="form-field">' +
            '<label for="exam-name">Exam name <span class="required-mark">*</span></label>' +
            '<input type="text" class="input" id="exam-name" value="' + U.escapeHTML(exam ? exam.name : '') + '" placeholder="e.g. Mathematics Midterm" required>' +
          '</div>' +
          '<div class="grid grid-cols-2">' +
            '<div class="form-field">' +
              '<label for="exam-subject">Subject</label>' +
              '<select class="select" id="exam-subject">' + subjectOptions() + '</select>' +
            '</div>' +
            '<div class="form-field">' +
              '<label for="exam-date">Date <span class="required-mark">*</span></label>' +
              '<input type="date" class="input" id="exam-date" value="' + (exam ? exam.date : '') + '" required>' +
            '</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="exam-desc">Description</label>' +
            '<textarea class="textarea" id="exam-desc" placeholder="What does the exam cover?">' + U.escapeHTML(exam ? exam.description : '') + '</textarea>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="exam-topics">Topics <span class="required-mark">*</span></label>' +
            '<input type="text" class="input" id="exam-topics" value="' + U.escapeHTML(topicsText) + '" placeholder="e.g. Limits, Derivatives, Integration">' +
            '<div class="form-hint">Separate topics with commas.</div>' +
          '</div>' +
        '</form>',
      actions: [
        { label: 'Cancel', class: 'btn-ghost', onClick: () => StudyFlow.Modal.closeModal() },
        { label: exam ? 'Save Changes' : 'Add Exam', class: 'btn-primary', onClick: saveExam }
      ],
      focus: '#exam-name'
    });
  }

  function saveExam() {
    const name = document.getElementById('exam-name').value.trim();
    const subjectId = document.getElementById('exam-subject').value;
    const date = document.getElementById('exam-date').value;
    const description = document.getElementById('exam-desc').value.trim();
    const topicNames = document.getElementById('exam-topics').value.split(',').map((t) => t.trim()).filter(Boolean);

    if (!name) { StudyFlow.UI.showToast('Please enter an exam name.', 'error'); return; }
    if (!date) { StudyFlow.UI.showToast('Please choose a date.', 'error'); return; }
    if (!topicNames.length) { StudyFlow.UI.showToast('Please add at least one topic.', 'error'); return; }

    const exams = S.getExams();
    if (editingId) {
      const exam = exams.find((e) => e.id === editingId);
      if (exam) {
        Object.assign(exam, {
          name, subjectId, date, description,
          topics: topicNames.map((name, i) => {
            const existing = (exam.topics || [])[i];
            return existing ? Object.assign(existing, { name }) : { id: U.uid('tp'), name, done: false };
          })
        });
        S.setExams(exams);
        StudyFlow.UI.showToast('Exam updated.');
      }
    } else {
      exams.push({
        id: U.uid('exam'),
        name, subjectId, date, description,
        topics: topicNames.map((name) => ({ id: U.uid('tp'), name, done: false })),
        createdAt: new Date().toISOString()
      });
      S.setExams(exams);
      StudyFlow.UI.showToast('Exam added.');
    }
    StudyFlow.Modal.closeModal();
    render();
  }

  /* ---------- Events ---------- */

  function bindEvents() {
    document.getElementById('btn-add-exam').addEventListener('click', () => openForm(null));

    document.getElementById('exam-grid').addEventListener('click', (e) => {
      const topicDel = e.target.closest('[data-action="delete-topic"]');
      if (topicDel) {
        const item = topicDel.closest('.topic-item');
        deleteTopic(item.dataset.examId, item.dataset.topicId);
        return;
      }

      const topicCheck = e.target.closest('input[data-action="toggle-topic"]');
      if (topicCheck) {
        const item = topicCheck.closest('.topic-item');
        toggleTopic(item.dataset.examId, item.dataset.topicId);
        return;
      }

      const addBtn = e.target.closest('[data-action="add-topic"]');
      if (addBtn) {
        const card = addBtn.closest('.exam-card');
        const input = card.querySelector('[data-action="add-topic-input"]');
        addTopic(card.dataset.examId, input.value);
        input.value = '';
        return;
      }

      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;
      const card = actionBtn.closest('.exam-card');
      const action = actionBtn.dataset.action;
      if (action === 'edit') openForm(card.dataset.examId);
      else if (action === 'delete') deleteExam(card.dataset.examId);
    });

    document.getElementById('exam-grid').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const input = e.target.closest('[data-action="add-topic-input"]');
      if (!input) return;
      const card = input.closest('.exam-card');
      addTopic(card.dataset.examId, input.value);
      input.value = '';
    });
  }

  /* ---------- Init ---------- */

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    render();
  });
})();