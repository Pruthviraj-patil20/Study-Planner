/* ==========================================================================
   StudyFlow — Authentication Page Controller
   Login / Sign up / Email verification / Forgot & reset password.
   ========================================================================== */

(function () {
  'use strict';

  var A = StudyFlow.Auth;
  var S = StudyFlow.Storage;

  var redirectTarget = 'index.html';

  /* ---------- Panel switching ---------- */

  function showPanel(id, opts) {
    opts = opts || {};
    ['panel-login', 'panel-signup', 'panel-verify', 'panel-forgot', 'panel-reset'].forEach(function (p) {
      document.getElementById(p).classList.toggle('hidden', p !== id);
    });

    var tabs = document.getElementById('auth-tabs');
    if (tabs) tabs.classList.toggle('hidden', opts.hideTabs || id === 'panel-verify');

    var tabLogin = document.getElementById('tab-login');
    var tabSignup = document.getElementById('tab-signup');
    if (tabLogin) tabLogin.classList.toggle('active', id === 'panel-login');
    if (tabSignup) tabSignup.classList.toggle('active', id === 'panel-signup');
    if (tabLogin) tabLogin.setAttribute('aria-selected', id === 'panel-login' ? 'true' : 'false');
    if (tabSignup) tabSignup.setAttribute('aria-selected', id === 'panel-signup' ? 'true' : 'false');

    window.scrollTo(0, 0);
    var first = document.querySelector('#' + id + ' input, #' + id + ' button');
    if (first && opts.focus !== false) setTimeout(function () { first.focus(); }, 80);
  }

  /* ---------- Errors & buttons ---------- */

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

  function redirectAfterAuth() {
    var user = A.currentUser() || A.restoreSession();
    var params = new URLSearchParams(window.location.search);
    var target = params.get('redirect') || 'index.html';
    try { target = decodeURIComponent(target); } catch (e) { target = 'index.html'; }
    // Prevent open-redirect / protocol injection.
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target) || target.indexOf('//') === 0) target = 'index.html';

    if (user && !A.isOnboarded(user)) {
      var onbUrl = 'onboarding.html';
      if (target && target !== 'index.html' && target !== 'onboarding.html') {
        onbUrl += '?redirect=' + encodeURIComponent(target);
      }
      window.location.replace(onbUrl);
      return;
    }

    window.location.replace(target);
  }

  /* ---------- Init ---------- */

  function init() {
    StudyFlow.Theme.init();

    // Already signed in? Go straight to the app.
    var user = A.restoreSession();
    if (user) {
      redirectAfterAuth();
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var mode = params.get('tab') || 'login';
    if (mode === 'signup') {
      showPanel('panel-signup', { hideTabs: false, focus: false });
    } else {
      showPanel('panel-login', { hideTabs: false, focus: false });
    }

    bindTabs();
    bindGoogleAuth();
    bindLogin();
    bindSignup();
    bindVerify();
    bindForgot();
    bindReset();
  }

  function notify(msg, type) {
    if (window.StudyFlow && window.StudyFlow.UI && window.StudyFlow.UI.showToast) {
      window.StudyFlow.UI.showToast(msg, type);
      return;
    }
    var toast = document.createElement('div');
    toast.className = 'auth-toast ' + (type || 'info');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3200);
  }

  /* ---------- Google OAuth Sign-in & Sign-up ---------- */

  function bindGoogleAuth() {
    var clientId = A.getGoogleClientId ? A.getGoogleClientId() : '';
    var btnLogin = document.getElementById('btn-google-login');
    var btnSignup = document.getElementById('btn-google-signup');
    var loginWrap = document.getElementById('gsi-login-btn');
    var signupWrap = document.getElementById('gsi-signup-btn');

    async function handleGoogleSuccess(payload) {
      setLoading('btn-google-login', true);
      setLoading('btn-google-signup', true);
      showError('login-error', '');
      showError('signup-error', '');

      try {
        var res = await A.loginWithGoogle(payload);
        if (!res.ok) {
          showError('login-error', res.error || 'Google sign-in failed.');
          showError('signup-error', res.error || 'Google sign-in failed.');
          return;
        }
        notify('Signed in with Google as ' + (res.user.name || res.user.email) + '!', 'success');
        redirectAfterAuth();
      } catch (err) {
        showError('login-error', 'An error occurred during Google sign-in.');
        showError('signup-error', 'An error occurred during Google sign-in.');
      } finally {
        setLoading('btn-google-login', false);
        setLoading('btn-google-signup', false);
      }
    }

    function onCredentialResponse(response) {
      if (!response || !response.credential) {
        showError('login-error', 'No credential received from Google.');
        return;
      }
      var payload = A.parseGoogleJwt(response.credential);
      if (!payload || !payload.email) {
        showError('login-error', 'Unable to parse Google authentication token.');
        return;
      }
      handleGoogleSuccess(payload);
    }

    var isFileProtocol = window.location.protocol === 'file:';

    function promptGoogleAction() {
      if (isFileProtocol) {
        var proceed = confirm(
          'Google Sign-In Notice:\n\n' +
          'Google OAuth 2.0 requires an HTTP origin (e.g. http://localhost:3000, http://127.0.0.1:5500, or your deployed URL) due to browser security restrictions on the file:// protocol.\n\n' +
          'Would you like to simulate Google Sign-in with a verified student Google account?'
        );
        if (proceed) {
          handleGoogleSuccess({
            sub: 'google_' + Math.floor(Math.random() * 1000000),
            name: 'Alex Johnson',
            given_name: 'Alex',
            email: 'alex.johnson.student@gmail.com',
            picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            email_verified: true
          });
        }
        return;
      }

      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.prompt(function (notification) {
            if (notification.isNotDisplayed()) {
              var reason = notification.getNotDisplayedReason ? notification.getNotDisplayedReason() : '';
              if (reason === 'opt_out_or_no_session') {
                showError('login-error', 'Please make sure you are signed into Google in your browser.');
              } else if (reason === 'suppressed_by_user') {
                showError('login-error', 'Google prompt was dismissed. Please click again.');
              }
            }
          });
        } catch (e) {
          console.warn('Google prompt exception:', e);
        }
      } else {
        showError('login-error', 'Google Identity Services is loading. Please try again in a moment.');
      }
    }

    if (btnLogin) btnLogin.addEventListener('click', promptGoogleAction);
    if (btnSignup) btnSignup.addEventListener('click', promptGoogleAction);

    if (isFileProtocol || !clientId) return;

    function renderGsiButtons() {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: onCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var gsiTheme = isDark ? 'filled_black' : 'outline';

        if (loginWrap) {
          window.google.accounts.id.renderButton(loginWrap, {
            type: 'standard',
            theme: gsiTheme,
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 380,
            logo_alignment: 'left'
          });
          setTimeout(function () {
            if (loginWrap.children.length > 0 && btnLogin) {
              btnLogin.style.display = 'none';
            }
          }, 350);
        }

        if (signupWrap) {
          window.google.accounts.id.renderButton(signupWrap, {
            type: 'standard',
            theme: gsiTheme,
            size: 'large',
            text: 'signup_with',
            shape: 'rectangular',
            width: 380,
            logo_alignment: 'left'
          });
          setTimeout(function () {
            if (signupWrap.children.length > 0 && btnSignup) {
              btnSignup.style.display = 'none';
            }
          }, 350);
        }

        return true;
      } catch (err) {
        console.warn('GSI render error:', err);
        return false;
      }
    }

    if (!renderGsiButtons()) {
      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        if (renderGsiButtons() || tries > 20) {
          clearInterval(timer);
        }
      }, 150);
    }
  }

  function bindTabs() {
    var tabLogin = document.getElementById('tab-login');
    var tabSignup = document.getElementById('tab-signup');
    if (tabLogin) tabLogin.addEventListener('click', function () { showPanel('panel-login'); });
    if (tabSignup) tabSignup.addEventListener('click', function () { showPanel('panel-signup'); });
  }

  /* ---------- Sign in ---------- */

  function bindLogin() {
    var form = document.getElementById('login-form');
    var btn = document.getElementById('btn-login');
    var demoBtn = document.getElementById('btn-demo-login');

    if (demoBtn) {
      demoBtn.addEventListener('click', function () {
        setLoading('btn-demo-login', true);
        try {
          A.loginDemoUser(true);
          redirectAfterAuth();
        } catch (err) {
          showError('login-error', 'Could not initialize demo session.');
        } finally {
          setLoading('btn-demo-login', false);
        }
      });
    }

    document.getElementById('btn-forgot').addEventListener('click', function () {
      var email = document.getElementById('login-email').value.trim();
      if (email) document.getElementById('forgot-email').value = email;
      showPanel('panel-forgot', { hideTabs: true });
    });
    document.getElementById('login-to-signup').addEventListener('click', function () {
      showPanel('panel-signup');
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = document.getElementById('login-email').value;
      var password = document.getElementById('login-password').value;
      var remember = document.getElementById('login-remember').checked;

      showError('login-error', '');
      if (!A.isValidEmail(email)) return showError('login-error', 'Please enter a valid email address.');
      if (!password) return showError('login-error', 'Please enter your password.');

      setLoading('btn-login', true);
      try {
        var res = await A.login({ email: email, password: password, remember: remember });
        if (!res.ok) {
          showError('login-error', res.error || 'Unable to sign in.');
          return;
        }
        if (res.needsVerification) {
          goVerify(res.pending);
          return;
        }
        redirectAfterAuth();
      } catch (err) {
        showError('login-error', 'Something went wrong. Please try again.');
      } finally {
        setLoading('btn-login', false);
      }
    });
  }

  /* ---------- Sign up ---------- */

  function bindSignup() {
    var form = document.getElementById('signup-form');

    document.getElementById('signup-to-login').addEventListener('click', function () {
      showPanel('panel-login');
    });

    // Offer to import existing single-user data if present.
    var legacyRow = document.getElementById('legacy-row');
    if (legacyRow && S && S.hasLegacyData && S.hasLegacyData()) {
      legacyRow.classList.remove('hidden');
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('signup-name').value;
      var email = document.getElementById('signup-email').value;
      var password = document.getElementById('signup-password').value;
      var confirm = document.getElementById('signup-confirm').value;
      var importLegacy = document.getElementById('signup-import')
        ? document.getElementById('signup-import').checked
        : false;

      showError('signup-error', '');

      if (String(name).trim().length < 2) return showError('signup-error', 'Please enter your full name.');
      if (!A.isValidEmail(email)) return showError('signup-error', 'Please enter a valid email address.');
      if (password !== confirm) return showError('signup-error', 'Passwords do not match.');
      var policy = A.passwordPolicyError(password);
      if (policy) return showError('signup-error', policy);

      setLoading('btn-signup', true);
      try {
        var res = await A.signup({
          name: name,
          email: email,
          password: password,
          importLegacy: importLegacy
        });
        if (!res.ok) {
          showError('signup-error', res.error || 'Unable to create your account.');
          return;
        }
        if (res.needsVerification) {
          goVerify(res.pending);
          return;
        }
        redirectAfterAuth();
      } catch (err) {
        showError('signup-error', 'Something went wrong. Please try again.');
      } finally {
        setLoading('btn-signup', false);
      }
    });
  }

  /* ---------- Email verification ---------- */

  function goVerify(pending) {
    if (!pending) return;
    var emailEl = document.getElementById('verify-email');
    var demoEl = document.getElementById('verify-demo');
    var codeEl = document.getElementById('verify-code');
    document.getElementById('verify-input').value = '';
    showError('verify-error', '');
    emailEl.textContent = pending.email;
    demoEl.hidden = false;
    codeEl.textContent = pending.code;
    showPanel('panel-verify', { hideTabs: true });
  }

  function bindVerify() {
    var form = document.getElementById('verify-form');
    var input = document.getElementById('verify-input');

    input.addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = input.value.trim();
      showError('verify-error', '');
      if (code.length !== 6) return showError('verify-error', 'Please enter the 6-digit code.');

      var res = A.verifyEmail(code);
      if (!res.ok) return showError('verify-error', res.error);
      if (StudyFlow.UI && StudyFlow.UI.showToast) StudyFlow.UI.showToast('Email verified. Welcome aboard!', 'success');
      redirectAfterAuth();
    });

    document.getElementById('btn-resend-code').addEventListener('click', function () {
      var pending = A.pendingVerification();
      if (!pending) return showError('verify-error', 'No pending verification found.');
      var res = A.resendVerification(pending.email);
      if (!res.ok) return showError('verify-error', res.error);
      document.getElementById('verify-code').textContent = res.code;
      document.getElementById('verify-demo').hidden = false;
      showError('verify-error', '');
      if (StudyFlow.UI && StudyFlow.UI.showToast) StudyFlow.UI.showToast('A new code has been issued.', 'info');
    });

    document.getElementById('btn-skip-verify').addEventListener('click', function () {
      var res = A.skipVerification();
      if (!res.ok) return showError('verify-error', res.error);
      redirectAfterAuth();
    });
  }

  /* ---------- Forgot password ---------- */

  function bindForgot() {
    var form = document.getElementById('forgot-form');
    document.getElementById('forgot-to-login').addEventListener('click', function () {
      showPanel('panel-login');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('forgot-email').value.trim();
      showError('forgot-error', '');
      if (!A.isValidEmail(email)) return showError('forgot-error', 'Please enter a valid email address.');

      var res = A.requestPasswordReset(email);
      if (res.ok && res.code) {
        var demo = document.getElementById('reset-demo');
        var codeEl = document.getElementById('reset-code');
        demo.hidden = false;
        codeEl.textContent = res.code;
        document.getElementById('reset-input').value = '';
        showPanel('panel-reset', { hideTabs: true });
      } else {
        showError('forgot-error', 'If an account exists for that email, a reset code has been sent.');
        // Non-blocking: still move to the reset screen for a smooth demo.
        var demo2 = document.getElementById('reset-demo');
        demo2.hidden = true;
        showPanel('panel-reset', { hideTabs: true });
      }
    });
  }

  /* ---------- Reset password ---------- */

  function bindReset() {
    var form = document.getElementById('reset-form');
    document.getElementById('reset-to-login').addEventListener('click', function () {
      showPanel('panel-login');
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var code = document.getElementById('reset-input').value.trim();
      var password = document.getElementById('reset-password').value;
      var confirm = document.getElementById('reset-confirm').value;

      showError('reset-error', '');
      if (code.length !== 6) return showError('reset-error', 'Please enter the 6-digit reset code.');
      if (password !== confirm) return showError('reset-error', 'Passwords do not match.');

      setLoading('btn-reset', true);
      try {
        var res = await A.resetPassword(code, password);
        if (!res.ok) {
          showError('reset-error', res.error);
          return;
        }
        if (StudyFlow.UI && StudyFlow.UI.showToast) StudyFlow.UI.showToast('Password updated. Please sign in.', 'success');
        document.getElementById('login-password').value = '';
        showPanel('panel-login', { hideTabs: false });
      } catch (err) {
        showError('reset-error', 'Something went wrong. Please try again.');
      } finally {
        setLoading('btn-reset', false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();