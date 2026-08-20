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

  /* ---------- Background Illustrations ---------- */

  function ensureBackgroundIllustration() {
    if (document.querySelector('.study-bg-layer')) return;
    const bgLayer = document.createElement('div');
    bgLayer.className = 'study-bg-layer';
    bgLayer.setAttribute('aria-hidden', 'true');
    bgLayer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;pointer-events:none;z-index:0;overflow:hidden;margin:0;padding:0;';
    bgLayer.innerHTML = `
      <svg class="study-bg-svg" viewBox="0 0 1600 1000" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;">
        <defs>
          <linearGradient id="study-stroke-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#818cf8" stop-opacity="0.12" />
          </linearGradient>
          <linearGradient id="study-stroke-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#a855f7" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#c084fc" stop-opacity="0.1" />
          </linearGradient>
          <linearGradient id="study-stroke-sky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.12" />
          </linearGradient>
          <linearGradient id="study-stroke-frost" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#e0e7ff" stop-opacity="0.3" />
          </linearGradient>
          <linearGradient id="study-fill-soft-indigo" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#e0e7ff" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#ede9fe" stop-opacity="0.04" />
          </linearGradient>
          <linearGradient id="study-fill-soft-purple" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ede9fe" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#fdf4ff" stop-opacity="0.04" />
          </linearGradient>
          <linearGradient id="study-fill-soft-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#f0f9ff" stop-opacity="0.04" />
          </linearGradient>
          <linearGradient id="study-fill-frost" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.12" />
          </linearGradient>
          <filter id="study-glow-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="90" />
          </filter>
          <filter id="study-soft-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>

        <g filter="url(#study-glow-blur)">
          <circle cx="280" cy="180" r="160" fill="#e0e7ff" fill-opacity="0.45" />
          <circle cx="1380" cy="220" r="220" fill="#ede9fe" fill-opacity="0.5" />
          <circle cx="920" cy="800" r="200" fill="#e0f2fe" fill-opacity="0.4" />
          <circle cx="1480" cy="820" r="180" fill="#fdf2f8" fill-opacity="0.35" />
        </g>

        <!-- Top-Right: Open Study Book -->
        <g transform="translate(1220, 90) rotate(-5)" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="140" cy="110" rx="160" ry="90" fill="url(#study-fill-soft-purple)" />
          <path d="M 140,40 C 90,26 25,32 -20,54 L -20,154 C 25,132 90,126 140,140 C 190,126 255,132 300,154 L 300,54 C 255,32 190,26 140,40 Z"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-purple)" stroke-width="1.6" />
          <path d="M 140,40 L 140,140" stroke="url(#study-stroke-indigo)" stroke-width="1.8" />
          <path d="M 136,41 L 136,141" stroke="url(#study-stroke-frost)" stroke-width="1.2" />
          <path d="M 144,41 L 144,141" stroke="url(#study-stroke-indigo)" stroke-width="1.2" stroke-opacity="0.6" />
          <path d="M 140,44 C 95,30 35,36 -14,58 L -14,148 C 35,128 95,122 140,136"
                fill="none" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
          <path d="M 140,48 C 100,34 45,40 -8,61 L -8,142 C 45,123 100,118 140,132"
                fill="none" stroke="url(#study-stroke-frost)" stroke-width="1" />
          <path d="M 140,44 C 185,30 245,36 294,58 L 294,148 C 245,128 185,122 140,136"
                fill="none" stroke="url(#study-stroke-purple)" stroke-width="1.3" />
          <path d="M 140,48 C 180,34 235,40 288,61 L 288,142 C 235,123 180,118 140,132"
                fill="none" stroke="url(#study-stroke-frost)" stroke-width="1" />
          <path d="M 140,136 C 137,162 147,180 138,206 L 144,200 L 150,206 C 143,180 148,162 143,136 Z"
                fill="url(#study-fill-soft-indigo)" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
          <line x1="8" y1="74" x2="115" y2="60" stroke="url(#study-stroke-indigo)" stroke-width="1.2" stroke-dasharray="8 6 14 5" />
          <line x1="8" y1="90" x2="118" y2="76" stroke="url(#study-stroke-indigo)" stroke-width="1.2" stroke-dasharray="12 5 18 6" />
          <line x1="12" y1="106" x2="112" y2="92" stroke="url(#study-stroke-indigo)" stroke-width="1.2" stroke-dasharray="10 6 12 6" />
          <line x1="16" y1="122" x2="90" y2="109" stroke="url(#study-stroke-indigo)" stroke-width="1.2" stroke-dasharray="6 4 10 4" />
          <line x1="165" y1="60" x2="272" y2="74" stroke="url(#study-stroke-purple)" stroke-width="1.2" stroke-dasharray="14 6 10 5" />
          <line x1="162" y1="76" x2="272" y2="90" stroke="url(#study-stroke-purple)" stroke-width="1.2" stroke-dasharray="10 5 16 6" />
          <line x1="168" y1="92" x2="268" y2="106" stroke="url(#study-stroke-purple)" stroke-width="1.2" stroke-dasharray="12 6 10 6" />
          <line x1="170" y1="109" x2="245" y2="122" stroke="url(#study-stroke-purple)" stroke-width="1.2" stroke-dasharray="8 4 12 4" />
        </g>

        <!-- Top-Left: Spiral Notebook & Stylus -->
        <g transform="translate(180, 80) rotate(-6)" stroke-linecap="round" stroke-linejoin="round">
          <rect x="-10" y="-10" width="220" height="260" rx="20" fill="url(#study-fill-soft-indigo)" filter="url(#study-soft-blur)" />
          <rect x="0" y="0" width="190" height="230" rx="14"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.6" />
          <rect x="24" y="16" width="150" height="198" rx="8"
                fill="none" stroke="url(#study-stroke-frost)" stroke-width="1.2" />
          <g stroke="url(#study-stroke-indigo)" stroke-width="1.4">
            <circle cx="12" cy="30" r="3" fill="#ffffff" fill-opacity="0.8" />
            <path d="M 6,28 C 0,30 0,36 8,36 C 14,36 15,30 11,29" />
            <circle cx="12" cy="56" r="3" fill="#ffffff" fill-opacity="0.8" />
            <path d="M 6,54 C 0,56 0,62 8,62 C 14,62 15,56 11,55" />
            <circle cx="12" cy="82" r="3" fill="#ffffff" fill-opacity="0.8" />
            <path d="M 6,80 C 0,82 0,88 8,88 C 14,88 15,82 11,81" />
            <circle cx="12" cy="108" r="3" fill="#ffffff" fill-opacity="0.8" />
            <path d="M 6,106 C 0,108 0,114 8,114 C 14,114 15,108 11,107" />
            <circle cx="12" cy="134" r="3" fill="#ffffff" fill-opacity="0.8" />
            <path d="M 6,132 C 0,134 0,140 8,140 C 14,140 15,134 11,133" />
            <circle cx="12" cy="160" r="3" fill="#ffffff" fill-opacity="0.8" />
            <path d="M 6,158 C 0,160 0,166 8,166 C 14,166 15,160 11,159" />
            <circle cx="12" cy="186" r="3" fill="#ffffff" fill-opacity="0.8" />
            <path d="M 6,184 C 0,186 0,192 8,192 C 14,192 15,186 11,185" />
            <circle cx="12" cy="212" r="3" fill="#ffffff" fill-opacity="0.8" />
            <path d="M 6,210 C 0,212 0,218 8,218 C 14,218 15,212 11,211" />
          </g>
          <g stroke="url(#study-stroke-sky)" stroke-width="0.8" stroke-dasharray="2 6">
            <line x1="40" y1="36" x2="160" y2="36" />
            <line x1="40" y1="56" x2="160" y2="56" />
            <line x1="40" y1="76" x2="160" y2="76" />
            <line x1="40" y1="96" x2="160" y2="96" />
            <line x1="40" y1="116" x2="160" y2="116" />
            <line x1="40" y1="136" x2="160" y2="136" />
            <line x1="40" y1="156" x2="160" y2="156" />
            <line x1="40" y1="176" x2="160" y2="176" />
            <line x1="40" y1="196" x2="160" y2="196" />
          </g>
          <rect x="40" y="50" width="8" height="8" rx="2" stroke="url(#study-stroke-indigo)" stroke-width="1.1" />
          <path d="M 42,54 L 44,56 L 47,52" stroke="url(#study-stroke-indigo)" stroke-width="1.1" />
          <line x1="56" y1="54" x2="140" y2="54" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
          <rect x="40" y="70" width="8" height="8" rx="2" stroke="url(#study-stroke-indigo)" stroke-width="1.1" />
          <path d="M 42,74 L 44,76 L 47,72" stroke="url(#study-stroke-indigo)" stroke-width="1.1" />
          <line x1="56" y1="74" x2="125" y2="74" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
          <rect x="40" y="90" width="8" height="8" rx="2" stroke="url(#study-stroke-indigo)" stroke-width="1.1" />
          <line x1="56" y1="94" x2="145" y2="94" stroke="url(#study-stroke-indigo)" stroke-width="1.2" stroke-dasharray="4 4" />
          <g transform="translate(130, 40) rotate(38)">
            <rect x="0" y="0" width="11" height="150" rx="3"
                  fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
            <path d="M 3,18 L -3,18 L -3,55 L 3,55" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
            <line x1="1" y1="115" x2="10" y2="115" stroke="url(#study-stroke-indigo)" stroke-width="1" />
            <line x1="1" y1="122" x2="10" y2="122" stroke="url(#study-stroke-indigo)" stroke-width="1" />
            <line x1="1" y1="129" x2="10" y2="129" stroke="url(#study-stroke-indigo)" stroke-width="1" />
            <polygon points="0,150 11,150 5.5,168" fill="url(#study-fill-soft-indigo)" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
            <circle cx="5.5" cy="168" r="1" fill="#6366f1" />
          </g>
        </g>

        <!-- Bottom-Right: Textbook Stack & Glasses -->
        <g transform="translate(1250, 680) rotate(3)" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="140" cy="130" rx="170" ry="110" fill="url(#study-fill-soft-sky)" filter="url(#study-soft-blur)" />
          <path d="M 10,180 C 10,180 5,210 10,230 L 260,215 C 255,195 260,165 260,165 Z"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.6" />
          <path d="M 10,180 L 260,165 L 290,135 L 40,150 Z"
                fill="url(#study-fill-soft-indigo)" stroke="url(#study-stroke-indigo)" stroke-width="1.6" />
          <path d="M 260,165 L 290,135 L 290,185 L 260,215 Z"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.5" />
          <line x1="264" y1="172" x2="286" y2="147" stroke="url(#study-stroke-frost)" stroke-width="1" />
          <line x1="264" y1="185" x2="286" y2="160" stroke="url(#study-stroke-frost)" stroke-width="1" />
          <line x1="264" y1="198" x2="286" y2="173" stroke="url(#study-stroke-frost)" stroke-width="1" />
          <line x1="45" y1="177" x2="45" y2="227" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
          <line x1="52" y1="176" x2="52" y2="226" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
          <line x1="215" y1="168" x2="215" y2="218" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
          <line x1="222" y1="167" x2="222" y2="217" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
          <g transform="translate(15, -35) rotate(-3)">
            <path d="M 15,160 C 15,160 10,188 15,205 L 245,190 C 240,173 245,145 245,145 Z"
                  fill="url(#study-fill-frost)" stroke="url(#study-stroke-purple)" stroke-width="1.5" />
            <path d="M 15,160 L 245,145 L 270,120 L 40,135 Z"
                  fill="url(#study-fill-soft-purple)" stroke="url(#study-stroke-purple)" stroke-width="1.5" />
            <path d="M 245,145 L 270,120 L 270,165 L 245,190 Z"
                  fill="url(#study-fill-frost)" stroke="url(#study-stroke-purple)" stroke-width="1.4" />
            <path d="M 180,185 L 180,215 L 186,210 L 192,215 L 192,184"
                  fill="url(#study-fill-soft-purple)" stroke="url(#study-stroke-purple)" stroke-width="1.2" />
          </g>
          <g transform="translate(30, -70) rotate(4)">
            <path d="M 20,150 C 20,150 16,172 20,184 L 230,170 C 226,158 230,136 230,136 Z"
                  fill="url(#study-fill-frost)" stroke="url(#study-stroke-sky)" stroke-width="1.5" />
            <path d="M 20,150 L 230,136 L 252,112 L 42,126 Z"
                  fill="url(#study-fill-soft-sky)" stroke="url(#study-stroke-sky)" stroke-width="1.5" />
            <path d="M 230,136 L 252,112 L 252,148 L 230,170 Z"
                  fill="url(#study-fill-frost)" stroke="url(#study-stroke-sky)" stroke-width="1.4" />
            <polygon points="125,128 145,123 155,134 135,139" fill="none" stroke="url(#study-stroke-sky)" stroke-width="1.2" />
          </g>
          <g transform="translate(10, 60) rotate(-12)">
            <circle cx="50" cy="50" r="22" fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
            <circle cx="105" cy="50" r="22" fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
            <path d="M 72,48 C 76,43 79,43 83,48" fill="none" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
            <path d="M 28,48 C 15,44 0,38 -15,32" fill="none" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
            <path d="M 127,48 C 140,44 155,38 170,32" fill="none" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
            <path d="M 40,38 C 52,35 58,40 60,48" stroke="url(#study-stroke-frost)" stroke-width="1.2" />
            <path d="M 95,38 C 107,35 113,40 115,48" stroke="url(#study-stroke-frost)" stroke-width="1.2" />
          </g>
        </g>

        <!-- Bottom-Left: Scholar Cap, Diploma & Ruler -->
        <g transform="translate(140, 680) rotate(5)" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="140" cy="120" rx="150" ry="90" fill="url(#study-fill-soft-purple)" filter="url(#study-soft-blur)" />
          <polygon points="120,40 220,70 120,100 20,70"
                   fill="url(#study-fill-frost)" stroke="url(#study-stroke-purple)" stroke-width="1.6" />
          <path d="M 60,78 L 60,110 C 60,135 180,135 180,110 L 180,78"
                fill="url(#study-fill-soft-purple)" stroke="url(#study-stroke-purple)" stroke-width="1.5" />
          <circle cx="120" cy="70" r="3.5" fill="#a855f7" stroke="url(#study-stroke-purple)" stroke-width="1" />
          <path d="M 120,70 C 145,72 175,85 190,115 L 194,145"
                fill="none" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
          <circle cx="194" cy="145" r="2.5" fill="none" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
          <polygon points="190,147 198,147 202,168 186,168"
                   fill="url(#study-fill-soft-indigo)" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
          <g transform="translate(170, 90) rotate(35)">
            <rect x="0" y="0" width="130" height="24" rx="12"
                  fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
            <ellipse cx="12" cy="12" rx="10" ry="10" fill="url(#study-fill-soft-indigo)" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
            <path d="M 12,6 C 8,6 6,10 6,12 C 6,16 12,18 16,15" fill="none" stroke="url(#study-stroke-indigo)" stroke-width="1" />
            <rect x="58" y="-1" width="14" height="26" rx="3"
                  fill="url(#study-fill-soft-purple)" stroke="url(#study-stroke-purple)" stroke-width="1.3" />
            <path d="M 65,25 L 58,45 L 64,42 L 70,47 L 69,25"
                  fill="url(#study-fill-soft-purple)" stroke="url(#study-stroke-purple)" stroke-width="1.2" />
          </g>
          <g transform="translate(-10, 110) rotate(-18)">
            <polygon points="0,140 180,140 0,20"
                     fill="url(#study-fill-frost)" stroke="url(#study-stroke-sky)" stroke-width="1.5" />
            <polygon points="25,125 130,125 25,50" fill="none" stroke="url(#study-stroke-sky)" stroke-width="1.3" />
            <line x1="25" y1="36" x2="33" y2="42" stroke="url(#study-stroke-sky)" stroke-width="1" />
            <line x1="45" y1="50" x2="55" y2="58" stroke="url(#study-stroke-sky)" stroke-width="1.3" />
            <line x1="65" y1="63" x2="73" y2="69" stroke="url(#study-stroke-sky)" stroke-width="1" />
            <line x1="85" y1="77" x2="95" y2="85" stroke="url(#study-stroke-sky)" stroke-width="1.3" />
            <line x1="105" y1="90" x2="113" y2="96" stroke="url(#study-stroke-sky)" stroke-width="1" />
            <line x1="125" y1="104" x2="135" y2="112" stroke="url(#study-stroke-sky)" stroke-width="1.3" />
            <line x1="145" y1="117" x2="153" y2="123" stroke="url(#study-stroke-sky)" stroke-width="1" />
          </g>
        </g>

        <!-- Ambient Focus Elements & Sparks -->
        <g transform="translate(820, 70)" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="40" cy="40" r="38" fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
          <circle cx="40" cy="40" r="33" fill="none" stroke="url(#study-stroke-frost)" stroke-width="1" stroke-dasharray="3 7" />
          <line x1="40" y1="9" x2="40" y2="14" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
          <line x1="40" y1="66" x2="40" y2="71" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
          <line x1="9" y1="40" x2="14" y2="40" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
          <line x1="66" y1="40" x2="71" y2="40" stroke="url(#study-stroke-indigo)" stroke-width="1.3" />
          <line x1="40" y1="40" x2="26" y2="24" stroke="url(#study-stroke-indigo)" stroke-width="1.8" />
          <line x1="40" y1="40" x2="56" y2="22" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
          <circle cx="40" cy="40" r="2.5" fill="#6366f1" />
        </g>

        <g transform="translate(1080, 480)" stroke-linecap="round" stroke-linejoin="round">
          <path d="M 20,0 C 9,0 0,9 0,20 C 0,27 4,33 9,37 L 9,45 L 31,45 L 31,37 C 36,33 40,27 40,20 C 40,9 31,0 20,0 Z"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-purple)" stroke-width="1.4" />
          <line x1="11" y1="48" x2="29" y2="48" stroke="url(#study-stroke-purple)" stroke-width="1.4" />
          <line x1="14" y1="52" x2="26" y2="52" stroke="url(#study-stroke-purple)" stroke-width="1.4" />
          <path d="M 14,24 L 17,14 L 23,14 L 26,24" fill="none" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
          <line x1="20" y1="-8" x2="20" y2="-15" stroke="url(#study-stroke-purple)" stroke-width="1.3" />
          <line x1="-3" y1="0" x2="-8" y2="-5" stroke="url(#study-stroke-purple)" stroke-width="1.3" />
          <line x1="43" y1="0" x2="48" y2="-5" stroke="url(#study-stroke-purple)" stroke-width="1.3" />
          <line x1="-8" y1="20" x2="-15" y2="20" stroke="url(#study-stroke-purple)" stroke-width="1.3" />
          <line x1="48" y1="20" x2="55" y2="20" stroke="url(#study-stroke-purple)" stroke-width="1.3" />
        </g>

        <g transform="translate(480, 520) rotate(-8)" stroke-linecap="round" stroke-linejoin="round">
          <path d="M 0,0 L 70,0 L 70,52 L 52,70 L 0,70 Z"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.4" />
          <polygon points="52,70 52,52 70,52"
                   fill="url(#study-fill-soft-indigo)" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
          <line x1="12" y1="18" x2="58" y2="18" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
          <line x1="12" y1="30" x2="52" y2="30" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
          <line x1="12" y1="42" x2="42" y2="42" stroke="url(#study-stroke-indigo)" stroke-width="1.2" stroke-dasharray="4 3" />
        </g>

        <!-- Sparkles & Node constellation -->
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M 450,110 Q 450,125 435,125 Q 450,125 450,140 Q 450,125 465,125 Q 450,125 450,110 Z"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
          <path d="M 1150,140 Q 1150,152 1138,152 Q 1150,152 1150,164 Q 1150,152 1162,152 Q 1150,152 1150,140 Z"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-purple)" stroke-width="1.2" />
          <path d="M 1180,820 Q 1180,835 1165,835 Q 1180,835 1180,850 Q 1180,835 1195,835 Q 1180,835 1180,820 Z"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-sky)" stroke-width="1.2" />
          <path d="M 420,740 Q 420,750 410,750 Q 420,750 420,760 Q 420,750 430,750 Q 420,750 420,740 Z"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-purple)" stroke-width="1.2" />
          <path d="M 780,870 Q 780,882 768,882 Q 780,882 780,894 Q 780,882 792,882 Q 780,882 780,870 Z"
                fill="url(#study-fill-frost)" stroke="url(#study-stroke-indigo)" stroke-width="1.2" />
          <g stroke="url(#study-stroke-frost)" stroke-width="0.9" stroke-dasharray="3 5">
            <line x1="450" y1="125" x2="520" y2="160" />
            <line x1="520" y1="160" x2="600" y2="140" />
            <circle cx="520" cy="160" r="2.5" fill="#818cf8" fill-opacity="0.5" />
            <circle cx="600" cy="140" r="2" fill="#c084fc" fill-opacity="0.5" />
            <line x1="1020" y1="210" x2="1090" y2="180" />
            <line x1="1090" y1="180" x2="1150" y2="152" />
            <circle cx="1020" cy="210" r="2" fill="#38bdf8" fill-opacity="0.5" />
            <circle cx="1090" cy="180" r="2.5" fill="#818cf8" fill-opacity="0.5" />
          </g>
        </g>
      </svg>
    `;
    document.body.prepend(bgLayer);
  }

  /* ---------- Boot ---------- */

  document.addEventListener('DOMContentLoaded', () => {
    StudyFlow.Storage.seedIfNeeded();
    StudyFlow.Theme.init();
    ensureBackgroundIllustration();
    initSidebar();
    StudyFlow.Modal = { openModal, closeModal, confirmDialog };
    StudyFlow.UI = { showToast };
    document.dispatchEvent(new CustomEvent('studyflow:ready'));
  });
})();