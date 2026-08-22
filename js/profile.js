/* ==========================================================================
   StudyFlow — Profile Page Controller
   Profile photo, name, personal info, password, verification, account.
   ========================================================================== */

(function () {
  'use strict';

  var A = StudyFlow.Auth;
  var S = StudyFlow.Storage;

  var pendingAvatar = null;

  /* ---------- Helpers ---------- */

  function showError(id, message) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('hidden', !message);
  }

  function setLoading(btnId, loading) {
    var btn = document.getElementById(btnId);
    if (btn) btn.classList.toggle('loading', loading);
  }

  function refreshHeader(user) {
    var avatar = document.getElementById('head-avatar');
    avatar.src = A.avatarSrc(user);
    avatar.alt = user.name + ' avatar';
    document.getElementById('head-name').textContent = user.name;
    document.getElementById('head-email').textContent = user.email;

    var since = new Date(user.createdAt);
    document.getElementById('head-since').textContent =
      'Member since ' + since.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    var verified = document.getElementById('head-verified');
    verified.classList.toggle('show', !!user.emailVerified);
    document.getElementById('head-status').className = 'badge ' + (user.emailVerified ? 'badge-success' : 'badge-warning');
    document.getElementById('head-status').textContent = user.emailVerified ? 'Verified email' : 'Email not verified';
  }

  function refreshVerificationControls(user) {
    var btn = document.getElementById('btn-verify-now');
    var desc = document.getElementById('verify-desc');
    if (!btn) return;
    if (user.emailVerified) {
      btn.hidden = true;
      desc.textContent = 'Your email address has been verified.';
    } else {
      btn.hidden = false;
      desc.textContent = 'Verify your email address to secure your account and unlock all features.';
    }
  }

  /* ---------- Load current user into the form ---------- */

  function loadProfile(user) {
    document.getElementById('form-avatar').src = A.avatarSrc(user);
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-bio').value = user.bio || '';
    document.getElementById('profile-institution').value = user.institution || '';
    document.getElementById('profile-course').value = user.course || '';
    document.getElementById('profile-phone').value = user.phone || '';

    var classSelect = document.getElementById('profile-class');
    if (classSelect && user.selectedClass) {
      classSelect.value = user.selectedClass;
    }

    document.getElementById('email-hint').textContent = user.emailVerified
      ? ''
      : 'Changing your email will require reverification.';
  }

  /* ---------- Avatar upload ---------- */

  function processImageFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var size = 256;
          var canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          var ctx = canvas.getContext('2d');
          var scale = Math.max(size / img.width, size / img.height);
          var w = img.width * scale;
          var h = img.height * scale;
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = function () { reject(new Error('Could not read that image.')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('Could not read that file.')); };
      reader.readAsDataURL(file);
    });
  }

  function bindAvatar() {
    var fileInput = document.getElementById('avatar-file');

    document.getElementById('btn-upload-photo').addEventListener('click', function () {
      fileInput.click();
    });

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) {
        showError('profile-error', 'Please choose an image smaller than 3 MB.');
        return;
      }
      processImageFile(file).then(function (dataUrl) {
        pendingAvatar = dataUrl;
        document.getElementById('form-avatar').src = dataUrl;
        showError('profile-error', '');
      }).catch(function (err) {
        showError('profile-error', err.message);
      });
    });

    document.getElementById('btn-remove-photo').addEventListener('click', function () {
      pendingAvatar = '';
      document.getElementById('form-avatar').src = A.avatarSrc(A.currentUser());
      showError('profile-error', '');
    });
  }

  /* ---------- Save personal info ---------- */

  function applyProfileSave(patch, reseedClass) {
    var res = A.updateProfile(patch);
    if (!res.ok) return showError('profile-error', res.error);

    if (reseedClass && patch.selectedClass && S && S.seedForClass) {
      S.seedForClass(res.user.id, patch.selectedClass);
    }

    pendingAvatar = null;
    var user = res.user;
    refreshHeader(user);
    refreshVerificationControls(user);
    loadProfile(user);
    document.dispatchEvent(new CustomEvent('studyflow:profile-updated'));

    if (res.needsVerification) {
      StudyFlow.UI.showToast('Email updated — please verify your new address.', 'warning');
    } else if (reseedClass) {
      StudyFlow.UI.showToast('Class updated & recommended structure loaded into planner!', 'success');
    } else {
      StudyFlow.UI.showToast('Profile updated successfully.', 'success');
    }
  }

  function bindProfileForm() {
    var form = document.getElementById('profile-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showError('profile-error', '');

      var currentUser = A.currentUser() || {};
      var name = document.getElementById('profile-name').value;
      var email = document.getElementById('profile-email').value;
      var bio = document.getElementById('profile-bio').value;
      var institution = document.getElementById('profile-institution').value;
      var course = document.getElementById('profile-course').value;
      var phone = document.getElementById('profile-phone').value;
      var classSelect = document.getElementById('profile-class');
      var newClass = classSelect ? classSelect.value : (currentUser.selectedClass || 'class-10');
      var oldClass = currentUser.selectedClass || '';

      var patch = {
        name: name,
        email: email,
        bio: bio,
        institution: institution,
        course: course,
        phone: phone,
        selectedClass: newClass,
        classSelected: true
      };
      if (pendingAvatar !== null) patch.avatar = pendingAvatar;

      if (newClass && oldClass && newClass !== oldClass) {
        var preset = window.StudyFlow.ClassPresets
          ? window.StudyFlow.ClassPresets.getPreset(newClass)
          : { name: newClass };

        StudyFlow.Modal.openModal({
          title: 'Update Planner Structure?',
          size: 'modal-md',
          body:
            '<div style="line-height:1.5; color:var(--text-secondary);">' +
              '<p>You changed your class to <strong>' + StudyFlow.Utils.escapeHTML(preset.name) + '</strong>.</p>' +
              '<p>Would you like to reload default curriculum subjects, chapters, and timetable for <strong>' + StudyFlow.Utils.escapeHTML(preset.name) + '</strong> into your planner, or keep your existing custom subjects?</p>' +
            '</div>',
          actions: [
            {
              label: 'Keep Existing Subjects',
              class: 'btn-ghost',
              onClick: function () {
                StudyFlow.Modal.closeModal();
                applyProfileSave(patch, false);
              }
            },
            {
              label: 'Update Class & Load Recommended Structure',
              class: 'btn-primary',
              onClick: function () {
                StudyFlow.Modal.closeModal();
                applyProfileSave(patch, true);
              }
            }
          ]
        });
        return;
      }

      applyProfileSave(patch, false);
    });
  }

  /* ---------- Change password ---------- */

  function bindPasswordForm() {
    var form = document.getElementById('password-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      showError('password-error', '');

      var current = document.getElementById('pw-current').value;
      var next = document.getElementById('pw-new').value;
      var confirm = document.getElementById('pw-confirm').value;

      if (!current) return showError('password-error', 'Please enter your current password.');
      if (next !== confirm) return showError('password-error', 'New passwords do not match.');
      var policy = A.passwordPolicyError(next);
      if (policy) return showError('password-error', policy);

      setLoading('btn-save-password', true);
      try {
        var res = await A.changePassword(current, next);
        if (!res.ok) return showError('password-error', res.error);
        form.reset();
        StudyFlow.UI.showToast('Password updated successfully.', 'success');
      } catch (err) {
        showError('password-error', 'Something went wrong. Please try again.');
      } finally {
        setLoading('btn-save-password', false);
      }
    });
  }

  /* ---------- Email verification ---------- */

  function bindVerification() {
    var btn = document.getElementById('btn-verify-now');
    btn.addEventListener('click', function () {
      var user = A.currentUser();
      if (!user) return;
      var res = A.resendVerification(user.email);
      if (!res.ok) return StudyFlow.UI.showToast(res.error, 'error');

      StudyFlow.Modal.openModal({
        title: 'Verify your email',
        size: 'modal-sm',
        body:
          '<p class="text-sm" style="color:var(--text-secondary)">Enter the 6-digit code sent to <strong>' +
            StudyFlow.Utils.escapeHTML(res.email) + '</strong>.</p>' +
          '<div class="auth-demo-code" style="margin-top:12px"><span>Demo mode — code</span><code>' + res.code + '</code></div>' +
          '<div class="form-field" style="margin-top:12px">' +
            '<input type="text" class="input input-code" id="profile-verify-code" inputmode="numeric" maxlength="6" placeholder="000000">' +
          '</div>' +
          '<div class="form-error hidden" id="profile-verify-err"></div>',
        actions: [
          { label: 'Cancel', class: 'btn-ghost', onClick: function () { StudyFlow.Modal.closeModal(); } },
          {
            label: 'Verify',
            class: 'btn-primary',
            onClick: function (btnEl) {
              var code = document.getElementById('profile-verify-code').value.trim();
              var err = document.getElementById('profile-verify-err');
              if (code.length !== 6) {
                err.textContent = 'Enter the 6-digit code.';
                err.classList.remove('hidden');
                return;
              }
              var r = A.verifyEmail(code);
              if (!r.ok) {
                err.textContent = r.error;
                err.classList.remove('hidden');
                return;
              }
              StudyFlow.Modal.closeModal();
              refreshHeader(r.user);
              refreshVerificationControls(r.user);
              loadProfile(r.user);
              document.dispatchEvent(new CustomEvent('studyflow:profile-updated'));
              StudyFlow.UI.showToast('Email verified. Thank you!', 'success');
            }
          }
        ],
        focus: '#profile-verify-code'
      });
    });
  }

  /* ---------- Logout & delete ---------- */

  function bindAccount() {
    document.getElementById('btn-logout').addEventListener('click', function () {
      A.logout();
      window.location.replace('auth.html');
    });

    document.getElementById('btn-delete-account').addEventListener('click', async function () {
      var confirmed = await StudyFlow.Modal.confirmDialog({
        title: 'Delete account?',
        message: 'This will permanently delete your account and all of your subjects, tasks, sessions, exams, notes, analytics and focus history. This cannot be undone.',
        confirmText: 'Delete my account',
        danger: true
      });
      if (!confirmed) return;
      A.deleteAccount();
      window.location.replace('auth.html?tab=signup');
    });
  }

  /* ---------- Init ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    var user = A.requireAuth();
    if (!user) return;

    refreshHeader(user);
    refreshVerificationControls(user);
    loadProfile(user);
    bindAvatar();
    bindProfileForm();
    bindPasswordForm();
    bindVerification();
    bindAccount();
  });
})();