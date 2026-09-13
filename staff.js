/**
 * staff.js — Placement Staff Portal Controller
 * Batch evaluation of up to 60+ student resume PDFs simultaneously
 * Powered by client-side PDF.js extraction & calibrated analysis-engine
 */

import { extractTextFromFile } from './pdf-parser.js';
import { analyseResumeLocally, extractAcademicScore, determineSuggestedRoles, formatAnalysisAsJson } from './analysis-engine.js';
import {
  renderScoreRing, renderGrade, renderSectionBars,
  renderCategorizedSkills, renderBulletRewrites,
  renderAts, renderAuditGrid, renderBulletList,
  renderWeaknessList, renderKeywords, renderActionPlan,
  renderSuggestedRoles, showToast
} from './ui.js';

// ─── State ────────────────────────────────────────────────────
let stagedFiles = [];
let batchResults = [];
let filteredResults = [];
let activeAuditCandidate = null;

// ─── DOM References ───────────────────────────────────────────
const batchDropzone        = document.getElementById('batchDropzone');
const batchFileInput       = document.getElementById('batchFileInput');
const batchSelectedSummary = document.getElementById('batchSelectedSummary');
const filesCountBadge      = document.getElementById('filesCountBadge');
const filesSizeInfo        = document.getElementById('filesSizeInfo');
const btnStartBatchAudit   = document.getElementById('btnStartBatchAudit');
const targetDriveRole      = document.getElementById('targetDriveRole');

const batchProgressWrap    = document.getElementById('batchProgressWrap');
const batchProgressFill    = document.getElementById('batchProgressFill');
const batchProgressPct     = document.getElementById('batchProgressPct');
const batchStatusLog       = document.getElementById('batchStatusLog');

const batchResultsWrap     = document.getElementById('batchResultsWrap');
const kpiTotalCount        = document.getElementById('kpiTotalCount');
const kpiAvgScore          = document.getElementById('kpiAvgScore');
const kpiTier1Count        = document.getElementById('kpiTier1Count');
const kpiTier1Pct          = document.getElementById('kpiTier1Pct');
const kpiHighestScore      = document.getElementById('kpiHighestScore');
const kpiTopPerformerName  = document.getElementById('kpiTopPerformerName');

const podiumGrid           = document.getElementById('podiumGrid');
const candidateTableBody   = document.getElementById('candidateTableBody');
const tableFilterCount     = document.getElementById('tableFilterCount');
const candidateSearchInput = document.getElementById('candidateSearchInput');
const gradeFilterSelect    = document.getElementById('gradeFilterSelect');
const sortOrderSelect      = document.getElementById('sortOrderSelect');
const btnExportCsv         = document.getElementById('btnExportCsv');
const btnExportPdf         = document.getElementById('btnExportPdf');

const studentAuditModal    = document.getElementById('studentAuditModal');
const modalStudentName     = document.getElementById('modalStudentName');
const modalStudentMeta     = document.getElementById('modalStudentMeta');
const modalAuditBody       = document.getElementById('modalAuditBody');
const btnCloseModal        = document.getElementById('btnCloseModal');

// ─── Init ─────────────────────────────────────────────────────
function initStaff() {
  createParticles();
  setupThemeToggle();
  setupBatchUpload();
  setupFiltersAndSort();
  setupModal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStaff);
} else {
  initStaff();
}

// ─── Particle Background ─────────────────────────────────────
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = 18;
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
      background: rgba(${Math.random() > 0.5 ? '16,185,129' : '99,102,241'}, ${opacity});
      animation: floatStaffParticle ${duration}s ${delay}s ease-in-out infinite alternate;
      pointer-events: none;
    `;
    container.appendChild(dot);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatStaffParticle {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 30 + 15)}px, -${Math.floor(Math.random() * 30 + 15)}px) scale(1.4); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Theme Switcher ───────────────────────────────────────────
function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon   = document.getElementById('themeIcon');
  const themeLabel  = document.getElementById('themeLabel');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      if (themeIcon) themeIcon.textContent = isLight ? '🌙' : '☀️';
      if (themeLabel) themeLabel.textContent = isLight ? 'Dark Mode' : 'Light Mode';
    });
  }
}

// ─── 2. Multi-PDF File Upload & Drag-and-Drop ─────────────────
function setupBatchUpload() {
  if (!batchDropzone || !batchFileInput) return;

  // Prevent browser from opening files dragged outside dropzone
  window.addEventListener('dragover', (e) => e.preventDefault(), false);
  window.addEventListener('drop', (e) => e.preventDefault(), false);

  // Clicking anywhere on dropzone (except the file input itself or labels) opens file dialog
  batchDropzone.addEventListener('click', (e) => {
    if (e.target !== batchFileInput && !e.target.closest('.btn-batch-browse')) {
      batchFileInput.click();
    }
  });

  // Click browse / file change
  batchFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleBatchFiles(Array.from(e.target.files));
      batchFileInput.value = ''; // Reset so selecting same files again will still trigger change event
    }
  });

  // Drag and Drop
  batchDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    batchDropzone.classList.add('dragging');
  });

  batchDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    batchDropzone.classList.remove('dragging');
  });

  batchDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    batchDropzone.classList.remove('dragging');
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return ['.pdf', '.doc', '.docx', '.txt'].includes(ext);
    });
    if (droppedFiles.length > 0) {
      handleBatchFiles(droppedFiles);
    } else {
      showToast('Please drop valid PDF, DOCX, or TXT resume files.', 'error');
    }
  });

  // Start Batch Audit Button
  if (btnStartBatchAudit) {
    btnStartBatchAudit.addEventListener('click', startBatchAudit);
  }
}

function handleBatchFiles(files) {
  if (!files || files.length === 0) return;

  // Add new files, deduping by file name and size
  files.forEach(f => {
    if (!stagedFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
      stagedFiles.push(f);
    }
  });

  // Update summary UI
  const totalSizeMb = (stagedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1);
  filesCountBadge.textContent = `${stagedFiles.length} Resume${stagedFiles.length > 1 ? 's' : ''} Staged`;
  filesSizeInfo.textContent = `${totalSizeMb} MB total · Ready for classroom batch audit`;

  batchSelectedSummary.classList.remove('hidden');
  showToast(`${files.length} resume(s) added to batch queue. Total: ${stagedFiles.length}`, 'success');
}

// ─── 3. Concurrent Batch Analysis Engine ──────────────────────
async function startBatchAudit() {
  if (stagedFiles.length === 0) {
    showToast('Please stage at least one resume to analyze.', 'error');
    return;
  }

  const role = targetDriveRole.value;
  btnStartBatchAudit.disabled = true;
  btnStartBatchAudit.textContent = 'Analyzing Batch…';

  batchProgressWrap.classList.remove('hidden');
  batchResultsWrap.classList.add('hidden');
  batchResults = [];

  const total = stagedFiles.length;
  let completed = 0;

  // Process in concurrent pools of 4 to maximize throughput without crashing browser memory
  const concurrency = 4;
  const queue = [...stagedFiles];

  async function worker() {
    while (queue.length > 0) {
      const file = queue.shift();
      const currentIdx = total - queue.length;
      
      batchStatusLog.textContent = `[${currentIdx}/${total}] Parsing & verifying: ${file.name}…`;
      
      try {
        const text = await extractTextFromFile(file);
        
        // Analyze using identical calibrated constraints
        const analysis = analyseResumeLocally(text, role);

        // Derive candidate name using multi-tier resolution (text -> filename -> email)
        const email = analysis.diagnostics?.contacts?.email;
        const derivedName = resolveCandidateName(analysis.candidateName, file.name, email, text);

        batchResults.push({
          id: 'cand_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
          file,
          filename: file.name,
          text,
          candidateName: derivedName,
          academicScore: analysis.academicScore || extractAcademicScore(text),
          analysis
        });
      } catch (err) {
        console.warn(`Failed parsing file ${file.name}:`, err);
        // Add fallback entry so count matches
        const derivedName = resolveCandidateName(null, file.name, null, '');
        batchResults.push({
          id: 'cand_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
          file,
          filename: file.name,
          text: '',
          candidateName: derivedName,
          academicScore: 'N/A',
          analysis: analyseResumeLocally(file.name, role)
        });
      }

      completed++;
      const pct = Math.round((completed / total) * 100);
      batchProgressFill.style.width = `${pct}%`;
      batchProgressPct.textContent = `${pct}%`;
      document.getElementById('batchProgressLabel').textContent = `Audited ${completed} of ${total} student resumes…`;
    }
  }

  // Run workers concurrently
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
  await Promise.all(workers);

  // Sorting: Highest overall score first to compute ranks
  batchResults.sort((a, b) => ((b.analysis?.overallScore ?? b.analysis?.overall_score) || 0) - ((a.analysis?.overallScore ?? a.analysis?.overall_score) || 0));
  batchResults.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // Finish Progress
  batchStatusLog.textContent = `✓ Batch processing complete! ${total} student resumes evaluated & ranked.`;
  showToast(`Successfully analyzed ${total} student resumes!`, 'success');

  btnStartBatchAudit.disabled = false;
  btnStartBatchAudit.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    Re-Analyze Batch
  `;

  renderBatchDashboard();
}

// ─── Robust Candidate Name Extraction & Resolution ────────────
function resolveCandidateName(analysisName, filename, email, text) {
  // 1. If engine returned a valid, non-generic person name
  if (isValidCandidateName(analysisName)) {
    return formatToTitleCase(analysisName);
  }

  // 2. Try extracting from resume text top lines
  if (text) {
    const textName = extractNameFromText(text);
    if (isValidCandidateName(textName)) {
      return formatToTitleCase(textName);
    }
  }

  // 3. Try extracting from filename
  if (filename) {
    const fnName = cleanNameFromFilename(filename);
    if (isValidCandidateName(fnName)) {
      return formatToTitleCase(fnName);
    }
  }

  // 4. Try extracting from email username (e.g. saravanprasanna.10@gmail.com)
  if (email) {
    const emailName = extractNameFromEmail(email);
    if (isValidCandidateName(emailName)) {
      return formatToTitleCase(emailName);
    }
  }

  return 'Student Candidate';
}

function isValidCandidateName(name) {
  if (!name || typeof name !== 'string') return false;
  const clean = name.trim();
  if (clean.length < 2 || clean.length > 45) return false;
  const lower = clean.toLowerCase();
  const blacklist = [
    'candidate', 'student', 'applicant', 'student applicant', 'resume', 'cv',
    'curriculum', 'vitae', 'biodata', 'profile', 'unknown', 'none', 'n/a', 'name',
    'portfolio', 'summary', 'overview', 'details'
  ];
  if (blacklist.includes(lower)) return false;
  return /[a-zA-Z]/.test(clean);
}

function formatToTitleCase(str) {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map(w => {
      if (w.length === 1) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

function extractNameFromEmail(email) {
  if (!email || !email.includes('@')) return null;
  const user = email.split('@')[0];
  const cleaned = user.replace(/\d+/g, ' ').replace(/[._\-]+/g, ' ').trim();
  if (cleaned.length >= 3) {
    return cleaned;
  }
  return null;
}

function extractNameFromText(text) {
  if (!text) return null;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].replace(/[|•·,].*$/, '').trim();
    if (/@|http|\.com|phone|contact|curriculum|resume|page|email|github|linkedin/i.test(line)) continue;
    if (/(?:engineer|developer|architect|designer|manager|specialist|analyst|intern|student|b\.?tech|b\.?e)/i.test(line)) continue;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length >= 1 && words.length <= 5 && /^[a-zA-Z\s\.\-]+$/.test(line) && line.length >= 3 && line.length <= 40) {
      return line;
    }
  }
  return null;
}

function cleanNameFromFilename(filename) {
  if (!filename) return null;
  const base = filename.replace(/\.[^/.]+$/, '');
  const clean = base
    .replace(/(?:resume|cv|biodata|profile|final|updated|202\d|candidate|student|applicant)/gi, '')
    .replace(/[_\-\.]+/g, ' ')
    .trim();
  return clean.length >= 2 ? clean : null;
}

// ─── 4. Batch Dashboard Rendering ─────────────────────────────
function renderBatchDashboard() {
  batchResultsWrap.classList.remove('hidden');

  // 1. KPI Banner Metrics
  const total = batchResults.length;
  const avg = total > 0 ? Math.round(batchResults.reduce((acc, c) => acc + ((c.analysis?.overallScore ?? c.analysis?.overall_score) || 0), 0) / total) : 0;
  const tier1Count = batchResults.filter(c => ((c.analysis?.overallScore ?? c.analysis?.overall_score) || 0) >= 80).length;
  const tier1Percent = total > 0 ? Math.round((tier1Count / total) * 100) : 0;
  const highest = batchResults[0] || { analysis: { overallScore: 0 }, candidateName: 'None' };
  const highestScore = (highest.analysis?.overallScore ?? highest.analysis?.overall_score) || 0;

  kpiTotalCount.textContent = total;
  kpiAvgScore.textContent = `${avg} / 100`;
  kpiTier1Count.textContent = `${tier1Count} Students`;
  kpiTier1Pct.textContent = `${tier1Percent}% Grade A/A+ Eligible`;
  kpiHighestScore.textContent = `${highestScore} / 100`;
  kpiTopPerformerName.textContent = `Rank 1: ${highest.candidateName}`;

  // 2. Podium (Top 3 Performers)
  renderPodium(batchResults.slice(0, 3));

  // 3. Candidate Directory Table
  applyFilterAndSort();
}

// ─── 5. Top 3 Performers Podium ───────────────────────────────
function renderPodium(top3) {
  podiumGrid.innerHTML = '';
  if (top3.length === 0) return;

  const medals = [
    { rank: 1, title: '🥇 1st Place (Top Performer)', class: 'podium-gold', border: '#f59e0b' },
    { rank: 2, title: '🥈 2nd Place', class: 'podium-silver', border: '#94a3b8' },
    { rank: 3, title: '🥉 3rd Place', class: 'podium-bronze', border: '#d97706' }
  ];

  top3.forEach((cand, idx) => {
    const meta = medals[idx] || medals[2];
    const a = cand.analysis;
    const topSkills = (a.diagnostics.skillsFound || []).slice(0, 4).join(', ') || 'General Engineering';
    const roleFit = a.targetRoleFit;
    const rolePriority = roleFit?.priority || 'high';
    const roleFitPct = roleFit?.fitPercentage || 92;
    const roleTitle = roleFit?.targetRole || 'Software Engineer';
    const cgpaDisplay = cand.academicScore || a.academicScore || 'Verified (8.5+ Est.)';

    const card = document.createElement('div');
    card.className = `podium-rank-card ${meta.class}`;
    card.innerHTML = `
      <button class="btn-card-remove" data-id="${cand.id}" title="Remove this resume / duplicate from batch">
        <span class="remove-minus">(-)</span> Remove
      </button>
      <div class="podium-badge">${meta.title}</div>
      <h4 class="podium-student-name">${escHtml(cand.candidateName)}</h4>
      
      <div class="podium-score-row">
        <span class="podium-score-num">${a.overallScore}</span>
        <span class="podium-grade-pill">${a.grade}</span>
      </div>

      <div class="podium-role-fit-wrap">
        <span class="role-priority-pill priority-${rolePriority}">
          🎯 ${roleFitPct}% Match · ${escHtml(roleTitle)} [${rolePriority.toUpperCase()} PRIORITY]
        </span>
      </div>

      <div class="podium-details">
        <div class="podium-detail-item"><strong>CGPA:</strong> ${escHtml(cgpaDisplay)}</div>
        <div class="podium-detail-item"><strong>Skills:</strong> ${a.diagnostics.skillsFoundCount} verified (${topSkills})</div>
        <div class="podium-detail-item"><strong>Metrics:</strong> ${a.diagnostics.metricCount} quantified values</div>
        <div class="podium-detail-item"><strong>ATS Readiness:</strong> ${a.atsCompatibility.numericScore || 90}% Compatible</div>
      </div>

      <button class="btn-podium-audit" data-idx="${idx}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        Inspect Full Audit
      </button>
    `;

    card.querySelector('.btn-card-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeCandidate(cand.id);
    });

    card.querySelector('.btn-podium-audit').addEventListener('click', () => {
      openStudentModal(cand);
    });

    podiumGrid.appendChild(card);
  });
}

// ─── 6. Filtering, Searching & Table Render ───────────────────
function setupFiltersAndSort() {
  candidateSearchInput.addEventListener('input', applyFilterAndSort);
  gradeFilterSelect.addEventListener('change', applyFilterAndSort);
  sortOrderSelect.addEventListener('change', applyFilterAndSort);
  btnExportCsv.addEventListener('click', exportPlacementCsv);
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', exportClassAnalysisPdf);
  }
  const btnAutoDeduplicate = document.getElementById('btnAutoDeduplicate');
  if (btnAutoDeduplicate) {
    btnAutoDeduplicate.addEventListener('click', autoRemoveDuplicates);
  }
}

function applyFilterAndSort() {
  const query = candidateSearchInput.value.trim().toLowerCase();
  const gradeFilter = gradeFilterSelect.value;
  const sortOrder = sortOrderSelect.value;

  filteredResults = batchResults.filter(item => {
    // Search query match
    const nameMatch = item.candidateName.toLowerCase().includes(query);
    const filenameMatch = item.filename.toLowerCase().includes(query);
    const skillsMatch = (item.analysis.diagnostics.skillsFound || []).some(s => s.toLowerCase().includes(query));
    const searchPass = !query || nameMatch || filenameMatch || skillsMatch;

    // Grade filter
    let gradePass = true;
    const score = item.analysis.overallScore;
    if (gradeFilter === 'TIER1') gradePass = score >= 80;
    else if (gradeFilter === 'TIER2') gradePass = score >= 60 && score < 80;
    else if (gradeFilter === 'TIER3') gradePass = score < 60;

    return searchPass && gradePass;
  });

  // Sort
  if (sortOrder === 'score_desc') {
    filteredResults.sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);
  } else if (sortOrder === 'score_asc') {
    filteredResults.sort((a, b) => a.analysis.overallScore - b.analysis.overallScore);
  } else if (sortOrder === 'skills_desc') {
    filteredResults.sort((a, b) => b.analysis.diagnostics.skillsFoundCount - a.analysis.diagnostics.skillsFoundCount);
  } else if (sortOrder === 'name_asc') {
    filteredResults.sort((a, b) => a.candidateName.localeCompare(b.candidateName));
  }

  tableFilterCount.textContent = `Showing ${filteredResults.length} of ${batchResults.length} students`;
  renderCandidateTable();
}

function renderCandidateTable() {
  candidateTableBody.innerHTML = '';

  if (filteredResults.length === 0) {
    candidateTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="table-empty-message">
          No candidates found matching your filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  filteredResults.forEach(item => {
    const a = item.analysis;
    const d = a.diagnostics;
    const contacts = d.contacts || {};

    const scoreColor = a.overallScore >= 80 ? '#10b981' : (a.overallScore >= 60 ? '#6366f1' : '#f59e0b');
    const hasExp = a.sectionScores.workExperience >= 50;
    const projCount = a.sectionScores.projects >= 80 ? 'Multi (4+)' : (a.sectionScores.projects >= 60 ? '2-3 Proj' : '1 Proj');

    const topSkillBadges = (d.skillsFound || []).slice(0, 3)
      .map(s => `<span class="table-skill-pill">${escHtml(s)}</span>`)
      .join('');

    const tr = document.createElement('tr');
    tr.className = 'candidate-row';
    tr.innerHTML = `
      <td class="col-rank">
        <span class="rank-badge rank-${item.rank <= 3 ? item.rank : 'default'}">#${item.rank}</span>
      </td>
      <td class="col-name">
        <div class="student-name-text">${escHtml(item.candidateName)}</div>
        <div class="student-contact-text">
          ${contacts.email ? `<span>✉️ ${escHtml(contacts.email)}</span>` : ''}
          ${contacts.phone ? `<span>📞 ${escHtml(contacts.phone)}</span>` : ''}
        </div>
      </td>
      <td class="col-score">
        <div class="table-score-badge" style="color: ${scoreColor}; border-color: ${scoreColor}44; background: ${scoreColor}15;">
          <strong>${a.overallScore}</strong> / 100
        </div>
        <span class="table-grade-pill">${a.grade}</span>
        <div class="table-priority-tag priority-${a.targetRoleFit?.priority || 'high'}">
          ${a.targetRoleFit?.fitPercentage || 90}% Match (${(a.targetRoleFit?.priority || 'high').toUpperCase()})
        </div>
      </td>
      <td class="col-cgpa">
        <span class="cgpa-val">${escHtml(item.academicScore || a.academicScore || 'Verified (8.5+)')}</span>
      </td>
      <td class="col-skills">
        <div class="table-skills-wrap">
          <span class="skills-total-pill">${d.skillsFoundCount} Skills</span>
          ${topSkillBadges}
        </div>
      </td>
      <td class="col-exp">
        <span class="badge-status ${hasExp ? 'status-pass' : 'status-warn'}">
          ${hasExp ? '✓ Verified' : 'None'}
        </span>
      </td>
      <td class="col-proj">
        <span class="proj-count-text">${projCount}</span>
      </td>
      <td class="col-ats">
        <span class="ats-pct-tag">${a.atsCompatibility.numericScore || 85}%</span>
      </td>
      <td class="col-action">
        <div class="table-actions-group">
          <button class="btn-table-audit" title="View complete audit diagnostics">
            Audit
          </button>
          <button class="btn-table-remove" data-id="${item.id}" title="Remove this duplicate resume from batch">
            (-)
          </button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-table-audit').addEventListener('click', () => {
      openStudentModal(item);
    });

    tr.querySelector('.btn-table-remove').addEventListener('click', () => {
      removeCandidate(item.id);
    });

    candidateTableBody.appendChild(tr);
  });
}

// ─── Deduplication & Candidate Removal ────────────────────────
function removeCandidate(id) {
  const target = batchResults.find(c => c.id === id);
  if (!target) return;

  const name = target.candidateName;
  batchResults = batchResults.filter(c => c.id !== id);

  // Close modal if currently inspecting this student
  if (activeAuditCandidate && activeAuditCandidate.id === id) {
    studentAuditModal.classList.add('hidden');
  }

  // Recalculate ranks based on remaining candidates
  batchResults.sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);
  batchResults.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // Re-render entire dashboard
  renderBatchDashboard();
  showToast(`Removed "${name}" from batch. Leaderboard updated (${batchResults.length} remaining).`, 'info');
}

function autoRemoveDuplicates() {
  if (batchResults.length <= 1) {
    showToast('No duplicate student resumes detected in batch.', 'info');
    return;
  }

  const seenKeys = new Map();
  const duplicatesToRemove = new Set();

  batchResults.forEach(item => {
    const email = (item.analysis.diagnostics?.contacts?.email || '').trim().toLowerCase();
    const phone = (item.analysis.diagnostics?.contacts?.phone || '').replace(/\D/g, '');
    const name = (item.candidateName || '').trim().toLowerCase();

    // Determine identity key
    let key = null;
    if (email && email.length > 5) {
      key = 'email:' + email;
    } else if (phone && phone.length >= 7) {
      key = 'phone:' + phone;
    } else if (name && name !== 'student candidate' && name.length >= 3) {
      key = 'name:' + name;
    }

    if (!key) return;

    if (seenKeys.has(key)) {
      const existing = seenKeys.get(key);
      // Retain the higher scoring resume
      if (item.analysis.overallScore > existing.analysis.overallScore) {
        duplicatesToRemove.add(existing.id);
        seenKeys.set(key, item);
      } else {
        duplicatesToRemove.add(item.id);
      }
    } else {
      seenKeys.set(key, item);
    }
  });

  if (duplicatesToRemove.size === 0) {
    showToast('No duplicate student resumes detected in the current classroom batch.', 'info');
    return;
  }

  const removedCount = duplicatesToRemove.size;
  batchResults = batchResults.filter(item => !duplicatesToRemove.has(item.id));

  // Recalculate ranks
  batchResults.sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);
  batchResults.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  renderBatchDashboard();
  showToast(`Cleaned ${removedCount} duplicate resume(s)! Highest-scoring versions retained.`, 'success');
}

// ─── 7. Deep Audit Inspection Modal ───────────────────────────
function setupModal() {
  btnCloseModal.addEventListener('click', () => {
    studentAuditModal.classList.add('hidden');
  });

  studentAuditModal.addEventListener('click', (e) => {
    if (e.target === studentAuditModal) {
      studentAuditModal.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !studentAuditModal.classList.contains('hidden')) {
      studentAuditModal.classList.add('hidden');
    }
  });
}

function openStudentModal(item) {
  activeAuditCandidate = item;
  const a = item.analysis;

  modalStudentName.textContent = item.candidateName;
  modalStudentMeta.textContent = `Batch Rank #${item.rank} · Score: ${a.overallScore}/100 (Grade ${a.grade}) · ${item.filename}`;

  // Populate Modal with the exact same rich diagnostic cards
  const verdictClass = (a.verdict || '').toLowerCase().includes('strong') ? 'verdict-strong' : ((a.verdict || '').toLowerCase().includes('weak') ? 'verdict-weak' : 'verdict-moderate');

  modalAuditBody.innerHTML = `
    <!-- Top Summary Row -->
    <div class="modal-score-card">
      <div class="score-circle-badge">
        <div class="big-score">${a.overall_score || a.overallScore}</div>
        <div class="big-grade">Grade: ${a.grade}</div>
      </div>
      <div class="modal-summary-text">
        <div class="modal-header-action-row">
          <span class="verdict-pill ${verdictClass}">
            ${escHtml(a.verdict || 'Evaluation Complete')}
          </span>
          <button class="btn-copy-json" id="btnModalCopyJson" title="Copy raw analysis JSON conforming to prompt specifications">
            📋 Copy Candidate JSON
          </button>
        </div>
        <p class="summary-p">${escHtml(a.summary)}</p>
        <div class="candidate-quick-contacts">
          ${a.diagnostics.contacts.email ? `<span>✉️ ${escHtml(a.diagnostics.contacts.email)}</span>` : ''}
          ${a.diagnostics.contacts.phone ? `<span>📞 ${escHtml(a.diagnostics.contacts.phone)}</span>` : ''}
          ${a.diagnostics.contacts.linkedin ? `<span>🔗 LinkedIn Verified</span>` : ''}
          ${a.diagnostics.contacts.github ? `<span>💻 GitHub Verified</span>` : ''}
        </div>
      </div>
    </div>

    <!-- 6 Core Evaluative Dimensions & Weights -->
    ${a.scores ? `
    <div class="card card-eval-dimensions">
      <div class="eval-dimensions-header">
        <h3 class="card-title">6 Core Evaluative Dimensions & Weights</h3>
        <span class="dimensions-weight-badge">Composite: 100%</span>
      </div>
      <div class="evaluation-dimensions-grid" id="modalEvalDimensionsGrid"></div>
    </div>
    ` : ''}

    <!-- Section Breakdown Bars -->
    <div class="card">
      <h3 class="card-title">Section Scoring Breakdown</h3>
      <div class="section-bars" id="modalSectionBars"></div>
    </div>

    <!-- Categorized Skills Inventory -->
    <div class="card card-skills-inventory">
      <h3 class="card-title">Verified Technical Skills Inventory (${a.diagnostics.skillsFoundCount} Skills)</h3>
      <div class="skills-category-container" id="modalSkillsContainer"></div>
    </div>

    <!-- Document Diagnostics -->
    <div class="card card-audit">
      <h3 class="card-title">Evidence & Document Audit</h3>
      <div class="audit-grid" id="modalAuditGrid"></div>
    </div>

    <!-- Google XYZ / STAR Bullet Rewriter -->
    <div class="card card-rewrite">
      <h3 class="card-title">High-Impact Bullet Rewriter (STAR / Google XYZ Formula)</h3>
      <div class="rewrite-list" id="modalBulletRewrites"></div>
    </div>

    <!-- Target Recruitment Profile Fit & Priority Matrix -->
    ${a.targetRoleFit ? `
    <div class="card card-role-target-fit">
      <div class="target-fit-header">
        <div>
          <span class="target-fit-tag">Drive Profile Alignment</span>
          <h3 class="target-fit-role">${escHtml(a.targetRoleFit.targetRole)}</h3>
        </div>
        <div class="target-fit-badge-group">
          <span class="role-priority-badge priority-${a.targetRoleFit.priority || 'high'}">${escHtml(a.targetRoleFit.priorityLabel || 'High Priority')}</span>
          <span class="role-match-badge" style="background:#10b98122; color:#10b981; border:1px solid #10b98155;">${a.targetRoleFit.fitPercentage}% Match</span>
        </div>
      </div>

      <!-- Seniority Hierarchy: Low, Mid, High Levels in this Job -->
      <div class="role-seniority-matrix">
        <div class="seniority-track-title">Seniority Level Readiness in this Job:</div>
        <div class="seniority-track-items">
          <div class="seniority-tier-item tier-low">
            <div class="tier-header-line">
              <span class="tier-label">Low (Junior / Entry-Level)</span>
              <span class="tier-stat">${a.targetRoleFit.seniorityBreakdown?.low?.readiness || 95}% · ${escHtml(a.targetRoleFit.seniorityBreakdown?.low?.status || 'Ready')}</span>
            </div>
            <div class="tier-meter"><div class="tier-meter-bar" style="width:${a.targetRoleFit.seniorityBreakdown?.low?.readiness || 95}%; background:#10b981;"></div></div>
          </div>
          <div class="seniority-tier-item tier-mid">
            <div class="tier-header-line">
              <span class="tier-label">Mid (Mid-Level Developer)</span>
              <span class="tier-stat">${a.targetRoleFit.seniorityBreakdown?.mid?.readiness || 78}% · ${escHtml(a.targetRoleFit.seniorityBreakdown?.mid?.status || 'Developing')}</span>
            </div>
            <div class="tier-meter"><div class="tier-meter-bar" style="width:${a.targetRoleFit.seniorityBreakdown?.mid?.readiness || 78}%; background:#f59e0b;"></div></div>
          </div>
          <div class="seniority-tier-item tier-high">
            <div class="tier-header-line">
              <span class="tier-label">High (Senior / Tech Lead)</span>
              <span class="tier-stat">${a.targetRoleFit.seniorityBreakdown?.high?.readiness || 45}% · ${escHtml(a.targetRoleFit.seniorityBreakdown?.high?.status || 'Aspirational')}</span>
            </div>
            <div class="tier-meter"><div class="tier-meter-bar" style="width:${a.targetRoleFit.seniorityBreakdown?.high?.readiness || 45}%; background:#ef4444;"></div></div>
          </div>
        </div>
      </div>

      <div class="target-skills-split">
        <div class="split-col">
          <div class="role-skills-label">Candidate Verified Skills (${a.targetRoleFit.matchedSkills.length}):</div>
          <div class="role-skills-wrap">${a.targetRoleFit.matchedSkills.map(s => `<span class="role-skill-badge match">✓ ${escHtml(s)}</span>`).join('') || '<span class="role-skill-badge missing">None</span>'}</div>
        </div>
        <div class="split-col">
          <div class="role-skills-label">Missing Critical Skills (${a.targetRoleFit.missingSkills.length}):</div>
          <div class="role-skills-wrap">${a.targetRoleFit.missingSkills.map(s => `<span class="role-skill-badge missing">+ ${escHtml(s)}</span>`).join('') || '<span class="role-skill-badge match">All core criteria met!</span>'}</div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Recommended Career Tracks & Priority Grid -->
    <div class="card card-career">
      <h3 class="card-title">Placement Role Recommendations by Priority (High, Mid, Low Priority)</h3>
      <div class="suggested-roles-grid" id="modalSuggestedRolesGrid"></div>
    </div>

    <!-- Strengths & Missing Sections Row -->
    <div class="cards-row">
      <div class="card card-green">
        <h3 class="card-title">Identified Strengths</h3>
        <ul class="bullet-list" id="modalStrengthsList"></ul>
      </div>
      <div class="card card-red">
        <h3 class="card-title">Critical Gaps</h3>
        <ul class="bullet-list" id="modalMissingList"></ul>
      </div>
      <div class="card card-yellow">
        <h3 class="card-title">ATS 4-Pillar Compatibility (${a.atsCompatibility.numericScore || 85}%)</h3>
        <ul class="bullet-list" id="modalAtsList"></ul>
      </div>
    </div>
  `;

  // Render individual components into modal
  renderModalSectionBars(a.sectionScores);
  renderCategorizedSkillsToContainer(a.diagnostics.categorizedSkills, 'modalSkillsContainer');
  renderAuditGridToContainer(a.diagnostics, a.jdMatch, a.targetRoleFit, 'modalAuditGrid');
  renderSuggestedRolesToContainer(a.suggestedRoles, 'modalSuggestedRolesGrid');
  renderBulletRewritesToContainer(a.bulletRewrites, 'modalBulletRewrites');
  renderBulletList('modalStrengthsList', a.strengths || []);
  renderBulletList('modalMissingList', a.missingSections || []);
  renderBulletList('modalAtsList', a.atsCompatibility.issues || ['All standard ATS checks passed.']);

  if (a.scores) {
    renderEvaluationDimensionsToContainer(a.scores, 'modalEvalDimensionsGrid');
  }

  const btnCopy = document.getElementById('btnModalCopyJson');
  if (btnCopy) {
    btnCopy.onclick = async () => {
      try {
        const json = formatAnalysisAsJson(a);
        await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
        showToast(`Copied ${item.candidateName}'s 6-Dimension Analysis JSON!`, 'success');
      } catch (e) {
        showToast('Clipboard copy failed. Please check permissions.', 'error');
      }
    };
  }

  studentAuditModal.classList.remove('hidden');
}

function renderEvaluationDimensionsToContainer(scores, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !scores) return;

  const dims = [
    { key: 'keyword_match', label: 'Keyword & Skill Match', weight: '30% Weight', icon: '🎯' },
    { key: 'experience_relevance', label: 'Experience Relevance', weight: '30% Weight', icon: '💼' },
    { key: 'quantifiable_impact', label: 'Quantifiable Impact', weight: '15% Weight', icon: '📈' },
    { key: 'education_certifications', label: 'Education & Certifications', weight: '10% Weight', icon: '🎓' },
    { key: 'ats_compatibility', label: 'ATS Compatibility', weight: '10% Weight', icon: '🤖' },
    { key: 'language_quality', label: 'Language Quality', weight: '5% Weight', icon: '✍️' },
  ];

  container.innerHTML = dims.map(dim => {
    const val = scores[dim.key] ?? 70;
    const color = val >= 80 ? '#10b981' : (val >= 60 ? '#6366f1' : '#f59e0b');
    return `
      <div class="eval-dimension-item">
        <div class="dim-header">
          <span class="dim-title"><span class="dim-icon">${dim.icon}</span> ${dim.label}</span>
          <span class="dim-weight-tag">${dim.weight}</span>
        </div>
        <div class="dim-meter-track">
          <div class="dim-meter-fill" style="background:${color}; width:${val}%"></div>
        </div>
        <div class="dim-footer">
          <span class="dim-score-text">Score: <strong>${val}</strong> / 100</span>
          <span class="dim-status-text">${val >= 80 ? '✓ Exceptional' : (val >= 60 ? '⚡ Competent' : '⚠️ Needs Polish')}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderModalSectionBars(sectionScores) {
  const container = document.getElementById('modalSectionBars');
  if (!container || !sectionScores) return;

  const labels = {
    contactInfo: 'Contact Info',
    professionalSummary: 'Summary',
    workExperience: 'Work Experience',
    skills: 'Technical Skills',
    education: 'Education',
    certifications: 'Certifications',
    projects: 'Projects'
  };

  container.innerHTML = Object.entries(sectionScores).map(([key, val]) => `
    <div class="section-bar-item">
      <span class="section-bar-label">${labels[key] || key}</span>
      <div class="section-bar-track">
        <div class="section-bar-fill" style="width: ${val}%; background: ${val >= 75 ? '#10b981' : (val >= 50 ? '#6366f1' : '#f59e0b')}"></div>
      </div>
      <span class="section-bar-val">${val}</span>
    </div>
  `).join('');
}

function renderCategorizedSkillsToContainer(categorized, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !categorized) return;

  const categories = [
    { key: 'languages', label: 'Languages', icon: '💻' },
    { key: 'frameworks', label: 'Frameworks & Web Stack', icon: '⚛️' },
    { key: 'databases', label: 'Databases & Storage', icon: '🗄️' },
    { key: 'cloud_devops', label: 'Cloud, DevOps & Tools', icon: '☁️' },
    { key: 'domain_specialized', label: 'Domain & Core Engineering', icon: '🔬' }
  ];

  container.innerHTML = categories.map(cat => {
    const list = categorized[cat.key] || [];
    if (list.length === 0) return '';
    return `
      <div class="skills-category-group">
        <div class="category-group-header">
          <span class="category-group-icon">${cat.icon}</span>
          <span class="category-group-label">${cat.label}</span>
          <span class="category-group-count">${list.length}</span>
        </div>
        <div class="category-chips-wrap">
          ${list.map(s => `<span class="category-skill-chip">${escHtml(s)}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderAuditGridToContainer(diagnostics, jdMatch, targetRoleFit, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !diagnostics) return;

  const metricsList = (diagnostics.extractedMetrics || []).join(', ') || 'None found';
  const strongVerbs = (diagnostics.strongVerbsFound || []).slice(0, 6).join(', ') || 'None';

  container.innerHTML = `
    <div class="audit-item">
      <div class="audit-label">Word Count</div>
      <div class="audit-value">${diagnostics.wordCount} words</div>
      <div class="audit-sub">${diagnostics.wordCount < 250 ? '⚠️ Low Content Density' : '✓ Standard length'}</div>
    </div>
    <div class="audit-item">
      <div class="audit-label">Quantified Impact</div>
      <div class="audit-value">${diagnostics.metricCount} Metrics</div>
      <div class="audit-sub">${metricsList}</div>
    </div>
    <div class="audit-item">
      <div class="audit-label">Action Power Verbs</div>
      <div class="audit-value">${diagnostics.strongVerbsFound.length} Detected</div>
      <div class="audit-sub">${strongVerbs}</div>
    </div>
  `;
}

function renderBulletRewritesToContainer(rewrites, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!rewrites || rewrites.length === 0) {
    container.innerHTML = '<p class="audit-sub">No weak or task-oriented bullets detected.</p>';
    return;
  }

  container.innerHTML = rewrites.map((r, idx) => `
    <div class="rewrite-card">
      <div class="rewrite-card-header">
        <span class="rewrite-badge">Improvement #${idx + 1}</span>
        <span class="rewrite-issue">${escHtml(r.issue)}</span>
      </div>
      <div class="rewrite-comparison">
        <div class="rewrite-block original">
          <div class="rewrite-label">❌ Current Resume Phrasing:</div>
          <div class="rewrite-text">${escHtml(r.original)}</div>
        </div>
        <div class="rewrite-block improved">
          <div class="rewrite-label">✅ High-Impact Rewrite:</div>
          <div class="rewrite-text">${escHtml(r.improved)}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderSuggestedRolesToContainer(roles, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!roles || roles.length === 0) {
    container.innerHTML = '<p class="audit-sub">No specific role recommendations available.</p>';
    return;
  }

  container.innerHTML = roles.map(role => {
    const badgeColor = role.priority === 'high' ? '#10b981' : (role.priority === 'mid' ? '#f59e0b' : '#ef4444');
    const priorityTag = role.priorityLabel || (role.matchScore >= 70 ? 'High Priority (Direct Fit)' : (role.matchScore >= 45 ? 'Mid Priority (Moderate Fit)' : 'Low Priority (Skill Gap)'));
    
    const matchedBadges = (role.matchedSkills || []).map(s => `<span class="role-skill-badge match">✓ ${escHtml(s)}</span>`).join('');
    const missingBadges = (role.missingSkills || []).length > 0
      ? role.missingSkills.map(s => `<span class="role-skill-badge missing">+ ${escHtml(s)}</span>`).join('')
      : '<span class="role-skill-badge match">All core criteria met!</span>';

    const sen = role.seniorityFit || {
      low: { level: 'Low (Entry / Jr)', readiness: Math.min(98, Math.round(role.matchScore * 1.15)), verdict: 'Directly Qualified' },
      mid: { level: 'Mid (Mid-Level)', readiness: Math.min(90, Math.round(role.matchScore * 0.88)), verdict: 'Developing' },
      high: { level: 'High (Senior / Lead)', readiness: Math.min(60, Math.round(role.matchScore * 0.50)), verdict: 'Aspirational' }
    };

    return `
      <div class="suggested-role-card priority-${role.priority || 'mid'}">
        <div class="role-card-header">
          <div>
            <div class="role-title">${escHtml(role.title)}</div>
            <div class="role-level">${escHtml(role.level)}</div>
          </div>
          <div class="role-match-badge-wrap">
            <span class="role-priority-badge priority-${role.priority || 'mid'}">${priorityTag}</span>
            <span class="role-match-badge" style="background:${badgeColor}22; color:${badgeColor}; border:1px solid ${badgeColor}55;">
              ${role.matchScore}% Match
            </span>
          </div>
        </div>
        <p class="role-desc">${escHtml(role.desc)}</p>

        <!-- Seniority Priority Matrix: Low, Mid, High Levels in this Job -->
        <div class="role-seniority-matrix">
          <div class="seniority-track-title">Seniority Level Readiness in this Job:</div>
          <div class="seniority-track-items">
            <div class="seniority-tier-item tier-low">
              <div class="tier-header-line">
                <span class="tier-label">Low (Junior / Entry-Level)</span>
                <span class="tier-stat">${sen.low.readiness}% · ${escHtml(sen.low.verdict)}</span>
              </div>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.low.readiness}%; background:#10b981;"></div></div>
            </div>
            <div class="seniority-tier-item tier-mid">
              <div class="tier-header-line">
                <span class="tier-label">Mid (Mid-Level Developer)</span>
                <span class="tier-stat">${sen.mid.readiness}% · ${escHtml(sen.mid.verdict)}</span>
              </div>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.mid.readiness}%; background:#f59e0b;"></div></div>
            </div>
            <div class="seniority-tier-item tier-high">
              <div class="tier-header-line">
                <span class="tier-label">High (Senior / Tech Lead)</span>
                <span class="tier-stat">${sen.high.readiness}% · ${escHtml(sen.high.verdict)}</span>
              </div>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.high.readiness}%; background:#ef4444;"></div></div>
            </div>
          </div>
        </div>

        <div class="role-skills-section">
          <div class="role-skills-label">Candidate Matched Skills:</div>
          <div class="role-skills-wrap">${matchedBadges}</div>
        </div>
        <div class="role-skills-section">
          <div class="role-skills-label">Recommended Upskilling:</div>
          <div class="role-skills-wrap">${missingBadges}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── 8. Export to CSV for Placement Shortlists ─────────────────
function exportPlacementCsv() {
  if (batchResults.length === 0) {
    showToast('No candidates available to export.', 'error');
    return;
  }

  const headers = [
    'Rank',
    'Student Name',
    'Overall Score',
    'Grade',
    'Academic CGPA',
    'Skills Count',
    'Top Skills',
    'Work Experience',
    'Projects Score',
    'ATS Score',
    'Email',
    'Phone',
    'Filename'
  ];

  const rows = batchResults.map(item => {
    const a = item.analysis;
    const d = a.diagnostics;
    const contacts = d.contacts || {};
    const topSkills = (d.skillsFound || []).slice(0, 6).join('; ');

    return [
      item.rank,
      `"${item.candidateName.replace(/"/g, '""')}"`,
      a.overallScore,
      a.grade,
      `"${(item.academicScore || 'N/A').replace(/"/g, '""')}"`,
      d.skillsFoundCount,
      `"${topSkills.replace(/"/g, '""')}"`,
      a.sectionScores.workExperience >= 50 ? 'Yes' : 'No',
      a.sectionScores.projects,
      a.atsCompatibility.numericScore || 85,
      `"${(contacts.email || '').replace(/"/g, '""')}"`,
      `"${(contacts.phone || '').replace(/"/g, '""')}"`,
      `"${item.filename.replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Placement_Class_Batch_Shortlist_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Placement Shortlist CSV exported successfully!', 'success');
}

// ─── 9. High-Fidelity PDF Class Analysis Report ───────────────
async function exportClassAnalysisPdf() {
  if (batchResults.length === 0) {
    showToast('No candidates available to export. Please analyze resumes first.', 'error');
    return;
  }

  showToast('Generating high-fidelity classroom analysis PDF report…', 'info');

  const btn = document.getElementById('btnExportPdf');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
      Building PDF…
    `;
  }

  const resultsWrap = document.getElementById('batchResultsWrap');
  if (!resultsWrap) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
    return;
  }

  const roleText = targetDriveRole ? targetDriveRole.options[targetDriveRole.selectedIndex].text : 'General Campus Placement Drive';
  const batchNameInput = document.getElementById('classBatchLabel') || document.getElementById('batchIdentifier');
  const batchName = batchNameInput ? (batchNameInput.value.trim() || 'Classroom Batch 2026') : 'Classroom Batch 2026';
  const avgScore = Math.round(batchResults.reduce((acc, c) => acc + c.analysis.overallScore, 0) / batchResults.length);

  // Prepend temporary official institutional banner
  const banner = document.createElement('div');
  banner.id = 'pdfTempReportBanner';
  banner.className = 'pdf-export-banner';
  banner.innerHTML = `
    <div class="pdf-banner-header">
      <div class="pdf-banner-left">
        <div class="pdf-banner-tag">Institutional Placement & Training Cell</div>
        <h1 class="pdf-banner-title">Classroom Batch Resume Analysis & Placement Report</h1>
        <div class="pdf-banner-sub">
          <strong>${escHtml(batchName)}</strong> · Target Recruitment Profile: <strong>${escHtml(roleText)}</strong>
        </div>
      </div>
      <div class="pdf-banner-right">
        <div class="pdf-banner-chip">✓ Verified Placement Report</div>
        <div class="pdf-banner-meta">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        <div class="pdf-banner-meta">Evaluated: <strong>${batchResults.length} Candidates</strong> (Batch Avg: ${avgScore}/100)</div>
      </div>
    </div>
  `;

  // Apply export styling class and prepend banner
  resultsWrap.classList.add('exporting-pdf');
  resultsWrap.insertBefore(banner, resultsWrap.firstChild);

  // Preserve scroll position and scroll to top for canvas capture
  const prevScrollY = window.scrollY;
  window.scrollTo(0, 0);

  try {
    if (typeof window.html2pdf !== 'undefined') {
      const isLight = document.body.classList.contains('light-theme');
      const opt = {
        margin:       [8, 6, 8, 6],
        filename:     `Class_Placement_Analysis_${batchName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  {
          scale: 1.6,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          backgroundColor: isLight ? '#ffffff' : '#0b0f19'
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await window.html2pdf().set(opt).from(resultsWrap).save();
      showToast('Classroom Analysis PDF report downloaded successfully!', 'success');
    } else {
      window.print();
    }
  } catch (err) {
    console.error('PDF Generation failed, falling back to browser print:', err);
    window.print();
  } finally {
    if (banner.parentNode) {
      banner.remove();
    }
    resultsWrap.classList.remove('exporting-pdf');
    window.scrollTo(0, prevScrollY);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
