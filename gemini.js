/**
 * gemini.js — Google Gemini API wrapper
 * Fixed: chat conversation structure + retry logic
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL_ID = 'gemini-3.6-flash';
const MAX_RETRIES = 4;

// Exponential backoff retry for 503/429 overload errors
async function fetchWithRetry(url, options, attempt = 0) {
  const res = await fetch(url, options);
  if ((res.status === 503 || res.status === 429) && attempt < MAX_RETRIES) {
    const delay = Math.pow(2, attempt + 1) * 1000;
    await new Promise((r) => setTimeout(r, delay));
    return fetchWithRetry(url, options, attempt + 1);
  }
  return res;
}

// ─── API Key Management ───────────────────────────────────
export function getApiKey() {
  return localStorage.getItem('resumeai_apikey') || '';
}

export function saveApiKey(key) {
  localStorage.setItem('resumeai_apikey', key.trim());
}

// ─── Resume Analysis ─────────────────────────────────────
export async function analyseResume(resumeText, targetRole = '') {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const roleContext = targetRole
    ? `The candidate is targeting the role of: "${targetRole}".`
    : 'No specific target role was provided — give general best-practice feedback.';

  const prompt = `You are an expert resume coach and HR specialist with 15+ years of experience reviewing thousands of resumes. Analyse the resume below and respond ONLY with a valid JSON object (no markdown, no code fences, no extra text).

${roleContext}

RESUME:
"""
${resumeText.slice(0, 12000)}
"""

Respond with this exact JSON schema:
{
  "overallScore": <integer 0-100>,
  "grade": "<A+ | A | B+ | B | C+ | C | D | F>",
  "summary": "<2-sentence honest overall assessment>",
  "sectionScores": {
    "contactInfo": <integer 0-100>,
    "professionalSummary": <integer 0-100>,
    "workExperience": <integer 0-100>,
    "skills": <integer 0-100>,
    "education": <integer 0-100>,
    "certifications": <integer 0-100>,
    "projects": <integer 0-100>
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "missingSections": ["<section name>", ...],
  "weaknesses": [
    { "text": "<weakness description>", "severity": "<high|medium|low>" },
    ...
  ],
  "atsCompatibility": {
    "score": "<Good|Fair|Poor>",
    "issues": ["<issue 1>", "<issue 2>", ...]
  },
  "recommendedKeywords": ["<keyword 1>", "<keyword 2>", ...],
  "keywordsContext": "<1 sentence explaining why these keywords matter>",
  "actionPlan": [
    "<specific, actionable step 1>",
    "<specific, actionable step 2>",
    "<specific, actionable step 3>",
    "<specific, actionable step 4>",
    "<specific, actionable step 5>"
  ]
}

Rules:
- Be honest and specific.
- missingSections: only list truly missing or extremely weak sections.
- weaknesses: 3-6 items ordered by severity descending.
- recommendedKeywords: 8-16 industry-relevant keywords.
- actionPlan: concrete, prioritised (most impactful first).`;

  const res = await fetchWithRetry(
    `${GEMINI_API_BASE}/models/${MODEL_ID}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `API error ${res.status}`;
    if (res.status === 400 && msg.includes('API key')) throw new Error('INVALID_API_KEY');
    throw new Error(msg);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!rawText) throw new Error('Empty response from Gemini.');

  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response. Please try again.');
  }
}

// ─── Chat (streaming) — FIXED conversation structure ─────
export async function* chatStream(messages, resumeContext = '') {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const systemPrefix = resumeContext
    ? `You are an expert resume coach. The user has shared their resume below for context. Use it to give highly personalised, specific advice. Be concise but thorough. Use bullet points when helpful.\n\nRESUME CONTEXT:\n"""\n${resumeContext.slice(0, 8000)}\n"""\n\n`
    : `You are an expert resume coach and career advisor. Give professional, actionable, specific advice about resumes and careers. Be concise and encouraging.\n\n`;

  // Build properly alternating user/model turns
  // Gemini REQUIRES: alternating user/model, starting AND ending with user
  const contents = [];

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const role = m.role === 'user' ? 'user' : 'model';
    // Prepend system context only to the very first user message
    const text = (i === 0 && m.role === 'user')
      ? systemPrefix + m.content
      : m.content;
    contents.push({ role, parts: [{ text }] });
  }

  // Safety check: last message must be from user
  if (!contents.length || contents[contents.length - 1].role !== 'user') {
    throw new Error('Invalid conversation state — last message must be from user.');
  }

  const res = await fetchWithRetry(
    `${GEMINI_API_BASE}/models/${MODEL_ID}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Chat error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;
      try {
        const chunk = JSON.parse(jsonStr);
        const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch { /* skip malformed chunk */ }
    }
  }
}
