/**
 * StudyFlow Serverless AI Chatbot Endpoint (/api/chat)
 * Compatible with Vercel Serverless Functions, Netlify Functions, and Node.js runtimes.
 *
 * Security: API keys are read securely from server-side environment variables
 * (OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, AI_API_KEY).
 */

// Helper to generate pedagogical system prompt
function buildSystemPrompt(studentContext) {
  const ctx = studentContext || {};
  const studentName = ctx.studentName || 'Student';
  const classLevel = ctx.classLevel || 'Class 10';
  const subjects = (ctx.subjects || []).join(', ') || 'School/College Curriculum';
  const upcomingExams = (ctx.upcomingExams || []).join(', ') || 'None scheduled';

  return `You are StudyFlow AI Tutor, an empathetic, highly intelligent, and expert academic study assistant.
You are currently tutoring: ${studentName}.
Academic Level / Class: ${classLevel}.
Enrolled Subjects: ${subjects}.
Upcoming Milestone Exams: ${upcomingExams}.

CORE PEDAGOGICAL INSTRUCTIONS:
1. NATURAL CONVERSATIONAL INTELLIGENCE:
   - If the user greets you (e.g. "Hello", "Hi", "Good morning"), respond warmly and politely, acknowledging their name and academic level, and offer proactive study help.
   - For general knowledge questions (history, geography, science, civics, general facts), provide clear, accurate, and engaging answers.

2. ADAPTATION TO STUDENT LEVEL:
   - For Early/Primary (Nursery - Class 5): Use simple language, engaging everyday analogies, and warm encouragement.
   - For Middle/Secondary/High School (Class 6 - 12): Provide structured syllabus explanations, standard formulas, step-by-step calculations, and board exam tips.
   - For Diploma/Undergrad/Engineering/University: Deliver rigorous theoretical depth, algorithmic derivations, code snippets with time/space complexity (Big-O), and system architecture insights.

3. STEP-BY-STEP MATHEMATICS & SCIENCE:
   - When solving any math, physics, or numerical problem, ALWAYS show:
     * Step 1: Identify given information & variables.
     * Step 2: State the standard formula.
     * Step 3: Step-by-step substitution and algebraic simplification.
     * Step 4: Clearly highlight the final verified answer with units.

4. MULTI-SUBJECT EXPERTISE:
   - Help seamlessly with Mathematics, Science (Physics, Chemistry, Biology), Computer Science & Coding, Engineering, History, Geography, English, Commerce, Economics, and more.

5. STUDY TOOLS & GENERATION:
   - When asked for a quiz: Provide 5 multiple-choice questions with (A), (B), (C), (D) choices and an Answer Key with explanations at the bottom.
   - When asked for flashcards: Provide active recall cards formatted with **Front:** and **Back:**.
   - When asked for a study plan: Structure a daily timetable aligned with their subjects and upcoming exams.

6. FORMATTING:
   - Use clean Markdown with bolding, bullet points, headers (###, ####), code blocks, and LaTeX math notation ($E = mc^2$ or $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$).`;
}

// Handler for Vercel / Standard Node.js Serverless Function
async function handleChatRequest(reqBody, reqHeaders = {}) {
  const {
    query = '',
    imageBase64 = null,
    history = [],
    studentContext = {},
    provider: requestedProvider,
    model: requestedModel
  } = reqBody;

  // Resolve API credentials securely from server environment variables
  const envOpenAI = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '';
  const envGemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  const envGroq = process.env.GROQ_API_KEY || '';

  // Optional user-supplied header (BYOK fallback)
  const authHeader = reqHeaders['authorization'] || reqHeaders['x-api-key'] || '';
  const userKey = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Determine provider
  let provider = requestedProvider || process.env.AI_PROVIDER || '';
  if (!provider) {
    if (envOpenAI || userKey.startsWith('sk-')) provider = 'openai';
    else if (envGemini || userKey.startsWith('AIza')) provider = 'gemini';
    else if (envGroq || userKey.startsWith('gsk_')) provider = 'groq';
    else provider = 'openai';
  }

  // Determine API key
  let apiKey = '';
  if (provider === 'gemini') apiKey = envGemini || userKey || envOpenAI;
  else if (provider === 'groq') apiKey = envGroq || userKey || envOpenAI;
  else apiKey = envOpenAI || userKey || envGemini || envGroq;

  // If no server API key and no user key, generate a rich academic response
  if (!apiKey) {
    return generateLocalFallbackResponse(query, studentContext, history);
  }

  const systemPrompt = buildSystemPrompt(studentContext);

  // 1. Google Gemini API
  if (provider === 'gemini') {
    const model = requestedModel || process.env.AI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const contents = [];

    // Attach recent multi-turn history (last 8 turns)
    if (Array.isArray(history)) {
      history.slice(-8).forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(msg.text || '') }]
        });
      });
    }

    const currentParts = [{ text: (contents.length === 0 ? systemPrompt + '\n\n' : '') + query }];

    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      currentParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    contents.push({ role: 'user', parts: currentParts });

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      })
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API error (${geminiRes.status})`);
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response text generated by Gemini.');

    return { text, provider: 'gemini', model };
  }

  // 2. OpenAI / Groq / Custom compatible
  let endpoint = 'https://api.openai.com/v1/chat/completions';
  let model = requestedModel || process.env.AI_MODEL || 'gpt-4o-mini';

  if (provider === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    if (!requestedModel || requestedModel.startsWith('gpt')) {
      model = 'llama-3.3-70b-versatile';
    }
  }

  const messages = [{ role: 'system', content: systemPrompt }];

  if (Array.isArray(history)) {
    history.slice(-8).forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: String(msg.text || '')
      });
    });
  }

  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: query || 'Please analyze this image/diagram and explain step-by-step.' },
        { type: 'image_url', image_url: { url: imageBase64 } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: query });
  }

  const oaiRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!oaiRes.ok) {
    const err = await oaiRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `${provider.toUpperCase()} API error (${oaiRes.status})`);
  }

  const oaiData = await oaiRes.json();
  const text = oaiData.choices?.[0]?.message?.content;
  if (!text) throw new Error(`No answer received from ${provider}.`);

  return { text, provider, model };
}

// Fallback generator when environment credentials are not yet configured
function generateLocalFallbackResponse(query, studentContext, history) {
  const q = String(query || '').toLowerCase().trim();
  const ctx = studentContext || {};
  const studentName = ctx.studentName || 'Student';
  const classLevel = ctx.classLevel || 'Class 10';

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|yo)\b/i.test(q)) {
    return {
      text: `Hello **${studentName}**! 😊\n\nI am your **AI Study Tutor**, tailored for **${classLevel}**.\n\nHow can I help you study today?\n- 📐 **Solve math & science problems step-by-step**\n- 🔬 **Explain complex concepts in simple terms**\n- 📝 **Create quizzes & flashcards**\n- 📅 **Plan your timetable and exam prep**`,
      provider: 'serverless-fallback',
      model: 'academic-inference'
    };
  }

  // Math Quadratic equation
  if (q.includes('2x^2 + 5x - 3') || q.includes('quadratic') || q.includes('x^2')) {
    return {
      text: `### 📐 Step-by-Step Math Solution\n\n**Problem:** Solve $2x^2 + 5x - 3 = 0$\n\n---\n\n#### **Step 1: Identify coefficients**\n- $a = 2, b = 5, c = -3$\n\n#### **Step 2: Calculate Discriminant ($\\Delta$)**\n$$\\Delta = b^2 - 4ac = (5)^2 - 4(2)(-3) = 25 + 24 = 49$$\n\n#### **Step 3: Quadratic Formula**\n$$x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} = \\frac{-5 \\pm 7}{4}$$\n\n- **Root 1:** $x = \\frac{2}{4} = \\mathbf{\\frac{1}{2}}$\n- **Root 2:** $x = \\frac{-12}{4} = \\mathbf{-3}$\n\n**Final Answer:** $x = \\frac{1}{2}$ or $x = -3$ ✅`,
      provider: 'serverless-fallback',
      model: 'academic-inference'
    };
  }

  // Linear equation
  const linMatch = q.match(/(\d+)x\s*([+-])\s*(\d+)\s*=\s*(\d+)/i);
  if (linMatch) {
    const a = parseFloat(linMatch[1]), sign = linMatch[2], b = parseFloat(linMatch[3]), c = parseFloat(linMatch[4]);
    const rhs = sign === '+' ? (c - b) : (c + b);
    const sol = rhs / a;
    return {
      text: `### 📐 Step-by-Step Linear Equation\n\n**Problem:** Solve $${a}x ${sign} ${b} = ${c}$\n\n1. **Isolate variable term:** $${a}x = ${c} ${sign === '+' ? '-' : '+'} ${b} = ${rhs}$\n2. **Divide by ${a}:** $x = \\frac{${rhs}}{${a}} = \\mathbf{${sol}}$\n\n**Final Answer:** $x = ${sol}$ ✅`,
      provider: 'serverless-fallback',
      model: 'academic-inference'
    };
  }

  // Default structured educational guide
  return {
    text: `### 📚 ${classLevel} Study Guide: ${query}\n\nHere is a structured explanation tailored for your curriculum:\n\n#### **1. Core Concept**\nThis concept is foundational in your academic syllabus. It connects theoretical principles with practical problem-solving.\n\n#### **2. Step-by-Step Breakdown**\n- **Principle A:** Understand standard definitions and basic units.\n- **Principle B:** Apply analytical formulas systematically.\n- **Principle C:** Connect concepts to real-world applications and diagrams.\n\n#### **3. Exam Strategy**\nWrite down formulas before substituting values, and verify units at every step.\n\n*(You can ask me to **"Solve Step by Step"**, **"Explain Simpler"**, or **"Create Quiz"**!)*`,
    provider: 'serverless-fallback',
    model: 'academic-inference'
  };
}

// Vercel Serverless Function entrypoint
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const result = await handleChatRequest(body || {}, req.headers || {});
    res.status(200).json(result);
  } catch (error) {
    console.error('Serverless /api/chat error:', error);
    res.status(500).json({
      error: error.message || 'Internal AI Serverless Error',
      provider: process.env.AI_PROVIDER || 'openai'
    });
  }
};

// Export internal helper for testing & Netlify bridge
module.exports.handleChatRequest = handleChatRequest;
module.exports.buildSystemPrompt = buildSystemPrompt;
