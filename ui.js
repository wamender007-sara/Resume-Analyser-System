/**
 * ui.js — DOM helpers: score ring, cards, skeleton, toasts
 */

import { formatAnalysisAsJson } from './analysis-engine.js';
import { updateAllAdSlots } from './ad-slot.js';
export { updateAllAdSlots };

// ─── Score Ring ─────────────────────────────────────────────
export function renderScoreRing(score) {
  const circumference = 314; // 2π × r=50
  const offset = circumference - (score / 100) * circumference;

  const ring = document.getElementById('ringFill');
  const numEl = document.getElementById('scoreNum');
  const gradeEl = document.getElementById('scoreGrade');
  const summaryEl = document.getElementById('scoreSummary');

  // Inject SVG gradient
  const svg = document.querySelector('.score-ring');
  if (!svg.querySelector('#ringGrad')) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#a78bfa"/>
      </linearGradient>`;
    svg.prepend(defs);
  }

  // Animate number counter
  let current = 0;
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    current = Math.round(eased * score);
    numEl.textContent = current;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // Animate ring
  setTimeout(() => {
    ring.style.strokeDashoffset = offset;
  }, 50);

  return { gradeEl, summaryEl };
}

export function renderGrade(gradeEl, grade, summaryEl, summary) {
  const gradeColors = {
    'A+': { bg: 'rgba(16,185,129,0.2)',  color: '#10b981' },
    'A' : { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
    'B+': { bg: 'rgba(99,102,241,0.2)',  color: '#818cf8' },
    'B' : { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
    'C+': { bg: 'rgba(245,158,11,0.2)',  color: '#f59e0b' },
    'C' : { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    'D' : { bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
    'F' : { bg: 'rgba(239,68,68,0.2)',   color: '#ef4444' },
  };
  const style = gradeColors[grade] || gradeColors['B'];
  gradeEl.textContent = `Grade: ${grade}`;
  gradeEl.style.background = style.bg;
  gradeEl.style.color = style.color;
  summaryEl.textContent = summary;
}

// ─── Verdict Badge ───────────────────────────────────────────
export function renderVerdictBadge(verdict, score) {
  const el = document.getElementById('scoreVerdict');
  if (!el) return;
  const v = verdict || (score >= 75 ? 'Strong Match' : (score >= 50 ? 'Moderate Match — needs tailoring' : 'Weak Match'));
  let cls = 'verdict-moderate';
  if (v.toLowerCase().includes('strong')) cls = 'verdict-strong';
  else if (v.toLowerCase().includes('weak')) cls = 'verdict-weak';
  
  el.className = `verdict-pill ${cls}`;
  el.textContent = v;
}

// ─── 6 Core Evaluative Dimensions ───────────────────────────
const EVAL_DIMENSIONS = [
  { key: 'keyword_match', label: 'Keyword & Skill Match', weight: '30% Weight', icon: '🎯' },
  { key: 'experience_relevance', label: 'Experience Relevance', weight: '30% Weight', icon: '💼' },
  { key: 'quantifiable_impact', label: 'Quantifiable Impact', weight: '15% Weight', icon: '📈' },
  { key: 'education_certifications', label: 'Education & Certifications', weight: '10% Weight', icon: '🎓' },
  { key: 'ats_compatibility', label: 'ATS Compatibility', weight: '10% Weight', icon: '🤖' },
  { key: 'language_quality', label: 'Language Quality', weight: '5% Weight', icon: '✍️' },
];

export function renderEvaluationDimensions(scores) {
  const container = document.getElementById('evalDimensionsGrid');
  if (!container || !scores) return;
  container.innerHTML = '';

  EVAL_DIMENSIONS.forEach(dim => {
    const val = scores[dim.key] ?? 70;
    const color = scoreColor(val);
    const item = document.createElement('div');
    item.className = 'eval-dimension-item';
    item.innerHTML = `
      <div class="dim-header">
        <span class="dim-title"><span class="dim-icon">${dim.icon}</span> ${dim.label}</span>
        <span class="dim-weight-tag">${dim.weight}</span>
      </div>
      <div class="dim-meter-track">
        <div class="dim-meter-fill" data-target="${val}" style="background:${color}; width:0%"></div>
      </div>
      <div class="dim-footer">
        <span class="dim-score-text">Score: <strong>${val}</strong> / 100</span>
        <span class="dim-status-text">${val >= 80 ? '✓ Exceptional' : (val >= 60 ? '⚡ Competent' : '⚠️ Needs Polish')}</span>
      </div>
    `;
    container.appendChild(item);
  });

  requestAnimationFrame(() => {
    document.querySelectorAll('.dim-meter-fill').forEach((el) => {
      const target = el.dataset.target;
      el.style.width = target + '%';
    });
  });
}

// ─── Employment Gaps (Neutral Observations) ──────────────────
export function renderEmploymentGaps(gaps) {
  const container = document.getElementById('employmentGapsContainer');
  if (!container) return;

  if (!gaps || gaps.length === 0) {
    container.innerHTML = `
      <div class="gap-positive-box">
        <div class="gap-icon">✓</div>
        <div class="gap-text">
          <strong>Continuous Career Progression:</strong> No unaddressed employment gaps exceeding 6 months detected.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = gaps.map(g => `
    <div class="gap-notice-card">
      <div class="gap-notice-badge">Gap: ${escHtml(g.period)}</div>
      <div class="gap-notice-desc">${escHtml(g.note)}</div>
    </div>
  `).join('');
}

// ─── Language & Phrasing Issues ──────────────────────────────
export function renderLanguageIssues(issues) {
  const container = document.getElementById('languageIssuesContainer');
  if (!container) return;

  if (!issues || issues.length === 0) {
    container.innerHTML = `
      <div class="lang-positive-box">
        <div class="lang-icon">✓</div>
        <div class="lang-text">
          <strong>Strong Phrasing:</strong> Action verbs utilized consistently with concise, impact-oriented statements.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="lang-issues-list">
      ${issues.map((item, idx) => `
        <div class="lang-issue-card">
          <div class="lang-issue-header">
            <span class="lang-issue-badge">Issue #${idx + 1}: ${escHtml(item.issue)}</span>
          </div>
          <div class="lang-snippet-text">"${escHtml(item.location)}"</div>
          <div class="lang-suggestion-text">💡 <strong>Suggested Fix:</strong> ${escHtml(item.suggestion)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── Copy Analysis JSON Button ───────────────────────────────
export function setupCopyJsonButton(analysisData) {
  const btn = document.getElementById('btnCopyJson');
  if (!btn) return;

  btn.onclick = async () => {
    try {
      const jsonObj = formatAnalysisAsJson(analysisData);
      const str = JSON.stringify(jsonObj, null, 2);
      await navigator.clipboard.writeText(str);
      showToast('Copied 6-Dimension Analysis JSON to clipboard!', 'success');
    } catch (e) {
      showToast('Failed to copy JSON. Please check clipboard permissions.', 'error');
    }
  };
}

// ─── Section Bars ────────────────────────────────────────────
const SECTION_LABELS = {
  contactInfo: 'Contact Info',
  professionalSummary: 'Summary',
  workExperience: 'Experience',
  skills: 'Skills',
  education: 'Education',
  certifications: 'Certifications',
  projects: 'Projects',
};

export function renderSectionBars(sectionScores) {
  const container = document.getElementById('sectionBars');
  container.innerHTML = '';

  for (const [key, value] of Object.entries(sectionScores)) {
    const label = SECTION_LABELS[key] || key;
    const color = scoreColor(value);

    const item = document.createElement('div');
    item.className = 'section-bar-item';
    item.innerHTML = `
      <span class="section-bar-label">${label}</span>
      <div class="section-bar-track">
        <div class="section-bar-fill" data-target="${value}" style="background:${color}; width:0%"></div>
      </div>
      <span class="section-bar-val">${value}</span>
    `;
    container.appendChild(item);
  }

  // Animate bars
  requestAnimationFrame(() => {
    document.querySelectorAll('.section-bar-fill').forEach((el) => {
      const target = el.dataset.target;
      el.style.width = target + '%';
    });
  });
}

function scoreColor(score) {
  if (score >= 80) return 'linear-gradient(90deg, #10b981, #34d399)';
  if (score >= 60) return 'linear-gradient(90deg, #6366f1, #818cf8)';
  if (score >= 40) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
  return 'linear-gradient(90deg, #ef4444, #f87171)';
}

// ─── Bullet Lists ────────────────────────────────────────────
export function renderBulletList(elementId, items) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = items.length
    ? items.map((text) => `<li>${escHtml(text)}</li>`).join('')
    : '<li>None identified.</li>';
}

// ─── Weakness List ───────────────────────────────────────────
export function renderWeaknessList(weaknesses) {
  const el = document.getElementById('weaknessList');
  if (!el) return;
  el.innerHTML = weaknesses
    .map(({ text, severity }) => `
      <li class="weakness-item ${severity || 'medium'}">
        <div class="weakness-text">${escHtml(text)}</div>
        <span class="severity-badge severity-${severity || 'medium'}">${severity || 'medium'}</span>
      </li>`)
    .join('');
}

// ─── Categorized Skills Inventory ────────────────────────────
export function renderCategorizedSkills(categorized) {
  const container = document.getElementById('skillsCategoryContainer');
  if (!container || !categorized) return;

  const categories = [
    { key: 'languages', label: 'Languages', icon: '💻' },
    { key: 'frameworks', label: 'Frameworks & Web Stack', icon: '⚛️' },
    { key: 'databases', label: 'Databases & Storage', icon: '🗄️' },
    { key: 'cloud_devops', label: 'Cloud, DevOps & Tools', icon: '☁️' },
    { key: 'domain_specialized', label: 'Domain & Core Engineering', icon: '🔬' }
  ];

  let hasAny = false;
  let html = '';

  categories.forEach(cat => {
    const list = categorized[cat.key] || [];
    if (list.length > 0) {
      hasAny = true;
      const chips = list.map(s => `<span class="category-skill-chip">${escHtml(s)}</span>`).join('');
      html += `
        <div class="skills-category-group">
          <div class="category-group-header">
            <span class="category-group-icon">${cat.icon}</span>
            <span class="category-group-label">${cat.label}</span>
            <span class="category-group-count">${list.length}</span>
          </div>
          <div class="category-chips-wrap">${chips}</div>
        </div>
      `;
    }
  });

  if (!hasAny) {
    container.innerHTML = '<p class="audit-sub">No technical skills detected yet. Add a dedicated Skills section to your resume.</p>';
  } else {
    container.innerHTML = html;
  }
}

// ─── Document & Evidence Audit Grid ──────────────────────────
export function renderAuditGrid(diagnostics, jdMatch, targetRoleFit) {
  const container = document.getElementById('auditGrid');
  if (!container || !diagnostics) return;

  const contacts = diagnostics.contacts || {};
  const metricsList = (diagnostics.extractedMetrics || []).join(', ') || 'None found';
  const skillsPreview = (diagnostics.skillsFound || []).slice(0, 8).join(', ') || 'None identified';
  const strongVerbs = (diagnostics.strongVerbsFound || []).slice(0, 6).join(', ') || 'None';

  let roleFitHtml = '';
  if (targetRoleFit) {
    const roleFitColor = targetRoleFit.priority === 'high' ? '#10b981' : (targetRoleFit.priority === 'mid' ? '#f59e0b' : '#ef4444');
    const priorityLabel = targetRoleFit.priorityLabel || (targetRoleFit.fitPercentage >= 70 ? 'High Priority Fit' : (targetRoleFit.fitPercentage >= 45 ? 'Mid Priority' : 'Low Priority Gap'));
    const sen = targetRoleFit.seniorityBreakdown;

    let senHtml = '';
    if (sen) {
      senHtml = `
        <div class="audit-seniority-tracks">
          <div class="audit-seniority-title">Role Seniority Hierarchy Readiness:</div>
          <div class="seniority-track-items">
            <div class="seniority-tier-item tier-low">
              <div class="tier-header-line">
                <span class="tier-label">${escHtml(sen.low?.tier || 'Low (Junior / Entry-Level)')}</span>
                <span class="tier-stat">${sen.low?.readiness || 90}% · ${escHtml(sen.low?.status || 'Ready')}</span>
              </div>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.low?.readiness || 90}%; background:#10b981;"></div></div>
            </div>
            <div class="seniority-tier-item tier-mid">
              <div class="tier-header-line">
                <span class="tier-label">${escHtml(sen.mid?.tier || 'Mid (Mid-Level Developer)')}</span>
                <span class="tier-stat">${sen.mid?.readiness || 75}% · ${escHtml(sen.mid?.status || 'Developing')}</span>
              </div>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.mid?.readiness || 75}%; background:#f59e0b;"></div></div>
            </div>
            <div class="seniority-tier-item tier-high">
              <div class="tier-header-line">
                <span class="tier-label">${escHtml(sen.high?.tier || 'High (Senior / Tech Lead)')}</span>
                <span class="tier-stat">${sen.high?.readiness || 45}% · ${escHtml(sen.high?.status || 'Aspirational')}</span>
              </div>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.high?.readiness || 45}%; background:#ef4444;"></div></div>
            </div>
          </div>
        </div>
      `;
    }

    roleFitHtml = `
      <div class="audit-item audit-highlight audit-role-fit">
        <div class="audit-header-row">
          <div class="audit-label">Target Role Alignment — ${escHtml(targetRoleFit.targetRole)}</div>
          <span class="role-priority-pill priority-${targetRoleFit.priority || 'high'}">${priorityLabel}</span>
        </div>
        <div class="audit-value" style="color:${roleFitColor}">${targetRoleFit.fitPercentage}% Match · ${escHtml(targetRoleFit.verdict)}</div>
        ${senHtml}
        <div class="audit-sub"><strong>Matched Skills:</strong> ${targetRoleFit.matchedSkills.join(', ') || 'None identified'}</div>
        <div class="audit-sub"><strong>Key Gap Competencies:</strong> ${targetRoleFit.missingSkills.join(', ') || 'All core benchmarks satisfied!'}</div>
      </div>
    `;
  }

  let jdHtml = '';
  if (jdMatch) {
    const jdBadgeColor = jdMatch.percentage >= 70 ? '#10b981' : (jdMatch.percentage >= 45 ? '#f59e0b' : '#ef4444');
    jdHtml = `
      <div class="audit-item audit-highlight">
        <div class="audit-label">Target Job Description Alignment</div>
        <div class="audit-value" style="color:${jdBadgeColor}">${jdMatch.percentage}% Match (${jdMatch.matchedCount}/${jdMatch.totalChecked} terms)</div>
        <div class="audit-sub">Missing: ${jdMatch.missingKeywords.join(', ') || 'All top terms matched!'}</div>
      </div>
    `;
  }

  container.innerHTML = `
    ${roleFitHtml}
    ${jdHtml}
    <div class="audit-item">
      <div class="audit-label">Word Count & Density</div>
      <div class="audit-value">${diagnostics.wordCount} words</div>
      <div class="audit-sub">${diagnostics.wordCount < 300 ? '⚠️ Brief (aim for 400-800 words)' : (diagnostics.wordCount > 900 ? '⚠️ Heavy (keep under 2 pages)' : '✓ Optimal recruiter length')}</div>
    </div>
    <div class="audit-item">
      <div class="audit-label">Quantified Impact Metrics</div>
      <div class="audit-value">${diagnostics.metricCount} Verified Values</div>
      <div class="audit-sub">${metricsList}</div>
    </div>
    <div class="audit-item">
      <div class="audit-label">Verified Tech Competencies</div>
      <div class="audit-value">${diagnostics.skillsFoundCount} Skills Found</div>
      <div class="audit-sub">${skillsPreview}</div>
    </div>
    <div class="audit-item">
      <div class="audit-label">Action Power Verbs</div>
      <div class="audit-value">${diagnostics.strongVerbsFound.length} Verbs Detected</div>
      <div class="audit-sub">${strongVerbs}</div>
    </div>
    <div class="audit-item">
      <div class="audit-label">Contact Reachability</div>
      <div class="audit-value">${contacts.email ? '✓ Email' : '✗ Missing Email'} | ${contacts.phone ? '✓ Phone' : '✗ Phone'}</div>
      <div class="audit-sub">${contacts.linkedin ? '✓ LinkedIn verified' : '⚠️ No LinkedIn'} | ${contacts.github ? '✓ GitHub verified' : '⚠️ No GitHub'}</div>
    </div>
  `;
}

// ─── Bullet Point Rewrites ───────────────────────────────────
export function renderBulletRewrites(rewrites) {
  const container = document.getElementById('bulletRewriteList');
  if (!container) return;

  if (!rewrites || rewrites.length === 0) {
    container.innerHTML = `
      <div class="empty-rewrite-box">
        <p class="audit-sub">✓ No passive or weak bullet points detected! Your bullet points demonstrate strong action and metric focus.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = rewrites.map((item, idx) => `
    <div class="rewrite-card">
      <div class="rewrite-card-header">
        <span class="rewrite-badge">Improvement #${idx + 1}</span>
        <span class="rewrite-issue">${escHtml(item.issue)}</span>
      </div>
      
      <div class="rewrite-comparison">
        <div class="rewrite-block original">
          <div class="rewrite-label">❌ Current Resume Phrasing:</div>
          <div class="rewrite-text">${escHtml(item.original)}</div>
        </div>
        
        <div class="rewrite-block improved">
          <div class="rewrite-label">✅ High-Impact Google XYZ / STAR Rewrite:</div>
          <div class="rewrite-text">${escHtml(item.improved)}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ─── Suggested Job Roles ──────────────────────────────────────
export function renderSuggestedRoles(roles) {
  const container = document.getElementById('suggestedRolesGrid');
  if (!container) return;

  if (!roles || roles.length === 0) {
    container.innerHTML = '<p class="audit-sub">Expand your skills section to view role recommendations.</p>';
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
          <div class="role-skills-label">Your Matched Skills:</div>
          <div class="role-skills-wrap">${matchedBadges}</div>
        </div>
        <div class="role-skills-section">
          <div class="role-skills-label">Recommended to Bridge Next Level:</div>
          <div class="role-skills-wrap">${missingBadges}</div>
        </div>

        <div class="role-apply-footer">
          <a href="opportunities.html?role=${encodeURIComponent(role.title)}" class="role-openings-btn" title="View matching openings on LinkedIn, Internshala & portals">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Apply to ${escHtml(role.title)} Openings (LinkedIn, Internshala, Naukri) &rarr;
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// ─── ATS ─────────────────────────────────────────────────────
export function renderAts(ats) {
  const badge = document.getElementById('atsBadge');
  const numEl = document.getElementById('atsScoreNum');
  const list = document.getElementById('atsList');

  const configs = {
    Good: { bg: 'rgba(16,185,129,0.2)', color: '#10b981', icon: '✓' },
    Fair: { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b', icon: '⚠' },
    Poor: { bg: 'rgba(239,68,68,0.2)',  color: '#ef4444', icon: '✗' },
  };
  const cfg = configs[ats.score] || configs['Fair'];
  badge.style.background = cfg.bg;
  badge.style.color = cfg.color;
  badge.textContent = `${cfg.icon} ATS ${ats.score}`;

  if (numEl) {
    numEl.textContent = `${ats.numericScore || 85}% Compatible`;
    numEl.style.color = cfg.color;
  }

  list.innerHTML = (ats.issues || [])
    .map((issue) => `<li>${escHtml(issue)}</li>`)
    .join('') || '<li>No major ATS issues detected.</li>';
}

// ─── Keywords ────────────────────────────────────────────────
export function renderKeywords(keywords, hint) {
  const container = document.getElementById('keywordChips');
  const hintEl = document.getElementById('keywordsHint');
  if (hint) hintEl.textContent = hint;
  container.innerHTML = keywords
    .map((kw) => `<span class="keyword-chip">${escHtml(kw)}</span>`)
    .join('');
}

// ─── Action Plan ─────────────────────────────────────────────
export function renderActionPlan(steps) {
  const el = document.getElementById('actionList');
  el.innerHTML = steps
    .map((step) => `<li>${escHtml(step)}</li>`)
    .join('');
}

// ─── Role Development & Skill Acquisition Roadmap ─────────────
export function renderRoleDevelopmentRoadmap(data, targetRole = '', jobDescription = '', isTailored = false) {
  const card = document.getElementById('roleDevCard');
  if (!card) return;

  // ONLY display this card when specifically running a tailored resume analysis
  if (!isTailored) {
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';

  const body = document.getElementById('roleDevBody');
  const sub = document.getElementById('roleDevSubtitle');
  const badge = document.getElementById('roleDevBadge');
  if (!body) return;

  const roleTitle = (targetRole || data?.targetRoleFit?.targetRole || 'Software Engineering Role').trim();
  let companyName = '';
  let cleanRole = roleTitle;
  if (roleTitle.includes('—')) {
    const parts = roleTitle.split('—').map(s => s.trim());
    companyName = parts[0];
    cleanRole = parts[1] || roleTitle;
  } else if (roleTitle.includes('-')) {
    const parts = roleTitle.split('-').map(s => s.trim());
    if (parts.length >= 2) {
      companyName = parts[0];
      cleanRole = parts.slice(1).join(' ');
    }
  }

  if (sub) {
    sub.textContent = companyName 
      ? `Custom preparation roadmap & competency bridge for ${companyName} (${cleanRole})`
      : `Custom preparation roadmap & competency bridge for ${cleanRole}`;
  }
  if (badge) {
    badge.textContent = companyName ? `${companyName} Roadmap` : 'Preparation Roadmap';
  }

  // Extract missing skills
  const missingKeywords = (data?.diagnostics?.missingKeywords || data?.recommendedKeywords || []).slice(0, 8);

  // Determine domain suggestions based on role
  const roleLower = roleTitle.toLowerCase();
  let domain = 'general';
  if (roleLower.includes('front') || roleLower.includes('react') || roleLower.includes('web') || roleLower.includes('ui')) domain = 'frontend';
  else if (roleLower.includes('back') || roleLower.includes('api') || roleLower.includes('node') || roleLower.includes('java') || roleLower.includes('python')) domain = 'backend';
  else if (roleLower.includes('full') || roleLower.includes('stack')) domain = 'fullstack';
  else if (roleLower.includes('data') || roleLower.includes('analyst') || roleLower.includes('analytics')) domain = 'data';
  else if (roleLower.includes('ai') || roleLower.includes('machine') || roleLower.includes('ml')) domain = 'aiml';
  else if (roleLower.includes('cloud') || roleLower.includes('devops') || roleLower.includes('infra')) domain = 'devops';
  else if (roleLower.includes('qa') || roleLower.includes('test') || roleLower.includes('automation')) domain = 'qa';

  // Domain bridge projects
  const bridgeProjects = {
    frontend: [
      {
        title: 'High-Performance E-Commerce Web App with Virtualization & State Cache',
        tech: 'React / Next.js, TypeScript, Zustand / Redux Toolkit, Tailwind CSS',
        why: 'Demonstrates component modularity, client-side caching, sub-second TTFB, and mobile touch responsiveness required by top product companies.'
      },
      {
        title: 'Collaborative Real-Time Workspace Canvas / Dashboard',
        tech: 'WebSockets, React, Canvas/SVG, Web Workers',
        why: 'Proves capability in handling asynchronous real-time events, optimistic UI updates, and heavy client-side computation.'
      }
    ],
    backend: [
      {
        title: 'Distributed Rate-Limited REST & gRPC API Microservice',
        tech: 'Node.js / Go / Java, Redis Token Bucket, PostgreSQL, Docker',
        why: 'Demonstrates high-concurrency API gateway patterns, database connection pooling, and sub-10ms response latency.'
      },
      {
        title: 'Event-Driven Asynchronous Order & Payment Processing Pipeline',
        tech: 'Apache Kafka / RabbitMQ, Redis Cache, SQL Transactions, Docker',
        why: 'Proves idempotency, distributed transactions, zero-loss queue consumer architecture, and crash recovery.'
      }
    ],
    fullstack: [
      {
        title: 'Full-Stack Production SaaS with Role-Based Auth & Real-Time Sync',
        tech: 'React, Node.js / Express, PostgreSQL, Redis, Webhooks',
        why: 'Proves full lifecycle competence from DB schema migrations to front-end state management and third-party webhook security.'
      },
      {
        title: 'Automated CI/CD Deployed Multi-Tenant Analytics Portal',
        tech: 'Next.js, Tailwind, Docker, GitHub Actions, Cloud Hosting',
        why: 'Shows hiring managers you can deploy, monitor, and scale modern web software independently.'
      }
    ],
    data: [
      {
        title: 'End-to-End Automated ETL Pipeline & Interactive Business Dashboard',
        tech: 'Python, Pandas, SQL (PostgreSQL), Power BI / Tableau, Streamlit',
        why: 'Demonstrates real-world data cleaning, dimensional modeling (Star Schema), and executive KPI presentation.'
      },
      {
        title: 'Customer Cohort Churn & Revenue Retention Predictor',
        tech: 'Python, Scikit-learn, Seaborn, SQL Window Functions',
        why: 'Directly applicable to product analytics and business growth teams at tech firms.'
      }
    ],
    aiml: [
      {
        title: 'Production RAG (Retrieval-Augmented Generation) Knowledge Engine',
        tech: 'Python, LangChain / LlamaIndex, Vector DB (Chroma/FAISS), LLM APIs',
        why: 'The #1 in-demand enterprise AI skill: building hallucinations-free grounded search over custom PDFs & company data.'
      },
      {
        title: 'Fine-Tuned Text Classifier with Fast Inference API Endpoint',
        tech: 'PyTorch, Hugging Face Transformers, FastAPI, Docker',
        why: 'Demonstrates model evaluation, latency optimization, and microservice packaging.'
      }
    ],
    devops: [
      {
        title: 'GitOps Infrastructure-as-Code & Kubernetes Cluster Deployment',
        tech: 'Terraform, Docker, Kubernetes (K8s), ArgoCD, Prometheus & Grafana',
        why: 'Proves automated cluster provisioning, monitoring alert rules, and zero-downtime rolling updates.'
      },
      {
        title: 'Zero-Trust Secure CI/CD Pipeline with SAST & Container Scanning',
        tech: 'GitHub Actions, SonarQube, Trivy, Cloud Storage',
        why: 'Demonstrates automated security scanning and cloud artifact lifecycle management.'
      }
    ],
    qa: [
      {
        title: 'End-to-End Multi-Browser Automation Testing Framework',
        tech: 'Playwright / Selenium, TypeScript / Python, Allure Reports, CI Integration',
        why: 'Demonstrates Page Object Model (POM), parallel test execution, and automated defect screenshots.'
      },
      {
        title: 'High-Volume API Performance & Stress Testing Suite',
        tech: 'Postman Collections, Newman, k6 / JMeter, GitHub Actions',
        why: 'Proves ability to benchmark API throughput, latency SLA compliance, and error boundary behavior.'
      }
    ],
    general: [
      {
        title: 'Scalable Full-Stack Engineering Application with Database Indexing',
        tech: 'Modern Framework (React/Vue), Backend API (Node/Python/Java), SQL, Docker',
        why: 'Demonstrates clean object-oriented architecture, relational database indexing, and REST API conventions.'
      },
      {
        title: 'Algorithmic Optimization & System Utility Tool',
        tech: 'C++ / Java / Python / TypeScript, Git, Automated Unit Testing',
        why: 'Proves mastery of core data structures, time-complexity analysis, and clean maintainable code.'
      }
    ]
  };

  const domainProjects = bridgeProjects[domain] || bridgeProjects.general;

  // Domain interview topics
  const interviewTopics = {
    frontend: [
      'DOM rendering pipeline, Critical Rendering Path & Core Web Vitals (LCP, INP, CLS)',
      'State management paradigms (Redux, Context, Zustand) and re-render optimization',
      'JavaScript closures, event loop, microtask queue, and Promise concurrency',
      'Component lifecycle, custom hooks design, and unit testing with Jest / React Testing Library'
    ],
    backend: [
      'Database normalization vs denormalization, B-Tree indexes, and slow query optimization',
      'REST vs gRPC vs GraphQL tradeoffs and idempotency in distributed payment/order APIs',
      'Caching invalidation strategies (Cache-aside, Write-through) using Redis',
      'Asynchronous task workers, message queues (Kafka/RabbitMQ), and dead-letter handling'
    ],
    fullstack: [
      'End-to-end security: JWT authentication, HTTP-only cookies, CORS, CSRF, and SQL injection prevention',
      'API schema validation, database migration patterns, and connection pool sizing',
      'Client-server caching, SSR (Server-Side Rendering) vs CSR (Client-Side Rendering)',
      'System design basics: Load balancers, reverse proxies (Nginx), and microservices vs monolith'
    ],
    data: [
      'Advanced SQL: Window functions (ROW_NUMBER, RANK, LEAD, LAG), CTEs, and query EXPLAIN plans',
      'Data modeling: Star Schema, Snowflake Schema, Fact vs Dimension tables',
      'Data transformation & outlier treatment in Python Pandas / NumPy',
      'Business metric definitions: LTV, CAC, Retention, Churn rate, and conversion funnels'
    ],
    aiml: [
      'Vector embeddings, cosine similarity search, chunking strategies, and RAG architectures',
      'Evaluation metrics: Precision, Recall, F1-Score, ROC-AUC, and Confusion Matrix interpretation',
      'Handling class imbalance, data leakage, and cross-validation techniques',
      'Model deployment tradeoffs: ONNX runtime, quantisation, and latency batching'
    ],
    devops: [
      'Docker container image optimization (multi-stage builds, non-root users, minimal Alpine base)',
      'Kubernetes core primitives: Pods, Deployments, Services, Ingress, and PersistentVolumes',
      'Infrastructure as Code (IaC) principles: state management, drift detection with Terraform',
      'Observability: Metrics (Prometheus), Logging (ELK/Loki), and Tracing (OpenTelemetry)'
    ],
    qa: [
      'Test automation design patterns: Page Object Model (POM), data-driven testing, and BDD (Cucumber)',
      'API contract testing, status code assertions, and mock API servers',
      'Performance testing: Load, stress, soak, and spike testing benchmarks with k6',
      'Defect lifecycle, bug reporting standards with reproduction steps and logs'
    ],
    general: [
      'Core Data Structures & Algorithms: Binary Search, Two Pointers, Trees, Graphs, Hash Maps, and Dynamic Programming',
      'Object-Oriented Design (SOLID principles, Factory, Singleton, Observer patterns)',
      'Database fundamentals: ACID properties, transactions, and indexing',
      'STAR method behavioral preparation: Leadership, resolving technical conflicts, and deadline delivery'
    ]
  };

  const domainTopics = interviewTopics[domain] || interviewTopics.general;

  body.innerHTML = `
    <!-- Top Focus Banner -->
    <div class="role-dev-target-banner">
      <div class="role-dev-banner-left">
        <span class="role-dev-company-pill">${escHtml(companyName || 'Target Role')}</span>
        <strong class="role-dev-role-name">${escHtml(cleanRole)}</strong>
      </div>
      <span class="role-dev-focus-badge">Tailored Skill Gap &amp; Development Strategy</span>
    </div>

    <!-- 1. Technical Skills to Acquire & Develop -->
    <div class="role-dev-section">
      <h4 class="role-dev-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        1. High-Priority Competencies to Develop
      </h4>
      <p class="role-dev-section-desc">Based on verified requirements for ${escHtml(cleanRole)}, developing these competencies will directly elevate your interview shortlist rate:</p>
      
      <div class="role-dev-skills-grid">
        ${missingKeywords.length > 0 ? missingKeywords.map(kw => `
          <div class="role-dev-skill-card">
            <div class="skill-card-top">
              <strong class="skill-name">${escHtml(kw)}</strong>
              <span class="skill-need-tag">Must Learn &amp; Practice</span>
            </div>
            <p class="skill-reason">Essential keyword and technical requirement for ${escHtml(cleanRole)}. Add dedicated project proof or coursework demonstrating practical application.</p>
          </div>
        `).join('') : `
          <div class="role-dev-skill-card">
            <div class="skill-card-top">
              <strong class="skill-name">System Architecture &amp; Scale</strong>
              <span class="skill-need-tag">Advanced Focus</span>
            </div>
            <p class="skill-reason">Your core keyword match is strong. Focus on scaling, production resilience, and automated testing to stand out among senior candidates.</p>
          </div>
        `}
      </div>
    </div>

    <!-- 2. Recommended Portfolio Bridge Projects -->
    <div class="role-dev-section">
      <h4 class="role-dev-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        2. Recommended Portfolio Bridge Projects to Build
      </h4>
      <p class="role-dev-section-desc">Add one of these real-world projects to your GitHub &amp; Resume to prove immediate job readiness to ${escHtml(companyName || 'the hiring team')}:</p>

      <div class="role-dev-projects-grid">
        ${domainProjects.map((p, pIdx) => `
          <div class="role-dev-project-card">
            <div class="project-card-num">Project 0${pIdx + 1}</div>
            <h5 class="project-card-title">${escHtml(p.title)}</h5>
            <div class="project-card-tech">
              <span class="tech-label">Recommended Tech Stack:</span>
              <span class="tech-pills">${escHtml(p.tech)}</span>
            </div>
            <p class="project-card-why"><strong>Why recruiters value this:</strong> ${escHtml(p.why)}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 3. Key Technical Interview Concepts to Master -->
    <div class="role-dev-section">
      <h4 class="role-dev-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        3. Core Technical &amp; System Concepts to Master
      </h4>
      <div class="role-dev-topics-list">
        ${domainTopics.map(t => `
          <div class="topic-item">
            <span class="topic-bullet">&bull;</span>
            <span class="topic-text">${escHtml(t)}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 4. Step-by-Step 4-Week Action Roadmap -->
    <div class="role-dev-section">
      <h4 class="role-dev-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        4. Step-by-Step 4-Week Action Roadmap for this Role
      </h4>
      <div class="roadmap-timeline">
        <div class="roadmap-step">
          <div class="step-badge">Week 1</div>
          <div class="step-content">
            <strong class="step-title">Fundamentals &amp; Core Skill Acquisition</strong>
            <p class="step-desc">Master the syntax and patterns for missing keywords (${missingKeywords.slice(0, 3).join(', ') || 'core role libraries'}). Build small micro-experiments and coding katas.</p>
          </div>
        </div>
        <div class="roadmap-step">
          <div class="step-badge">Week 2</div>
          <div class="step-content">
            <strong class="step-title">Bridge Project Implementation</strong>
            <p class="step-desc">Build and push one production-grade bridge project to GitHub with comprehensive README, architectural diagram, and unit tests.</p>
          </div>
        </div>
        <div class="roadmap-step">
          <div class="step-badge">Week 3</div>
          <div class="step-content">
            <strong class="step-title">Resume Refinement in AI Editor</strong>
            <p class="step-desc">Add your newly built project to your resume. Use the AI Resume Editor to formulate action bullets with measurable percentage metrics.</p>
          </div>
        </div>
        <div class="roadmap-step">
          <div class="step-badge">Week 4</div>
          <div class="step-content">
            <strong class="step-title">Mock Technical &amp; Machine Coding Practice</strong>
            <p class="step-desc">Practice timed coding assessments, system design breakdowns, and behavioral STAR stories for ${escHtml(companyName || 'campus / off-campus')} hiring rounds.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── Skeleton ────────────────────────────────────────────────
export function showSkeleton() {
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('skeletonWrap').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  updateAllAdSlots();
}

export function hideSkeleton() {
  document.getElementById('skeletonWrap').classList.add('hidden');
}

export function showResults() {
  document.getElementById('results').classList.remove('hidden');
  updateAllAdSlots();
}

export function resetToEmptyState() {
  document.getElementById('emptyState')?.classList.remove('hidden');
  document.getElementById('skeletonWrap')?.classList.add('hidden');
  document.getElementById('results')?.classList.add('hidden');
  updateAllAdSlots();
}

// ─── Toast Notifications ─────────────────────────────────────
export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    error:   '✕',
    success: '✓',
    info:    'ℹ',
  };

  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${escHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Chat helpers ────────────────────────────────────────────
export function appendChatMessage(role, content) {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <div class="msg-avatar">${role === 'user' ? '👤' : '✨'}</div>
    <div class="msg-bubble">${formatChatContent(content)}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

export function appendTypingIndicator() {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg assistant';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="msg-avatar">✨</div>
    <div class="msg-bubble">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

export function removeTypingIndicator() {
  document.getElementById('typingIndicator')?.remove();
}

export function updateStreamingBubble(div, text) {
  const bubble = div.querySelector('.msg-bubble');
  if (bubble) {
    bubble.innerHTML = formatChatContent(text);
    div.parentElement.scrollTop = div.parentElement.scrollHeight;
  }
}


// ─── Score Potential Panel ───────────────────────────────────
/**
 * Render the Score Improvement Potential panel.
 * @param {object} potential — result of computeScorePotential(analysis)
 */
export function renderScorePotential(potential) {
  const container = document.getElementById('scorePotentialContainer');
  if (!container || !potential) return;

  const { currentScore, potentialScore, pointsGain, improvements, alreadyStrong } = potential;

  if (pointsGain <= 0 || improvements.length === 0) {
    // Score is already near maximum — show congratulatory message
    container.innerHTML = `
      <div class="sp-perfect-row">
        <span class="sp-perfect-icon">✦</span>
        <span class="sp-perfect-text">Your resume is performing near its maximum potential across all dimensions. Focus on tailoring to each specific job description.</span>
      </div>`;
    return;
  }

  const gainColor   = pointsGain >= 10 ? 'var(--green, #15803d)' : 'var(--primary, #0284c7)';
  const strongHtml  = alreadyStrong.length > 0
    ? `<div class="sp-strong-row">
        <span class="sp-strong-label">✓ Already strong:</span>
        ${alreadyStrong.map(l => `<span class="sp-strong-chip">${escHtml(l)}</span>`).join('')}
       </div>`
    : '';

  const itemsHtml = improvements.map((imp, idx) => {
    const barPct  = Math.round((imp.currentScore / 100) * 100);
    const barColor = imp.currentScore >= 80 ? 'var(--green,#15803d)'
                   : imp.currentScore >= 60 ? 'var(--primary,#0284c7)'
                   : imp.currentScore >= 40 ? 'var(--yellow,#b45309)'
                   : 'var(--red,#be123c)';
    const weightPct = Math.round(imp.weight * 100);
    return `
      <div class="sp-item">
        <div class="sp-item-header">
          <div class="sp-item-left">
            <span class="sp-rank">${idx + 1}</span>
            <span class="sp-dim-label">${escHtml(imp.label)}</span>
            <span class="sp-weight-tag">${weightPct}% weight</span>
          </div>
          <div class="sp-item-right">
            <span class="sp-current-score">${imp.currentScore}<span class="sp-denom">/100</span></span>
            <span class="sp-arrow">→</span>
            <span class="sp-ceiling-score">${imp.ceiling}</span>
            <span class="sp-gain-tag">+${imp.weightedGain} pts</span>
          </div>
        </div>
        <div class="sp-bar-track">
          <div class="sp-bar-fill" style="width:${barPct}%;background:${barColor};"></div>
          <div class="sp-bar-potential" style="width:${Math.round(imp.ceiling)}%;"></div>
        </div>
        <p class="sp-hint">${escHtml(imp.hint)}</p>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="sp-headline-row">
      <div class="sp-score-from">
        <span class="sp-score-val">${currentScore}</span>
        <span class="sp-score-meta">current</span>
      </div>
      <div class="sp-arrow-big">→</div>
      <div class="sp-score-to">
        <span class="sp-score-val" style="color:${gainColor};">${potentialScore}</span>
        <span class="sp-score-meta">potential</span>
      </div>
      <div class="sp-gain-summary">
        <span class="sp-gain-pill" style="background:${gainColor}22;color:${gainColor};border:1px solid ${gainColor}55;">
          +${pointsGain} points within reach
        </span>
        <span class="sp-gain-sub">Fix the ${improvements.length} dimension${improvements.length > 1 ? 's' : ''} below</span>
      </div>
    </div>
    ${strongHtml}
    <div class="sp-items-list">${itemsHtml}</div>`;
}

// ─── Best Matching Section at Bottom of Analysis Tab ──────────
export function renderBestMatchingSection(data) {
  const card = document.getElementById('bestMatchingCard');
  if (!card) return;

  const suggestedRoles = data?.suggestedRoles || [];

  // 1. Populate top preview chips as links to best-matching.html
  const preview = document.getElementById('bestMatchingRolesPreview');
  if (preview) {
    if (suggestedRoles.length === 0) {
      preview.innerHTML = `
        <a href="best-matching.html" class="best-matching-role-chip" title="Explore Best Matching Jobs on dedicated page">
          <span>⭐ Software Engineer</span>
          <span class="match-score">85% Match</span>
        </a>
      `;
    } else {
      const topRoles = suggestedRoles.slice(0, 4);
      preview.innerHTML = topRoles.map((role, idx) => {
        const star = idx === 0 ? '⭐ ' : '';
        const badgeColor = role.matchScore >= 70 ? '#10b981' : (role.matchScore >= 45 ? '#0284c7' : '#64748b');
        return `
          <a href="best-matching.html" class="best-matching-role-chip" title="Direct match for ${escHtml(role.title)} — View all matching jobs">
            <span>${star}${escHtml(role.title)}</span>
            <span class="match-score" style="color:${badgeColor}; border:1px solid ${badgeColor}40;">${role.matchScore}% Match</span>
          </a>
        `;
      }).join('');
    }
  }

  // 2. Extract Candidate Skills
  const flatSkills = [];
  if (data?.skills?.technical && Array.isArray(data.skills.technical)) {
    flatSkills.push(...data.skills.technical);
  }
  if (data?.diagnostics?.categorizedSkills) {
    Object.values(data.diagnostics.categorizedSkills).forEach(cat => {
      if (cat?.items) cat.items.forEach(it => { if (it?.name) flatSkills.push(it.name); });
    });
  }
  if (data?.diagnostics?.uniqueSkills) {
    data.diagnostics.uniqueSkills.forEach(s => flatSkills.push(s));
  }
  const candidateSkills = Array.from(new Set(flatSkills.map(s => s.toLowerCase())));

  // 3. Save Candidate Profile for best-matching.html & opportunities.html
  try {
    const candidateProfile = {
      candidateName: data?.contact?.name || data?.candidateName || 'Candidate',
      targetRole: data?.targetRoleFit?.targetRole || (suggestedRoles[0]?.title) || 'Software Engineer',
      suggestedRoles: suggestedRoles,
      flatSkills: Array.from(new Set(flatSkills)),
      overallScore: data?.overall_score || data?.overallScore || 85,
      atsGrade: data?.grade || 'A'
    };
    localStorage.setItem('resumereviewer_candidate_profile', JSON.stringify(candidateProfile));
  } catch (e) {}
}

function renderInpageJobsGrid() {
  const grid = document.getElementById('inpageBestMatchingJobsGrid');
  const countEl = document.getElementById('inpageVisibleJobsCount');
  const allCountEl = document.getElementById('inpageAllCount');
  const filterLabel = document.getElementById('inpageFilterLabel');
  if (!grid) return;

  if (allCountEl) allCountEl.textContent = inpageScoredJobs.length;

  let filtered = inpageScoredJobs.filter(job => {
    if (inpageCurrentFilter !== 'all') {
      if (inpageCurrentFilter === 'internship' && job.type !== 'internship') return false;
      if (inpageCurrentFilter === 'fresher' && job.type !== 'fresher') return false;
      if (inpageCurrentFilter === 'product' && job.category !== 'product') return false;
      if (inpageCurrentFilter === 'high-package' && (job.salaryNumeric || 0) < 7.0) return false;
    }
    if (inpageCurrentSearch) {
      const haystack = `${job.title} ${job.company} ${(job.requiredSkills || []).join(' ')} ${job.location} ${job.roleCategory} ${job.summary}`.toLowerCase();
      if (!haystack.includes(inpageCurrentSearch)) return false;
    }
    return true;
  });

  if (inpageCurrentSort === 'match') {
    filtered.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
  } else if (inpageCurrentSort === 'stipend') {
    filtered.sort((a, b) => (b.salaryNumeric || 0) - (a.salaryNumeric || 0));
  } else if (inpageCurrentSort === 'recent') {
    filtered.sort((a, b) => (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0));
  }

  if (countEl) countEl.textContent = filtered.length;
  if (filterLabel) {
    if (inpageCurrentFilter === 'internship') filterLabel.textContent = 'Best Matching Internships';
    else if (inpageCurrentFilter === 'fresher') filterLabel.textContent = 'Best Matching Fresher Roles';
    else if (inpageCurrentFilter === 'product') filterLabel.textContent = 'Best Matching Product Firms';
    else if (inpageCurrentFilter === 'high-package') filterLabel.textContent = 'High Package Roles (₹7+ LPA)';
    else filterLabel.textContent = 'All Top Matches for Your Resume';
  }

  grid.innerHTML = filtered.map((job, idx) => {
    const logoSrc = COMPANY_LOGOS[job.brandKey] || `https://www.google.com/s2/favicons?domain=${job.domain || 'google.com'}&sz=128`;
    const logoContent = `
      <img src="${logoSrc}" 
           alt="${escHtml(job.company)} logo" class="company-logo-img" loading="eager" 
           onerror="this.onerror=null; this.src='https://www.google.com/s2/favicons?domain=${job.domain || 'google.com'}&sz=128';" />
    `;

    const matchBadgeColor = job.matchPercentage >= 85 ? '#10b981' : (job.matchPercentage >= 70 ? '#0284c7' : '#f59e0b');

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
      <div class="opp-job-card best-match-card inpage-job-card" data-job-id="${job.id}" title="Touch anywhere to view full interview guide & detailed description">
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
          <div class="company-badge-wrap intel-modal-btn" data-job-id="${job.id}">
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

          <a href="https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.linkedinSearchQuery)}&f_E=1%2C2&f_TPR=r604800" target="_blank" rel="noopener noreferrer" class="btn-linkedin-icon" title="Search similar openings on LinkedIn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a66c2"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Attach card-wide touch triggers (touch anywhere in job box opens detailed description)
  grid.querySelectorAll('.inpage-job-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Allow direct external links (Apply on Official Portal, LinkedIn) without opening modal
      if (e.target.closest('a') && !e.target.closest('.intel-modal-btn')) {
        return;
      }
      const jobId = card.dataset.jobId;
      openInpageJobModal(jobId);
    });
  });

  // Explicit stopPropagation on external apply & linkedin action links
  grid.querySelectorAll('.direct-apply-btn, .btn-linkedin-icon').forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  // Attach modal trigger listeners on Interview Guide buttons
  grid.querySelectorAll('.intel-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const jobId = btn.dataset.jobId;
      openInpageJobModal(jobId);
    });
  });
}

function openInpageJobModal(jobId) {
  const job = (inpageScoredJobs || []).find(j => j.id === jobId) || (OPPORTUNITIES_DATA || []).find(j => j.id === jobId);
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

  // Wire up Tailor Resume action button (same page in-place tailoring!)
  const tailorBtn = document.getElementById('tailorResumeBtn');
  if (tailorBtn) {
    tailorBtn.onclick = (e) => {
      e.preventDefault();
      closeInpageModal();

      const roleInput = document.getElementById('targetRole');
      if (roleInput) {
        roleInput.value = `${job.company} — ${job.title}`;
      }
      const jdInput = document.getElementById('jobDescription');
      if (jdInput) {
        jdInput.value = `Target Company: ${job.company}\nTarget Role: ${job.title} (${job.roleCategory})\nLocation: ${job.location} | Package: ${job.package}\nBatch Eligibility: ${job.batchEligibility || ''}\n\nRole Overview:\n${job.summary || ''}\n\nRequired Technical Competencies:\n${(job.requiredSkills || []).join(', ')}\n\nInterview Questions & Evaluation Focus:\n${(job.sampleQuestions || []).join('\n')}\n\nRecruiter Resume Tip:\n${job.resumeTip || ''}`;
      }

      showToast(`Tailoring resume for ${job.company}! Recalculating ATS match & keywords...`, 'success');

      if (typeof inpageTailorCallback === 'function') {
        inpageTailorCallback();
      }

      const results = document.getElementById('results');
      if (results) {
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  }

  if (modal) modal.classList.remove('hidden');
}

function closeInpageModal() {
  const modal = document.getElementById('roleIntelligenceModal');
  if (modal) modal.classList.add('hidden');
}

function initInpageControls() {
  const searchInput = document.getElementById('inpageBestMatchSearchInput');
  const sortSelect = document.getElementById('inpageBestMatchSortSelect');
  const tabs = document.querySelectorAll('#inpageBestMatchCategoryTabs .opp-tab');
  const toggleBtn = document.getElementById('bestMatchingToggleBtn') || document.getElementById('bestMatchingScrollBtn');
  const expandable = document.getElementById('bestMatchingExpandableContent');
  const btnSub = document.getElementById('bestMatchingBtnSub');
  const collapseBtn = document.getElementById('inpageCollapseBtn');
  const modal = document.getElementById('roleIntelligenceModal');
  const closeBtn = document.getElementById('closeIntelModalBtn');
  const dismissBtn = document.getElementById('dismissIntelModalBtn');

  function toggleExpanded(shouldOpen) {
    if (!expandable) return;
    const isCurrentlyHidden = expandable.classList.contains('hidden');
    const targetOpen = (typeof shouldOpen === 'boolean') ? shouldOpen : isCurrentlyHidden;

    if (targetOpen) {
      expandable.classList.remove('hidden');
      if (toggleBtn) toggleBtn.classList.add('active');
      if (btnSub) btnSub.innerHTML = 'Hide Matching Roles &uarr;';
      renderInpageJobsGrid();
      setTimeout(() => {
        expandable.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else {
      expandable.classList.add('hidden');
      if (toggleBtn) toggleBtn.classList.remove('active');
      const count = (inpageScoredJobs && inpageScoredJobs.length) ? inpageScoredJobs.length : 16;
      if (btnSub) btnSub.innerHTML = `Open Matching Jobs (${count}) &darr;`;
      const card = document.getElementById('bestMatchingCard');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleExpanded();
    });
  }

  if (collapseBtn) {
    collapseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleExpanded(false);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      inpageCurrentSearch = e.target.value.toLowerCase().trim();
      renderInpageJobsGrid();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      inpageCurrentSort = e.target.value;
      renderInpageJobsGrid();
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      inpageCurrentFilter = tab.dataset.category || 'all';
      renderInpageJobsGrid();
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeInpageModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeInpageModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeInpageModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeInpageModal();
    }
  });
}


// ─── Utilities ───────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatChatContent(text) {
  // Convert markdown-like formatting to HTML
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}
