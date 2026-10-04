/**
 * best-matching.js
 * Dedicated Best Matching Jobs Hub
 * Ranks and renders the highest-compatibility jobs based on the candidate's verified resume profile.
 */

import { COMPANY_LOGOS, OPPORTUNITIES_DATA, escHtml } from './opportunities.js';

let candidateProfile = null;
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'match'; // Default: Highest match % first!

// ─── Initialization ───
document.addEventListener('DOMContentLoaded', () => {
  loadCandidateProfile();
  renderHeroBar();
  initSearchAndFilters();
  initCategoryTabs();
  initSorting();
  initModal();

  // Render initial sorted best-matching list
  renderBestMatchingJobs();
});

// ─── 1. Load Candidate Profile ───
function loadCandidateProfile() {
  try {
    const raw = localStorage.getItem('resumereviewer_candidate_profile');
    if (raw) {
      candidateProfile = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not parse candidate profile', e);
  }

  // Session fallback if localStorage was cleared
  if (!candidateProfile) {
    try {
      const savedAnalysis = sessionStorage.getItem('resumereviewer_saved_analysis');
      if (savedAnalysis) {
        const data = JSON.parse(savedAnalysis);
        const flatSkills = [];
        if (data.diagnostics?.categorizedSkills) {
          Object.values(data.diagnostics.categorizedSkills).forEach(cat => {
            if (cat?.items) cat.items.forEach(it => { if (it?.name) flatSkills.push(it.name); });
          });
        }
        candidateProfile = {
          candidateName: data.contact?.name || data.candidateName || 'Candidate',
          targetRole: data.targetRoleFit?.targetRole || (data.suggestedRoles?.[0]?.title) || 'Software Engineer',
          suggestedRoles: data.suggestedRoles || [],
          flatSkills: Array.from(new Set(flatSkills)),
          overallScore: data.overall_score || data.overallScore || 85,
          atsGrade: data.grade || 'A'
        };
      }
    } catch (e) {
      console.warn('Session fallback parsing error', e);
    }
  }
}

// ─── 2. Render Hero Match Bar ───
function renderHeroBar() {
  const bar = document.getElementById('bestMatchHeroBar');
  if (!bar) return;

  if (candidateProfile && candidateProfile.flatSkills && candidateProfile.flatSkills.length > 0) {
    const score = candidateProfile.overallScore || 85;
    const scoreColor = score >= 80 ? '#10b981' : (score >= 60 ? '#f59e0b' : '#ef4444');
    const flatSkills = candidateProfile.flatSkills || [];
    const skillsSnippet = flatSkills.slice(0, 8).map(s => `<span class="match-skill-pill">${escHtml(s)}</span>`).join('');
    const extraCount = Math.max(0, flatSkills.length - 8);
    const candidateName = candidateProfile.candidateName || 'Candidate';
    const targetRole = candidateProfile.targetRole || (candidateProfile.suggestedRoles?.[0]?.title) || 'Software Engineer';

    bar.innerHTML = `
      <div class="match-bar-loaded">
        <div class="match-score-badge" style="background:${scoreColor}18; border-color:${scoreColor}55; color:${scoreColor};">
          <div class="score-val">${score}%</div>
          <div class="score-tag">ATS Match</div>
        </div>
        <div class="match-details">
          <div class="match-title-row">
            <span class="match-head-title">Personalized for <strong>${escHtml(candidateName)}</strong></span>
            <span class="match-role-tag">Target: <strong>${escHtml(targetRole)}</strong></span>
          </div>
          <div class="match-sub-text">
            Based on <strong>${flatSkills.length} verified technical skills</strong> and project portfolio in your resume. Below roles are ranked with full job descriptions and compatibility breakdown.
          </div>
          <div class="match-skills-row">
            ${skillsSnippet}
            ${extraCount > 0 ? `<span class="match-skill-extra">+${extraCount} more</span>` : ''}
          </div>
        </div>
        <div class="match-actions">
          <a href="index.html" class="reanalyse-btn" title="Return to resume analysis">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Reviewer
          </a>
        </div>
      </div>
    `;
  } else {
    bar.innerHTML = `
      <div class="match-bar-empty">
        <div class="empty-badge-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="empty-info">
          <div class="empty-title">Viewing Standard Role Compatibility</div>
          <div class="empty-desc">Upload your resume in the Candidate Reviewer to automatically compute your exact skill match percentage, identify bridgeable gaps, and prepare for company-specific interview rounds.</div>
        </div>
        <a href="index.html" class="btn-match-cta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Evaluate Resume Now</span>
        </a>
      </div>
    `;
  }
}

// ─── 3. Dynamic Match Calculation with Personalized Rationale ───
function calculateJobMatch(job) {
  const hasResume = Boolean(candidateProfile && candidateProfile.flatSkills && candidateProfile.flatSkills.length > 0);

  if (!hasResume) {
    return {
      hasResumeMatch: false,
      matchPercentage: 75,
      matchedSkills: job.requiredSkills.slice(0, 3),
      missingSkills: job.requiredSkills.slice(3),
      rationale: `General high-demand tech stack requiring ${job.requiredSkills.slice(0, 3).join(', ')}.`
    };
  }

  const candidateSkills = (candidateProfile.flatSkills || []).map(s => s.toLowerCase());
  const jobSkills = job.requiredSkills || [];

  const matched = [];
  const missing = [];

  jobSkills.forEach(req => {
    const isFound = candidateSkills.some(cs => cs.includes(req.toLowerCase()) || req.toLowerCase().includes(cs));
    if (isFound) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  });

  const ratio = jobSkills.length > 0 ? (matched.length / jobSkills.length) : 0.6;
  // Blend with candidate overall score for realistic candidate-tailored ranking
  const candidateBase = candidateProfile.overallScore ? candidateProfile.overallScore / 100 : 0.85;
  const blendedRatio = (ratio * 0.7) + (candidateBase * 0.3);
  const matchPercentage = Math.min(98, Math.max(35, Math.round(blendedRatio * 100)));

  // Generate personalized rationale explaining why this job matches their resume
  let rationale = '';
  if (matched.length >= 3) {
    rationale = `Strong direct fit: Your verified proficiencies in <strong>${escHtml(matched.slice(0, 3).join(', '))}</strong> directly fulfill this role's core engineering stack.`;
  } else if (matched.length >= 1) {
    rationale = `Solid foundation: You meet core requirements in <strong>${escHtml(matched.join(', '))}</strong>. Adding <strong>${escHtml(missing.slice(0, 2).join(', '))}</strong> will position you as a top candidate.`;
  } else {
    rationale = `High-potential growth role: Focuses on foundational problem solving and <strong>${escHtml(jobSkills.slice(0, 2).join(', '))}</strong>.`;
  }

  return {
    hasResumeMatch: true,
    matchPercentage,
    matchedSkills: matched,
    missingSkills: missing,
    rationale
  };
}

// ─── 4. Render Best Matching Jobs Grid ───
function renderBestMatchingJobs() {
  const grid = document.getElementById('bestMatchJobsGrid');
  const emptyState = document.getElementById('bestMatchEmptyState');
  const countEl = document.getElementById('visibleJobsCount');
  const allCountEl = document.getElementById('allCount');
  const filterLabel = document.getElementById('bestMatchFilterLabel');

  if (!grid) return;

  if (allCountEl) allCountEl.textContent = OPPORTUNITIES_DATA.length;

  // Filter items
  let filtered = OPPORTUNITIES_DATA.filter(job => {
    // Category filter
    if (currentFilter !== 'all') {
      if (currentFilter === 'internship' && job.type !== 'internship') return false;
      if (currentFilter === 'fresher' && job.type !== 'fresher') return false;
      if (currentFilter === 'product' && job.category !== 'product') return false;
      if (currentFilter === 'high-package' && (job.salaryNumeric || 0) < 7.0) return false;
    }

    // Search filter
    if (currentSearch) {
      const haystack = `${job.title} ${job.company} ${job.requiredSkills.join(' ')} ${job.location} ${job.roleCategory} ${job.summary}`.toLowerCase();
      if (!haystack.includes(currentSearch)) return false;
    }

    return true;
  });

  // Calculate dynamic match scores & rationales
  filtered = filtered.map(job => {
    const matchData = calculateJobMatch(job);
    return { ...job, ...matchData };
  });

  // Sort: By default, highest match % first!
  if (currentSort === 'match') {
    filtered.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
  } else if (currentSort === 'stipend') {
    filtered.sort((a, b) => (b.salaryNumeric || 0) - (a.salaryNumeric || 0));
  } else if (currentSort === 'recent') {
    filtered.sort((a, b) => (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0));
  }

  // Update counter & label
  if (countEl) countEl.textContent = filtered.length;
  if (filterLabel) {
    if (currentFilter === 'internship') filterLabel.textContent = 'Best Matching Internships';
    else if (currentFilter === 'fresher') filterLabel.textContent = 'Best Matching Fresher Roles';
    else if (currentFilter === 'product') filterLabel.textContent = 'Best Matching Product Firms';
    else if (currentFilter === 'high-package') filterLabel.textContent = 'High Package Roles (₹7+ LPA)';
    else filterLabel.textContent = 'All Top Matches for Your Resume';
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Render cards
  grid.innerHTML = filtered.map((job, idx) => {
    // Official Logo rendering with fallbacks
    const logoSrc = COMPANY_LOGOS[job.brandKey] || `https://www.google.com/s2/favicons?domain=${job.domain || 'google.com'}&sz=128`;
    const logoContent = `
      <img src="${logoSrc}" 
           alt="${escHtml(job.company)} logo" class="company-logo-img" loading="eager" 
           onerror="this.onerror=null; this.src='https://www.google.com/s2/favicons?domain=${job.domain || 'google.com'}&sz=128';" />
    `;

    const matchBadgeColor = job.matchPercentage >= 85 ? '#10b981' : (job.matchPercentage >= 70 ? '#0284c7' : '#f59e0b');

    // Rank Pill configuration
    let rankLabel = '';
    let rankClass = 'top-general';
    let rankIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

    if (idx === 0) {
      rankLabel = '#1 TOP MATCH';
      rankClass = 'top-1';
    } else if (idx === 1) {
      rankLabel = '#2 TOP MATCH';
      rankClass = 'top-2';
    } else if (idx === 2) {
      rankLabel = '#3 TOP MATCH';
      rankClass = 'top-3';
    } else {
      rankLabel = 'HIGH ALIGNMENT';
      rankClass = 'top-general';
      rankIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    }

    const cleanBatch = job.batchEligibility ? job.batchEligibility.split('(')[0].trim() : '2025–2026 Batch';

    const skillsSectionHtml = `
      <div class="skills-label-line">
        <span>Verified Skills Match:</span>
        <span class="skills-ratio">${job.matchedSkills ? job.matchedSkills.length : 0} of ${job.requiredSkills.length} Verified</span>
      </div>
      <div class="job-skills-chips">
        ${(job.matchedSkills || []).map(s => `<span class="job-skill-chip match">✓ ${escHtml(s)}</span>`).join('')}
        ${(job.missingSkills || []).map(s => `<span class="job-skill-chip neutral">+ ${escHtml(s)}</span>`).join('')}
      </div>
    `;

    const typeBadgeClass = job.type === 'internship' ? 'type-internship' : 'type-fresher';

    return `
      <div class="opp-job-card best-match-card" data-job-id="${job.id}">
        <!-- Top Header Pill: Rank & Eligibility -->
        <div class="job-card-top-bar">
          <span class="best-match-card-top-pill ${rankClass}">
            ${rankIcon}
            <span>${rankLabel}</span>
          </span>
          <span class="batch-eligibility-pill" title="${escHtml(job.batchEligibility || '2025 & 2026 Batch')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${escHtml(cleanBatch)}</span>
          </span>
        </div>

        <!-- Company & Role Title -->
        <div class="job-card-header">
          <div class="company-badge-wrap intel-modal-btn" data-job-id="${job.id}" role="button" tabindex="0">
            <div class="company-avatar" title="${escHtml(job.company)}">
              ${logoContent}
            </div>
            <div class="company-info-wrap">
              <div class="job-company">
                ${escHtml(job.company)} <span class="verified-icon" title="Verified Campus Recruiter">✓</span>
              </div>
              <h4 class="job-title">${escHtml(job.title)}</h4>
            </div>
          </div>
          <div class="job-match-badge" style="background:${matchBadgeColor}15; color:${matchBadgeColor}; border:1px solid ${matchBadgeColor}44;" title="${job.matchPercentage}% skills match based on your evaluated resume">
            <span class="match-num">${job.matchPercentage}%</span>
            <span class="match-text">Match</span>
          </div>
        </div>

        <!-- Metadata Row -->
        <div class="job-meta-row">
          <span class="job-type-pill ${typeBadgeClass}">${job.typeLabel}</span>
          <span class="job-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escHtml(job.location)}
          </span>
          <span class="job-meta-item package-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <strong>${escHtml(job.package)}</strong>
          </span>
        </div>

        <!-- Comprehensive Job Description -->
        <p class="job-desc">${escHtml(job.summary)}</p>

        <!-- Why This Matches Your Resume Box -->
        <div class="best-match-rationale-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <div class="rationale-text">${job.rationale}</div>
        </div>

        <!-- Skills Breakdown -->
        <div class="job-skills-section">
          ${skillsSectionHtml}
        </div>

        <!-- Action Buttons -->
        <div class="job-card-actions">
          <a href="${job.applyUrl}" target="_blank" rel="noopener noreferrer" class="direct-apply-btn" title="Apply on official company portal">
            <span>Apply on Official Portal</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>

          <button class="role-openings-btn intel-modal-btn" data-job-id="${job.id}" style="width:auto; padding:0.55rem 0.85rem;" title="View Interview Blueprint & Hiring Rounds">
            <span>Interview Guide</span>
          </button>

          <a href="https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.linkedinSearchQuery)}&f_E=1%2C2&f_TPR=r604800" target="_blank" rel="noopener noreferrer" class="btn-linkedin-icon" title="Search similar openings on LinkedIn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a66c2"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Attach card-wide touch triggers (touch anywhere in job box opens detailed description)
  document.querySelectorAll('.opp-job-card.best-match-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Allow direct external links (Apply on Official Portal, LinkedIn) without opening modal
      if (e.target.closest('a') && !e.target.closest('.intel-modal-btn')) {
        return;
      }
      const jobId = card.dataset.jobId;
      openRoleIntelligenceModal(jobId);
    });
  });

  // Explicit stopPropagation on external apply & linkedin action links
  document.querySelectorAll('.direct-apply-btn, .btn-linkedin-icon').forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  // Attach modal trigger listeners on Interview Guide buttons
  document.querySelectorAll('.intel-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const jobId = btn.dataset.jobId;
      openRoleIntelligenceModal(jobId);
    });
  });
}

// ─── 5. Search & Filters Setup ───
function initSearchAndFilters() {
  const searchInput = document.getElementById('bestMatchSearchInput');
  const resetBtn = document.getElementById('resetBestMatchFiltersBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      renderBestMatchingJobs();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentSearch = '';
      currentFilter = 'all';
      const tabs = document.querySelectorAll('#bestMatchCategoryTabs .opp-tab');
      tabs.forEach(t => t.classList.toggle('active', t.dataset.category === 'all'));
      renderBestMatchingJobs();
    });
  }
}

function initCategoryTabs() {
  const tabs = document.querySelectorAll('#bestMatchCategoryTabs .opp-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.category || 'all';
      renderBestMatchingJobs();
    });
  });
}

function initSorting() {
  const sortSelect = document.getElementById('bestMatchSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderBestMatchingJobs();
    });
  }
}

// ─── 6. Role Intelligence & Interview Blueprint Modal ───
function initModal() {
  const modal = document.getElementById('roleIntelligenceModal');
  const closeBtn = document.getElementById('closeIntelModalBtn');
  const dismissBtn = document.getElementById('dismissIntelModalBtn');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

function openRoleIntelligenceModal(jobId) {
  const job = OPPORTUNITIES_DATA.find(j => j.id === jobId);
  if (!job) return;

  const modal = document.getElementById('roleIntelligenceModal');
  const title = document.getElementById('intelRoleTitle');
  const company = document.getElementById('intelCompanyName');
  const category = document.getElementById('intelRoleCategory');
  const body = document.getElementById('intelModalBody');

  if (title) title.textContent = job.title;
  if (company) {
    const logoSrc = COMPANY_LOGOS[job.brandKey] || `https://www.google.com/s2/favicons?domain=${job.domain || 'google.com'}&sz=128`;
    company.innerHTML = `
      <span style="display:inline-flex; align-items:center; gap:8px;">
        <img src="${logoSrc}" alt="${escHtml(job.company)} logo" style="width:20px; height:20px; object-fit:contain; border-radius:4px;" />
        <span><strong>${escHtml(job.company)}</strong> &bull; ${escHtml(job.location)} &bull; ${escHtml(job.package)}</span>
      </span>
    `;
  }
  if (category) category.textContent = `${job.roleCategory} Interview Guide`;

  const processHtml = (job.interviewProcess || []).map((p, idx) => `
    <div class="intel-process-step">
      <div class="step-num-badge">${idx + 1}</div>
      <div class="step-content">
        <div class="process-round-title">${escHtml(p.round)}</div>
        <div class="process-round-desc">${escHtml(p.desc)}</div>
      </div>
    </div>
  `).join('');

  const questionsHtml = (job.sampleQuestions || []).map(q => `
    <li class="intel-question-item">
      <span class="quote-icon">“</span>
      <span>${escHtml(q)}</span>
    </li>
  `).join('');

  const requiredSkillsTags = (job.requiredSkills || []).map(s => `
    <span class="role-skill-badge">${escHtml(s)}</span>
  `).join('');

  if (body) {
    body.innerHTML = `
      <div class="intel-section">
        <h4 class="intel-heading">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Selection Process &amp; Interview Rounds
        </h4>
        <div class="intel-process-list">${processHtml}</div>
      </div>

      <div class="intel-section">
        <h4 class="intel-heading">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Frequently Asked Technical Questions
        </h4>
        <ul class="intel-questions-list">${questionsHtml}</ul>
      </div>

      <div class="intel-grid-row">
        <div class="intel-section">
          <h4 class="intel-heading">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Key Technical Skills Evaluated
          </h4>
          <div class="role-skills-wrap">${requiredSkillsTags}</div>
        </div>

        <div class="intel-section">
          <h4 class="intel-heading">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            Eligibility &amp; Target Degrees
          </h4>
          <p class="intel-text">${escHtml(job.batchEligibility || '2025 & 2026 Graduates')}</p>
        </div>
      </div>

      <div class="intel-section highlight-box">
        <h4 class="intel-heading">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          Candidate Advice &amp; Resume Tailoring
        </h4>
        <p class="intel-text">${escHtml(job.resumeTip || 'Highlight foundational data structures, clean code, and relevant projects.')}</p>
      </div>
    `;
  }

  // Wire up Tailor Resume action button (same tab redirect)
  const tailorBtn = document.getElementById('tailorResumeBtn');
  if (tailorBtn) {
    tailorBtn.onclick = (e) => {
      e.preventDefault();
      try {
        const tailorPayload = {
          jobId: job.id,
          title: job.title,
          company: job.company,
          roleCategory: job.roleCategory,
          targetRole: `${job.company} — ${job.title}`,
          requiredSkills: job.requiredSkills || [],
          jobDescription: `Target Company: ${job.company}\nTarget Role: ${job.title} (${job.roleCategory})\nLocation: ${job.location} | Package: ${job.package}\nBatch Eligibility: ${job.batchEligibility || ''}\n\nRole Overview:\n${job.summary || ''}\n\nRequired Technical Competencies:\n${(job.requiredSkills || []).join(', ')}\n\nInterview Questions & Evaluation Focus:\n${(job.sampleQuestions || []).join('\n')}\n\nRecruiter Resume Tip:\n${job.resumeTip || ''}`,
          timestamp: Date.now()
        };
        localStorage.setItem('resumereviewer_tailor_payload', JSON.stringify(tailorPayload));
      } catch (err) {
        console.warn('Could not store tailor payload', err);
      }
      // Navigate in SAME tab!
      window.location.href = 'index.html?tailor=' + encodeURIComponent(job.id);
    };
  }

  if (modal) modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('roleIntelligenceModal');
  if (modal) modal.classList.add('hidden');
}
