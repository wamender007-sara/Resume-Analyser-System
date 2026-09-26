/**
 * app.js — Core orchestration module
 * Powered by built-in Analysis Engine & Gemini-powered Career Advisor
 */

import { analyseResumeLocally, generateChatResponse, validateResumeDocument } from './analysis-engine.js';
import { extractTextFromFile } from './pdf-parser.js';
import {
  renderScoreRing, renderGrade, renderSectionBars,
  renderBulletList, renderWeaknessList, renderAts,
  renderKeywords, renderActionPlan, renderAuditGrid,
  renderSuggestedRoles, renderCategorizedSkills, renderBulletRewrites,
  renderVerdictBadge, renderEvaluationDimensions, renderEmploymentGaps,
  renderLanguageIssues, setupCopyJsonButton,
  showSkeleton, hideSkeleton, showResults, resetToEmptyState,
  showToast,
  appendChatMessage, appendTypingIndicator, removeTypingIndicator,
  updateStreamingBubble,
  updateAllAdSlots,
  renderScorePotential,
} from './ui.js';
import { openResumeEditor } from './resume-editor.js';
import { getApiKey, saveApiKey, chatStream } from './gemini.js';
import { generatePdfReport } from './pdf-export.js';
import { computeScorePotential } from './score-potential.js';

// ─── State ────────────────────────────────────────────────────
let currentResumeText = '';
let currentAnalysis = null;
let isChatting = false;
/** @type {Array<{role:'user'|'assistant', content:string}>} */
let chatHistory = [];

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
  setupFileUpload();
  setupTabSwitcher();
  setupAnalyseButton();
  setupChat();
  setupTextarea();
  setupEditorTriggers();
  setupApiKey();
  updateAllAdSlots();
  updateGeminiStatusBadge();
}

// ─── AI Resume Editor Trigger Setup ───────────────────────────
function setupEditorTriggers() {
  const btnOpenEditor = document.getElementById('btnOpenEditor');
  const btnLaunchBanner = document.getElementById('btnLaunchEditorFromBanner');

  const handleOpen = () => {
    if (!currentAnalysis || !currentResumeText) {
      showToast('Please analyze an authentic Resume first to open the AI Editor.', 'error');
      return;
    }
    const validation = validateResumeDocument(currentResumeText);
    if (!validation.isValid) {
      showToast(`Cannot launch AI Resume Editor: ${validation.reason}. Please upload a Resume or CV.`, 'error');
      return;
    }
    const role = (targetRoleInput?.value || '').trim();
    openResumeEditor(currentResumeText, currentAnalysis, role);
  };

  if (btnOpenEditor) btnOpenEditor.addEventListener('click', handleOpen);
  if (btnLaunchBanner) btnLaunchBanner.addEventListener('click', handleOpen);

  // ─── PDF Export Trigger ─────────────────────────────────────
  const btnExportPdf = document.getElementById('btnExportPdf');
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      if (!currentAnalysis) {
        showToast('Please analyse a resume first before exporting.', 'error');
        return;
      }
      btnExportPdf.disabled = true;
      btnExportPdf.textContent = 'Preparing…';
      try {
        generatePdfReport(currentAnalysis, showToast);
      } finally {
        // Re-enable after a short delay (print dialog may be synchronous or async)
        setTimeout(() => {
          btnExportPdf.disabled = false;
          btnExportPdf.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF`;
        }, 1200);
      }
    });
  }
}

// ─── Particle Background (Clean No-Op) ────────────────────────
function createParticles() {
  // Retained as clean no-op to eliminate artificial visual clutter
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
    if (!text || text.length < 30) {
      throw new Error('The file appears to be empty or has no readable text.');
    }

    const validation = validateResumeDocument(text, file.name);
    if (!validation.isValid) {
      currentResumeText = '';
      currentAnalysis = null;
      resetToEmptyState();
      fileInfo.className = 'file-info file-info-error';
      fileInfo.classList.remove('hidden');
      fileInfo.innerHTML = `
        <div style="display:flex; align-items:flex-start; gap:10px; text-align:left; width:100%; min-width:0; box-sizing:border-box;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.3" style="flex-shrink:0; margin-top:2px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div style="min-width:0; flex:1; width:100%; overflow-wrap:anywhere; word-break:break-word;">
            <div style="font-weight:700; color:#991b1b; font-size:0.86rem; line-height:1.35; overflow-wrap:anywhere; word-break:break-word;">⚠️ Invalid Document: ${validation.reason}</div>
            <div style="font-size:0.78rem; color:#7f1d1d; margin-top:4px; line-height:1.45; overflow-wrap:anywhere; word-break:break-word;">${validation.details}</div>
          </div>
        </div>
      `;
      showToast(`⚠️ ${validation.reason}. Please upload an authentic Resume or CV.`, 'error');
      updateAnalyseButton();
      return;
    }

    currentResumeText = text;
    fileInfo.className = 'file-info';
    fileInfo.classList.remove('hidden');
    fileInfo.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; width:100%; min-width:0;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>
        <span style="min-width:0; flex:1; overflow-wrap:anywhere; word-break:break-word;">
          <strong>${file.name}</strong> — ${(file.size / 1024).toFixed(0)} KB · ${text.split(/\s+/).length.toLocaleString()} words extracted
        </span>
      </div>
    `;
    showToast(`${file.name} verified as Resume. Ready for analysis!`, 'success');
    updateAnalyseButton();
  } catch (err) {
    fileInfo.className = 'file-info file-info-error';
    fileInfo.classList.remove('hidden');
    fileInfo.innerHTML = `<span>⚠️ ${err.message}</span>`;
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
  const apiKeyToggle  = document.getElementById('apiKeyToggle');
  const apiKeyPanel   = document.getElementById('apiKeyPanel');
  const apiKeyInput   = document.getElementById('apiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');

  if (!apiKeyToggle || !apiKeyPanel) return; // Elements not present — skip

  // Pre-fill input if a key is already saved
  if (apiKeyInput && getApiKey()) {
    apiKeyInput.value = getApiKey();
  }

  apiKeyToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    apiKeyPanel.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!apiKeyPanel.contains(e.target) && e.target !== apiKeyToggle) {
      apiKeyPanel.classList.add('hidden');
    }
  });

  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', () => {
      const key = (apiKeyInput?.value || '').trim();
      if (!key.startsWith('AIza') && !key.startsWith('AQ.')) {
        showToast('That doesn\'t look like a valid Gemini API key. It should start with "AIza" or "AQ.".', 'error');
        return;
      }
      saveApiKey(key);
      showToast('Personal Precise activated! Responses are now powered with maximum precision.', 'success');
      apiKeyPanel.classList.add('hidden');
      updateGeminiStatusBadge();
    });
  }

  if (clearApiKeyBtn) {
    clearApiKeyBtn.addEventListener('click', () => {
      localStorage.removeItem('resumeai_apikey');
      if (apiKeyInput) apiKeyInput.value = '';
      showToast('Personal API key cleared.', 'info');
      apiKeyPanel.classList.add('hidden');
      updateGeminiStatusBadge();
    });
  }

  if (apiKeyInput) {
    apiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveApiKeyBtn?.click();
    });
  }
}

// ─── Gemini Status Badge ───────────────────────────────────────
function updateGeminiStatusBadge() {
  const badge = document.getElementById('geminiStatusBadge');
  const chatStatusEl = document.getElementById('chatStatus');
  const hasKey = Boolean(getApiKey());

  if (badge) {
    badge.textContent = hasKey ? 'Personal Precise (Active)' : 'Personal Precise';
    badge.className = hasKey ? 'gemini-badge gemini-active' : 'gemini-badge gemini-builtin';
    badge.title = hasKey
      ? 'Personal Precise is active — deep, high-precision answers enabled'
      : 'Configure your personal Gemini API key for maximum accuracy & precision';
  }

  if (chatStatusEl) {
    chatStatusEl.textContent = hasKey ? 'Powered by Personal Precise' : 'Personal Precise Mode';
  }
}

// ─── Analyse ──────────────────────────────────────────────────
function setupAnalyseButton() {
  analyseBtn.addEventListener('click', runAnalysis);
}

async function runAnalysis() {
  const resumeText = getActiveResumeText();
  if (!resumeText || resumeText.length < 40) {
    showToast('Please upload or paste your resume first.', 'error');
    return;
  }

  // Pre-analysis entry-level validation
  const validation = validateResumeDocument(resumeText);
  if (!validation.isValid) {
    resetToEmptyState();
    showToast(`Cannot analyse: ${validation.reason}. Please provide an authentic Resume or CV.`, 'error');
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
    currentAnalysis = analysis;
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

  // Score Improvement Potential Panel
  renderScorePotential(computeScorePotential(data));

  // Save profile to localStorage for opportunities.html
  try {
    const flatSkills = [];
    if (data.diagnostics && data.diagnostics.categorizedSkills) {
      Object.values(data.diagnostics.categorizedSkills).forEach(cat => {
        if (cat && cat.items) {
          cat.items.forEach(it => {
            if (it && it.name) flatSkills.push(it.name);
          });
        }
      });
    } else if (data.skills && Array.isArray(data.skills.technical)) {
      flatSkills.push(...data.skills.technical);
    }

    const candidateProfile = {
      targetRole: (document.getElementById('targetRoleInput')?.value || '').trim(),
      suggestedRoles: data.suggestedRoles || [],
      flatSkills: Array.from(new Set(flatSkills)),
      overallScore: data.overall_score || data.overallScore || (data.scores ? Math.round(Object.values(data.scores).reduce((a,b)=>a+b,0)/Object.keys(data.scores).length) : 80),
      seniority: data.seniority || 'junior',
      atsGrade: data.grade || 'B',
      updatedAt: Date.now()
    };
    localStorage.setItem('resumereviewer_candidate_profile', JSON.stringify(candidateProfile));
  } catch (e) {
    console.warn('Could not cache candidate profile', e);
  }
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

  // Add to history for Gemini multi-turn conversation
  chatHistory.push({ role: 'user', content: text });

  // Disable input while responding
  isChatting = true;
  chatSend.disabled = true;
  const chatStatusEl = document.getElementById('chatStatus');
  if (chatStatusEl) chatStatusEl.textContent = 'Thinking…';

  const apiKey = getApiKey();

  if (apiKey) {
    // ── Gemini streaming path (Personal Precise) ───────────────
    await sendChatMessageViaGemini(text, chatStatusEl);
  } else {
    // ── Prompt user to enter API key for maximum precision ──────
    const panel = document.getElementById('apiKeyPanel');
    if (panel) panel.classList.remove('hidden');
    const input = document.getElementById('apiKeyInput');
    if (input) input.focus();
    showToast('🔑 Please provide your personal Gemini API key for precise, accurate answers.', 'info');
    sendChatMessageViaBuiltIn(text, chatStatusEl);
  }
}

async function sendChatMessageViaGemini(text, chatStatusEl) {
  // Show typing indicator while we open the stream
  appendTypingIndicator();

  // Create an empty assistant bubble we'll stream tokens into
  let streamingDiv = null;
  let accumulated = '';

  try {
    if (!currentResumeText) currentResumeText = getActiveResumeText();
    const targetRole = targetRoleInput ? targetRoleInput.value.trim() : '';

    // Build message list for Gemini — only user/assistant turns (no system)
    const geminiMessages = chatHistory.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    removeTypingIndicator();
    // Create the streaming bubble before first token arrives
    streamingDiv = appendChatMessage('assistant', '');

    const stream = chatStream(geminiMessages, currentResumeText);

    for await (const chunk of stream) {
      accumulated += chunk;
      updateStreamingBubble(streamingDiv, accumulated);
    }

    if (!accumulated.trim()) {
      // Empty stream — use fallback
      throw new Error('Empty Gemini response');
    }

    // Persist assistant reply in history
    chatHistory.push({ role: 'assistant', content: accumulated });

  } catch (err) {
    // Remove partial streaming bubble if it exists
    if (streamingDiv) streamingDiv.remove();
    removeTypingIndicator();

    const isKeyError = err.message === 'NO_API_KEY'
      || err.message === 'INVALID_API_KEY'
      || err.message?.includes('API key');

    if (isKeyError) {
      showToast('Personal API key is invalid or expired. Switched to standard mode.', 'error');
      localStorage.removeItem('resumeai_apikey');
      updateGeminiStatusBadge();
    }

    // Always fall back gracefully — never leave the user with no response
    const targetRole = targetRoleInput ? targetRoleInput.value.trim() : '';
    const fallbackReply = generateChatResponse(text, currentResumeText, targetRole, currentAnalysis);
    appendChatMessage('assistant', fallbackReply);
    chatHistory.push({ role: 'assistant', content: fallbackReply });

  } finally {
    if (chatStatusEl) chatStatusEl.textContent = getApiKey() ? 'Powered by Personal Precise AI' : 'Personal Precise Mode';
    isChatting = false;
    chatSend.disabled = false;
    chatInput.focus();
  }
}

function sendChatMessageViaBuiltIn(text, chatStatusEl) {
  // Show typing indicator
  appendTypingIndicator();

  // Preserve natural-feeling delay for standard path
  setTimeout(() => {
    try {
      removeTypingIndicator();
      if (!currentResumeText) currentResumeText = getActiveResumeText();
      const targetRole = targetRoleInput ? targetRoleInput.value.trim() : '';
      const baseReply = generateChatResponse(text, currentResumeText, targetRole, currentAnalysis);
      const reply = `💡 *Personal Precise AI:* Activate your personal key above for deep, high-precision answers tailored to your specific questions.\n\n` + baseReply;
      appendChatMessage('assistant', reply);
      chatHistory.push({ role: 'assistant', content: reply });
    } catch (err) {
      console.error('Chat error:', err);
      removeTypingIndicator();
      appendChatMessage('assistant', `⚠️ Sorry, I encountered an issue: ${err.message}. Please try again!`);
    } finally {
      if (chatStatusEl) chatStatusEl.textContent = 'Resume Review Specialist';
      isChatting = false;
      chatSend.disabled = false;
      chatInput.focus();
    }
  }, 450);
}

// ─── Start ────────────────────────────────────────────────────
init();
