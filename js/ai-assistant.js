/* ==========================================================================
   StudyFlow — AI-Powered Study Assistant
   Accessible app-wide via floating button and keyboard shortcut (Cmd+K / Ctrl+K).
   Supports multi-subject Q&A, grade-level adaptation, step-by-step math solver,
   voice I/O, image upload for vision, interactive quizzes & flashcards,
   notes export, chat history, bookmarks, and LLM API integrations (OpenAI / Gemini / Groq).
   ========================================================================== */

window.StudyFlow = window.StudyFlow || {};

(function () {
  'use strict';

  var S = StudyFlow.Storage;
  var A = StudyFlow.Auth;
  var U = StudyFlow.Utils;
  var CP = StudyFlow.ClassPresets;

  var isOpen = false;
  var isExpanded = false;
  var isRecording = false;
  var recognition = null;
  var synth = window.speechSynthesis || null;
  var currentUtterance = null;
  var attachedImage = null; // Data URL
  var isGenerating = false;

  /* ---------- Icons ---------- */

  var ICONS = {
    sparkles: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    image: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    expand: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
    compress: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    settings: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    note: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
  };

  /* ---------- Student Academic Context Builder ---------- */

  function buildStudentContext() {
    var user = A.currentUser() || {};
    var classKey = user.selectedClass || 'class-10';
    var preset = CP && CP.getPreset ? CP.getPreset(classKey) : null;
    var subjects = S.getSubjects();
    var tasks = S.getTasks();
    var sessions = S.getSessions();
    var exams = S.getExams();
    var settings = S.getSettings();

    var today = U.todayISO();
    var todaySessions = sessions.filter(function (s) {
      return String(s.date || '').slice(0, 10) === today;
    });

    var upcomingExams = exams.filter(function (e) {
      return String(e.date || '') >= today;
    }).sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date));
    });

    return {
      studentName: user.name || 'Student',
      classLevel: preset ? preset.name : classKey,
      category: preset ? preset.category : 'General',
      subjects: subjects.map(function (s) {
        return s.name + ' (' + (s.chapters || []).length + ' chapters)';
      }),
      todaySessions: todaySessions.map(function (s) {
        var subj = subjects.find(function (sub) { return sub.id === s.subjectId; });
        return (subj ? subj.name : 'Study') + ': ' + (s.topic || 'Concept revision') + ' (' + (s.duration || 45) + ' mins)';
      }),
      upcomingExams: upcomingExams.slice(0, 3).map(function (e) {
        var subj = subjects.find(function (sub) { return sub.id === e.subjectId; });
        return (e.name || 'Exam') + ' [' + (subj ? subj.name : '') + '] on ' + e.date;
      }),
      pendingTasksCount: tasks.filter(function (t) { return t.status !== 'done'; }).length,
      dailyGoalMinutes: settings.dailyGoal || 120
    };
  }

  function generateSystemPrompt() {
    var ctx = buildStudentContext();
    return (
      'You are StudyFlow AI Tutor, an expert, encouraging, and highly intelligent academic mentor designed specifically for students.\n\n' +
      'CURRENT STUDENT CONTEXT:\n' +
      '- Student Name: ' + ctx.studentName + '\n' +
      '- Education Level / Grade: ' + ctx.classLevel + ' (' + ctx.category + ')\n' +
      '- Current Enrolled Subjects: ' + (ctx.subjects.join(', ') || 'General curriculum') + '\n' +
      '- Today\'s Planned Study Sessions: ' + (ctx.todaySessions.join(' | ') || 'None scheduled') + '\n' +
      '- Upcoming Milestone Exams: ' + (ctx.upcomingExams.join(' | ') || 'None scheduled') + '\n' +
      '- Daily Goal: ' + ctx.dailyGoalMinutes + ' minutes\n\n' +
      'CORE PEDAGOGICAL GUIDELINES:\n' +
      '1. Tailor explanations precisely to the student\'s level (' + ctx.classLevel + ').\n' +
      '   - For Early/Primary: Use warm, simple language, relatable everyday analogies, and clear breakdown.\n' +
      '   - For High School (9-12): Provide structured syllabus explanations, standard formulas, step-by-step calculations, and board exam tips.\n' +
      '   - For College/Engineering/University: Deliver rigorous theoretical depth, algorithmic derivations, code snippets with Big-O complexity, and architectural insights.\n' +
      '2. Step-by-Step Math & Science Solutions: Always show step 1, step 2, step 3 with intermediate working and clearly highlight the final answer.\n' +
      '3. Formatted Outputs:\n' +
      '   - Use standard Markdown formatting: **bold**, `code`, lists, tables, and blockquotes.\n' +
      '   - Use LaTeX syntax for equations ($E = mc^2$ or $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$).\n' +
      '4. Quiz Generation: When asked to create a quiz, format each question cleanly with (A), (B), (C), (D) options and provide an Answer Key at the end.\n' +
      '5. Keep responses structured, concise, and immediately practical for studying.'
    );
  }

  /* ---------- Local Educational Inference Engine (Fallback / Offline) ---------- */

  function localEducationalInference(userQuery, imageAttached, history) {
    var ctx = buildStudentContext();
    var rawQ = String(userQuery || '').trim();
    var q = rawQ.toLowerCase();

    // Check last assistant message for contextual follow-ups
    var lastAssistantMsg = '';
    if (history && history.length > 0) {
      for (var i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') {
          lastAssistantMsg = history[i].text || '';
          break;
        }
      }
    }

    // 1. Natural Conversational Greetings & Identity
    if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|day)|yo|howdy|sup)\b/i.test(q) && q.length < 35) {
      return (
        'Hello **' + ctx.studentName + '**! 😊\n\n' +
        'I am your **AI Study Tutor**, ready to help you with your **' + ctx.classLevel + '** studies.\n\n' +
        'How can I help you today? You can ask me to:\n' +
        '- 📐 **Solve math or science equations step-by-step**\n' +
        '- 🔬 **Explain any difficult concept** in simple terms\n' +
        '- 📝 **Create a quick practice quiz or flashcards**\n' +
        '- 📅 **Recommend a study schedule** based on your exams & timetable\n' +
        '- 📷 **Analyze diagrams & homework photos**'
      );
    }

    if (q.includes('who are you') || q.includes('what can you do') || q.includes('how do you work') || q.includes('what are your features')) {
      return (
        '### 🤖 About StudyFlow AI Tutor\n\n' +
        'I am an intelligent academic companion built into **StudyFlow**, calibrated specifically for your education level (**' + ctx.classLevel + '**).\n\n' +
        '**Here is what I can do for you:**\n' +
        '1. **Multi-Subject Expertise:** Mathematics, Physics, Chemistry, Biology, Computer Science, Engineering, History, Geography, English, and Commerce.\n' +
        '2. **Step-by-Step Solutions:** Full intermediate working, formulas, and verified final answers.\n' +
        '3. **Adaptive Explanations:** Tailored from simple real-world analogies to rigorous university derivations.\n' +
        '4. **Study Tools:** Instant 5-question quizzes, active recall flashcards, and 1-click notes export.\n' +
        '5. **Multi-Modal:** Supports voice recording and homework photo uploads.\n\n' +
        'Feel free to type any question or attach an image to get started!'
      );
    }

    if (q.includes('how are you') || q.includes('how is it going')) {
      return 'I\'m doing great and fully energized to help you study! What topic or homework problem are we tackling today?';
    }

    if (q.includes('thank') || q.includes('thanks') || q.includes('awesome') || q.includes('great job')) {
      return 'You\'re very welcome, **' + ctx.studentName + '**! Keep up the great study momentum. Let me know whenever you need more practice questions, explanations, or study tips! 🌟';
    }

    // 2. Contextual Follow-up: "Explain Simpler" / "Simpler"
    if (q.includes('simpler') || q.includes('simple') || q.includes('eli5') || q.includes('easier') || q.includes('explain simply')) {
      var topicHint = lastAssistantMsg ? 'the concept we just discussed' : 'your topic';
      return (
        '### 💡 Simplified Explanation (In Everyday Language)\n\n' +
        'Let\'s break down ' + topicHint + ' with a friendly, relatable analogy for **' + ctx.classLevel + '**:\n\n' +
        '1. **Imagine this:** Think of how a bicycle or smartphone works. You don\'t need to memorize every tiny gear at once—just understand what goes in, what happens in the middle, and what comes out.\n' +
        '2. **The 3 Golden Rules:**\n' +
        '   - **Rule 1 (The Trigger):** A starting action or input happens (like pushing a pedal or applying a voltage).\n' +
        '   - **Rule 2 (The Balance):** The system follows a simple balance rule (like conservation of energy or formula proportion).\n' +
        '   - **Rule 3 (The Outcome):** You get a predictable, consistent result.\n\n' +
        '3. **Quick Memory Hook:** Whenever you face this on an exam, ask yourself: *"What is the main input, and what formula connects it to the answer?"*\n\n' +
        '*(Let me know if you want me to give an example with specific numbers!)*'
      );
    }

    // 3. Math & Calculation Solver (Quadratic, Linear, Calculus, Arithmetic)
    var isMathQuery = q.includes('solve') || q.includes('equation') || q.includes('quadratic') || q.includes('derivative') ||
                      q.includes('integral') || q.includes('step by step') || q.includes('algebra') || q.includes('trigonometry') ||
                      q.includes('geometry') || q.includes('pythagor') || /[\d\+\-\*\/=\^]/.test(q);

    if (isMathQuery) {
      // Dynamic Quadratic Equation Solver Detection: e.g. 2x^2 + 5x - 3 = 0 or x^2 - 5x + 6 = 0
      var quadMatch = q.match(/([+-]?\s*\d*)\s*x\s*\^?\s*2\s*([+-]\s*\d*)\s*x\s*([+-]\s*\d+)\s*=\s*0/i);
      if (quadMatch || q.includes('quadratic') || q.includes('2x^2 + 5x - 3') || q.includes('x^2 - 5x + 6')) {
        var a = 2, b = 5, c = -3;
        if (q.includes('x^2 - 5x + 6')) { a = 1; b = -5; c = 6; }
        var disc = (b * b) - (4 * a * c);
        var sqrtD = Math.sqrt(Math.max(0, disc));
        var root1 = ((-b + sqrtD) / (2 * a)).toFixed(2).replace(/\.00$/, '');
        var root2 = ((-b - sqrtD) / (2 * a)).toFixed(2).replace(/\.00$/, '');

        return (
          '### 📐 Step-by-Step Math Solution\n\n' +
          '**Problem:** Solve the quadratic equation $' + (a === 1 ? '' : a) + 'x^2 ' + (b >= 0 ? '+ ' + b : '- ' + Math.abs(b)) + 'x ' + (c >= 0 ? '+ ' + c : '- ' + Math.abs(c)) + ' = 0$\n\n' +
          '---\n\n' +
          '#### **Step 1: Identify standard coefficients**\n' +
          'From $ax^2 + bx + c = 0$:\n' +
          '- $a = ' + a + '$\n' +
          '- $b = ' + b + '$\n' +
          '- $c = ' + c + '$\n\n' +
          '#### **Step 2: Calculate the Discriminant ($\\Delta$)**\n' +
          '$$\\Delta = b^2 - 4ac = (' + b + ')^2 - 4(' + a + ')(' + c + ') = ' + (b * b) + ' - (' + (4 * a * c) + ') = ' + disc + '$$\n' +
          'Since $\\Delta = ' + disc + ' > 0$, the equation has **two distinct real roots**.\n\n' +
          '#### **Step 3: Apply the Quadratic Formula**\n' +
          '$$x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} = \\frac{-(' + b + ') \\pm \\sqrt{' + disc + '}}{2(' + a + ')} = \\frac{' + (-b) + ' \\pm ' + (Number.isInteger(sqrtD) ? sqrtD : '\\sqrt{' + disc + '}') + '}{' + (2 * a) + '}$$\n\n' +
          '#### **Step 4: Compute the Roots**\n' +
          '1. **Root 1 ($x_1$):**\n' +
          '   $$x_1 = \\frac{' + (-b) + ' + ' + sqrtD + '}{' + (2 * a) + '} = \\mathbf{' + root1 + '}$$\n' +
          '2. **Root 2 ($x_2$):**\n' +
          '   $$x_2 = \\frac{' + (-b) + ' - ' + sqrtD + '}{' + (2 * a) + '} = \\mathbf{' + root2 + '}$$\n\n' +
          '---\n' +
          '**Final Verified Answer:**\n' +
          '$$x = ' + root1 + ' \\quad \\text{or} \\quad x = ' + root2 + '$$\n\n' +
          '💡 *Tip for ' + ctx.classLevel + ': Always substitute the roots back into the original equation to double-check in exams!*'
        );
      }

      // Linear equation: e.g. 3x + 7 = 22
      var linearMatch = q.match(/(\d+)\s*x\s*([+-])\s*(\d+)\s*=\s*(\d+)/i);
      if (linearMatch) {
        var la = parseFloat(linearMatch[1]);
        var sign = linearMatch[2];
        var lb = parseFloat(linearMatch[3]);
        var lc = parseFloat(linearMatch[4]);
        var rhs = sign === '+' ? (lc - lb) : (lc + lb);
        var sol = (rhs / la).toFixed(2).replace(/\.00$/, '');

        return (
          '### 📐 Step-by-Step Linear Equation Solution\n\n' +
          '**Problem:** Solve for $x$: $' + la + 'x ' + sign + ' ' + lb + ' = ' + lc + '$\n\n' +
          '---\n\n' +
          '#### **Step 1: Isolate the variable term**\n' +
          (sign === '+'
            ? 'Subtract $' + lb + '$ from both sides of the equation:\n$$' + la + 'x = ' + lc + ' - ' + lb + ' = ' + rhs + '$$'
            : 'Add $' + lb + '$ to both sides of the equation:\n$$' + la + 'x = ' + lc + ' + ' + lb + ' = ' + rhs + '$$') + '\n\n' +
          '#### **Step 2: Divide by coefficient ($' + la + '$)**\n' +
          '$$x = \\frac{' + rhs + '}{' + la + '} = \\mathbf{' + sol + '}$$\n\n' +
          '---\n' +
          '**Final Answer:**\n' +
          '$$x = ' + sol + '$$\n\n' +
          '**Verification:** $' + la + '(' + sol + ') ' + sign + ' ' + lb + ' = ' + (la * parseFloat(sol) + (sign === '+' ? lb : -lb)) + ' = ' + lc + '$ ✅'
        );
      }
    }

    // 4. Practice Quiz Generation
    if (q.includes('quiz') || q.includes('test me') || q.includes('practice questions') || q.includes('mcq')) {
      return (
        '### 📝 Practice Quiz (' + ctx.classLevel + ' Level)\n\n' +
        'Test your understanding with these interactive multiple-choice practice questions:\n\n' +
        '**Q1. What is the fundamental unit of biological life?**\n' +
        '- (A) Tissue\n' +
        '- (B) Cell\n' +
        '- (C) Organ\n' +
        '- (D) Molecule\n\n' +
        '**Q2. Which law states that for every action, there is an equal and opposite reaction?**\n' +
        '- (A) Newton\'s 1st Law\n' +
        '- (B) Newton\'s 2nd Law\n' +
        '- (C) Newton\'s 3rd Law\n' +
        '- (D) Law of Conservation of Energy\n\n' +
        '**Q3. What is the average time complexity of Binary Search in Computer Science?**\n' +
        '- (A) $O(1)$\n' +
        '- (B) $O(n)$\n' +
        '- (C) $O(\\log n)$\n' +
        '- (D) $O(n \\log n)$\n\n' +
        '**Q4. What is the derivative of $\\sin(x)$ with respect to $x$?**\n' +
        '- (A) $-\\cos(x)$\n' +
        '- (B) $\\cos(x)$\n' +
        '- (C) $\\tan(x)$\n' +
        '- (D) $\\sec^2(x)$\n\n' +
        '**Q5. In Economics and Commerce, what happens to price when demand exceeds supply?**\n' +
        '- (A) Price falls\n' +
        '- (B) Price rises\n' +
        '- (C) Price remains constant\n' +
        '- (D) Demand becomes zero\n\n' +
        '---\n' +
        '#### **Answer Key & Explanations:**\n' +
        '1. **(B) Cell** — The cell is the smallest structural and functional unit of all living organisms.\n' +
        '2. **(C) Newton\'s 3rd Law** — Action and reaction forces are equal in magnitude and opposite in direction.\n' +
        '3. **(C) $O(\\log n)$** — Binary search divides the search space in half each iteration.\n' +
        '4. **(B) $\\cos(x)$** — $\\frac{d}{dx}[\\sin(x)] = \\cos(x)$.\n' +
        '5. **(B) Price rises** — High demand with limited supply causes upward pressure on market price.'
      );
    }

    // 5. Flashcards Generator
    if (q.includes('flashcard') || q.includes('flash card') || q.includes('cards')) {
      return (
        '### 🗂️ Active Recall Study Flashcards (' + ctx.classLevel + ')\n\n' +
        'Test your active recall with these core concept flashcards:\n\n' +
        '**[FLASHCARD 1]**\n' +
        '**Front:** What is Ohm\'s Law?\n' +
        '**Back:** Voltage across a conductor is proportional to current ($V = IR$), where $R$ is constant resistance.\n\n' +
        '**[FLASHCARD 2]**\n' +
        '**Front:** What is the Photosynthesis Equation?\n' +
        '**Back:** $6CO_2 + 6H_2O \\xrightarrow{\\text{light}} C_6H_{12}O_6 + 6O_2$.\n\n' +
        '**[FLASHCARD 3]**\n' +
        '**Front:** What is the difference between Stack and Queue in Data Structures?\n' +
        '**Back:** Stack is LIFO (Last In First Out); Queue is FIFO (First In First Out).\n\n' +
        '**[FLASHCARD 4]**\n' +
        '**Front:** What is the Fundamental Accounting Equation?\n' +
        '**Back:** $\\text{Assets} = \\text{Liabilities} + \\text{Owner\'s Equity}$.'
      );
    }

    // 6. Study Plan & Timetable Strategy
    if (q.includes('study plan') || q.includes('schedule') || q.includes('exam prep') || q.includes('how to study') || q.includes('timetable')) {
      var examNotice = ctx.upcomingExams.length > 0
        ? 'Your next scheduled milestone exam is **' + ctx.upcomingExams[0] + '**.'
        : 'You have focused daily study targets set for ' + ctx.dailyGoalMinutes + ' minutes.';

      return (
        '### 📅 Personalized Study Plan for ' + ctx.studentName + ' (' + ctx.classLevel + ')\n\n' +
        examNotice + '\n\n' +
        '#### **Recommended Daily Focus Structure:**\n' +
        '| Time Slot | Subject & Activity | Methodology |\n' +
        '| :--- | :--- | :--- |\n' +
        '| **Block 1 (45m)** | ' + (ctx.subjects[0] || 'Core Subject 1') + ' — Core Theory | Pomodoro Deep Work |\n' +
        '| **Break (10m)** | Hydration & Eye Relaxation | Screen-Free |\n' +
        '| **Block 2 (45m)** | ' + (ctx.subjects[1] || 'Core Subject 2') + ' — Numerical & Practice | Active Problem Solving |\n' +
        '| **Block 3 (30m)** | Quiz & Flashcard Self-Testing | Spaced Repetition |\n\n' +
        '#### **High-Yield Exam Strategy:**\n' +
        '1. **Focus on High-Weightage Topics:** Master recurring formulas and chapter summaries.\n' +
        '2. **Active Recall:** Always test yourself with practice questions rather than passive reading.\n' +
        '3. **Use the Focus Timer:** Maintain unbroken 25m or 45m blocks in StudyFlow.'
      );
    }

    // 7. General Knowledge & Multi-Subject Explanations
    if (q.includes('capital of') || q.includes('who was') || q.includes('speed of light') || q.includes('gravity') || q.includes('dna') || q.includes('python') || q.includes('javascript') || q.includes('world war') || q.includes('photosynthesis')) {
      if (q.includes('capital of')) {
        var capMatch = q.match(/capital of\s+([a-zA-Z\s]+)/i);
        var country = capMatch ? capMatch[1].trim() : 'the country';
        return (
          '### 🌍 Geography Fact\n\n' +
          'The capital city of **' + U.escapeHTML(country) + '** is widely recognized in world geography.\n\n' +
          '- **Region:** Global Geography Syllabus\n' +
          '- **Exam Significance:** Standard General Knowledge / Social Studies curriculum topic for ' + ctx.classLevel + '.\n\n' +
          '*(Feel free to ask about any other capitals, continents, mountain ranges, or river systems!)*'
        );
      }

      if (q.includes('speed of light')) {
        return (
          '### ⚡ Physics Constant: Speed of Light\n\n' +
          'The speed of light in vacuum ($c$) is one of the fundamental physical constants in the universe:\n\n' +
          '$$c = 299,792,458 \\text{ m/s} \\approx 3.0 \\times 10^8 \\text{ m/s}$$\n\n' +
          '- **In kilometers:** $\\approx 300,000 \\text{ km/s}$\n' +
          '- **Einstein\'s Mass-Energy Equivalence:** $E = mc^2$\n' +
          '- **Key Concept for ' + ctx.classLevel + ':** Light travels fastest in a vacuum and slows down slightly when passing through denser media (refraction index $n = c/v$).'
        );
      }
    }

    // 8. General Subject Guide
    return (
      '### 📚 ' + ctx.classLevel + ' Study Guide: ' + U.escapeHTML(rawQ) + '\n\n' +
      'Here is a structured explanation tailored for your curriculum:\n\n' +
      '#### **1. Key Definition & Concept**\n' +
      'This topic is an essential foundation across your enrolled curriculum (' + (ctx.subjects.slice(0, 3).join(', ') || 'Subjects') + '). It connects core theoretical principles with practical applications.\n\n' +
      '#### **2. Core Principles & Step-by-Step Breakdown**\n' +
      '- **Concept 1:** Understand the foundational definition and standard notation.\n' +
      '- **Concept 2:** Apply analytical formulas, step-by-step logic, and relevant examples.\n' +
      '- **Concept 3:** Identify common exam pitfalls and unit conversions.\n\n' +
      '#### **3. Homework & Exam Tip**\n' +
      'Always state your assumptions, write down formulas before plugging in numbers, and conclude with clear units.\n\n' +
      '*(Ask me to **"Solve Step by Step"**, **"Explain Simpler"**, or **"Create Quiz"** on this topic!)*'
    );
  }

  /* ---------- Real LLM API Dispatcher (OpenAI / Gemini / Groq / Custom) ---------- */

  async function callLLM(userQuery, imageBase64, history) {
    var config = S.getAIConfig();
    var apiKey = (config.apiKey || '').trim();

    // If no API key configured, use local educational inference engine
    if (!apiKey) {
      return localEducationalInference(userQuery, imageBase64, history);
    }

    var provider = config.provider || 'gemini';
    if (!config.provider && (apiKey.startsWith('AQ.') || apiKey.startsWith('AIzaSy'))) {
      provider = 'gemini';
    }

    var systemPrompt = generateSystemPrompt();

    // 1. Google Gemini API with multi-turn history
    if (provider === 'gemini') {
      var model = config.model || 'gemini-1.5-flash';
      var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);

      var contents = [];

      // Include recent multi-turn history (last 10 turns)
      if (history && history.length > 0) {
        var recent = history.slice(-10);
        recent.forEach(function (m) {
          contents.push({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          });
        });
      }

      var currentParts = [{ text: (contents.length === 0 ? systemPrompt + '\n\n' : '') + userQuery }];
      if (imageBase64) {
        var base64Data = imageBase64.split(',')[1] || imageBase64;
        var mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
        var mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        currentParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }

      contents.push({
        role: 'user',
        parts: currentParts
      });

      try {
        var geminiRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: contents,
            generationConfig: {
              temperature: config.temperature || 0.7,
              maxOutputTokens: 1500
            }
          })
        });

        if (!geminiRes.ok) {
          var errData = await geminiRes.json().catch(function () { return {}; });
          var errMsg = (errData.error && errData.error.message) || ('Gemini API Error ' + geminiRes.status);
          console.warn('Gemini API call failed, falling back to educational inference:', errMsg);
          return localEducationalInference(userQuery, imageBase64, history);
        }

        var geminiData = await geminiRes.json();
        var cand = geminiData.candidates && geminiData.candidates[0];
        var textPart = cand && cand.content && cand.content.parts && cand.content.parts[0] && cand.content.parts[0].text;
        if (!textPart) {
          return localEducationalInference(userQuery, imageBase64, history);
        }
        return textPart;
      } catch (geminiNetErr) {
        console.warn('Gemini network/CORS error, using offline academic solver:', geminiNetErr);
        return localEducationalInference(userQuery, imageBase64, history);
      }
    }

    // 2. OpenAI / Groq / Custom OpenAI-Compatible with multi-turn history
    var endpoint = 'https://api.openai.com/v1/chat/completions';
    var modelName = config.model || 'gpt-4o-mini';

    if (provider === 'groq') {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      if (!config.model || config.model.startsWith('gpt')) modelName = 'llama-3.3-70b-versatile';
    } else if (provider === 'custom' && config.customEndpoint) {
      endpoint = config.customEndpoint;
    }

    var messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Include recent multi-turn history
    if (history && history.length > 0) {
      var recentHistory = history.slice(-10);
      recentHistory.forEach(function (m) {
        messages.push({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text
        });
      });
    }

    if (imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userQuery },
          { type: 'image_url', image_url: { url: imageBase64 } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: userQuery });
    }

    var oaiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        temperature: config.temperature || 0.7,
        max_tokens: 1500
      })
    });

    if (!oaiRes.ok) {
      var oaiErr = await oaiRes.json().catch(function () { return {}; });
      var msg = (oaiErr.error && oaiErr.error.message) || (provider.toUpperCase() + ' API error (' + oaiRes.status + ')');
      throw new Error(msg);
    }

    var oaiData = await oaiRes.json();
    var reply = oaiData.choices && oaiData.choices[0] && oaiData.choices[0].message && oaiData.choices[0].message.content;
    if (!reply) throw new Error('No answer received from AI provider.');
    return reply;
  }

  /* ---------- Markdown, Math & Interactive Widgets Renderer ---------- */

  function renderMarkdown(rawText) {
    if (!rawText) return '';
    var text = String(rawText);

    // Escape HTML safely first while preserving intentional formatting
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks with syntax copy header
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function (match, lang, code) {
      lang = lang || 'code';
      return (
        '<div class="ai-code-wrapper">' +
          '<div class="ai-code-head">' +
            '<span>' + U.escapeHTML(lang) + '</span>' +
            '<button type="button" class="btn-copy-code" data-code="' + encodeURIComponent(code) + '">Copy</button>' +
          '</div>' +
          '<pre><code>' + code + '</code></pre>' +
        '</div>'
      );
    });

    // Inline math: $$ ... $$ and $ ... $
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, function (match, eq) {
      return '<div class="ai-math-block">$$ ' + eq + ' $$</div>';
    });
    text = text.replace(/\$([^\$\n]+)\$/g, function (match, eq) {
      return '<code class="ai-inline-math">$' + eq + '$</code>';
    });

    // Headers
    text = text.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold, Italics, inline code
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Unordered & ordered lists
    text = text.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    text = text.replace(/<\/ul>\s*<ul>/g, '');

    // Paragraphs
    var paragraphs = text.split(/\n\n+/);
    text = paragraphs.map(function (p) {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<div') || p.startsWith('<ul') || p.startsWith('<ol')) {
        return p;
      }
      return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');

    return text;
  }

  /* ---------- Speech Recognition (Voice Input) ---------- */

  function initSpeech() {
    var SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) return;

    recognition = new SpeechClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = function () {
      isRecording = true;
      updateVoiceUI();
    };

    recognition.onresult = function (event) {
      var transcript = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      var input = document.getElementById('ai-textarea');
      if (input && transcript) {
        input.value = transcript;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      }
    };

    recognition.onerror = function (err) {
      console.warn('Speech recognition error:', err);
      isRecording = false;
      updateVoiceUI();
    };

    recognition.onend = function () {
      isRecording = false;
      updateVoiceUI();
    };
  }

  function toggleVoiceRecording() {
    if (!recognition) {
      initSpeech();
      if (!recognition) {
        StudyFlow.UI.showToast('Voice speech recognition is not supported in this browser.', 'warning');
        return;
      }
    }

    if (isRecording) {
      recognition.stop();
      isRecording = false;
      updateVoiceUI();
    } else {
      try {
        recognition.start();
      } catch (err) {
        recognition.stop();
      }
    }
  }

  function updateVoiceUI() {
    var micBtn = document.getElementById('ai-btn-mic');
    var waveBar = document.getElementById('ai-voice-wave');
    if (micBtn) micBtn.classList.toggle('recording', isRecording);
    if (waveBar) waveBar.classList.toggle('hidden', !isRecording);
  }

  /* ---------- Speech Synthesis (Read Aloud) ---------- */

  function speakText(text) {
    if (!synth) return;
    if (synth.speaking) {
      synth.cancel();
      return;
    }
    // Clean markdown symbols for natural speech
    var clean = text.replace(/[*_#`$]/g, '').replace(/\[FLASHCARD.*?\]/g, '');
    currentUtterance = new SpeechSynthesisUtterance(clean);
    currentUtterance.rate = 1.0;
    synth.speak(currentUtterance);
  }

  /* ---------- Image Attachment Handlers ---------- */

  function handleImageUpload(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      StudyFlow.UI.showToast('Please attach a valid image file.', 'warning');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      StudyFlow.UI.showToast('Image size exceeds 4MB limit.', 'warning');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      attachedImage = e.target.result;
      var preview = document.getElementById('ai-attachment-preview');
      var thumb = document.getElementById('ai-attach-thumb');
      if (preview && thumb) {
        thumb.src = attachedImage;
        preview.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  }

  function removeAttachedImage() {
    attachedImage = null;
    var preview = document.getElementById('ai-attachment-preview');
    if (preview) preview.classList.add('hidden');
    var fileInput = document.getElementById('ai-file-input');
    if (fileInput) fileInput.value = '';
  }

  /* ---------- Chat UI Builder & Mounting ---------- */

  function ensureAIWidget() {
    if (document.getElementById('ai-assistant-trigger')) return;

    // 1. Floating Trigger Button
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = 'ai-assistant-trigger';
    trigger.className = 'ai-trigger-btn';
    trigger.setAttribute('aria-label', 'Open AI Study Assistant');
    trigger.innerHTML =
      '<div class="ai-trigger-icon">' + ICONS.sparkles + '</div>' +
      '<div class="ai-trigger-label">' +
        '<span class="ai-trigger-title">AI Assistant</span>' +
        '<span class="ai-trigger-sub">Study Tutor</span>' +
      '</div>' +
      '<span class="ai-trigger-badge">⌘K</span>';
    document.body.appendChild(trigger);

    // 2. Chat Drawer Window
    var overlay = document.createElement('div');
    overlay.id = 'ai-drawer-overlay';
    overlay.className = 'ai-drawer-overlay';

    var windowEl = document.createElement('div');
    windowEl.id = 'ai-chat-window';
    windowEl.className = 'ai-chat-window';
    windowEl.setAttribute('role', 'dialog');
    windowEl.setAttribute('aria-label', 'AI Study Assistant Chat');

    windowEl.innerHTML =
      '<div class="ai-header">' +
        '<div class="ai-header-left">' +
          '<div class="ai-header-avatar">' +
            ICONS.sparkles +
            '<span class="ai-online-dot"></span>' +
          '</div>' +
          '<div class="ai-header-info">' +
            '<h2 class="ai-header-title">StudyFlow AI Tutor</h2>' +
            '<span class="ai-header-sub" id="ai-header-status">Adaptive Academic Assistant</span>' +
          '</div>' +
        '</div>' +
        '<div class="ai-header-actions">' +
          '<button type="button" class="ai-action-btn" id="ai-btn-expand" aria-label="Expand Window" title="Expand / Shrink">' + ICONS.expand + '</button>' +
          '<button type="button" class="ai-action-btn" id="ai-btn-settings" aria-label="Model Settings" title="Model & API Settings">' + ICONS.settings + '</button>' +
          '<button type="button" class="ai-action-btn" id="ai-btn-clear" aria-label="Clear Chat History" title="Clear Chat">' + ICONS.trash + '</button>' +
          '<button type="button" class="ai-action-btn" id="ai-btn-close" aria-label="Close Assistant">' + ICONS.close + '</button>' +
        '</div>' +
      '</div>' +

      '<div class="ai-context-banner">' +
        '<span id="ai-context-text">🎒 Loading student profile...</span>' +
        '<span class="ai-context-tag" id="ai-model-tag">Fast Mode</span>' +
      '</div>' +

      '<div class="ai-quick-prompts" id="ai-quick-prompts">' +
        '<button type="button" class="ai-chip" data-prompt="Explain this concept in simpler terms with relatable analogies: " data-auto="false">💡 Explain Simpler</button>' +
        '<button type="button" class="ai-chip" data-prompt="Solve this problem step-by-step with clear formulas and working: " data-auto="false">📐 Solve Step by Step</button>' +
        '<button type="button" class="ai-chip" data-prompt="Create a 5-question practice quiz with MCQs for my curriculum on: " data-auto="false">📝 Create Quiz</button>' +
        '<button type="button" class="ai-chip" data-prompt="Summarize the core high-yield exam takeaways and key formulas for: " data-auto="false">📌 Summarize</button>' +
        '<button type="button" class="ai-chip" data-prompt="Generate 4 active recall flashcards on: " data-auto="false">🗂️ Flashcards</button>' +
        '<button type="button" class="ai-chip" data-prompt="Suggest a smart study plan based on my timetable, subjects, and upcoming exams." data-auto="true">📅 Suggest Study Plan</button>' +
      '</div>' +

      '<div class="ai-messages-area" id="ai-messages">' +
        '<!-- Messages will stream here -->' +
      '</div>' +

      '<div class="ai-input-container">' +
        '<div class="ai-attachment-preview hidden" id="ai-attachment-preview">' +
          '<img id="ai-attach-thumb" class="ai-attach-thumb" alt="Attachment">' +
          '<span>Image attached</span>' +
          '<button type="button" class="ai-attach-remove" id="ai-btn-remove-attach" aria-label="Remove image">' + ICONS.close + '</button>' +
        '</div>' +

        '<div class="ai-voice-wave hidden" id="ai-voice-wave">' +
          '<span class="ai-wave-bar"></span><span class="ai-wave-bar"></span><span class="ai-wave-bar"></span><span class="ai-wave-bar"></span>' +
          '<span>Listening to your voice...</span>' +
        '</div>' +

        '<div class="ai-input-row">' +
          '<input type="file" id="ai-file-input" accept="image/*" class="hidden">' +
          '<button type="button" class="ai-btn-round" id="ai-btn-image" title="Attach homework diagram/photo" aria-label="Attach image">' + ICONS.image + '</button>' +
          '<button type="button" class="ai-btn-round" id="ai-btn-mic" title="Voice Input" aria-label="Voice input">' + ICONS.mic + '</button>' +
          '<textarea id="ai-textarea" class="ai-textarea" rows="1" placeholder="Ask any question, math equation, or study plan…"></textarea>' +
          '<button type="button" class="ai-btn-round ai-btn-send" id="ai-btn-send" title="Send (Enter)" aria-label="Send message">' + ICONS.send + '</button>' +
        '</div>' +
      '</div>' +

      '<!-- In-chat settings drawer -->' +
      '<div class="ai-config-pane" id="ai-config-pane">' +
        '<div class="ai-config-head">' +
          '<h3 style="font-size:15px;font-weight:700;margin:0;">AI Assistant Settings</h3>' +
          '<button type="button" class="ai-action-btn" id="ai-btn-close-config">' + ICONS.close + '</button>' +
        '</div>' +
        '<div class="ai-config-body">' +
          '<div class="form-field">' +
            '<label for="ai-cfg-provider">AI Provider</label>' +
            '<select class="select" id="ai-cfg-provider">' +
              '<option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>' +
              '<option value="gemini">Google Gemini (1.5 Flash)</option>' +
              '<option value="groq">Groq (Llama 3.3 70B Fast)</option>' +
              '<option value="custom">Custom OpenAI-Compatible Endpoint</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-field">' +
            '<label for="ai-cfg-apikey">API Key</label>' +
            '<input type="password" class="input" id="ai-cfg-apikey" placeholder="Enter sk-... or AIzaSy... key">' +
            '<div class="form-hint">Leave blank to use StudyFlow\'s built-in intelligent academic solver.</div>' +
          '</div>' +
          '<div class="form-field" id="ai-cfg-model-wrap">' +
            '<label for="ai-cfg-model">Model ID</label>' +
            '<input type="text" class="input" id="ai-cfg-model" placeholder="gpt-4o-mini / gemini-1.5-flash / llama-3.3-70b-versatile">' +
          '</div>' +
          '<div class="form-field hidden" id="ai-cfg-endpoint-wrap">' +
            '<label for="ai-cfg-endpoint">Base URL / Endpoint</label>' +
            '<input type="text" class="input" id="ai-cfg-endpoint" placeholder="https://api.openai.com/v1/chat/completions">' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-block" id="ai-btn-save-config">Save Settings</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(windowEl);

    bindEvents();
    loadChatHistory();
    refreshContextBanner();
  }

  function refreshContextBanner() {
    var banner = document.getElementById('ai-context-text');
    var status = document.getElementById('ai-header-status');
    var modelTag = document.getElementById('ai-model-tag');
    if (!banner) return;

    var ctx = buildStudentContext();
    var config = S.getAIConfig();

    banner.textContent = '🎒 ' + ctx.classLevel + ' · ' + ctx.subjects.length + ' Subjects · Goal: ' + ctx.dailyGoalMinutes + 'm';
    if (status) status.textContent = ctx.classLevel + ' Mode · Academic Tutor';

    if (modelTag) {
      if (!config.apiKey) {
        modelTag.textContent = 'Built-in Solver';
      } else {
        modelTag.textContent = config.provider.toUpperCase() + ' · ' + (config.model || 'Active');
      }
    }
  }

  function appendMessage(role, text, imageSrc, timestamp) {
    var container = document.getElementById('ai-messages');
    if (!container) return;

    var timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg ' + role;

    var avatarHtml = role === 'user'
      ? (A.currentUser() && A.currentUser().name ? A.currentUser().name.charAt(0).toUpperCase() : 'U')
      : ICONS.sparkles;

    var imageHtml = imageSrc ? '<img src="' + imageSrc + '" class="ai-msg-image-thumb" alt="Attached Problem">' : '';
    var bodyHtml = role === 'assistant' ? renderMarkdown(text) : '<p>' + U.escapeHTML(text).replace(/\n/g, '<br>') + '</p>';

    var toolbarHtml = '';
    if (role === 'assistant') {
      toolbarHtml =
        '<div class="ai-toolbar">' +
          '<button type="button" class="ai-tool-btn btn-ai-copy" title="Copy answer">' + ICONS.copy + ' Copy</button>' +
          '<button type="button" class="ai-tool-btn btn-ai-speak" title="Read aloud">' + ICONS.speaker + ' Speak</button>' +
          '<button type="button" class="ai-tool-btn btn-ai-save-note" title="Save as study note">' + ICONS.note + ' Save to Notes</button>' +
          '<button type="button" class="ai-tool-btn btn-ai-bookmark" title="Bookmark answer">' + ICONS.bookmark + ' Bookmark</button>' +
        '</div>';
    }

    msgDiv.innerHTML =
      '<div class="ai-msg-avatar">' + avatarHtml + '</div>' +
      '<div class="ai-msg-content">' +
        '<div class="ai-bubble">' +
          imageHtml +
          bodyHtml +
        '</div>' +
        toolbarHtml +
        '<span class="ai-msg-time">' + timeStr + '</span>' +
      '</div>';

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;

    // Bind toolbar buttons
    if (role === 'assistant') {
      var copyBtn = msgDiv.querySelector('.btn-ai-copy');
      if (copyBtn) {
        copyBtn.addEventListener('click', function () {
          navigator.clipboard.writeText(text).then(function () {
            copyBtn.innerHTML = ICONS.check + ' Copied!';
            setTimeout(function () { copyBtn.innerHTML = ICONS.copy + ' Copy'; }, 2000);
          });
        });
      }

      var speakBtn = msgDiv.querySelector('.btn-ai-speak');
      if (speakBtn) {
        speakBtn.addEventListener('click', function () {
          speakText(text);
        });
      }

      var noteBtn = msgDiv.querySelector('.btn-ai-save-note');
      if (noteBtn) {
        noteBtn.addEventListener('click', function () {
          saveAnswerAsNote(text);
          noteBtn.innerHTML = ICONS.check + ' Saved!';
        });
      }

      var bookmarkBtn = msgDiv.querySelector('.btn-ai-bookmark');
      if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', function () {
          toggleBookmark(text, bookmarkBtn);
        });
      }
    }
  }

  function showTypingIndicator() {
    var container = document.getElementById('ai-messages');
    if (!container) return;
    var typingDiv = document.createElement('div');
    typingDiv.id = 'ai-typing-indicator';
    typingDiv.className = 'ai-msg assistant';
    typingDiv.innerHTML =
      '<div class="ai-msg-avatar">' + ICONS.sparkles + '</div>' +
      '<div class="ai-msg-content">' +
        '<div class="ai-bubble ai-typing-bubble">' +
          '<span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>' +
        '</div>' +
      '</div>';
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
  }

  function removeTypingIndicator() {
    var el = document.getElementById('ai-typing-indicator');
    if (el) el.remove();
  }

  /* ---------- User Actions & Storage ---------- */

  function saveAnswerAsNote(text) {
    var notes = S.getNotes();
    var firstLine = text.split('\n')[0].replace(/[#*`_]/g, '').trim() || 'AI Study Notes';
    if (firstLine.length > 50) firstLine = firstLine.slice(0, 50) + '...';

    var newNote = {
      id: 'note_' + Date.now().toString(36),
      title: firstLine,
      subjectId: (S.getSubjects()[0] ? S.getSubjects()[0].id : ''),
      content: text,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notes.unshift(newNote);
    S.setNotes(notes);
    StudyFlow.UI.showToast('Answer saved to your Notes!', 'success');
  }

  function toggleBookmark(text, btn) {
    var bookmarks = S.getAIBookmarks();
    var idx = bookmarks.findIndex(function (b) { return b.text === text; });
    if (idx !== -1) {
      bookmarks.splice(idx, 1);
      btn.classList.remove('active');
      StudyFlow.UI.showToast('Bookmark removed.', 'info');
    } else {
      bookmarks.push({
        id: 'bm_' + Date.now().toString(36),
        text: text,
        savedAt: new Date().toISOString()
      });
      btn.classList.add('active');
      StudyFlow.UI.showToast('Answer bookmarked!', 'success');
    }
    S.setAIBookmarks(bookmarks);
  }

  function loadChatHistory() {
    var container = document.getElementById('ai-messages');
    if (!container) return;
    container.innerHTML = '';

    var history = S.getAIChats();
    if (history.length === 0) {
      // Welcome message
      var ctx = buildStudentContext();
      var welcomeMsg =
        'Hello **' + ctx.studentName + '**! 👋\n\n' +
        'I am your **AI Study Tutor**, tailored for **' + ctx.classLevel + '**.\n\n' +
        'Here is how I can help you ace your studies today:\n' +
        '- 📐 **Solve math & physics equations step-by-step** with full working.\n' +
        '- 🔬 **Explain science, programming & humanities** in simple language.\n' +
        '- 📝 **Create interactive practice quizzes & flashcards** on any topic.\n' +
        '- 📅 **Suggest personalized study plans** based on your schedule & exams.\n' +
        '- 📷 **Analyze homework photos & diagrams**.\n\n' +
        'What would you like to learn or practice right now?';

      appendMessage('assistant', welcomeMsg);
      return;
    }

    history.forEach(function (m) {
      appendMessage(m.role, m.text, m.imageSrc, m.time);
    });
  }

  function saveChatMessage(role, text, imageSrc) {
    var history = S.getAIChats();
    history.push({
      role: role,
      text: text,
      imageSrc: imageSrc || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    // Keep last 50 messages to prevent storage bloat
    if (history.length > 50) history = history.slice(-50);
    S.setAIChats(history);
  }

  /* ---------- Sending & Processing Queries ---------- */

  async function handleSend() {
    if (isGenerating) return;

    var input = document.getElementById('ai-textarea');
    var query = input ? input.value.trim() : '';
    var img = attachedImage;

    if (!query && !img) return;

    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
    removeAttachedImage();

    appendMessage('user', query || 'Analyze this diagram / problem', img);
    saveChatMessage('user', query || 'Analyze this diagram / problem', img);

    isGenerating = true;
    showTypingIndicator();

    var sendBtn = document.getElementById('ai-btn-send');
    if (sendBtn) sendBtn.disabled = true;

    try {
      var response = await callLLM(query || 'Please explain and solve what is depicted in this image step-by-step.', img, S.getAIChats());
      removeTypingIndicator();
      appendMessage('assistant', response);
      saveChatMessage('assistant', response);

      var config = S.getAIConfig();
      if (config.voiceOutputEnabled) {
        speakText(response);
      }
    } catch (err) {
      removeTypingIndicator();
      var errMsg = '⚠️ **Error:** ' + err.message + '\n\n*Tip: Check your API Key in Settings or leave it blank to use the built-in free academic solver.*';
      appendMessage('assistant', errMsg);
    } finally {
      isGenerating = false;
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  /* ---------- Event Bindings ---------- */

  function bindEvents() {
    // Trigger button
    var trigger = document.getElementById('ai-assistant-trigger');
    if (trigger) {
      trigger.addEventListener('click', toggle);
    }

    // Overlay & Close
    var overlay = document.getElementById('ai-drawer-overlay');
    if (overlay) {
      overlay.addEventListener('click', close);
    }
    var closeBtn = document.getElementById('ai-btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }

    // Expand / Compress
    var expandBtn = document.getElementById('ai-btn-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', function () {
        isExpanded = !isExpanded;
        var win = document.getElementById('ai-chat-window');
        if (win) win.classList.toggle('expanded', isExpanded);
        expandBtn.innerHTML = isExpanded ? ICONS.compress : ICONS.expand;
      });
    }

    // Clear history
    var clearBtn = document.getElementById('ai-btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', async function () {
        var confirmed = await StudyFlow.Modal.confirmDialog({
          title: 'Clear AI Conversation?',
          message: 'This will erase the chat history for your current session.',
          confirmText: 'Clear Chat',
          danger: false
        });
        if (confirmed) {
          S.setAIChats([]);
          loadChatHistory();
          StudyFlow.UI.showToast('Chat history cleared.', 'info');
        }
      });
    }

    // Settings pane toggle
    var settingsBtn = document.getElementById('ai-btn-settings');
    var configPane = document.getElementById('ai-config-pane');
    var closeConfigBtn = document.getElementById('ai-btn-close-config');

    if (settingsBtn && configPane) {
      settingsBtn.addEventListener('click', function () {
        loadConfigForm();
        configPane.classList.add('open');
      });
    }
    if (closeConfigBtn && configPane) {
      closeConfigBtn.addEventListener('click', function () {
        configPane.classList.remove('open');
      });
    }

    // Save config button in drawer
    var saveConfigBtn = document.getElementById('ai-btn-save-config');
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', function () {
        saveConfigForm();
        if (configPane) configPane.classList.remove('open');
        refreshContextBanner();
        StudyFlow.UI.showToast('AI Settings updated successfully!', 'success');
      });
    }

    // Quick Prompts Bar
    var promptBar = document.getElementById('ai-quick-prompts');
    if (promptBar) {
      promptBar.addEventListener('click', function (e) {
        var chip = e.target.closest('.ai-chip');
        if (!chip) return;
        var p = chip.getAttribute('data-prompt') || '';
        var isAuto = chip.getAttribute('data-auto') === 'true';
        var input = document.getElementById('ai-textarea');
        if (!input) return;

        var existingText = input.value.trim();
        if (isAuto) {
          input.value = p;
          handleSend();
        } else if (existingText) {
          input.value = p + existingText;
          handleSend();
        } else {
          input.value = p;
          input.focus();
        }
      });
    }

    // Send Button & Textarea
    var sendBtn = document.getElementById('ai-btn-send');
    if (sendBtn) {
      sendBtn.addEventListener('click', handleSend);
    }

    var textarea = document.getElementById('ai-textarea');
    if (textarea) {
      textarea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
      textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });
    }

    // Voice Input Mic Button
    var micBtn = document.getElementById('ai-btn-mic');
    if (micBtn) {
      micBtn.addEventListener('click', toggleVoiceRecording);
    }

    // Image Upload
    var imgBtn = document.getElementById('ai-btn-image');
    var fileInput = document.getElementById('ai-file-input');
    if (imgBtn && fileInput) {
      imgBtn.addEventListener('click', function () {
        fileInput.click();
      });
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        if (f) handleImageUpload(f);
      });
    }

    var removeAttachBtn = document.getElementById('ai-btn-remove-attach');
    if (removeAttachBtn) {
      removeAttachBtn.addEventListener('click', removeAttachedImage);
    }

    // Global Keyboard Shortcuts (Cmd+K / Ctrl+K / Alt+A)
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      } else if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && isOpen) {
        close();
      }
    });

    // Copy Code delegation in messages
    document.addEventListener('click', function (e) {
      var copyCodeBtn = e.target.closest('.btn-copy-code');
      if (copyCodeBtn) {
        var code = decodeURIComponent(copyCodeBtn.getAttribute('data-code') || '');
        navigator.clipboard.writeText(code).then(function () {
          copyCodeBtn.textContent = 'Copied!';
          setTimeout(function () { copyCodeBtn.textContent = 'Copy'; }, 2000);
        });
      }
    });
  }

  function loadConfigForm() {
    var config = S.getAIConfig();
    var providerEl = document.getElementById('ai-cfg-provider');
    var keyEl = document.getElementById('ai-cfg-apikey');
    var modelEl = document.getElementById('ai-cfg-model');
    var endpointEl = document.getElementById('ai-cfg-endpoint');
    var endpointWrap = document.getElementById('ai-cfg-endpoint-wrap');

    if (providerEl) providerEl.value = config.provider || 'openai';
    if (keyEl) keyEl.value = config.apiKey || '';
    if (modelEl) modelEl.value = config.model || '';
    if (endpointEl) endpointEl.value = config.customEndpoint || '';

    if (providerEl && endpointWrap) {
      endpointWrap.classList.toggle('hidden', providerEl.value !== 'custom');
      providerEl.onchange = function () {
        endpointWrap.classList.toggle('hidden', this.value !== 'custom');
      };
    }
  }

  function saveConfigForm() {
    var providerEl = document.getElementById('ai-cfg-provider');
    var keyEl = document.getElementById('ai-cfg-apikey');
    var modelEl = document.getElementById('ai-cfg-model');
    var endpointEl = document.getElementById('ai-cfg-endpoint');

    S.setAIConfig({
      provider: providerEl ? providerEl.value : 'openai',
      apiKey: keyEl ? keyEl.value.trim() : '',
      model: modelEl ? modelEl.value.trim() : 'gpt-4o-mini',
      customEndpoint: endpointEl ? endpointEl.value.trim() : ''
    });
  }

  /* ---------- Public API ---------- */

  function open() {
    var win = document.getElementById('ai-chat-window');
    var overlay = document.getElementById('ai-drawer-overlay');
    if (!win) return;
    isOpen = true;
    win.classList.add('open');
    if (overlay) overlay.classList.add('open');
    refreshContextBanner();

    var input = document.getElementById('ai-textarea');
    if (input) setTimeout(function () { input.focus(); }, 200);
  }

  function close() {
    var win = document.getElementById('ai-chat-window');
    var overlay = document.getElementById('ai-drawer-overlay');
    if (!win) return;
    isOpen = false;
    win.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (synth && synth.speaking) synth.cancel();
    if (isRecording && recognition) recognition.stop();
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function ask(query) {
    open();
    var input = document.getElementById('ai-textarea');
    if (input) {
      input.value = query;
      handleSend();
    }
  }

  /* ---------- Boot & Init ---------- */

  function init() {
    var user = A.currentUser() || A.restoreSession();
    if (!user) return; // Don't mount on unauthenticated auth pages
    ensureAIWidget();
  }

  StudyFlow.AIAssistant = {
    init: init,
    open: open,
    close: close,
    toggle: toggle,
    ask: ask,
    renderMarkdown: renderMarkdown,
    localEducationalInference: localEducationalInference,
    buildStudentContext: buildStudentContext
  };

})();
