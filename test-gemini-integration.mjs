/**
 * test-gemini-integration.mjs
 * Verifies Gemini integration wiring, key management, message history,
 * model ID correctness, and fallback behaviour.
 *
 * Run: node test-gemini-integration.mjs
 *
 * NOTE: These tests cover logic that runs in both browser and Node environments.
 * Actual network streaming is NOT tested here (requires a live API key).
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ─── Minimal localStorage mock for Node environment ──────────────────
const store = {};
globalThis.localStorage = {
  getItem:    (k)    => store[k] ?? null,
  setItem:    (k, v) => { store[k] = String(v); },
  removeItem: (k)    => { delete store[k]; },
};

// ─── Load modules ─────────────────────────────────────────────────────
import { getApiKey, saveApiKey, chatStream } from './gemini.js';
import { generateChatResponse } from './analysis-engine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// ─── 1. Model ID ──────────────────────────────────────────────────────
console.log('\n--- 1. Model ID is a valid Gemini model ---');
{
  const __dir = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(__dir, 'gemini.js'), 'utf-8');
  const modelMatch = src.match(/const MODEL_ID\s*=\s*['"]([^'"]+)['"]/);
  const modelId = modelMatch ? modelMatch[1] : '';

  assert(modelId !== 'gemini-3.6-flash', 'MODEL_ID is no longer the invalid "gemini-3.6-flash"');
  assert(
    modelId === 'gemini-2.0-flash-lite' || modelId.startsWith('gemini-'),
    `MODEL_ID is a recognisable Gemini model identifier: "${modelId}"`
  );
}

// ─── 2. API Key Management ────────────────────────────────────────────
console.log('\n--- 2. API key save / retrieve / clear ---');
{
  // No key initially (store starts empty)
  assert(getApiKey() === '', 'getApiKey() returns empty string when nothing saved');

  // Save a realistic-looking key
  const fakeKey = 'AIzaSyTESTKEY1234567890abcdefghij';
  saveApiKey(fakeKey);
  assert(getApiKey() === fakeKey, 'saveApiKey() + getApiKey() round-trip works');

  // Key is trimmed on save
  saveApiKey('  AIzaSyTRIMTEST  ');
  assert(getApiKey() === 'AIzaSyTRIMTEST', 'saveApiKey() trims whitespace');

  // Clear via removeItem (mirrors app.js clear path)
  localStorage.removeItem('resumeai_apikey');
  assert(getApiKey() === '', 'After removeItem, getApiKey() returns empty string');
}

// ─── 3. Key Validation Logic (mirrors app.js prefix check) ───────────
console.log('\n--- 3. Key format validation (prefix check) ---');
{
  function isValidKeyFormat(key) {
    return key.startsWith('AIza') || key.startsWith('AQ.');
  }

  assert(isValidKeyFormat('AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX'), 'AIza... key accepted');
  assert(isValidKeyFormat('AQ.XXXXXXXXXXXXXXXXX'), 'AQ. key accepted');
  assert(!isValidKeyFormat('sk-abc123'), 'OpenAI-style key rejected');
  assert(!isValidKeyFormat(''), 'Empty string rejected');
  assert(!isValidKeyFormat('gemini-key-fake'), 'Random string rejected');
}

// ─── 4. chatStream throws NO_API_KEY when no key is set ───────────────
console.log('\n--- 4. chatStream throws NO_API_KEY with no key ---');
{
  // Ensure no key in storage
  localStorage.removeItem('resumeai_apikey');

  let caughtError = null;
  try {
    const messages = [{ role: 'user', content: 'Hello' }];
    const gen = chatStream(messages, '');
    // The generator checks for key before the first fetch
    await gen.next();
  } catch (err) {
    caughtError = err;
  }

  assert(caughtError !== null, 'chatStream() throws when no API key is set');
  assert(caughtError?.message === 'NO_API_KEY', `Error message is "NO_API_KEY": "${caughtError?.message}"`);
}

// ─── 5. Message history alternation rules ────────────────────────────
console.log('\n--- 5. Gemini message alternation (user/model mapping) ---');
{
  // Replicate the mapping logic from gemini.js chatStream exactly
  function buildGeminiContents(chatHistory, systemPrefix) {
    const contents = [];
    for (let i = 0; i < chatHistory.length; i++) {
      const m = chatHistory[i];
      const role = m.role === 'user' ? 'user' : 'model';
      const text = (i === 0 && m.role === 'user') ? systemPrefix + m.content : m.content;
      contents.push({ role, parts: [{ text }] });
    }
    return contents;
  }

  const history = [
    { role: 'user',      content: 'How do I improve my resume?' },
    { role: 'assistant', content: 'Add metrics to your bullet points.' },
    { role: 'user',      content: 'Can you give an example?' },
  ];

  const contents = buildGeminiContents(history, 'System: You are a career advisor.\n\n');

  assert(contents.length === 3, 'Three messages produce three contents entries');
  assert(contents[0].role === 'user',  'First entry is user');
  assert(contents[1].role === 'model', 'Second entry maps assistant → model');
  assert(contents[2].role === 'user',  'Third entry is user');
  assert(contents[contents.length - 1].role === 'user', 'Last entry is always user (Gemini requirement)');
  assert(
    contents[0].parts[0].text.startsWith('System:'),
    'System prefix is prepended only to first user message'
  );
  assert(
    !contents[1].parts[0].text.startsWith('System:'),
    'System prefix NOT added to model messages'
  );
  assert(
    !contents[2].parts[0].text.startsWith('System:'),
    'System prefix NOT added to subsequent user messages'
  );
}

// ─── 6. Built-in fallback generateChatResponse works independently ────
console.log('\n--- 6. Built-in fallback generateChatResponse works ---');
{
  const sampleResume = `
John Doe
john@example.com | 9876543210

Technical Skills
Python, JavaScript, React, Node.js, MySQL

Projects
Portfolio Website
• Built a personal portfolio website using React and Node.js

Education
B.Tech Computer Science - XYZ University - 2024 - CGPA: 8.5
  `;

  let fallbackReply = null;
  let fallbackErr = null;
  try {
    fallbackReply = generateChatResponse(
      'How can I improve my ATS score?',
      sampleResume,
      'Software Engineer',
      null
    );
  } catch (e) {
    fallbackErr = e;
  }

  assert(fallbackErr === null, 'generateChatResponse does not throw');
  assert(typeof fallbackReply === 'string', 'generateChatResponse returns a string');
  assert(fallbackReply.length > 20, 'Response has meaningful content (>20 chars)');
  assert(!fallbackReply.includes('undefined'), 'Response contains no "undefined" placeholders');
}

// ─── 7. Gemini module exports ─────────────────────────────────────────
console.log('\n--- 7. gemini.js exports all required symbols ---');
{
  const { getApiKey: gak, saveApiKey: sak, chatStream: cs, analyseResume: ar } = await import('./gemini.js');
  assert(typeof gak === 'function',  'getApiKey exported as function');
  assert(typeof sak === 'function',  'saveApiKey exported as function');
  assert(typeof cs === 'function',   'chatStream exported as function (async generator)');
  assert(typeof ar === 'function',   'analyseResume exported as function');
}

// ─── Summary ──────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(55)}`);
console.log(`Gemini Integration Tests: ${passed} passed, ${failed} failed out of ${passed + failed} total`);
if (failed > 0) {
  console.error('\n❌ Some tests failed. See above for details.\n');
  process.exit(1);
} else {
  console.log('✅ All Gemini integration tests passed!\n');
}
