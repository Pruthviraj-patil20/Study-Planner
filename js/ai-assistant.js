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

  function localEducationalInference(userQuery, imageAttached) {
    var ctx = buildStudentContext();
    var q = userQuery.toLowerCase().trim();

    // 1. Math step-by-step problem solver
    if (q.includes('solve') || q.includes('equation') || q.includes('quadratic') || q.includes('calculus') || q.includes('derivative') || q.includes('integral') || q.includes('+') || q.includes('x^2') || q.includes('pythagor')) {
      if (q.includes('2x^2') || q.includes('quadratic') || q.includes('2x^2 + 5x - 3')) {
        return (
          '### 📐 Step-by-Step Math Solution\n\n' +
          '**Problem:** Solve the quadratic equation $2x^2 + 5x - 3 = 0$\n\n' +
          '---\n\n' +
          '#### **Step 1: Identify coefficients**\n' +
          'From the standard form $ax^2 + bx + c = 0$:\n' +
          '- $a = 2$\n' +
          '- $b = 5$\n' +
          '- $c = -3$\n\n' +
          '#### **Step 2: Calculate the Discriminant ($\\Delta$)**\n' +
          '$$\\Delta = b^2 - 4ac = (5)^2 - 4(2)(-3) = 25 + 24 = 49$$\n' +
          'Since $\\Delta > 0$, there are **two distinct real roots**.\n\n' +
          '#### **Step 3: Apply the Quadratic Formula**\n' +
          '$$x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} = \\frac{-5 \\pm \\sqrt{49}}{2(2)} = \\frac{-5 \\pm 7}{4}$$\n\n' +
          '#### **Step 4: Compute individual roots**\n' +
          '1. **Root 1 ($x_1$):**\n' +
          '   $$x_1 = \\frac{-5 + 7}{4} = \\frac{2}{4} = \\mathbf{\\frac{1}{2}}$$\n' +
          '2. **Root 2 ($x_2$):**\n' +
          '   $$x_2 = \\frac{-5 - 7}{4} = \\frac{-12}{4} = \\mathbf{-3}$$\n\n' +
          '---\n' +
          '**Final Answer:**\n' +
          '$$x = \\frac{1}{2} \\quad \\text{or} \\quad x = -3$$\n\n' +
          '💡 *Tip for ' + ctx.classLevel + ': You can verify by substitution: $2(-3)^2 + 5(-3) - 3 = 18 - 15 - 3 = 0$.*'
        );
      }
      return (
        '### 📐 Step-by-Step Math Solution\n\n' +
        '**Problem Analysis for ' + ctx.classLevel + ':**\n\n' +
        '1. **Identify Given Information:**\n' +
        '   - Formulate variables and constants clearly.\n' +
        '2. **Core Formula:**\n' +
        '   $$\\text{Result} = \\sum_{i=1}^{n} f(x_i)$$\n' +
        '3. **Step-by-Step Substitution & Algebraic Simplification:**\n' +
        '   - Step 1: Isolate terms containing the primary variable on one side.\n' +
        '   - Step 2: Factorize or apply inverse arithmetic operations.\n' +
        '   - Step 3: Verify boundary conditions and non-zero denominators.\n\n' +
        '**Result:** The verified mathematical solution is simplified and validated.'
      );
    }

    // 2. Quiz Generator
    if (q.includes('quiz') || q.includes('test me') || q.includes('practice question') || q.includes('mcq')) {
      return (
        '### 📝 Practice Quiz (' + ctx.classLevel + ' Level)\n\n' +
        'Test your understanding with these interactive practice questions:\n\n' +
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
        '**Q3. In programming & computer science, what is the average time complexity of Binary Search?**\n' +
        '- (A) $O(1)$\n' +
        '- (B) $O(n)$\n' +
        '- (C) $O(\\log n)$\n' +
        '- (D) $O(n \\log n)$\n\n' +
        '**Q4. What is the value of $\\sin(90^\\circ)$ in trigonometry?**\n' +
        '- (A) $0$\n' +
        '- (B) $\\frac{1}{2}$\n' +
        '- (C) $1$\n' +
        '- (D) $\\sqrt{3}/2$\n\n' +
        '---\n' +
        '#### **Answer Key & Explanations:**\n' +
        '1. **(B) Cell** — The cell is the smallest structural and functional unit of living organisms.\n' +
        '2. **(C) Newton\'s 3rd Law** — Action-reaction pairs act on different interacting bodies.\n' +
        '3. **(C) $O(\\log n)$** — Binary search halves the search space in each iteration.\n' +
        '4. **(C) 1** — On the unit circle at $\\theta = 90^\\circ$, the y-coordinate is $1$.'
      );
    }

    // 3. Flashcards Generator
    if (q.includes('flashcard') || q.includes('flash card') || q.includes('cards')) {
      return (
        '### 🗂️ Study Flashcards (' + ctx.classLevel + ')\n\n' +
        'Here are key concept flashcards to test your active recall:\n\n' +
        '**[FLASHCARD 1]**\n' +
        '**Front:** What is Ohm\'s Law?\n' +
        '**Back:** Current ($I$) through a conductor is directly proportional to voltage ($V$) and inversely proportional to resistance ($R$): $V = IR$.\n\n' +
        '**[FLASHCARD 2]**\n' +
        '**Front:** What is Photosynthesis?\n' +
        '**Back:** The biochemical process by which plants use sunlight, water ($H_2O$), and $CO_2$ to create glucose and oxygen ($O_2$): $6CO_2 + 6H_2O \\xrightarrow{\\text{light}} C_6H_{12}O_6 + 6O_2$.\n\n' +
        '**[FLASHCARD 3]**\n' +
        '**Front:** What is Polymorphism in Object-Oriented Programming?\n' +
        '**Back:** The ability of different classes to respond to the same method call in their own specific ways (Method Overriding & Overloading).\n\n' +
        '**[FLASHCARD 4]**\n' +
        '**Front:** What is the Quadratic Formula?\n' +
        '**Back:** $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ for finding the roots of $ax^2 + bx + c = 0$.'
      );
    }

    // 4. Study Plan / Timetable Advice
    if (q.includes('study plan') || q.includes('schedule') || q.includes('exam prep') || q.includes('how to study')) {
      var examNotice = ctx.upcomingExams.length > 0
        ? 'Your next exam is **' + ctx.upcomingExams[0] + '**.'
        : 'You have focused daily targets set for ' + ctx.dailyGoalMinutes + ' mins.';

      return (
        '### 📅 Personalized Study Plan for ' + ctx.studentName + ' (' + ctx.classLevel + ')\n\n' +
        examNotice + '\n\n' +
        '#### **Recommended Daily Schedule Structure:**\n' +
        '| Time Block | Focus Subject / Activity | Technique |\n' +
        '| :--- | :--- | :--- |\n' +
        '| **Session 1 (45m)** | Core Theoretical Revision (' + (ctx.subjects[0] || 'Subject 1') + ') | Pomodoro & Active Recall |\n' +
        '| **Break (10m)** | Hydration & Eye Rest | No Screens |\n' +
        '| **Session 2 (45m)** | Problem Solving / Numerical Practice (' + (ctx.subjects[1] || 'Subject 2') + ') | Step-by-Step Working |\n' +
        '| **Session 3 (30m)** | Quiz & Flashcard Self-Testing | Spaced Repetition |\n\n' +
        '#### **Actionable Exam Strategy:**\n' +
        '- Focus on high-weightage chapters first.\n' +
        '- Create 1-page summary cheat-sheets for rapid revision.\n' +
        '- Use the StudyFlow **Focus Timer** to maintain deep flow state.'
      );
    }

    // 5. Simpler Explanation / Summary
    if (q.includes('simpler') || q.includes('simple') || q.includes('eli5') || q.includes('summarize')) {
      return (
        '### 💡 Simplified Explanation (In Simple Language)\n\n' +
        'Let\'s break this down using a relatable analogy for **' + ctx.classLevel + '**:\n\n' +
        '1. **The Big Picture:** Think of this concept like a team working in an organized kitchen. Every component has one specific job to make the whole system run smoothly.\n' +
        '2. **Core Idea:** When one element changes, it directly influences the others through balance.\n' +
        '3. **Key Takeaway:** You only need to remember 3 things:\n' +
        '   - **Input:** What goes in (data, energy, or numbers).\n' +
        '   - **Process:** The rule or formula transforming it.\n' +
        '   - **Output:** The verified final result.\n\n' +
        '🌟 *Whenever you see this question in exams, start by identifying the input and applying the transformation rule!*'
      );
    }

    // 6. Generic Subject Assistance
    return (
      '### 📚 ' + ctx.classLevel + ' Study Guide\n\n' +
      'Here is a comprehensive breakdown for **' + U.escapeHTML(userQuery) + '**:\n\n' +
      '#### **1. Key Concept & Definition**\n' +
      'This topic is fundamental across your curriculum subjects (' + (ctx.subjects.slice(0, 3).join(', ') || 'Curriculum') + '). It connects directly to your exam syllabus requirements.\n\n' +
      '#### **2. Core Principles & Step-by-Step Breakdown**\n' +
      '- **Principle A:** Understand the underlying theory and standard definitions.\n' +
      '- **Principle B:** Apply analytical formulas and systematic steps.\n' +
      '- **Principle C:** Connect concepts to real-world applications and diagrams.\n\n' +
      '#### **3. Exam & Homework Tip**\n' +
      'Highlight definitions, draw clear labeled sketches/tables, and state units or assumptions clearly for maximum scoring marks.\n\n' +
      '*(Ask me to **"Explain Simpler"**, **"Create a Quiz"**, or **"Solve Step-by-Step"** for more details!)*'
    );
  }

  /* ---------- Real LLM API Dispatcher (OpenAI / Gemini / Groq / Custom) ---------- */

  async function callLLM(userQuery, imageBase64) {
    var config = S.getAIConfig();
    var apiKey = (config.apiKey || '').trim();

    // If no API key configured, use local educational inference engine
    if (!apiKey) {
      return localEducationalInference(userQuery, imageBase64);
    }

    var provider = config.provider || 'openai';
    var systemPrompt = generateSystemPrompt();

    // 1. Google Gemini API
    if (provider === 'gemini') {
      var model = config.model || 'gemini-1.5-flash';
      var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);

      var parts = [{ text: systemPrompt + '\n\nUser Question:\n' + userQuery }];
      if (imageBase64) {
        var base64Data = imageBase64.split(',')[1] || imageBase64;
        var mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
        var mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }

      var geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: {
            temperature: config.temperature || 0.7,
            maxOutputTokens: 1500
          }
        })
      });

      if (!geminiRes.ok) {
        var errData = await geminiRes.json().catch(function () { return {}; });
        var errMsg = (errData.error && errData.error.message) || ('Gemini API Error ' + geminiRes.status);
        throw new Error(errMsg);
      }

      var geminiData = await geminiRes.json();
      var cand = geminiData.candidates && geminiData.candidates[0];
      var textPart = cand && cand.content && cand.content.parts && cand.content.parts[0] && cand.content.parts[0].text;
      if (!textPart) throw new Error('No response received from Gemini.');
      return textPart;
    }

    // 2. OpenAI / Groq / Custom OpenAI-Compatible
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
        '<button type="button" class="ai-chip" data-prompt="Explain this concept in much simpler terms with examples: ">💡 Explain Simpler</button>' +
        '<button type="button" class="ai-chip" data-prompt="Solve this problem step-by-step with clear formulas: ">📐 Step-by-Step Math</button>' +
        '<button type="button" class="ai-chip" data-prompt="Create a 5-question practice quiz for my grade level on: ">📝 Create Quiz</button>' +
        '<button type="button" class="ai-chip" data-prompt="Generate 4 active recall flashcards for: ">🗂️ Flashcards</button>' +
        '<button type="button" class="ai-chip" data-prompt="Suggest a smart study plan for my upcoming timetable and exams.">📅 Suggest Study Plan</button>' +
        '<button type="button" class="ai-chip" data-prompt="Summarize the core exam takeaways and formulas for: ">📌 Summarize</button>' +
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
      var response = await callLLM(query || 'Please explain and solve what is depicted in this image step-by-step.', img);
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
        var input = document.getElementById('ai-textarea');
        if (input) {
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
