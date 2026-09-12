/**
 * app.js — Core orchestration module
 * Powered by built-in Analysis Engine & Career Coach
 * Completely free of external API keys or server setup
 */

import { analyseResumeLocally, generateChatResponse } from './analysis-engine.js';
import { extractTextFromFile } from './pdf-parser.js';
import {
  renderScoreRing, renderGrade, renderSectionBars,
  renderBulletList, renderWeaknessList, renderAts,
  renderKeywords, renderActionPlan, renderAuditGrid,
  renderSuggestedRoles, renderCategorizedSkills, renderBulletRewrites,
  renderVerdictBadge, renderEvaluationDimensions, renderEmploymentGaps,
  renderLanguageIssues, setupCopyJsonButton,
  showSkeleton, hideSkeleton, showResults,
  showToast,
  appendChatMessage, appendTypingIndicator, removeTypingIndicator,
  updateStreamingBubble,
} from './ui.js';

// ─── State ────────────────────────────────────────────────────
let currentResumeText = '';
let isChatting = false;

// ─── DOM Refs ─────────────────────────────────────────────────
const fileInput        = document.getElementById('fileInput');
const dropzone         = document.getElementById('dropzone');
const fileInfo         = document.getElementById('fileInfo');
const resumeTextarea   = document.getElementById('resumeText');
const charCount        = document.getElementById('charCount');
const clearTextBtn     = document.getElementById('clearText');
const targetRoleInput  = document.getElementById('targetRole');
const senioritySelect  = document.getElementById('seniorityLevel');
const analyseBtn       = document.getElementById('analyseBtn');
const tabs             = document.querySelectorAll('.tab');
const tabContents      = document.querySelectorAll('.tab-content');
const chatInput        = document.getElementById('chatInput');
const chatSend         = document.getElementById('chatSend');
const quickChips       = document.querySelectorAll('.quick-chip');

// ─── Init ─────────────────────────────────────────────────────
function init() {
  createParticles();
  setupThemeToggle();
  setupFileUpload();
  setupTabSwitcher();
  setupAnalyseButton();
  setupChat();
  setupTextarea();
}

// ─── Theme Switcher (Default: Light Aesthetic Mode) ───────────
function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon   = document.getElementById('themeIcon');
  const themeLabel  = document.getElementById('themeLabel');

  // Set Light Theme as default for modern, clean aesthetic
  document.body.classList.add('light-theme');
  if (themeIcon) themeIcon.textContent = '🌙';
  if (themeLabel) themeLabel.textContent = 'Dark Mode';

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      if (themeIcon) themeIcon.textContent = isLight ? '🌙' : '☀️';
      if (themeLabel) themeLabel.textContent = isLight ? 'Dark Mode' : 'Light Mode';
    });
  }
}

// ─── Particle Background ─────────────────────────────────────
function createParticles() {
  const container = document.getElementById('particles');
  const count = 20;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const delay = Math.random() * 6;
    const duration = 8 + Math.random() * 10;
    const opacity = Math.random() * 0.15 + 0.05;

    dot.style.cssText = `
      position: absolute;
      left: ${x}%;
      top: ${y}%;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(${Math.random() > 0.5 ? '99,102,241' : '139,92,246'}, ${opacity});
      animation: floatParticle ${duration}s ${delay}s ease-in-out infinite alternate;
      pointer-events: none;
    `;
    container.appendChild(dot);
  }

  // Inject float animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatParticle {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 40 + 20)}px, -${Math.floor(Math.random() * 40 + 20)}px) scale(1.5); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Tab Switcher ─────────────────────────────────────────────
function setupTabSwitcher() {
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      updateAnalyseButton();
    });
  });
}

// ─── File Upload ──────────────────────────────────────────────
function setupFileUpload() {
  // Click to browse
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  // Drag & drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragging');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragging');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
}

async function handleFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    showToast('File too large. Maximum size is 10 MB.', 'error');
    return;
  }

  const allowed = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    showToast(`Unsupported file type: ${ext}. Use PDF, DOC, DOCX, or TXT.`, 'error');
    return;
  }

  fileInfo.classList.remove('hidden');
  fileInfo.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
    <span>Reading <strong>${file.name}</strong>…</span>
  `;

  try {
    const text = await extractTextFromFile(file);
    if (!text || text.length < 50) {
      throw new Error('The file appears to be empty or has no readable text.');
    }
    currentResumeText = text;
    fileInfo.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>
      <strong>${file.name}</strong> — ${(file.size / 1024).toFixed(0)} KB · ${text.split(/\s+/).length.toLocaleString()} words extracted
    `;
    showToast(`${file.name} loaded successfully.`, 'success');
    updateAnalyseButton();
  } catch (err) {
    fileInfo.classList.add('hidden');
    showToast(err.message, 'error');
  }
}

// ─── Textarea ─────────────────────────────────────────────────
function setupTextarea() {
  resumeTextarea.addEventListener('input', () => {
    const len = resumeTextarea.value.length;
    charCount.textContent = `${len.toLocaleString()} characters`;
    currentResumeText = resumeTextarea.value;
    updateAnalyseButton();
  });

  clearTextBtn.addEventListener('click', () => {
    resumeTextarea.value = '';
    charCount.textContent = '0 characters';
    currentResumeText = '';
    updateAnalyseButton();
  });
}

function getActiveResumeText() {
  const activeTab = document.querySelector('.tab.active')?.dataset.tab;
  if (activeTab === 'paste') return resumeTextarea.value.trim();
  return currentResumeText;
}

function updateAnalyseButton() {
  const text = getActiveResumeText();
  analyseBtn.disabled = !text || text.length < 50;
}

// ─── API Key ──────────────────────────────────────────────────
function setupApiKey() {
  apiKeyToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    apiKeyPanel.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!apiKeyPanel.contains(e.target) && e.target !== apiKeyToggle) {
      apiKeyPanel.classList.add('hidden');
    }
  });

  saveApiKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key.startsWith('AIza') && !key.startsWith('AQ.')) {
      showToast('That doesn\'t look like a valid Gemini API key. It should start with "AIza" or "AQ.".', 'error');
      return;
    }
    saveApiKey(key);
    showToast('API key saved!', 'success');
    apiKeyPanel.classList.add('hidden');
  });

  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveApiKeyBtn.click();
  });
}

// ─── Analyse ──────────────────────────────────────────────────
function setupAnalyseButton() {
  analyseBtn.addEventListener('click', runAnalysis);
}

async function runAnalysis() {
  const resumeText = getActiveResumeText();
  if (!resumeText || resumeText.length < 50) {
    showToast('Please upload or paste your resume first.', 'error');
    return;
  }

  // Store for chat context
  currentResumeText = resumeText;

  // UI: loading state
  analyseBtn.textContent = 'Analysing…';
  analyseBtn.classList.add('loading');
  analyseBtn.disabled = true;
  showSkeleton();

  // Scroll to results on mobile/tablets
  if (window.innerWidth <= 950) {
    document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  try {
    let targetRole = targetRoleInput.value.trim();
    const seniority = senioritySelect ? senioritySelect.value : 'auto';
    const jdInput = document.getElementById('jobDescription');
    const jobDescription = jdInput ? jdInput.value.trim() : '';
    
    // Inject seniority prefix if explicitly chosen
    if (seniority === 'senior' && !targetRole.toLowerCase().includes('senior') && !targetRole.toLowerCase().includes('lead')) {
      targetRole = targetRole ? `Senior ${targetRole}` : 'Senior Software Engineer';
    } else if (seniority === 'junior' && !targetRole.toLowerCase().includes('junior') && !targetRole.toLowerCase().includes('trainee') && !targetRole.toLowerCase().includes('intern')) {
      targetRole = targetRole ? `Junior ${targetRole} Trainee` : 'Software Developer Trainee';
    }

    // Simulate natural analysis delay for smooth UX animation
    await new Promise(r => setTimeout(r, 600));

    const analysis = analyseResumeLocally(resumeText, targetRole, jobDescription);
    renderAnalysis(analysis);
    showToast(`Comprehensive evaluation against ${analysis.seniority.toUpperCase()} expectations complete!`, 'success');

    // Notify side chatbot with seniority-calibrated advice
    appendChatMessage('assistant', `✅ **${analysis.seniority.toUpperCase()} Level Multi-Stage Audit Complete!**\n\n` +
      `We audited your resume across word density (${analysis.diagnostics.wordCount} words), identified ${analysis.diagnostics.skillsFoundCount} verified technical competencies, and audited ${analysis.diagnostics.metricCount} quantifiable impact metrics.\n\n` +
      (analysis.jdMatch ? `📌 **Job Description Match:** ${analysis.jdMatch.percentage}%\n\n` : '') +
      (analysis.seniority === 'senior' 
        ? `Recruiters for senior positions look for **System Architecture**, **Leadership/Mentoring**, and **High-Scale Impact ($/RPS/Latency)**. I noticed a few gaps—ask me to help rewrite your bullets!`
        : `Your profile has a solid foundation for entry/trainee opportunities. Ask me how to highlight your key projects or write a compelling summary!`));

  } catch (err) {
    hideSkeleton();
    document.getElementById('emptyState').classList.remove('hidden');
    showToast(`Analysis error: ${err.message}`, 'error');
  } finally {
    analyseBtn.textContent = '';
    analyseBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      Analyse Resume`;
    analyseBtn.classList.remove('loading');
    analyseBtn.disabled = false;
  }
}

function renderAnalysis(data) {
  hideSkeleton();
  showResults();

  // Score ring & Verdict
  const { gradeEl, summaryEl } = renderScoreRing(data.overall_score || data.overallScore || 0);
  renderGrade(gradeEl, data.grade || 'B', summaryEl, data.summary || '');
  renderVerdictBadge(data.verdict, data.overall_score || data.overallScore || 0);
  setupCopyJsonButton(data);

  // 6 Core Evaluative Dimensions & Weights
  if (data.scores) {
    renderEvaluationDimensions(data.scores);
  }

  // Section bars
  if (data.sectionScores) {
    renderSectionBars(data.sectionScores);
  }

  // Evidence & Document Audit Grid
  if (data.diagnostics) {
    renderAuditGrid(data.diagnostics, data.jdMatch, data.targetRoleFit);
  }

  // Categorized Technical Skills Inventory
  if (data.diagnostics && data.diagnostics.categorizedSkills) {
    renderCategorizedSkills(data.diagnostics.categorizedSkills);
  }

  // High-Impact Bullet Rewriter (STAR / Google XYZ)
  if (data.bulletRewrites) {
    renderBulletRewrites(data.bulletRewrites);
  }

  // Language Quality & Employment Gaps Check
  renderLanguageIssues(data.language_issues || []);
  renderEmploymentGaps(data.employment_gaps || []);

  // Strengths
  renderBulletList('strengthsList', data.strengths || []);

  // Missing sections
  renderBulletList('missingList', data.missingSections || []);

  // ATS
  if (data.atsCompatibility) {
    renderAts(data.atsCompatibility);
  }

  // Weaknesses
  if (data.weaknesses) {
    renderWeaknessList(data.weaknesses);
  }

  // Recommended Job Roles to Apply For
  if (data.suggestedRoles) {
    renderSuggestedRoles(data.suggestedRoles);
  }

  // Keywords
  renderKeywords(
    data.recommendedKeywords || [],
    data.keywordsContext || ''
  );

  // Action plan
  renderActionPlan(data.actionPlan || []);
}

// ─── Chat ─────────────────────────────────────────────────────
function setupChat() {
  // Send message
  chatSend.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Auto-resize textarea
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
  });

  // Quick chips
  quickChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chatInput.value = chip.dataset.prompt;
      chatInput.dispatchEvent(new Event('input'));
      sendChatMessage();
    });
  });
}

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text || isChatting) return;

  // Clear input
  chatInput.value = '';
  chatInput.style.height = 'auto';

  // Render user bubble
  appendChatMessage('user', text);

  // Disable input while responding
  isChatting = true;
  chatSend.disabled = true;
  const chatStatus = document.getElementById('chatStatus');
  chatStatus.textContent = 'Thinking…';

  // Show typing indicator
  appendTypingIndicator();

  // Natural response simulation
  setTimeout(() => {
    removeTypingIndicator();
    const targetRole = targetRoleInput.value.trim();
    const reply = generateChatResponse(text, currentResumeText, targetRole);
    appendChatMessage('assistant', reply);
    chatStatus.textContent = 'Career Coach & Review Specialist';
    isChatting = false;
    chatSend.disabled = false;
    chatInput.focus();
  }, 450);
}

// ─── Start ────────────────────────────────────────────────────
init();
