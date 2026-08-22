/* ==========================================================================
   StudyFlow — Authentication & Multi-User Core
   Client-side auth with salted PBKDF2 password hashing (WebCrypto with a
   pure-JS fallback), session tokens, "Remember Me", simulated email
   verification, and password reset codes.

   Storage is namespaced per user by the Storage layer, which reads the
   authenticated user id from StudyFlow.Auth.currentUserId().

   SECURITY NOTE
   Because StudyFlow runs fully in the browser (no backend), this provides
   account isolation within the same browser/device and best-effort
   credential protection. A real deployment would replace this module with
   a server-side auth service (bcrypt + JWT + real email delivery).
   ========================================================================== */

window.StudyFlow = window.StudyFlow || {};

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Configuration
     ------------------------------------------------------------------ */
  var VERIFY_EMAIL = true;                 // require simulated email verification on sign up
  var PBKDF2_ITERATIONS = 100000;          // WebCrypto iterations
  var FALLBACK_ITERATIONS = 12000;         // pure-JS iterations (much slower)
  var SESSION_TTL_REMEMBER = 30 * 24 * 3600 * 1000; // 30 days
  var SESSION_TTL_DEFAULT = 24 * 3600 * 1000;      // 24 hours (per-tab, sessionStorage)
  var CODE_TTL = 15 * 60 * 1000;           // verification / reset code lifetime

  var USERS_KEY = 'studyflow_users';
  var SESSION_KEY = 'studyflow_session';
  var PENDING_VERIFY_KEY = 'studyflow_pending_verify';
  var PENDING_RESET_KEY = 'studyflow_pending_reset';

  /* ------------------------------------------------------------------
     Minimal storage primitives (auth is independent of the data layer)
     ------------------------------------------------------------------ */

  function lsGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, value) {
    try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function lsRemove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* noop */ }
  }
  function ssGet(key) {
    try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
  }
  function ssSet(key, value) {
    try { window.sessionStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function ssRemove(key) {
    try { window.sessionStorage.removeItem(key); } catch (e) { /* noop */ }
  }

  function loadJSON(key) {
    var raw = lsGet(key);
    if (raw === null) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function saveJSON(key, data) {
    return lsSet(key, JSON.stringify(data));
  }

  /* ------------------------------------------------------------------
     Binary helpers
     ------------------------------------------------------------------ */

  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function randomBytes(n) {
    var bytes = new Uint8Array(n);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }

  function randomHex(bytes) {
    var out = '';
    var b = randomBytes(bytes);
    for (var i = 0; i < b.length; i++) out += ('0' + b[i].toString(16)).slice(-2);
    return out;
  }

  function randomCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /* ------------------------------------------------------------------
     SHA-256 (pure JS fallback when WebCrypto is unavailable)
     ------------------------------------------------------------------ */

  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function sha256Bytes(input) {
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    var data = new Uint8Array(input);
    var bitLen = data.length * 8;
    var padded = new Uint8Array(((data.length + 8 + 64) >> 6) << 6);
    padded.set(data);
    padded[data.length] = 0x80;
    var dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 4, bitLen >>> 0, false);
    dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);

    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    var h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    var w = new Uint32Array(64);

    for (var i = 0; i < padded.length; i += 64) {
      for (var t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4, false);
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var temp1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var temp2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + temp1) | 0;
        d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    var out = new Uint8Array(32);
    var outDV = new DataView(out.buffer);
    outDV.setUint32(0, h0, false); outDV.setUint32(4, h1, false);
    outDV.setUint32(8, h2, false); outDV.setUint32(12, h3, false);
    outDV.setUint32(16, h4, false); outDV.setUint32(20, h5, false);
    outDV.setUint32(24, h6, false); outDV.setUint32(28, h7, false);
    return out;
  }

  function webCryptoAvailable() {
    return !!(window.crypto && window.crypto.subtle &&
      typeof window.crypto.subtle.importKey === 'function' &&
      typeof window.crypto.subtle.deriveBits === 'function');
  }

  function hmacSha256(keyBytes, msgBytes) {
    var B = 64;
    var K = keyBytes;
    if (K.length > B) {
      K = sha256Bytes(K);
    }
    var keyPad = new Uint8Array(B);
    keyPad.set(K);

    var iPad = new Uint8Array(B);
    var oPad = new Uint8Array(B);
    for (var i = 0; i < B; i++) {
      iPad[i] = keyPad[i] ^ 0x36;
      oPad[i] = keyPad[i] ^ 0x5c;
    }

    var innerBuf = new Uint8Array(B + msgBytes.length);
    innerBuf.set(iPad, 0);
    innerBuf.set(msgBytes, B);
    var innerHash = sha256Bytes(innerBuf);

    var outerBuf = new Uint8Array(B + 32);
    outerBuf.set(oPad, 0);
    outerBuf.set(innerHash, B);
    return sha256Bytes(outerBuf);
  }

  function pbkdf2HmacSha256(passwordStr, saltBytes, iterations) {
    var passBytes = new TextEncoder().encode(passwordStr);
    var saltWithIndex = new Uint8Array(saltBytes.length + 4);
    saltWithIndex.set(saltBytes, 0);
    saltWithIndex[saltBytes.length + 3] = 1;

    var u = hmacSha256(passBytes, saltWithIndex);
    var result = new Uint8Array(u);

    for (var i = 1; i < iterations; i++) {
      u = hmacSha256(passBytes, u);
      for (var k = 0; k < 32; k++) {
        result[k] ^= u[k];
      }
    }
    return result;
  }

  /* ------------------------------------------------------------------
     Password hashing — PBKDF2 with HMAC-SHA256 (WebCrypto / pure JS)
     Result: { algorithm, iterations, salt, hash } where salt/hash are base64
     ------------------------------------------------------------------ */

  async function deriveBits(password, saltBytes, iterations) {
    if (webCryptoAvailable()) {
      try {
        var enc = new TextEncoder();
        var key = await window.crypto.subtle.importKey(
          'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
        );
        var bits = await window.crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: saltBytes, iterations: iterations, hash: 'SHA-256' },
          key, 256
        );
        return new Uint8Array(bits);
      } catch (err) {
        // Fall back to pure JS PBKDF2
      }
    }
    return pbkdf2HmacSha256(password, saltBytes, Math.min(iterations, 10000));
  }

  async function hashPassword(password) {
    var salt = randomBytes(16);
    var useWeb = webCryptoAvailable();
    var iterations = useWeb ? PBKDF2_ITERATIONS : FALLBACK_ITERATIONS;
    var hash = await deriveBits(password, salt, iterations);
    return {
      algorithm: 'PBKDF2',
      iterations: iterations,
      salt: bytesToB64(salt),
      hash: bytesToB64(hash)
    };
  }

  async function verifyPassword(password, record) {
    if (!record || !record.hash || !record.salt) return false;
    try {
      var iterations = Number(record.iterations) || (webCryptoAvailable() ? PBKDF2_ITERATIONS : FALLBACK_ITERATIONS);
      var hash = await deriveBits(password, b64ToBytes(record.salt), iterations);
      return bytesToB64(hash) === record.hash;
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------------------------------------------
     User registry & Demo account provisioning
     ------------------------------------------------------------------ */

  var DEMO_USER = {
    id: 'u_demo_alex_johnson',
    name: 'Alex Johnson',
    email: 'alex@studyflow.app',
    passwordHash: {
      algorithm: 'PBKDF2',
      iterations: 100000,
      salt: 'STGymsmdZ20NZg8j3Fh4iw==',
      hash: 'tzOaaPQATDuR4K2X68INY0H2FpGnOFlWHJUx7+UPJF8='
    },
    avatar: null,
    bio: 'Computer Science student focusing on Algorithms and Web Technologies.',
    institution: 'Tech University',
    course: 'Computer Science',
    phone: '+1 (555) 234-5678',
    selectedClass: 'engineering',
    classSelected: true,
    emailVerified: true,
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
    sessions: []
  };

  function loadUsers() {
    var list = loadJSON(USERS_KEY);
    if (!Array.isArray(list) || list.length === 0) {
      list = [DEMO_USER];
      saveJSON(USERS_KEY, list);
    }
    return list;
  }
  function saveUsers(list) {
    return saveJSON(USERS_KEY, list);
  }
  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }
  function findUserByEmail(email) {
    var target = normalizeEmail(email);
    return loadUsers().find(function (u) { return u.email === target; }) || null;
  }
  function findUserById(id) {
    return loadUsers().find(function (u) { return u.id === id; }) || null;
  }
  function updateUser(updater) {
    var list = loadUsers();
    var idx = list.findIndex(function (u) { return u.id === currentUserId(); });
    if (idx === -1) return null;
    var next = updater(list[idx]);
    list[idx] = next;
    saveUsers(list);
    return next;
  }

  /* ------------------------------------------------------------------
     Email validation
     ------------------------------------------------------------------ */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function isValidEmail(email) {
    return EMAIL_RE.test(String(email || '').trim());
  }

  function passwordPolicyError(password) {
    if (!password || String(password).length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    return null;
  }

  /* ------------------------------------------------------------------
     Session management
     ------------------------------------------------------------------ */

  var currentUser = null;   // cached during restoreSession

  function currentUserId() {
    return currentUser ? currentUser.id : null;
  }

  function readSessionRecord() {
    var raw = ssGet(SESSION_KEY) || lsGet(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function writeSessionRecord(record) {
    var json = JSON.stringify(record);
    if (record.remember) {
      lsSet(SESSION_KEY, json);
      ssRemove(SESSION_KEY);
    } else {
      ssSet(SESSION_KEY, json);
      lsRemove(SESSION_KEY);
    }
  }

  function destroySessionRecord() {
    lsRemove(SESSION_KEY);
    ssRemove(SESSION_KEY);
  }

  function pruneExpiredSessions(user) {
    var now = Date.now();
    var before = (user.sessions || []).length;
    user.sessions = (user.sessions || []).filter(function (s) { return s.exp > now; });
    if (before !== user.sessions.length) saveUsers(loadUsers().map(function (u) {
      return u.id === user.id ? user : u;
    }));
  }

  function createSession(user, remember) {
    var now = Date.now();
    var token = randomHex(24);
    var exp = now + (remember ? SESSION_TTL_REMEMBER : SESSION_TTL_DEFAULT);
    var record = { uid: user.id, token: token, exp: exp, remember: !!remember };
    var list = loadUsers();
    var idx = list.findIndex(function (u) { return u.id === user.id; });
    if (idx === -1) return null;
    if (!Array.isArray(list[idx].sessions)) list[idx].sessions = [];
    list[idx].sessions = list[idx].sessions.filter(function (s) { return s.exp > now; });
    list[idx].sessions.push({ token: token, exp: exp, createdAt: now });
    saveUsers(list);
    writeSessionRecord(record);
    currentUser = list[idx];
    return currentUser;
  }

  function restoreSession() {
    var record = readSessionRecord();
    if (!record || !record.uid || !record.token || !record.exp) {
      currentUser = null;
      return null;
    }
    if (record.exp < Date.now()) {
      destroySessionRecord();
      currentUser = null;
      return null;
    }
    var user = findUserById(record.uid);
    if (!user) {
      destroySessionRecord();
      currentUser = null;
      return null;
    }
    var active = (user.sessions || []).some(function (s) {
      return s.token === record.token && s.exp > Date.now();
    });
    if (!active) {
      destroySessionRecord();
      currentUser = null;
      return null;
    }
    pruneExpiredSessions(user);
    currentUser = user;
    return user;
  }

  function currentSessionRecord() {
    return readSessionRecord();
  }

  function logout() {
    var user = currentUser;
    var record = readSessionRecord();
    if (user && record) {
      var list = loadUsers();
      var idx = list.findIndex(function (u) { return u.id === user.id; });
      if (idx !== -1 && Array.isArray(list[idx].sessions)) {
        list[idx].sessions = list[idx].sessions.filter(function (s) { return s.token !== record.token; });
        saveUsers(list);
      }
    }
    destroySessionRecord();
    currentUser = null;
  }

  function revokeAllSessions() {
    if (currentUser) {
      var list = loadUsers();
      var idx = list.findIndex(function (u) { return u.id === currentUser.id; });
      if (idx !== -1) list[idx].sessions = [];
      saveUsers(list);
    }
    destroySessionRecord();
    currentUser = null;
  }

  /* ------------------------------------------------------------------
     Email verification (simulated — code shown on screen)
     ------------------------------------------------------------------ */

  function createPendingVerification(user) {
    saveJSON(PENDING_VERIFY_KEY, {
      uid: user.id,
      email: user.email,
      code: randomCode(),
      exp: Date.now() + CODE_TTL
    });
    return loadJSON(PENDING_VERIFY_KEY);
  }

  function pendingVerification() {
    return loadJSON(PENDING_VERIFY_KEY);
  }

  function verifyEmail(code) {
    var pending = pendingVerification();
    if (!pending) return { ok: false, error: 'No verification request found.' };
    if (pending.exp < Date.now()) {
      lsRemove(PENDING_VERIFY_KEY);
      return { ok: false, error: 'Verification code has expired. Please request a new one.' };
    }
    if (String(code).trim() !== String(pending.code)) {
      return { ok: false, error: 'Incorrect verification code.' };
    }
    var list = loadUsers();
    var idx = list.findIndex(function (u) { return u.id === pending.uid; });
    if (idx === -1) {
      lsRemove(PENDING_VERIFY_KEY);
      return { ok: false, error: 'Account no longer exists.' };
    }
    list[idx].emailVerified = true;
    list[idx].updatedAt = new Date().toISOString();
    saveUsers(list);
    lsRemove(PENDING_VERIFY_KEY);
    currentUser = createSession(list[idx], false);
    return { ok: true, user: currentUser };
  }

  function skipVerification() {
    var pending = loadJSON(PENDING_VERIFY_KEY);
    if (!pending) return { ok: false, error: 'No pending verification found.' };
    var user = findUserById(pending.uid);
    if (!user) {
      lsRemove(PENDING_VERIFY_KEY);
      return { ok: false, error: 'Account no longer exists.' };
    }
    lsRemove(PENDING_VERIFY_KEY);
    createSession(user, false);
    return { ok: true, user: currentUser };
  }

  function resendVerification(email) {
    var user = findUserByEmail(email);
    if (!user) return { ok: false, error: 'No account found for that email.' };
    var pending = createPendingVerification(user);
    return { ok: true, code: pending.code, email: pending.email };
  }

  /* ------------------------------------------------------------------
     Password reset (simulated code flow)
     ------------------------------------------------------------------ */

  function requestPasswordReset(email) {
    var user = findUserByEmail(email);
    var out = { ok: true, found: !!user };
    if (user) {
      saveJSON(PENDING_RESET_KEY, {
        uid: user.id,
        code: randomCode(),
        exp: Date.now() + CODE_TTL
      });
      out.code = loadJSON(PENDING_RESET_KEY).code;
    }
    return out;
  }

  function resetPassword(code, newPassword) {
    var policy = passwordPolicyError(newPassword);
    if (policy) return { ok: false, error: policy };
    var pending = loadJSON(PENDING_RESET_KEY);
    if (!pending) return { ok: false, error: 'No reset request found. Please start again.' };
    if (pending.exp < Date.now()) {
      lsRemove(PENDING_RESET_KEY);
      return { ok: false, error: 'Reset code has expired. Please start again.' };
    }
    if (String(code).trim() !== String(pending.code)) {
      return { ok: false, error: 'Incorrect reset code.' };
    }
    return hashPassword(newPassword).then(function (hash) {
      var list = loadUsers();
      var idx = list.findIndex(function (u) { return u.id === pending.uid; });
      if (idx === -1) return { ok: false, error: 'Account no longer exists.' };
      list[idx].passwordHash = hash;
      list[idx].sessions = [];               // invalidate existing sessions
      list[idx].updatedAt = new Date().toISOString();
      saveUsers(list);
      lsRemove(PENDING_RESET_KEY);
      return { ok: true };
    });
  }

  /* ------------------------------------------------------------------
     Sign up / Sign in
     ------------------------------------------------------------------ */

  async function signup(input) {
    var name = String(input.name || '').trim();
    var email = normalizeEmail(input.email);
    var password = String(input.password || '');

    if (name.length < 2) return { ok: false, error: 'Please enter your full name.' };
    if (!isValidEmail(email)) return { ok: false, error: 'Please enter a valid email address.' };
    var policy = passwordPolicyError(password);
    if (policy) return { ok: false, error: policy };

    if (findUserByEmail(email)) {
      return { ok: false, error: 'An account with that email already exists.' };
    }

    var hash = await hashPassword(password);
    var now = new Date().toISOString();
    var user = {
      id: 'u_' + randomHex(8),
      name: name,
      email: email,
      passwordHash: hash,
      avatar: null,
      bio: '',
      institution: '',
      course: '',
      phone: '',
      selectedClass: input.selectedClass || '',
      classSelected: !!input.selectedClass,
      emailVerified: !VERIFY_EMAIL,
      createdAt: now,
      updatedAt: now,
      sessions: []
    };

    var list = loadUsers();
    list.push(user);
    saveUsers(list);

    // Provision the user's private data namespace (fresh sample data or a
    // migration of the previous single-user data in this browser).
    if (StudyFlow.Storage && StudyFlow.Storage.seedForUser) {
      StudyFlow.Storage.seedForUser(user.id, { importLegacy: !!input.importLegacy });
    }

    var pending = VERIFY_EMAIL ? createPendingVerification(user) : null;
    if (VERIFY_EMAIL) {
      return { ok: true, needsVerification: true, pending: pending };
    }
    createSession(user, false);
    return { ok: true, user: user, needsVerification: false };
  }

  async function login(input) {
    var email = normalizeEmail(input.email);
    var password = String(input.password || '');
    var remember = !!input.remember;

    var user = findUserByEmail(email);
    if (!user) return { ok: false, error: 'Invalid email or password.' };

    var valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return { ok: false, error: 'Invalid email or password.' };

    if (VERIFY_EMAIL && !user.emailVerified) {
      var pending = createPendingVerification(user);
      return { ok: true, needsVerification: true, pending: pending, user: user };
    }

    createSession(user, remember);
    return { ok: true, user: currentUser, needsVerification: false };
  }

  /* ------------------------------------------------------------------
     Profile updates
     ------------------------------------------------------------------ */

  function updateProfile(patch) {
    var user = findUserById(currentUserId());
    if (!user) return { ok: false, error: 'Not authenticated.' };

    if ('name' in patch) {
      var name = String(patch.name || '').trim();
      if (name.length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };
      user.name = name;
    }
    if ('email' in patch) {
      var email = normalizeEmail(patch.email);
      if (!isValidEmail(email)) return { ok: false, error: 'Please enter a valid email address.' };
      if (email !== user.email) {
        var clash = loadUsers().find(function (u) { return u.email === email && u.id !== user.id; });
        if (clash) return { ok: false, error: 'That email is already in use.' };
        user.email = email;
        user.emailVerified = !VERIFY_EMAIL;
        user._needsReverify = VERIFY_EMAIL;
        if (VERIFY_EMAIL) createPendingVerification(user);
      }
    }
    ['avatar', 'bio', 'institution', 'course', 'phone', 'selectedClass'].forEach(function (field) {
      if (field in patch) user[field] = patch[field] === undefined ? '' : patch[field];
    });
    if ('classSelected' in patch) {
      user.classSelected = !!patch.classSelected;
    }

    user.updatedAt = new Date().toISOString();
    var list = loadUsers();
    var idx = list.findIndex(function (u) { return u.id === user.id; });
    list[idx] = user;
    saveUsers(list);
    currentUser = user;
    return { ok: true, user: user, needsVerification: !!user._needsReverify, reverifyEmail: user.email };
  }

  function setSelectedClass(classKey, reseedPlanner) {
    var user = findUserById(currentUserId());
    if (!user) return { ok: false, error: 'Not authenticated.' };

    user.selectedClass = classKey;
    user.classSelected = true;
    user.updatedAt = new Date().toISOString();

    var list = loadUsers();
    var idx = list.findIndex(function (u) { return u.id === user.id; });
    if (idx !== -1) {
      list[idx] = user;
      saveUsers(list);
    }
    currentUser = user;

    if (reseedPlanner !== false && StudyFlow.Storage && StudyFlow.Storage.seedForClass) {
      StudyFlow.Storage.seedForClass(user.id, classKey);
    }

    return { ok: true, user: user };
  }

  function isOnboarded(user) {
    user = user || currentUser || restoreSession();
    return !!(user && user.classSelected && user.selectedClass);
  }

  async function changePassword(currentPassword, newPassword) {
    var user = findUserById(currentUserId());
    if (!user) return { ok: false, error: 'Not authenticated.' };
    var valid = await verifyPassword(String(currentPassword || ''), user.passwordHash);
    if (!valid) return { ok: false, error: 'Current password is incorrect.' };
    var policy = passwordPolicyError(newPassword);
    if (policy) return { ok: false, error: policy };

    var hash = await hashPassword(newPassword);
    var record = readSessionRecord();
    user.passwordHash = hash;
    user.sessions = record ? [{ token: record.token, exp: record.exp, createdAt: Date.now() }] : [];
    user.updatedAt = new Date().toISOString();
    var list = loadUsers();
    var idx = list.findIndex(function (u) { return u.id === user.id; });
    list[idx] = user;
    saveUsers(list);
    currentUser = user;
    return { ok: true };
  }

  function deleteAccount() {
    var user = findUserById(currentUserId());
    if (!user) return false;
    var list = loadUsers().filter(function (u) { return u.id !== user.id; });
    saveUsers(list);
    if (StudyFlow.Storage && StudyFlow.Storage.clearUserData) {
      StudyFlow.Storage.clearUserData(user.id);
    }
    destroySessionRecord();
    currentUser = null;
    return true;
  }

  /* ------------------------------------------------------------------
     Avatar helpers
     ------------------------------------------------------------------ */

  function initialsAvatar(name) {
    var words = String(name || '').trim().split(/\s+/).filter(Boolean);
    var initials = (words.slice(0, 2).map(function (w) { return w[0]; }).join('') || '?').toUpperCase();
    var palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
    var hue = 0;
    for (var i = 0; i < name.length; i++) hue = (hue * 31 + name.charCodeAt(i)) >>> 0;
    var color = palette[hue % palette.length];
    var size = 96;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + color + '"/>' +
          '<stop offset="1" stop-color="' + color + '" stop-opacity="0.72"/>' +
        '</linearGradient></defs>' +
        '<rect width="' + size + '" height="' + size + '" rx="24" fill="url(#g)"/>' +
        '<text x="50%" y="52%" dy="0.35em" text-anchor="middle" font-family="Inter, system-ui, sans-serif" ' +
          'font-size="34" font-weight="700" fill="#ffffff">' + initials + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function avatarSrc(user) {
    if (user && user.avatar) return user.avatar;
    return initialsAvatar(user && user.name ? user.name : '?');
  }

  /* ------------------------------------------------------------------
     Auth guard & helpers
     ------------------------------------------------------------------ */

  function loginDemoUser(remember) {
    var users = loadUsers();
    var user = findUserByEmail('alex@studyflow.app') || users[0] || DEMO_USER;
    if (!user.selectedClass) {
      user.selectedClass = 'engineering';
      user.classSelected = true;
    }
    createSession(user, remember !== false);
    if (StudyFlow.Storage && StudyFlow.Storage.seedIfNeeded) {
      StudyFlow.Storage.seedIfNeeded();
    }
    return { ok: true, user: currentUser };
  }

  function loginAsGuest() {
    var guestUser = {
      id: 'u_guest_' + randomHex(6),
      name: 'Guest Scholar',
      email: 'guest.' + randomHex(4) + '@studyflow.local',
      passwordHash: { algorithm: 'PBKDF2', iterations: 1000, salt: '', hash: '' },
      avatar: null,
      bio: 'Guest exploring StudyFlow.',
      institution: 'Self-directed Learning',
      course: 'General Studies',
      phone: '',
      selectedClass: '',
      classSelected: false,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessions: []
    };
    var list = loadUsers();
    list.push(guestUser);
    saveUsers(list);
    createSession(guestUser, false);
    return { ok: true, user: currentUser };
  }

  function redirectToLogin() {
    var rawPage = window.location.pathname.split('/').pop() || 'index.html';
    var page = rawPage.indexOf('.html') !== -1 ? rawPage : 'index.html';
    var qs = window.location.search || '';
    var target = 'auth.html?redirect=' + encodeURIComponent(page + qs);
    if (window.location.pathname.indexOf('auth.html') !== -1) return;
    window.location.replace(target);
  }

  function redirectToOnboarding(redirectUrl) {
    var rawPage = window.location.pathname.split('/').pop() || 'index.html';
    var page = rawPage.indexOf('.html') !== -1 ? rawPage : 'index.html';
    var qs = window.location.search || '';
    var target = 'onboarding.html';
    if (redirectUrl) {
      target += '?redirect=' + encodeURIComponent(redirectUrl);
    } else if (page !== 'index.html' && page !== 'onboarding.html') {
      target += '?redirect=' + encodeURIComponent(page + qs);
    }
    if (window.location.pathname.indexOf('onboarding.html') !== -1) return;
    window.location.replace(target);
  }

  function requireAuth(options) {
    var user = restoreSession();
    if (!user) {
      redirectToLogin();
      return null;
    }

    var skipOnboardingCheck = options && options.allowUnonboarded;
    var pathname = window.location.pathname;
    var isAuthPage = pathname.indexOf('auth.html') !== -1;
    var isOnboardingPage = pathname.indexOf('onboarding.html') !== -1;

    if (!skipOnboardingCheck && !isOnboarded(user) && !isAuthPage && !isOnboardingPage) {
      redirectToOnboarding();
      return user;
    }

    return user;
  }

  /* ------------------------------------------------------------------
     Export
     ------------------------------------------------------------------ */

  StudyFlow.Auth = {
    VERIFY_EMAIL: VERIFY_EMAIL,
    DEMO_CREDENTIALS: { email: 'alex@studyflow.app', password: 'StudyFlow123!' },
    currentUser: function () { return currentUser; },
    currentUserId: currentUserId,
    restoreSession: restoreSession,
    currentSessionRecord: currentSessionRecord,
    requireAuth: requireAuth,
    redirectToLogin: redirectToLogin,
    redirectToOnboarding: redirectToOnboarding,
    isOnboarded: isOnboarded,
    setSelectedClass: setSelectedClass,
    logout: logout,
    revokeAllSessions: revokeAllSessions,
    signup: signup,
    login: login,
    loginDemoUser: loginDemoUser,
    loginAsGuest: loginAsGuest,
    verifyEmail: verifyEmail,
    pendingVerification: pendingVerification,
    resendVerification: resendVerification,
    skipVerification: skipVerification,
    requestPasswordReset: requestPasswordReset,
    resetPassword: resetPassword,
    updateProfile: updateProfile,
    changePassword: changePassword,
    deleteAccount: deleteAccount,
    isValidEmail: isValidEmail,
    passwordPolicyError: passwordPolicyError,
    avatarSrc: avatarSrc,
    initialsAvatar: initialsAvatar
  };
})();
