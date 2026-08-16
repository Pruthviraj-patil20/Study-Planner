/* ==========================================================================
   StudyFlow — Subjects
   CRUD for subjects + chapter management.
   ========================================================================== */

(function () {
  'use strict';
  const U = StudyFlow.Utils;
  const S = StudyFlow.Storage;

  let editingId = null;

  /* ---------- Render ---------- */

  function render() {
    const subjects = S.getSubjects();
    const grid = document.getElementById('subject-grid');

    const overallEl = document.getElementById('overall-progress');
    const withChapters = subjects.filter((s) => (s.chapters || []).length > 0);
    const overall = withChapters.length
      ? Math.round(withChapters.reduce((a, s) => a + U.subjectProgress(s), 0) / withChapters.length)
      : 0;
    overallEl.textContent = overall + '%';

    if (!subjects.length) {
      grid.innerHTML =
        '<div class="card"><div class="empty-state">' +
          '<div class="empty-icon">' + U.icon('book') + '</div>' +
          '<h3>No subjects yet</h3>' +
          '<p>Add your first subject to start tracking chapter progress.</p>' +
          '<button class="btn btn-primary" id="empty-add">Add Subject</button>' +
        '</div></div>';
      const btn = document.getElementById('empty-add');
      btn && btn.addEventListener('click', openForm);
      return;
    }

    grid.innerHTML = subjects.map((s) => {
      const pct = U.subjectProgress(s);
      const cls = U.progressClass(pct);
      const total = (s.chapters || []).length;
      const done = (s.chapters || []).filter((c) => c.completed).length;
      const studyMin = U.subjectStudyMinutes(s.id, S.getFocusSessions(), S.getSessions());
      return (
        '<div class="subject-card">' +
          '<div class="subject-top">' +
            '<div class="subject-head">' +
              '<div class="subject-avatar" style="background:' + U.escapeHTML(s.color) + '">' + U.icon(s.icon || 'book') + '</div>' +
              '<div class="subject-head-info">' +
                '<h3 title="' + U.escapeHTML(s.name) + '">' + U.escapeHTML(s.name) + '</h3>' +
                '<div class="subject-meta">Target ' + (s.target || 80) + '%</div>' +
              '</div>' +
              '<div class="subject-actions">' +
                '<button class="icon-btn" data-action="chapters" data-id="' + s.id + '" aria-label="Manage chapters of ' + U.escapeHTML(s.name) + '" title="Chapters">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' +
                '</button>' +
                '<button class="icon-btn" data-action="edit" data-id="' + s.id + '" aria-label="Edit ' + U.escapeHTML(s.name) + '" title="Edit">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>' +
                '</button>' +
                '<button class="icon-btn" data-action="delete" data-id="' + s.id + '" aria-label="Delete ' + U.escapeHTML(s.name) + '" title="Delete">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="subject-body">' +
            '<div class="subject-progress-head">' +
              '<span class="label">Progress</span>' +
              '<span class="value" style="color:' + U.escapeHTML(s.color) + '">' + pct + '%</span>' +
            '</div>' +
            '<div class="progress"><div class="progress-bar ' + cls + '" style="width:' + pct + '%"></div></div>' +
            '<div class="subject-foot">' +
              '<span>' + done + ' / ' + total + ' chapters done</span>' +
              '<span>' + U.formatMinutesShort(studyMin) + ' studied</span>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function bindActions() {
    const grid = document.getElementById('subject-grid');
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') openForm(id);
      else if (action === 'delete') deleteSubject(id);
      else if (action === 'chapters') openChapters(id);
    });
  }

  /* ---------- Add / Edit ---------- */

  function openForm(id) {
    editingId = id || null;
    const subject = editingId ? (S.getSubjects().find((s) => s.id === editingId) || null) : null;

    const swatches = U.COLORS.map((c) =>
      '<button type="button" class="swatch' + (subject && subject.color === c ? ' selected' : '') +
      '" data-color="' + c + '" style="background:' + c + '" aria-label="Color ' + c + '"></button>'
    ).join('');

    const iconOptions = Object.keys(U.ICONS).map((name) =>
      '<button type="button" class="icon-option' + (subject && subject.icon === name ? ' selected' : '') +
      '" data-icon="' + name + '" title="' + name + '">' + U.icon(name) + '</button>'
    ).join('');

    StudyFlow.Modal.openModal({
      title: subject ? 'Edit Subject' : 'Add Subject',
      body:
        '<form id="subject-form" novalidate>' +
          '<div class="form-field">' +
            '<label for="subject-name">Name <span class="required-mark">*</span></label>' +
            '<input type="text" id="subject-name" class="input" value="' + U.escapeHTML(subject ? subject.name : '') + '" placeholder="e.g. Organic Chemistry" required>' +
          '</div>' +
          '<div class="form-field">' +
            '<label>Color</label>' +
            '<div class="swatch-row">' + swatches + '</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label>Icon</label>' +
            '<div class="icon-row">' + iconOptions + '</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="subject-target">Target completion %</label>' +
            '<input type="number" id="subject-target" class="input" min="1" max="100" value="' + (subject ? subject.target : 80) + '">' +
          '</div>' +
        '</form>',
      actions: [
        { label: 'Cancel', class: 'btn-ghost', onClick: () => StudyFlow.Modal.closeModal() },
        { label: subject ? 'Save Changes' : 'Add Subject', class: 'btn-primary', onClick: saveForm }
      ],
      focus: '#subject-name'
    });

    let color = subject ? subject.color : U.COLORS[0];
    let icon = subject ? (subject.icon || 'book') : 'book';

    const swatchRow = document.querySelector('.swatch-row');
    const iconRow = document.querySelector('.icon-row');

    swatchRow.addEventListener('click', (e) => {
      const sw = e.target.closest('.swatch');
      if (!sw) return;
      swatchRow.querySelectorAll('.swatch').forEach((x) => x.classList.remove('selected'));
      sw.classList.add('selected');
      color = sw.dataset.color;
    });

    iconRow.addEventListener('click', (e) => {
      const opt = e.target.closest('.icon-option');
      if (!opt) return;
      iconRow.querySelectorAll('.icon-option').forEach((x) => x.classList.remove('selected'));
      opt.classList.add('selected');
      icon = opt.dataset.icon;
    });

    const nameInput = document.getElementById('subject-name');
    nameInput.addEventListener('input', () => {
      if (nameInput.classList.contains('invalid')) validateForm();
    });
    window._sfSubjectMeta = { getColor: () => color, getIcon: () => icon };
  }

  function validateForm() {
    const name = document.getElementById('subject-name');
    const valid = name.value.trim().length > 0;
    name.classList.toggle('invalid', !valid);
    return valid;
  }

  function saveForm() {
    if (!validateForm()) {
      StudyFlow.UI.showToast('Please enter a subject name.', 'error');
      return;
    }
    const name = document.getElementById('subject-name').value.trim();
    const target = Math.max(1, Math.min(100, Number(document.getElementById('subject-target').value) || 80));
    const meta = window._sfSubjectMeta;
    const subjects = S.getSubjects();

    if (editingId) {
      const subject = subjects.find((s) => s.id === editingId);
      if (subject) {
        subject.name = name;
        subject.target = target;
        if (meta) {
          subject.color = meta.getColor();
          subject.icon = meta.getIcon();
        }
        S.setSubjects(subjects);
        StudyFlow.UI.showToast('Subject updated successfully.');
      }
    } else {
      subjects.push({
        id: U.uid('subj'),
        name,
        color: meta ? meta.getColor() : U.COLORS[0],
        icon: meta ? meta.getIcon() : 'book',
        target,
        chapters: [],
        createdAt: new Date().toISOString()
      });
      S.setSubjects(subjects);
      StudyFlow.UI.showToast('Subject added successfully.');
    }
    delete window._sfSubjectMeta;
    StudyFlow.Modal.closeModal();
    render();
  }

  /* ---------- Delete ---------- */

  function deleteSubject(id) {
    const subjects = S.getSubjects();
    const subject = subjects.find((s) => s.id === id);
    if (!subject) return;
    StudyFlow.Modal.confirmDialog({
      title: 'Delete subject?',
      message: 'Delete "' + subject.name + '"? Related tasks, sessions and exams will be detached from it.',
      confirmText: 'Delete',
      danger: true
    }).then((ok) => {
      if (!ok) return;
      S.setSubjects(subjects.filter((s) => s.id !== id));
      StudyFlow.UI.showToast('Subject deleted successfully.');
      render();
    });
  }

  /* ---------- Chapters ---------- */

  function openChapters(id) {
    const subject = S.getSubjects().find((s) => s.id === id);
    if (!subject) return;

    renderChapterList(subject);

    StudyFlow.Modal.openModal({
      title: 'Chapters — ' + subject.name,
      size: 'modal-lg',
      body:
        '<div id="chapter-list" class="chapter-list"></div>' +
        '<div class="chapter-add">' +
          '<input type="text" id="chapter-name" class="input" placeholder="New chapter name...">' +
          '<button class="btn btn-primary" id="btn-add-chapter">Add</button>' +
        '</div>',
      actions: [
        { label: 'Done', class: 'btn-primary', onClick: () => StudyFlow.Modal.closeModal() }
      ],
      focus: '#chapter-name'
    });

    const subjectId = id;
    const listEl = document.getElementById('chapter-list');
    const input = document.getElementById('chapter-name');

    document.getElementById('btn-add-chapter').addEventListener('click', () => {
      const name = input.value.trim();
      if (!name) {
        StudyFlow.UI.showToast('Enter a chapter name.', 'error');
        return;
      }
      const subjects = S.getSubjects();
      const subj = subjects.find((s) => s.id === subjectId);
      subj.chapters.push({ id: U.uid('chap'), name, completed: false });
      S.setSubjects(subjects);
      input.value = '';
      renderChapterList(subj);
      StudyFlow.UI.showToast('Chapter added successfully.');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-add-chapter').click();
    });

    listEl.addEventListener('change', (e) => {
      const cb = e.target.closest('input[type="checkbox"]');
      if (!cb) return;
      const subjects = S.getSubjects();
      const subj = subjects.find((s) => s.id === subjectId);
      const chap = subj.chapters.find((c) => c.id === cb.dataset.chapterId);
      if (chap) chap.completed = cb.checked;
      S.setSubjects(subjects);
      renderChapterList(subj);
      StudyFlow.UI.showToast(cb.checked ? 'Chapter marked as completed.' : 'Chapter marked as incomplete.');
    });

    listEl.addEventListener('click', (e) => {
      const del = e.target.closest('[data-del-chapter]');
      if (!del) return;
      const subjects = S.getSubjects();
      const subj = subjects.find((s) => s.id === subjectId);
      subj.chapters = subj.chapters.filter((c) => c.id !== del.dataset.delChapter);
      S.setSubjects(subjects);
      renderChapterList(subj);
      StudyFlow.UI.showToast('Chapter deleted successfully.');
    });
  }

  function renderChapterList(subject) {
    const listEl = document.getElementById('chapter-list');
    if (!listEl) return;
    const chapters = subject.chapters || [];
    if (!chapters.length) {
      listEl.innerHTML = '<div class="inline-empty" style="text-align:center;color:var(--text-muted);font-size:12.5px;padding:10px">No chapters yet. Add your first one above.</div>';
      return;
    }
    listEl.innerHTML = chapters.map((c) =>
      '<div class="chapter-item' + (c.completed ? ' done' : '') + '">' +
        '<label>' +
          '<input type="checkbox" data-chapter-id="' + c.id + '"' + (c.completed ? ' checked' : '') + '>' +
          '<span>' + U.escapeHTML(c.name) + '</span>' +
        '</label>' +
        '<button class="icon-btn" data-del-chapter="' + c.id + '" aria-label="Delete chapter" style="width:28px;height:28px">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        '</button>' +
      '</div>'
    ).join('');
  }

  /* ---------- Init ---------- */

  function init() {
    const addBtn = document.getElementById('btn-add-subject');
    addBtn && addBtn.addEventListener('click', () => openForm(null));
    bindActions();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();