/* ==========================================================================
   StudyFlow — Notes
   CRUD operations, search, subject filtering, and pinning for study notes.
   ========================================================================== */

(function () {
  'use strict';

  const U = StudyFlow.Utils;
  const S = StudyFlow.Storage;

  let searchTerm = '';
  let subjectFilter = 'all';
  let pinnedOnly = false;
  let editingId = null;

  /* ---------- Filter & Sort ---------- */

  function getFilteredNotes() {
    let list = S.getNotes();
    const term = searchTerm.trim().toLowerCase();

    if (subjectFilter !== 'all') {
      list = list.filter((n) => n.subjectId === subjectFilter);
    }

    if (pinnedOnly) {
      list = list.filter((n) => n.pinned);
    }

    if (term) {
      list = list.filter((n) => {
        const titleMatch = (n.title || '').toLowerCase().includes(term);
        const contentMatch = (n.content || '').toLowerCase().includes(term);
        const subjName = U.subjectName(n.subjectId).toLowerCase();
        return titleMatch || contentMatch || subjName.includes(term);
      });
    }

    // Sort: pinned first, then newest updated/created first
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const dateA = a.updatedAt || a.createdAt || '';
      const dateB = b.updatedAt || b.createdAt || '';
      return String(dateB).localeCompare(String(dateA));
    });
  }

  /* ---------- Populate Subject Filter Dropdown ---------- */

  function populateSubjectFilter() {
    const select = document.getElementById('note-filter');
    if (!select) return;

    const subjects = S.getSubjects();
    const currentVal = select.value || 'all';

    let html = '<option value="all">All subjects</option>';
    subjects.forEach((s) => {
      html += '<option value="' + U.escapeHTML(s.id) + '">' + U.escapeHTML(s.name) + '</option>';
    });
    select.innerHTML = html;
    select.value = currentVal;
  }

  /* ---------- Render Notes Grid ---------- */

  function render() {
    const list = getFilteredNotes();
    const grid = document.getElementById('notes-grid');
    const empty = document.getElementById('notes-empty');
    if (!grid || !empty) return;

    if (!list.length) {
      grid.innerHTML = '';
      empty.innerHTML =
        '<div class="card"><div class="empty-state">' +
          '<div class="empty-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
          '</div>' +
          '<h3>No notes found</h3>' +
          '<p>' + (searchTerm || subjectFilter !== 'all' || pinnedOnly ? 'Try clearing or changing your search filters.' : 'Create your first study note to organize revision materials.') + '</p>' +
          '<button class="btn btn-primary" id="empty-add-note">Add Note</button>' +
        '</div></div>';

      const emptyBtn = document.getElementById('empty-add-note');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openForm());
      return;
    }

    empty.innerHTML = '';

    grid.innerHTML = list.map((n) => {
      const isPinned = !!n.pinned;
      const subjName = U.subjectName(n.subjectId);
      const subjColor = U.subjectColor(n.subjectId);
      const timeString = U.timeAgo(n.updatedAt || n.createdAt);

      return (
        '<div class="note-card' + (isPinned ? ' pinned' : '') + '" data-id="' + U.escapeHTML(n.id) + '">' +
          '<div class="note-head">' +
            '<button type="button" class="note-pin' + (isPinned ? ' pinned' : '') + '" data-action="pin" data-id="' + U.escapeHTML(n.id) + '" title="' + (isPinned ? 'Unpin note' : 'Pin note') + '" aria-label="' + (isPinned ? 'Unpin note' : 'Pin note') + '">' +
              '<svg viewBox="0 0 24 24" fill="' + (isPinned ? 'currentColor' : 'none') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<line x1="12" y1="17" x2="12" y2="22"/>' +
                '<path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/>' +
              '</svg>' +
            '</button>' +
            '<div class="note-title">' +
              '<h3 title="' + U.escapeHTML(n.title) + '">' + U.escapeHTML(n.title) + '</h3>' +
            '</div>' +
          '</div>' +
          '<div class="note-content">' + U.escapeHTML(n.content || '') + '</div>' +
          '<div class="note-foot">' +
            '<div style="display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;text-overflow:ellipsis">' +
              '<span style="width:8px;height:8px;border-radius:99px;background:' + U.escapeHTML(subjColor) + ';flex-shrink:0"></span>' +
              '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + U.escapeHTML(subjName) + '</span>' +
              '<span style="opacity:0.6">·</span>' +
              '<span style="white-space:nowrap;opacity:0.8">' + U.escapeHTML(timeString) + '</span>' +
            '</div>' +
            '<div class="note-actions">' +
              '<button type="button" class="icon-btn" data-action="edit" data-id="' + U.escapeHTML(n.id) + '" title="Edit note" aria-label="Edit note">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>' +
              '</button>' +
              '<button type="button" class="icon-btn" data-action="delete" data-id="' + U.escapeHTML(n.id) + '" title="Delete note" aria-label="Delete note">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ---------- Add / Edit Form Modal ---------- */

  function openForm(id) {
    editingId = id || null;
    const notes = S.getNotes();
    const note = editingId ? notes.find((n) => n.id === editingId) : null;
    const subjects = S.getSubjects();

    const subjectOptions = subjects.map((s) => {
      const selected = (note && note.subjectId === s.id) || (!note && subjectFilter === s.id) ? ' selected' : '';
      return '<option value="' + U.escapeHTML(s.id) + '"' + selected + '>' + U.escapeHTML(s.name) + '</option>';
    }).join('');

    StudyFlow.Modal.openModal({
      title: note ? 'Edit Note' : 'Add Study Note',
      body:
        '<form id="note-form" novalidate>' +
          '<div class="form-field">' +
            '<label for="note-form-title">Title <span class="required-mark">*</span></label>' +
            '<input type="text" id="note-form-title" class="input" value="' + U.escapeHTML(note ? note.title : '') + '" placeholder="e.g. Differentiation Rules & Formulas" required>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="note-form-subject">Subject</label>' +
            '<select id="note-form-subject" class="select">' +
              '<option value="">General / None</option>' +
              subjectOptions +
            '</select>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="note-form-content">Content</label>' +
            '<textarea id="note-form-content" class="input" style="height:140px;resize:vertical;font-family:inherit;line-height:1.5" placeholder="Write formulas, key takeaways, summary points...">' + U.escapeHTML(note ? note.content : '') + '</textarea>' +
          '</div>' +
          '<div class="form-field checkbox-field" style="display:flex;align-items:center;gap:8px;margin-top:12px">' +
            '<input type="checkbox" id="note-form-pinned" ' + (note && note.pinned ? 'checked' : '') + ' style="width:16px;height:16px;cursor:pointer">' +
            '<label for="note-form-pinned" style="cursor:pointer;margin:0;font-weight:500">Pin to top of notes</label>' +
          '</div>' +
        '</form>',
      actions: [
        { label: 'Cancel', class: 'btn-ghost', onClick: () => StudyFlow.Modal.closeModal() },
        { label: note ? 'Save Changes' : 'Create Note', class: 'btn-primary', onClick: saveForm }
      ],
      focus: '#note-form-title'
    });

    const titleInput = document.getElementById('note-form-title');
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        if (titleInput.classList.contains('invalid')) {
          titleInput.classList.remove('invalid');
        }
      });
    }
  }

  function saveForm() {
    const titleInput = document.getElementById('note-form-title');
    const subjectSelect = document.getElementById('note-form-subject');
    const contentInput = document.getElementById('note-form-content');
    const pinnedInput = document.getElementById('note-form-pinned');

    if (!titleInput) return;
    const title = titleInput.value.trim();

    if (!title) {
      titleInput.classList.add('invalid');
      StudyFlow.UI.showToast('Please enter a note title.', 'error');
      titleInput.focus();
      return;
    }

    const nowISO = new Date().toISOString();
    let notes = S.getNotes();

    if (editingId) {
      notes = notes.map((n) => {
        if (n.id === editingId) {
          return Object.assign({}, n, {
            title,
            subjectId: subjectSelect ? subjectSelect.value : '',
            content: contentInput ? contentInput.value : '',
            pinned: pinnedInput ? pinnedInput.checked : false,
            updatedAt: nowISO
          });
        }
        return n;
      });
      S.setNotes(notes);
      StudyFlow.UI.showToast('Note updated successfully.', 'success');
    } else {
      const newNote = {
        id: U.uid('note'),
        title,
        subjectId: subjectSelect ? subjectSelect.value : '',
        content: contentInput ? contentInput.value : '',
        pinned: pinnedInput ? pinnedInput.checked : false,
        createdAt: nowISO,
        updatedAt: nowISO
      };
      notes.unshift(newNote);
      S.setNotes(notes);
      StudyFlow.UI.showToast('Note created successfully.', 'success');
    }

    StudyFlow.Modal.closeModal();
    render();
  }

  /* ---------- Pin Toggle ---------- */

  function togglePin(id) {
    let notes = S.getNotes();
    let newPinnedState = false;
    notes = notes.map((n) => {
      if (n.id === id) {
        newPinnedState = !n.pinned;
        return Object.assign({}, n, { pinned: newPinnedState, updatedAt: new Date().toISOString() });
      }
      return n;
    });
    S.setNotes(notes);
    StudyFlow.UI.showToast(newPinnedState ? 'Note pinned.' : 'Note unpinned.', 'info');
    render();
  }

  /* ---------- Delete Note ---------- */

  async function deleteNote(id) {
    const notes = S.getNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const confirmed = await StudyFlow.Modal.confirmDialog({
      title: 'Delete Note',
      message: 'Are you sure you want to delete "' + note.title + '"? This action cannot be undone.',
      confirmText: 'Delete Note',
      danger: true
    });

    if (confirmed) {
      const updated = notes.filter((n) => n.id !== id);
      S.setNotes(updated);
      StudyFlow.UI.showToast('Note deleted.', 'success');
      render();
    }
  }

  /* ---------- Event Bindings ---------- */

  function bindEvents() {
    // Add Note button in topbar
    const addBtn = document.getElementById('btn-add-note');
    if (addBtn) addBtn.addEventListener('click', () => openForm());

    // Search input
    const searchInput = document.getElementById('note-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        render();
      });
    }

    // Subject filter
    const filterSelect = document.getElementById('note-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        subjectFilter = e.target.value;
        render();
      });
    }

    // Pinned only toggle button
    const pinnedBtn = document.getElementById('btn-toggle-pinned');
    if (pinnedBtn) {
      pinnedBtn.addEventListener('click', () => {
        pinnedOnly = !pinnedOnly;
        if (pinnedOnly) {
          pinnedBtn.classList.add('active', 'btn-primary');
          pinnedBtn.classList.remove('btn-ghost');
          pinnedBtn.textContent = 'Showing pinned only';
        } else {
          pinnedBtn.classList.remove('active', 'btn-primary');
          pinnedBtn.classList.add('btn-ghost');
          pinnedBtn.textContent = 'Show pinned only';
        }
        render();
      });
    }

    // Grid clicks (Pin, Edit, Delete, or click card to edit)
    const grid = document.getElementById('notes-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn) {
          e.stopPropagation();
          const action = actionBtn.dataset.action;
          const id = actionBtn.dataset.id;
          if (action === 'pin') togglePin(id);
          else if (action === 'edit') openForm(id);
          else if (action === 'delete') deleteNote(id);
          return;
        }

        const card = e.target.closest('.note-card');
        if (card && card.dataset.id) {
          openForm(card.dataset.id);
        }
      });
    }
  }

  /* ---------- Init ---------- */

  function init() {
    populateSubjectFilter();
    bindEvents();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
