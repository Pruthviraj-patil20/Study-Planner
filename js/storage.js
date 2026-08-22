/* ==========================================================================
   StudyFlow — Storage Layer
   Centralized LocalStorage operations. All data is namespaced per
   authenticated user so one user can never read another user's data.
   The public typed accessors (getSubjects, setTasks, ...) automatically
   resolve to the currently signed-in user's namespace.
   ========================================================================== */

window.StudyFlow = window.StudyFlow || {};

(function () {
  'use strict';

  const TYPES = {
    subjects: 'subjects',
    tasks: 'tasks',
    sessions: 'sessions',
    exams: 'exams',
    notes: 'notes',
    focus: 'focus_sessions',
    settings: 'settings',
    ai_config: 'ai_config',
    ai_chats: 'ai_chats',
    ai_bookmarks: 'ai_bookmarks',
    seeded: 'seeded'
  };

  /* Legacy keys used by the original single-user version. */
  const LEGACY_KEYS = {
    subjects: 'studyflow_subjects',
    tasks: 'studyflow_tasks',
    sessions: 'studyflow_sessions',
    exams: 'studyflow_exams',
    notes: 'studyflow_notes',
    focus: 'studyflow_focus_sessions',
    settings: 'studyflow_settings',
    ai_config: 'studyflow_ai_config',
    ai_chats: 'studyflow_ai_chats',
    ai_bookmarks: 'studyflow_ai_bookmarks',
    seeded: 'studyflow_seeded'
  };

  const KEYS = LEGACY_KEYS;

  const DEFAULT_SETTINGS = {
    dailyGoal: 120,
    focusDefault: 25,
    breakDefault: 5,
    weekStart: 0
  };

  function getDefaultAPIKey() {
    try {
      return atob('QVEuQWI4Uk42THNETGs3bXF2N0lmVDEwc0lRdFdMT0tyWWlQMHROWHlka2RlczhjblJoaGc=');
    } catch (e) {
      return '';
    }
  }

  const DEFAULT_AI_CONFIG = {
    provider: 'gemini', // 'openai' | 'gemini' | 'groq' | 'custom'
    apiKey: getDefaultAPIKey(),
    model: 'gemini-1.5-flash',
    customEndpoint: '',
    systemInstructions: '',
    voiceInputEnabled: true,
    voiceOutputEnabled: false,
    temperature: 0.7
  };

  /* ---------- Key resolution ---------- */

  function scopedKey(type, uid) {
    uid = uid || (StudyFlow.Auth ? StudyFlow.Auth.currentUserId() : null);
    return uid ? 'studyflow_user_' + uid + '_' + TYPES[type] : LEGACY_KEYS[type];
  }

  function currentUserId() {
    return StudyFlow.Auth ? StudyFlow.Auth.currentUserId() : null;
  }

  /* ---------- Core primitives ---------- */

  function saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (err) {
      console.warn('StudyFlow: failed to persist', key, err);
      return false;
    }
  }

  function loadData(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback === undefined ? null : fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('StudyFlow: failed to read', key, err);
      return fallback === undefined ? null : fallback;
    }
  }

  function deleteData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      return false;
    }
  }

  function updateData(key, updater) {
    const current = loadData(key, []);
    const next = typeof updater === 'function' ? updater(current) : updater;
    saveData(key, next);
    return next;
  }

  function clearAllData() {
    const uid = currentUserId();
    Object.keys(TYPES).forEach((type) => {
      deleteData(scopedKey(type, uid));
    });
  }

  /* ---------- Typed accessors (user-scoped) ---------- */

  function getSubjects() { return loadData(scopedKey('subjects'), []); }
  function setSubjects(list) { return saveData(scopedKey('subjects'), list); }
  function getTasks() { return loadData(scopedKey('tasks'), []); }
  function setTasks(list) { return saveData(scopedKey('tasks'), list); }
  function getSessions() { return loadData(scopedKey('sessions'), []); }
  function setSessions(list) { return saveData(scopedKey('sessions'), list); }
  function getExams() { return loadData(scopedKey('exams'), []); }
  function setExams(list) { return saveData(scopedKey('exams'), list); }
  function getNotes() { return loadData(scopedKey('notes'), []); }
  function setNotes(list) { return saveData(scopedKey('notes'), list); }
  function getFocusSessions() { return loadData(scopedKey('focus'), []); }
  function setFocusSessions(list) { return saveData(scopedKey('focus'), list); }
  function getSettings() { return Object.assign({}, DEFAULT_SETTINGS, loadData(scopedKey('settings'), {})); }
  function setSettings(patch) {
    const merged = Object.assign({}, getSettings(), patch);
    saveData(scopedKey('settings'), merged);
    return merged;
  }
  function getAIConfig() {
    const loaded = loadData(scopedKey('ai_config'), {});
    const cfg = Object.assign({}, DEFAULT_AI_CONFIG, loaded);
    if (!cfg.apiKey) {
      cfg.apiKey = getDefaultAPIKey();
    }
    return cfg;
  }
  function setAIConfig(patch) {
    const merged = Object.assign({}, getAIConfig(), patch);
    saveData(scopedKey('ai_config'), merged);
    return merged;
  }
  function getAIChats() { return loadData(scopedKey('ai_chats'), []); }
  function setAIChats(list) { return saveData(scopedKey('ai_chats'), list); }
  function getAIBookmarks() { return loadData(scopedKey('ai_bookmarks'), []); }
  function setAIBookmarks(list) { return saveData(scopedKey('ai_bookmarks'), list); }

  /* ---------- Seed data (per user, on first launch of their account) ---------- */

  function pad2(n) { return String(n).padStart(2, '0'); }
  function isoDaysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function isoWithOffset(days, hours, mins) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hours, mins, 0, 0);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' +
      pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function buildSeedData() {
    const now = Date.now();
    const id = (p) => p + '_' + now.toString(36) + Math.random().toString(36).slice(2, 7);
    const today = isoDaysFromNow(0);

    const subjects = [
      { name: 'Mathematics', color: '#6366f1', icon: 'math', target: 80, chapters: [] },
      { name: 'Physics', color: '#0ea5e9', icon: 'atom', target: 70, chapters: [] },
      { name: 'Data Structures', color: '#10b981', icon: 'code', target: 85, chapters: [] },
      { name: 'Web Development', color: '#f59e0b', icon: 'layout', target: 75, chapters: [] },
      { name: 'Database Management', color: '#ec4899', icon: 'database', target: 65, chapters: [] },
      { name: 'Ai Finance', color: '#8b5cf6', icon: 'chart', target: 75, chapters: [] }
    ].map((s) => {
      const chapterNames = {
        Mathematics: ['Limits & Continuity', 'Differentiation', 'Integration', 'Linear Algebra', 'Probability', 'Differential Equations'],
        Physics: ['Kinematics', 'Laws of Motion', 'Thermodynamics', 'Electrostatics', 'Optics'],
        'Data Structures': ['Arrays & Strings', 'Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs', 'Hashing', 'Dynamic Programming'],
        'Web Development': ['HTML & CSS', 'JavaScript Basics', 'DOM Manipulation', 'Responsive Design', 'Fetch & APIs'],
        'Database Management': ['ER Models', 'SQL Basics', 'Normalization', 'Transactions', 'Indexing'],
        'Ai Finance': ['Financial Time Series & Forecasting', 'Algorithmic Trading Strategies', 'Machine Learning in Portfolio Management', 'Risk Modeling & Credit Scoring', 'Sentiment Analysis & NLP in Markets']
      }[s.name] || ['Chapter 1', 'Chapter 2', 'Chapter 3'];

      return Object.assign({}, s, {
        id: id('subj'),
        createdAt: isoWithOffset(-20, 9, 0),
        chapters: chapterNames.map((name, i) => ({
          id: id('chap'),
          name,
          completed: i < Math.floor(chapterNames.length * 0.45)
        }))
      });
    });

    const subjectId = (name) => (subjects.find((s) => s.name === name) || {}).id || '';

    const tasks = [
      { title: 'Solve calculus problem set', description: 'Chapter 5 exercises, problems 1–20.', subjectId: subjectId('Mathematics'), category: 'Homework', priority: 'High', deadline: isoDaysFromNow(1), status: 'in-progress', createdAt: isoWithOffset(-2, 14, 0) },
      { title: 'Prepare Data Structures quiz', description: 'Trees and Graph traversal algorithms.', subjectId: subjectId('Data Structures'), category: 'Revision', priority: 'High', deadline: isoDaysFromNow(2), status: 'todo', createdAt: isoWithOffset(-1, 10, 0) },
      { title: 'Build portfolio landing page', description: 'Responsive hero section with CSS grid.', subjectId: subjectId('Web Development'), category: 'Project', priority: 'Medium', deadline: isoDaysFromNow(5), status: 'todo', createdAt: isoWithOffset(-3, 16, 0) },
      { title: 'Physics lab report', description: 'Summarize the pendulum experiment results.', subjectId: subjectId('Physics'), category: 'Assignment', priority: 'Medium', deadline: isoDaysFromNow(3), status: 'todo', createdAt: isoWithOffset(-4, 11, 0) },
      { title: 'Normalization practice', description: 'Convert sample schema to 3NF.', subjectId: subjectId('Database Management'), category: 'Practice', priority: 'Low', deadline: isoDaysFromNow(6), status: 'done', completedAt: isoWithOffset(-1, 18, 0), createdAt: isoWithOffset(-5, 9, 0) },
      { title: 'Review HTML semantics', description: 'Re-read semantic HTML notes.', subjectId: subjectId('Web Development'), category: 'Revision', priority: 'Low', deadline: isoDaysFromNow(-1), status: 'done', completedAt: isoWithOffset(-2, 20, 0), createdAt: isoWithOffset(-6, 9, 0) }
    ].map((t) => Object.assign({ id: id('task') }, t));

    const mkSession = (dayOffset, startH, startM, endH, endM, subject, topic, completed) => ({
      id: id('sess'),
      subjectId: subjectId(subject),
      topic,
      date: isoDaysFromNow(dayOffset),
      startTime: pad2(startH) + ':' + pad2(startM),
      endTime: pad2(endH) + ':' + pad2(endM),
      duration: (endH * 60 + endM) - (startH * 60 + startM),
      priority: 'Medium',
      notes: '',
      completed: completed === undefined ? false : completed,
      createdAt: isoWithOffset(-7, 8, 0)
    });

    const sessions = [
      mkSession(0, 9, 0, 10, 30, 'Mathematics', 'Integration techniques', false),
      mkSession(0, 13, 0, 14, 0, 'Data Structures', 'Tree traversals', false),
      mkSession(0, 17, 0, 18, 30, 'Web Development', 'CSS Grid layout', true),
      mkSession(1, 10, 0, 11, 30, 'Physics', 'Laws of motion', false),
      mkSession(1, 15, 0, 16, 0, 'Database Management', 'SQL joins', false),
      mkSession(-1, 9, 0, 10, 0, 'Mathematics', 'Limits review', true),
      mkSession(-1, 14, 0, 15, 30, 'Data Structures', 'Linked list problems', true),
      mkSession(-2, 11, 0, 12, 0, 'Web Development', 'Responsive media queries', true)
    ];

    const exams = [
      { name: 'Mathematics Midterm', subjectId: subjectId('Mathematics'), date: isoDaysFromNow(5), description: 'Covers limits, derivatives and integration.', topics: ['Limits', 'Derivatives', 'Integration', 'Applications'], createdAt: isoWithOffset(-10, 9, 0) },
      { name: 'Data Structures Quiz', subjectId: subjectId('Data Structures'), date: isoDaysFromNow(2), description: 'Trees and graph traversal algorithms.', topics: ['Binary Trees', 'BST', 'Graph BFS/DFS', 'Complexity'], createdAt: isoWithOffset(-4, 9, 0) },
      { name: 'Physics Finals', subjectId: subjectId('Physics'), date: isoDaysFromNow(21), description: 'Full semester material.', topics: ['Kinematics', 'Mechanics', 'Thermo', 'Electrostatics', 'Optics'], createdAt: isoWithOffset(-15, 9, 0) }
    ].map((e) => Object.assign({
      id: id('exam'),
      topics: (e.topics || []).map((t, i) => ({ id: id('tp'), name: t, done: i < 1 }))
    }, e));

    const notes = [
      { title: 'Integration shortcuts', subjectId: subjectId('Mathematics'), content: '1. Integration by parts: u-substitution first.\n2. Remember ∫1/(1+x²) dx = arctan(x) + C.\n3. Symmetry can simplify definite integrals.', pinned: true, createdAt: isoWithOffset(-4, 9, 0) },
      { title: 'Tree traversal cheat sheet', subjectId: subjectId('Data Structures'), content: 'Preorder: root, left, right\nInorder: left, root, right\nPostorder: left, right, root\nUse a stack for iterative DFS, queue for BFS.', pinned: false, createdAt: isoWithOffset(-2, 10, 0) },
      { title: 'SQL aggregate functions', subjectId: subjectId('Database Management'), content: 'COUNT, SUM, AVG, MIN, MAX. Always pair with GROUP BY when using non-aggregated columns.', pinned: false, createdAt: isoWithOffset(-6, 16, 0) }
    ].map((n) => Object.assign({ id: id('note'), updatedAt: n.createdAt }, n));

    const focus = [];
    const focusConfig = [
      { d: 0, subj: 'Mathematics', dur: 50 },
      { d: 0, subj: 'Data Structures', dur: 25 },
      { d: -1, subj: 'Web Development', dur: 50 },
      { d: -1, subj: 'Mathematics', dur: 25 },
      { d: -2, subj: 'Physics', dur: 25 },
      { d: -3, subj: 'Database Management', dur: 50 },
      { d: -3, subj: 'Data Structures', dur: 25 },
      { d: -4, subj: 'Web Development', dur: 25 },
      { d: -5, subj: 'Mathematics', dur: 50 },
      { d: -6, subj: 'Physics', dur: 25 }
    ];
    focusConfig.forEach((f) => {
      focus.push({
        id: id('fs'),
        subjectId: subjectId(f.subj),
        mode: f.dur === 50 ? 'long' : 'classic',
        duration: f.dur,
        completed: true,
        date: isoDaysFromNow(f.d),
        startedAt: isoWithOffset(f.d, 9, 0),
        endedAt: isoWithOffset(f.d, 9 + Math.round(f.dur / 60), f.dur % 60)
      });
    });

    return { subjects, tasks, sessions, exams, notes, focus };
  }

  /* ---------- Class-specific seed generator ---------- */

  function buildClassSeedData(classKey) {
    if (!window.StudyFlow || !window.StudyFlow.ClassPresets) {
      return buildSeedData();
    }
    const preset = window.StudyFlow.ClassPresets.getPreset(classKey);
    if (!preset) return buildSeedData();

    const now = Date.now();
    const id = (p) => p + '_' + now.toString(36) + Math.random().toString(36).slice(2, 7);

    // 1. Build Subjects
    const subjects = (preset.subjects || []).map((s) => {
      const chapterList = s.chapters || ['Chapter 1', 'Chapter 2', 'Chapter 3'];
      return {
        id: id('subj'),
        name: s.name,
        color: s.color || '#6366f1',
        icon: s.icon || 'book',
        target: s.target || 80,
        createdAt: isoWithOffset(-20, 9, 0),
        chapters: chapterList.map((chName, i) => ({
          id: id('chap'),
          name: chName,
          completed: i < Math.floor(chapterList.length * 0.4)
        }))
      };
    });

    const getSubjectId = (idx, fallbackName) => {
      if (typeof idx === 'number' && subjects[idx]) return subjects[idx].id;
      if (fallbackName) {
        const match = subjects.find((s) => s.name.toLowerCase().includes(String(fallbackName).toLowerCase()));
        if (match) return match.id;
      }
      return subjects[0] ? subjects[0].id : '';
    };

    // 2. Build Tasks
    const tasks = (preset.tasks || []).map((t, idx) => ({
      id: id('task'),
      title: t.title,
      description: t.description || '',
      subjectId: getSubjectId(t.subjectIndex ?? (idx % subjects.length)),
      category: t.category || 'Homework',
      priority: t.priority || 'Medium',
      deadline: isoDaysFromNow(t.daysOffset !== undefined ? t.daysOffset : 2),
      status: idx === 0 ? 'in-progress' : (idx === (preset.tasks.length - 1) ? 'done' : 'todo'),
      completedAt: idx === (preset.tasks.length - 1) ? isoWithOffset(-1, 18, 0) : null,
      createdAt: isoWithOffset(-3, 10, 0)
    }));

    // 3. Build Study Sessions
    const sessions = (preset.sessions || []).map((sess, idx) => ({
      id: id('sess'),
      subjectId: getSubjectId(sess.subjectIndex ?? (idx % subjects.length)),
      topic: sess.topic || 'Core concept revision',
      date: isoDaysFromNow(sess.dayOffset || 0),
      startTime: pad2(sess.startH || 9) + ':' + pad2(sess.startM || 0),
      endTime: pad2(sess.endH || 10) + ':' + pad2(sess.endM || 0),
      duration: ((sess.endH || 10) * 60 + (sess.endM || 0)) - ((sess.startH || 9) * 60 + (sess.startM || 0)),
      priority: sess.priority || 'Medium',
      notes: '',
      completed: !!sess.completed,
      createdAt: isoWithOffset(-5, 8, 0)
    }));

    // 4. Build Exams
    const exams = (preset.exams || []).map((ex, idx) => {
      const sId = getSubjectId(ex.subjectIndex ?? (idx % subjects.length));
      const subj = subjects.find((s) => s.id === sId);
      const chaps = subj && subj.chapters ? subj.chapters.slice(0, 3).map((c) => c.name) : ['Unit 1', 'Unit 2'];
      return {
        id: id('exam'),
        name: ex.name,
        subjectId: sId,
        date: isoDaysFromNow(ex.daysOffset || 10),
        description: ex.description || 'Covers comprehensive syllabus chapters.',
        topics: chaps.map((tName, tIdx) => ({
          id: id('tp'),
          name: tName,
          done: tIdx === 0
        })),
        createdAt: isoWithOffset(-8, 9, 0)
      };
    });

    // 5. Build Notes
    const notes = (preset.notes || []).map((n, idx) => ({
      id: id('note'),
      title: n.title,
      subjectId: getSubjectId(n.subjectIndex ?? (idx % subjects.length)),
      content: n.content,
      pinned: !!n.pinned,
      createdAt: isoWithOffset(-4, 10, 0),
      updatedAt: isoWithOffset(-1, 14, 0)
    }));

    // 6. Build Focus History
    const focus = [];
    if (subjects.length > 0) {
      const focusDur = preset.focusDefault || 30;
      const history = [
        { d: 0, sIdx: 0, dur: focusDur },
        { d: 0, sIdx: Math.min(1, subjects.length - 1), dur: focusDur },
        { d: -1, sIdx: 0, dur: focusDur },
        { d: -2, sIdx: Math.min(2, subjects.length - 1), dur: focusDur },
        { d: -3, sIdx: Math.min(1, subjects.length - 1), dur: focusDur }
      ];
      history.forEach((h) => {
        focus.push({
          id: id('fs'),
          subjectId: getSubjectId(h.sIdx),
          mode: 'classic',
          duration: h.dur,
          completed: true,
          date: isoDaysFromNow(h.d),
          startedAt: isoWithOffset(h.d, 9, 0),
          endedAt: isoWithOffset(h.d, 9 + Math.floor(h.dur / 60), h.dur % 60)
        });
      });
    }

    const settings = Object.assign({}, DEFAULT_SETTINGS, {
      dailyGoal: preset.dailyGoal || DEFAULT_SETTINGS.dailyGoal,
      focusDefault: preset.focusDefault || DEFAULT_SETTINGS.focusDefault,
      breakDefault: preset.breakDefault || DEFAULT_SETTINGS.breakDefault
    });

    return { subjects, tasks, sessions, exams, notes, focus, settings };
  }

  function seedForClass(uid, classKey) {
    uid = uid || currentUserId();
    if (!uid) return false;
    const data = buildClassSeedData(classKey);
    saveData(scopedKey('subjects', uid), data.subjects);
    saveData(scopedKey('tasks', uid), data.tasks);
    saveData(scopedKey('sessions', uid), data.sessions);
    saveData(scopedKey('exams', uid), data.exams);
    saveData(scopedKey('notes', uid), data.notes);
    saveData(scopedKey('focus', uid), data.focus);
    if (data.settings) {
      saveData(scopedKey('settings', uid), data.settings);
    }
    saveData(scopedKey('seeded', uid), true);
    return true;
  }

  function seedForUser(uid, options) {
    uid = uid || currentUserId();
    if (!uid) return false;
    const importLegacy = options && options.importLegacy;

    if (importLegacy && migrateLegacy(uid)) {
      saveData(scopedKey('seeded', uid), true);
      return true;
    }

    const user = StudyFlow.Auth ? StudyFlow.Auth.currentUser() : null;
    const classKey = (options && options.classKey) || (user && user.selectedClass) || 'class-10';

    if (window.StudyFlow && window.StudyFlow.ClassPresets) {
      return seedForClass(uid, classKey);
    }

    const data = buildSeedData();
    saveData(scopedKey('subjects', uid), data.subjects);
    saveData(scopedKey('tasks', uid), data.tasks);
    saveData(scopedKey('sessions', uid), data.sessions);
    saveData(scopedKey('exams', uid), data.exams);
    saveData(scopedKey('notes', uid), data.notes);
    saveData(scopedKey('focus', uid), data.focus);
    saveData(scopedKey('settings', uid), DEFAULT_SETTINGS);
    saveData(scopedKey('seeded', uid), true);
    return true;
  }

  function seedIfNeeded() {
    const uid = currentUserId();
    if (!uid) return false;
    if (loadData(scopedKey('seeded', uid), false) === true) return false;
    return seedForUser(uid, { importLegacy: hasLegacyData() });
  }

  /* ---------- Legacy (pre-auth) data migration ---------- */

  function hasLegacyData() {
    return Object.keys(TYPES).some((type) => localStorage.getItem(LEGACY_KEYS[type]) !== null);
  }

  function migrateLegacy(uid) {
    uid = uid || currentUserId();
    if (!uid) return false;
    let migrated = false;
    Object.keys(TYPES).forEach((type) => {
      const raw = localStorage.getItem(LEGACY_KEYS[type]);
      if (raw !== null) {
        try {
          localStorage.setItem(scopedKey(type, uid), raw);
        } catch (err) { /* noop */ }
        localStorage.removeItem(LEGACY_KEYS[type]);
        migrated = true;
      }
    });
    return migrated;
  }

  function clearUserData(uid) {
    uid = uid || currentUserId();
    if (!uid) return;
    Object.keys(TYPES).forEach((type) => {
      deleteData(scopedKey(type, uid));
    });
  }

  /* ---------- Export ---------- */

  StudyFlow.Storage = {
    KEYS,
    DEFAULT_SETTINGS,
    TYPES,
    saveData,
    loadData,
    deleteData,
    updateData,
    clearAllData,
    getSubjects,
    setSubjects,
    getTasks,
    setTasks,
    getSessions,
    setSessions,
    getExams,
    setExams,
    getNotes,
    setNotes,
    getFocusSessions,
    setFocusSessions,
    getSettings,
    setSettings,
    getAIConfig,
    setAIConfig,
    getAIChats,
    setAIChats,
    getAIBookmarks,
    setAIBookmarks,
    seedIfNeeded,
    seedForUser,
    seedForClass,
    buildClassSeedData,
    hasLegacyData,
    migrateLegacy,
    clearUserData
  };
})();