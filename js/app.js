/* ==========================================================================
   StudyFlow — Application Shell
   Shared init for every page: sidebar, topbar, toasts, modals, confirm dialog.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Sidebar ---------- */

  function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const menuToggle = document.getElementById('menu-toggle');
    const closeBtn = document.getElementById('sidebar-close');

    function open() {
      sidebar && sidebar.classList.add('open');
      backdrop && backdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      sidebar && sidebar.classList.remove('open');
      backdrop && backdrop.classList.remove('show');
      document.body.style.overflow = '';
    }

    menuToggle && menuToggle.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    backdrop && backdrop.addEventListener('click', close);

    const current = document.body.getAttribute('data-page') || '';
    document.querySelectorAll('.nav-link').forEach((link) => {
      if (link.getAttribute('data-nav') === current) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });

    const streakEl = document.getElementById('sidebar-streak');
    if (streakEl) {
      const streak = StudyFlow.Utils.currentStreak(
        StudyFlow.Storage.getFocusSessions(),
        StudyFlow.Storage.getSessions()
      );
      streakEl.textContent = streak;
    }
  }

  /* ---------- Toasts ---------- */

  function ensureToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.setAttribute('role', 'status');

    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.innerHTML = icons[type] || icons.info;

    const msg = document.createElement('div');
    msg.className = 'toast-message';
    msg.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(msg);
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 220);
    }, 3200);
  }

  /* ---------- Modal ---------- */

  function ensureModal() {
    let overlay = document.getElementById('app-modal');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'app-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<div class="modal"><div class="modal-header">' +
      '<h3 class="modal-title" id="app-modal-title"></h3>' +
      '<button type="button" class="icon-btn modal-x" aria-label="Close dialog">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></div><div class="modal-body" id="app-modal-body"></div>' +
      '<div class="modal-footer" id="app-modal-footer"></div></div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    overlay.querySelector('.modal-x').addEventListener('click', closeModal);
    return overlay;
  }

  function openModal(options) {
    const overlay = ensureModal();
    const modal = overlay.querySelector('.modal');
    const title = overlay.querySelector('#app-modal-title');
    const body = overlay.querySelector('#app-modal-body');
    const footer = overlay.querySelector('#app-modal-footer');

    title.textContent = options.title || '';
    body.innerHTML = options.body || '';
    footer.innerHTML = '';

    if (options.size) modal.className = 'modal ' + options.size;
    else modal.className = 'modal';

    (options.actions || []).forEach((action) => {
      const btn = document.createElement('button');
      btn.type = action.type || 'button';
      btn.className = 'btn ' + (action.class || '');
      btn.textContent = action.label || '';
      btn.addEventListener('click', () => {
        if (action.onClick) action.onClick(btn);
      });
      footer.appendChild(btn);
    });

    if (options.focus) {
      setTimeout(() => {
        const target = body.querySelector(options.focus);
        target && target.focus();
      }, 60);
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    overlay._keyHandler = onKey;
    document.addEventListener('keydown', onKey);
  }

  function closeModal() {
    const overlay = document.getElementById('app-modal');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (overlay._keyHandler) {
      document.removeEventListener('keydown', overlay._keyHandler);
      delete overlay._keyHandler;
    }
  }

  function confirmDialog(options) {
    return new Promise((resolve) => {
      openModal({
        title: options.title || 'Are you sure?',
        size: 'modal-sm',
        body: '<p class="text-sm" style="color:var(--text-secondary)">' +
          StudyFlow.Utils.escapeHTML(options.message || '') + '</p>',
        actions: [
          { label: 'Cancel', class: 'btn-ghost', onClick: () => { closeModal(); resolve(false); } },
          {
            label: options.confirmText || 'Confirm',
            class: options.danger ? 'btn-danger' : 'btn-primary',
            onClick: () => { closeModal(); resolve(true); }
          }
        ]
      });
    });
  }

  /* ---------- Boot ---------- */

  document.addEventListener('DOMContentLoaded', () => {
    StudyFlow.Storage.seedIfNeeded();
    StudyFlow.Theme.init();
    initSidebar();
    StudyFlow.Modal = { openModal, closeModal, confirmDialog };
    StudyFlow.UI = { showToast };
    document.dispatchEvent(new CustomEvent('studyflow:ready'));
  });
})();