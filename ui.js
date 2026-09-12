/**
 * ui.js — DOM helpers: score ring, cards, skeleton, toasts
 */

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
              <span class="tier-label">${escHtml(sen.low?.tier || 'Low (Entry/Jr)')}</span>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.low?.readiness || 90}%; background:#10b981;"></div></div>
              <span class="tier-stat">${sen.low?.readiness || 90}% · ${escHtml(sen.low?.status || 'Ready')}</span>
            </div>
            <div class="seniority-tier-item tier-mid">
              <span class="tier-label">${escHtml(sen.mid?.tier || 'Mid (Developer)')}</span>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.mid?.readiness || 75}%; background:#f59e0b;"></div></div>
              <span class="tier-stat">${sen.mid?.readiness || 75}% · ${escHtml(sen.mid?.status || 'Developing')}</span>
            </div>
            <div class="seniority-tier-item tier-high">
              <span class="tier-label">${escHtml(sen.high?.tier || 'High (Lead/Sr)')}</span>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.high?.readiness || 45}%; background:#ef4444;"></div></div>
              <span class="tier-stat">${sen.high?.readiness || 45}% · ${escHtml(sen.high?.status || 'Aspirational')}</span>
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
              <span class="tier-label">Low (Entry/Jr)</span>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.low.readiness}%; background:#10b981;"></div></div>
              <span class="tier-stat">${sen.low.readiness}% · ${escHtml(sen.low.verdict)}</span>
            </div>
            <div class="seniority-tier-item tier-mid">
              <span class="tier-label">Mid (Developer)</span>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.mid.readiness}%; background:#f59e0b;"></div></div>
              <span class="tier-stat">${sen.mid.readiness}% · ${escHtml(sen.mid.verdict)}</span>
            </div>
            <div class="seniority-tier-item tier-high">
              <span class="tier-label">High (Senior/Lead)</span>
              <div class="tier-meter"><div class="tier-meter-bar" style="width:${sen.high.readiness}%; background:#ef4444;"></div></div>
              <span class="tier-stat">${sen.high.readiness}% · ${escHtml(sen.high.verdict)}</span>
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

// ─── Skeleton ────────────────────────────────────────────────
export function showSkeleton() {
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('skeletonWrap').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
}

export function hideSkeleton() {
  document.getElementById('skeletonWrap').classList.add('hidden');
}

export function showResults() {
  document.getElementById('results').classList.remove('hidden');
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
