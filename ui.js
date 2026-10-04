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
export function renderRoleDevelopmentRoadmap(data, targetRole = '', jobDescription = '') {
  const card = document.getElementById('roleDevCard');
  const body = document.getElementById('roleDevBody');
  const sub = document.getElementById('roleDevSubtitle');
  const badge = document.getElementById('roleDevBadge');
  if (!card || !body) return;

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
  const preview = document.getElementById('bestMatchingRolesPreview');
  const card = document.getElementById('bestMatchingCard');
  if (!card) return;

  const roles = data?.suggestedRoles || [];
  if (!preview) return;

  if (roles.length === 0) {
    preview.innerHTML = `
      <div class="best-matching-role-chip">
        <span>⭐ Software Engineer</span>
        <span class="match-score">85% Match</span>
      </div>
    `;
    return;
  }

  const topRoles = roles.slice(0, 4);
  preview.innerHTML = topRoles.map((role, idx) => {
    const star = idx === 0 ? '⭐ ' : '';
    const badgeColor = role.matchScore >= 70 ? '#10b981' : (role.matchScore >= 45 ? '#0284c7' : '#64748b');
    return `
      <div class="best-matching-role-chip" title="Direct match for ${escHtml(role.title)}">
        <span>${star}${escHtml(role.title)}</span>
        <span class="match-score" style="color:${badgeColor}; border:1px solid ${badgeColor}40;">${role.matchScore}% Match</span>
      </div>
    `;
  }).join('');
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
