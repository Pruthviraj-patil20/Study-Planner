/* ==========================================================================
   StudyFlow — Class Onboarding Controller
   Interactive class cards, category filtering, search, live preview drawer,
   and automatic planner structure seeding.
   ========================================================================== */

(function () {
  'use strict';

  var A = StudyFlow.Auth;
  var S = StudyFlow.Storage;
  var CP = StudyFlow.ClassPresets;
  var U = StudyFlow.Utils;

  var selectedClassKey = 'class-10';
  var activeCategory = 'all';
  var searchQuery = '';
  var isChangingClass = false;
  var redirectTarget = 'index.html';

  function getIconSvg(iconName) {
    if (U && U.icon) {
      return U.icon(iconName || 'book');
    }
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
  }

  function renderCards() {
    var grid = document.getElementById('class-grid');
    if (!grid || !CP) return;

    var presets = CP.getAllPresets();

    // Filter by Category
    if (activeCategory !== 'all') {
      presets = presets.filter(function (p) {
        return p.categoryKey === activeCategory;
      });
    }

    // Filter by Search Query
    if (searchQuery) {
      var q = searchQuery.toLowerCase().trim();
      presets = presets.filter(function (p) {
        var nameMatch = p.name.toLowerCase().indexOf(q) !== -1;
        var descMatch = (p.description || '').toLowerCase().indexOf(q) !== -1;
        var catMatch = (p.category || '').toLowerCase().indexOf(q) !== -1;
        var subjMatch = (p.subjects || []).some(function (s) {
          return s.name.toLowerCase().indexOf(q) !== -1;
        });
        return nameMatch || descMatch || catMatch || subjMatch;
      });
    }

    if (presets.length === 0) {
      grid.innerHTML =
        '<div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border);">' +
          '<div style="font-size: 32px; margin-bottom: 8px;">🔍</div>' +
          '<h3 style="font-size: 16px; margin: 0 0 6px;">No matching classes found</h3>' +
          '<p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 14px;">Try searching for a different grade or clear filters.</p>' +
          '<button type="button" class="btn btn-soft btn-sm" id="btn-reset-filters">Reset Filters</button>' +
        '</div>';
      var resetBtn = document.getElementById('btn-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          activeCategory = 'all';
          searchQuery = '';
          var sInput = document.getElementById('class-search');
          if (sInput) sInput.value = '';
          syncCategoryTabs();
          renderCards();
        });
      }
      return;
    }

    grid.innerHTML = presets.map(function (p) {
      var isSelected = p.id === selectedClassKey;
      var topSubjs = (p.subjects || []).slice(0, 4);

      var subjPills = topSubjs.map(function (s) {
        return '<span class="class-subj-tag">' +
          '<span class="class-subj-dot" style="background:' + U.escapeHTML(s.color || '#6366f1') + '"></span>' +
          U.escapeHTML(s.name) +
        '</span>';
      }).join('');

      var extraCount = (p.subjects || []).length - topSubjs.length;
      if (extraCount > 0) {
        subjPills += '<span class="class-subj-tag" style="color:var(--text-muted)">+' + extraCount + ' more</span>';
      }

      return (
        '<div class="class-card' + (isSelected ? ' selected' : '') + '" data-class-id="' + p.id + '" role="radio" aria-checked="' + isSelected + '" tabindex="0">' +
          '<div class="class-card-header">' +
            '<div class="class-card-icon">' + getIconSvg(p.icon) + '</div>' +
            '<div class="class-card-check">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<h2 class="class-card-title">' + U.escapeHTML(p.name) + '</h2>' +
            '<span class="class-card-badge">' + U.escapeHTML(p.badge || p.category) + '</span>' +
          '</div>' +
          '<p class="class-card-desc">' + U.escapeHTML(p.description || '') + '</p>' +
          '<div class="class-card-subjects">' +
            subjPills +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function updatePreviewDrawer() {
    var preset = CP.getPreset(selectedClassKey);
    if (!preset) return;

    var iconBox = document.getElementById('preview-icon-box');
    var titleEl = document.getElementById('preview-title');
    var catEl = document.getElementById('preview-category');
    var descEl = document.getElementById('preview-desc');
    var listEl = document.getElementById('preview-subjects-list');
    var totalEl = document.getElementById('preview-subj-total');
    var goalEl = document.getElementById('preview-goal');
    var focusEl = document.getElementById('preview-focus');
    var customWrap = document.getElementById('custom-name-wrap');

    if (iconBox) iconBox.innerHTML = getIconSvg(preset.icon);
    if (titleEl) titleEl.textContent = preset.name;
    if (catEl) catEl.textContent = preset.category + ' · ' + (preset.badge || 'Recommended Track');
    if (descEl) descEl.textContent = preset.description || '';

    if (customWrap) {
      customWrap.classList.toggle('hidden', preset.id !== 'other');
    }

    var subjs = preset.subjects || [];
    if (totalEl) totalEl.textContent = subjs.length + ' Subjects';

    if (listEl) {
      listEl.innerHTML = subjs.map(function (s) {
        var chapsCount = (s.chapters || []).length;
        return (
          '<div class="preview-subj-item">' +
            '<div class="preview-subj-left">' +
              '<span class="class-subj-dot" style="background:' + U.escapeHTML(s.color || '#6366f1') + '; width:8px; height:8px;"></span>' +
              '<span>' + U.escapeHTML(s.name) + '</span>' +
            '</div>' +
            '<span class="preview-subj-count">' + chapsCount + ' chapters</span>' +
          '</div>'
        );
      }).join('');
    }

    if (goalEl) goalEl.textContent = (preset.dailyGoal || 120) + ' mins';
    if (focusEl) focusEl.textContent = (preset.focusDefault || 25) + ' mins';
  }

  function syncCategoryTabs() {
    var tabs = document.querySelectorAll('.cat-pill');
    tabs.forEach(function (t) {
      var isAct = t.getAttribute('data-cat') === activeCategory;
      t.classList.toggle('active', isAct);
      t.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });
  }

  function bindEvents() {
    // Card Selection
    var grid = document.getElementById('class-grid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        var card = e.target.closest('.class-card');
        if (!card) return;
        var id = card.getAttribute('data-class-id');
        if (id) {
          selectedClassKey = id;
          renderCards();
          updatePreviewDrawer();
        }
      });

      grid.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var card = e.target.closest('.class-card');
          if (card) {
            e.preventDefault();
            var id = card.getAttribute('data-class-id');
            if (id) {
              selectedClassKey = id;
              renderCards();
              updatePreviewDrawer();
            }
          }
        }
      });
    }

    // Category Tabs
    var catContainer = document.getElementById('cat-filters');
    if (catContainer) {
      catContainer.addEventListener('click', function (e) {
        var pill = e.target.closest('.cat-pill');
        if (!pill) return;
        activeCategory = pill.getAttribute('data-cat') || 'all';
        syncCategoryTabs();
        renderCards();
      });
    }

    // Search Box
    var searchInput = document.getElementById('class-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = this.value;
        renderCards();
      });
    }

    // Confirm Button
    var confirmBtn = document.getElementById('btn-confirm-class');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', handleConfirm);
    }

    // Cancel Button (if came from settings/profile)
    var cancelBtn = document.getElementById('btn-cancel-change');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        window.location.replace(redirectTarget);
      });
    }
  }

  function handleConfirm() {
    var user = A.currentUser() || A.restoreSession();
    if (!user) {
      A.redirectToLogin();
      return;
    }

    var confirmBtn = document.getElementById('btn-confirm-class');
    if (confirmBtn) {
      confirmBtn.classList.add('loading');
      confirmBtn.disabled = true;
    }

    try {
      var preset = CP.getPreset(selectedClassKey);
      var customInput = document.getElementById('custom-class-name');
      var customVal = customInput ? customInput.value.trim() : '';

      var patch = {
        selectedClass: selectedClassKey,
        classSelected: true
      };

      if (customVal) {
        patch.course = customVal;
      } else if (preset && !user.course) {
        patch.course = preset.name;
      }

      A.updateProfile(patch);

      // Seed planner with default subjects, chapters, tasks, timetable, exams, and notes for this class
      S.seedForClass(user.id, selectedClassKey);

      setTimeout(function () {
        window.location.replace(redirectTarget);
      }, 250);

    } catch (err) {
      console.error('Error confirming class selection:', err);
      if (confirmBtn) {
        confirmBtn.classList.remove('loading');
        confirmBtn.disabled = false;
      }
      alert('Unable to complete class setup. Please try again.');
    }
  }

  function init() {
    StudyFlow.Theme.init();

    // Authentication Guard
    var user = A.restoreSession();
    if (!user) {
      A.redirectToLogin();
      return;
    }

    var params = new URLSearchParams(window.location.search);
    isChangingClass = params.get('change') === '1' || params.get('from') === 'profile' || params.get('from') === 'settings';
    var redirectParam = params.get('redirect');
    if (redirectParam) {
      try { redirectTarget = decodeURIComponent(redirectParam); } catch (e) { redirectTarget = 'index.html'; }
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(redirectTarget) || redirectTarget.indexOf('//') === 0) {
        redirectTarget = 'index.html';
      }
    } else if (isChangingClass) {
      redirectTarget = params.get('from') === 'settings' ? 'settings.html' : 'profile.html';
    } else {
      redirectTarget = 'index.html';
    }

    // If user is already onboarded and not explicitly requesting change, redirect to target
    if (!isChangingClass && A.isOnboarded(user)) {
      window.location.replace(redirectTarget);
      return;
    }

    // Set initial selected class from user's profile if available
    if (user.selectedClass && CP.PRESETS[user.selectedClass]) {
      selectedClassKey = user.selectedClass;
    } else {
      selectedClassKey = 'class-10';
    }

    // UI Mode adaptation (new onboarding vs changing class)
    if (isChangingClass) {
      var badgeEl = document.getElementById('onboarding-mode-badge');
      if (badgeEl) badgeEl.textContent = '🔄 Change Class & Curriculum';
      var confirmBtn = document.getElementById('btn-confirm-class');
      if (confirmBtn) confirmBtn.querySelector('.btn-label').textContent = 'Apply Class & Update Planner →';
      var cancelWrap = document.getElementById('cancel-change-wrap');
      if (cancelWrap) cancelWrap.classList.remove('hidden');
    }

    renderCards();
    updatePreviewDrawer();
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
