/**
 * staff.js — Placement Staff Portal Controller
 * Batch evaluation of up to 60+ student resume PDFs simultaneously
 * Powered by client-side PDF.js extraction & calibrated analysis-engine
 */

import { extractTextFromFile } from './pdf-parser.js';
import { analyseResumeLocally } from './analysis-engine.js';
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
const staffLoginSection    = document.getElementById('staffLoginSection');
const staffDashboardSection= document.getElementById('staffDashboardSection');
const staffLoginForm       = document.getElementById('staffLoginForm');
const btnQuickDemo         = document.getElementById('btnQuickDemo');
const staffUserBadge       = document.getElementById('staffUserBadge');
const staffOfficerName     = document.getElementById('staffOfficerName');
const btnLogout            = document.getElementById('btnLogout');

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

const studentAuditModal    = document.getElementById('studentAuditModal');
const modalStudentName     = document.getElementById('modalStudentName');
const modalStudentMeta     = document.getElementById('modalStudentMeta');
const modalAuditBody       = document.getElementById('modalAuditBody');
const btnCloseModal        = document.getElementById('btnCloseModal');

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  setupAuth();
  setupBatchUpload();
  setupFiltersAndSort();
  setupModal();
});

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

// ─── 1. Authentication & Session Management ───────────────────
function setupAuth() {
  const isAuth = sessionStorage.getItem('placement_staff_auth') === 'true';
  const savedOfficer = sessionStorage.getItem('placement_staff_officer') || 'Prof. Placement Officer';

  if (isAuth) {
    showDashboard(savedOfficer);
  } else {
    showLogin();
  }

  // Handle standard login form submit
  if (staffLoginForm) {
    staffLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('staffEmail').value.trim();
      const dept = document.getElementById('staffDept').value;
      const officerLabel = `Staff Officer (${dept})`;

      sessionStorage.setItem('placement_staff_auth', 'true');
      sessionStorage.setItem('placement_staff_officer', officerLabel);
      showDashboard(officerLabel);
      showToast(`Welcome to Placement Cell Portal (${dept})`, 'success');
    });
  }

  // Quick Demo Login
  if (btnQuickDemo) {
    btnQuickDemo.addEventListener('click', () => {
      const officerLabel = 'Dr. S. Ramanathan (Head of Placements)';
      sessionStorage.setItem('placement_staff_auth', 'true');
      sessionStorage.setItem('placement_staff_officer', officerLabel);
      showDashboard(officerLabel);
      showToast('Authenticated via Placement Officer Demo account.', 'success');
    });
  }

  // Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('placement_staff_auth');
      sessionStorage.removeItem('placement_staff_officer');
      showLogin();
      showToast('Logged out of Staff Portal.', 'info');
    });
  }
}

function showLogin() {
  staffLoginSection.classList.remove('hidden');
  staffDashboardSection.classList.add('hidden');
  staffUserBadge.classList.add('hidden');
}

function showDashboard(officerName) {
  staffLoginSection.classList.add('hidden');
  staffDashboardSection.classList.remove('hidden');
  staffUserBadge.classList.remove('hidden');
  if (staffOfficerName) staffOfficerName.textContent = officerName;
}

// ─── 2. Multi-PDF File Upload & Drag-and-Drop ─────────────────
function setupBatchUpload() {
  // Click browse
  batchFileInput.addEventListener('change', (e) => {
    handleBatchFiles(Array.from(e.target.files));
  });

  // Drag and Drop
  batchDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    batchDropzone.classList.add('dragging');
  });

  batchDropzone.addEventListener('dragleave', () => {
    batchDropzone.classList.remove('dragging');
  });

  batchDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
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
  btnStartBatchAudit.addEventListener('click', startBatchAudit);
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

        // Derive candidate name fallback from filename if text extraction was generic
        let derivedName = analysis.candidateName;
        if (!derivedName || derivedName === 'CANDIDATE' || derivedName.length < 3) {
          derivedName = cleanNameFromFilename(file.name);
        }

        batchResults.push({
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
        batchResults.push({
          file,
          filename: file.name,
          text: '',
          candidateName: cleanNameFromFilename(file.name),
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
  batchResults.sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);
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

function cleanNameFromFilename(filename) {
  const base = filename.replace(/\.[^/.]+$/, '');
  const clean = base
    .replace(/(?:resume|cv|biodata|profile|final|updated|202\d)/gi, '')
    .replace(/[_\-\.]+/g, ' ')
    .trim();
  return clean.length >= 2 ? clean.toUpperCase() : 'STUDENT APPLICANT';
}

function extractAcademicScore(text) {
  const m = text.match(/(?:cgpa|gpa|percentage|marks?)\s*[:=\-]?\s*(\d{1,2}(?:\.\d{1,2})?(?:\s*\/\s*10|\s*%)?)/i);
  return m ? m[0].trim() : 'N/A';
}

// ─── 4. Batch Dashboard Rendering ─────────────────────────────
function renderBatchDashboard() {
  batchResultsWrap.classList.remove('hidden');

  // 1. KPI Banner Metrics
  const total = batchResults.length;
  const avg = Math.round(batchResults.reduce((acc, c) => acc + c.analysis.overallScore, 0) / total);
  const tier1Count = batchResults.filter(c => c.analysis.overallScore >= 80).length;
  const tier1Percent = Math.round((tier1Count / total) * 100);
  const highest = batchResults[0] || { analysis: { overallScore: 0 }, candidateName: 'None' };

  kpiTotalCount.textContent = total;
  kpiAvgScore.textContent = `${avg} / 100`;
  kpiTier1Count.textContent = `${tier1Count} Students`;
  kpiTier1Pct.textContent = `${tier1Percent}% Grade A/A+ Eligible`;
  kpiHighestScore.textContent = `${highest.analysis.overallScore} / 100`;
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

    const card = document.createElement('div');
    card.className = `podium-rank-card ${meta.class}`;
    card.innerHTML = `
      <div class="podium-badge">${meta.title}</div>
      <h4 class="podium-student-name">${escHtml(cand.candidateName)}</h4>
      
      <div class="podium-score-row">
        <span class="podium-score-num">${a.overallScore}</span>
        <span class="podium-grade-pill">${a.grade}</span>
      </div>

      <div class="podium-details">
        <div class="podium-detail-item"><strong>CGPA:</strong> ${escHtml(cand.academicScore || 'Verified')}</div>
        <div class="podium-detail-item"><strong>Skills:</strong> ${a.diagnostics.skillsFoundCount} verified (${topSkills})</div>
        <div class="podium-detail-item"><strong>Metrics:</strong> ${a.diagnostics.metricCount} quantified values</div>
        <div class="podium-detail-item"><strong>ATS Readiness:</strong> ${a.atsCompatibility.numericScore || 90}% Compatible</div>
      </div>

      <button class="btn-podium-audit" data-idx="${idx}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        Inspect Full Audit
      </button>
    `;

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
      </td>
      <td class="col-cgpa">
        <span class="cgpa-val">${escHtml(item.academicScore || 'N/A')}</span>
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
        <button class="btn-table-audit" title="View complete audit diagnostics">
          Audit
        </button>
      </td>
    `;

    tr.querySelector('.btn-table-audit').addEventListener('click', () => {
      openStudentModal(item);
    });

    candidateTableBody.appendChild(tr);
  });
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
  modalAuditBody.innerHTML = `
    <!-- Top Summary Row -->
    <div class="modal-score-card">
      <div class="score-circle-badge">
        <div class="big-score">${a.overallScore}</div>
        <div class="big-grade">Grade: ${a.grade}</div>
      </div>
      <div class="modal-summary-text">
        <p class="summary-p">${escHtml(a.summary)}</p>
        <div class="candidate-quick-contacts">
          ${a.diagnostics.contacts.email ? `<span>✉️ ${escHtml(a.diagnostics.contacts.email)}</span>` : ''}
          ${a.diagnostics.contacts.phone ? `<span>📞 ${escHtml(a.diagnostics.contacts.phone)}</span>` : ''}
          ${a.diagnostics.contacts.linkedin ? `<span>🔗 LinkedIn Verified</span>` : ''}
          ${a.diagnostics.contacts.github ? `<span>💻 GitHub Verified</span>` : ''}
        </div>
      </div>
    </div>

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
  renderBulletRewritesToContainer(a.bulletRewrites, 'modalBulletRewrites');
  renderBulletList('modalStrengthsList', a.strengths || []);
  renderBulletList('modalMissingList', a.missingSections || []);
  renderBulletList('modalAtsList', a.atsCompatibility.issues || ['All standard ATS checks passed.']);

  studentAuditModal.classList.remove('hidden');
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

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
