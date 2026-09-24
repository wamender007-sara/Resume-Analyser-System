/**
 * pdf-export.js — Analysis Report PDF Generator
 *
 * Builds a structured HTML report from the live analysis object and
 * triggers window.print() so the browser's native Print-to-PDF produces
 * a clean, multi-page professional document.
 *
 * Zero external dependencies — no CDN, no server call.
 * No API keys or raw resume text are included in the report.
 */

// ─── Dimension labels (mirrors ui.js EVAL_DIMENSIONS) ─────────────────
const DIMENSION_LABELS = {
  keyword_match:           'Keyword & Skill Match',
  experience_relevance:    'Experience Relevance',
  quantifiable_impact:     'Quantifiable Impact',
  education_certifications:'Education & Certifications',
  ats_compatibility:       'ATS Compatibility',
  language_quality:        'Language Quality',
};

const DIMENSION_WEIGHTS = {
  keyword_match:           '30%',
  experience_relevance:    '30%',
  quantifiable_impact:     '15%',
  education_certifications:'10%',
  ats_compatibility:       '10%',
  language_quality:        '5%',
};

const SECTION_LABELS = {
  contactInfo:         'Contact Info',
  professionalSummary: 'Professional Summary',
  workExperience:      'Work Experience',
  skills:              'Skills',
  education:           'Education',
  certifications:      'Certifications',
  projects:            'Projects',
};

// ─── Utility helpers ───────────────────────────────────────────────────
function esc(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scoreBar(value) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  const color = pct >= 80 ? '#15803d' : pct >= 60 ? '#0284c7' : pct >= 40 ? '#b45309' : '#be123c';
  return `
    <div class="rr-bar-row">
      <div class="rr-bar-track">
        <div class="rr-bar-fill" style="width:${pct}%;background:${color};"></div>
      </div>
      <span class="rr-bar-val" style="color:${color};">${pct}</span>
    </div>`;
}

function severityLabel(sev) {
  if (sev === 'high')   return '<span class="rr-sev rr-sev-high">High</span>';
  if (sev === 'low')    return '<span class="rr-sev rr-sev-low">Low</span>';
  return '<span class="rr-sev rr-sev-med">Medium</span>';
}

// ─── Section builders ──────────────────────────────────────────────────

function buildHeader(a) {
  const score  = a.overallScore ?? a.overall_score ?? 0;
  const grade  = esc(a.grade ?? 'B');
  const name   = esc(a.candidateName ?? 'Candidate');
  const sen    = esc((a.seniority ?? 'junior').toUpperCase());
  const date   = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const verdictClass = score >= 75 ? 'rr-verdict-strong' : score >= 50 ? 'rr-verdict-mod' : 'rr-verdict-weak';

  const circumference = 314;
  const offset = Math.round(circumference - (score / 100) * circumference);

  return `
  <div class="rr-header">
    <div class="rr-header-top">
      <div class="rr-brand">
        <span class="rr-brand-name">ResumeReviewer</span>
        <span class="rr-brand-tag">ATS Diagnostics &amp; Career Architecture</span>
      </div>
      <div class="rr-meta">
        <span>Analysis Report</span>
        <span>${esc(date)}</span>
      </div>
    </div>

    <div class="rr-hero">
      <div class="rr-score-ring-wrap">
        <svg class="rr-score-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" stroke-width="10"/>
          <circle cx="60" cy="60" r="50" fill="none"
            stroke="${score >= 75 ? '#15803d' : score >= 50 ? '#0284c7' : '#be123c'}"
            stroke-width="10"
            stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            transform="rotate(-90 60 60)"/>
        </svg>
        <div class="rr-score-center">
          <span class="rr-score-num">${score}</span>
          <span class="rr-score-denom">/100</span>
        </div>
      </div>

      <div class="rr-hero-details">
        <div class="rr-candidate-name">${name}</div>
        <div class="rr-pills-row">
          <span class="rr-grade-pill">Grade: ${grade}</span>
          <span class="rr-seniority-pill">${sen} Level</span>
          <span class="rr-verdict-pill ${verdictClass}">${esc(a.verdict ?? 'Moderate Match')}</span>
        </div>
        <p class="rr-summary-text">${esc(a.summary ?? '')}</p>
        ${a.diagnostics ? `
        <div class="rr-quick-stats">
          <span>${a.diagnostics.wordCount ?? 0} words</span>
          <span>${a.diagnostics.skillsFoundCount ?? 0} skills detected</span>
          <span>${a.diagnostics.metricCount ?? 0} metrics found</span>
          ${a.jdMatch ? `<span>JD Match: ${a.jdMatch.percentage}%</span>` : ''}
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

function buildDimensions(scores) {
  if (!scores) return '';
  const rows = Object.entries(DIMENSION_LABELS).map(([key, label]) => {
    const val = scores[key] ?? 0;
    const weight = DIMENSION_WEIGHTS[key] ?? '';
    return `
    <div class="rr-dim-row">
      <div class="rr-dim-label">${esc(label)} <span class="rr-dim-weight">${weight}</span></div>
      ${scoreBar(val)}
    </div>`;
  }).join('');
  return `
  <div class="rr-section rr-avoid-break">
    <h2 class="rr-section-title">6 Core Evaluative Dimensions</h2>
    <div class="rr-dim-grid">${rows}</div>
  </div>`;
}

function buildSectionScores(sectionScores) {
  if (!sectionScores) return '';
  const rows = Object.entries(sectionScores).map(([key, val]) => {
    const label = SECTION_LABELS[key] ?? key;
    return `
    <div class="rr-dim-row">
      <div class="rr-dim-label">${esc(label)}</div>
      ${scoreBar(val)}
    </div>`;
  }).join('');
  return `
  <div class="rr-section">
    <h2 class="rr-section-title">Section Breakdown</h2>
    <div class="rr-dim-grid">${rows}</div>
  </div>`;
}

function buildSkills(categorized) {
  if (!categorized) return '';
  const catLabels = {
    languages:         '💻 Languages',
    frameworks:        '⚛ Frameworks & Web Stack',
    databases:         '🗄 Databases & Storage',
    cloud_devops:      '☁ Cloud, DevOps & Tools',
    domain_specialized:'🔬 Domain & Core Engineering',
  };
  let html = '';
  for (const [key, label] of Object.entries(catLabels)) {
    const list = categorized[key] ?? [];
    if (list.length === 0) continue;
    html += `<div class="rr-skill-group">
      <span class="rr-skill-cat">${label}</span>
      <div class="rr-skill-chips">${list.map(s => `<span class="rr-chip">${esc(s)}</span>`).join('')}</div>
    </div>`;
  }
  if (!html) return '';
  return `
  <div class="rr-section">
    <h2 class="rr-section-title">Verified Technical Skills Inventory</h2>
    ${html}
  </div>`;
}

function buildStrengthsWeaknesses(strengths, weaknesses, missingSections) {
  const strHtml = (strengths ?? []).map(s => `<li>${esc(s)}</li>`).join('') || '<li>None identified.</li>';
  const wkHtml  = (weaknesses ?? []).map(w =>
    `<li>${severityLabel(w.severity)} ${esc(w.text)}</li>`).join('') || '<li>None identified.</li>';
  const misHtml = (missingSections ?? []).map(s => `<li>${esc(s)}</li>`).join('') || '<li>None identified.</li>';

  return `
  <div class="rr-section rr-three-col">
    <div class="rr-col rr-col-green">
      <h3 class="rr-col-title">✓ Strengths</h3>
      <ul class="rr-list">${strHtml}</ul>
    </div>
    <div class="rr-col rr-col-red">
      <h3 class="rr-col-title">⚠ Missing / Gaps</h3>
      <ul class="rr-list">${misHtml}</ul>
    </div>
    <div class="rr-col rr-col-amber">
      <h3 class="rr-col-title">↑ Critical Improvements</h3>
      <ul class="rr-list">${wkHtml}</ul>
    </div>
  </div>`;
}

function buildAts(atsCompatibility) {
  if (!atsCompatibility) return '';
  const rating = esc(atsCompatibility.score ?? 'Fair');
  const numeric = atsCompatibility.numericScore ?? 0;
  const issues  = (atsCompatibility.issues ?? []).map(i => `<li>${esc(i)}</li>`).join('');
  const ratingColor = rating === 'Good' ? '#15803d' : rating === 'Fair' ? '#b45309' : '#be123c';
  return `
  <div class="rr-section rr-avoid-break">
    <h2 class="rr-section-title">ATS Compatibility</h2>
    <div class="rr-ats-row">
      <span class="rr-ats-badge" style="background:${ratingColor}22;color:${ratingColor};border:1px solid ${ratingColor}55;">${rating}</span>
      <span class="rr-ats-num">${numeric}% Compatible</span>
    </div>
    ${issues ? `<ul class="rr-list">${issues}</ul>` : ''}
  </div>`;
}

function buildActionPlan(actionPlan, recommendedKeywords, keywordsContext) {
  const steps = (actionPlan ?? []).map((s, i) => `<li><strong>${i + 1}.</strong> ${esc(s)}</li>`).join('');
  const kwHtml = (recommendedKeywords ?? []).map(k => `<span class="rr-chip">${esc(k)}</span>`).join('');
  let html = '';
  if (steps) {
    html += `
  <div class="rr-section rr-avoid-break">
    <h2 class="rr-section-title">Prioritized Action Plan</h2>
    <ul class="rr-list rr-action-list">${steps}</ul>
  </div>`;
  }
  if (kwHtml) {
    html += `
  <div class="rr-section rr-avoid-break">
    <h2 class="rr-section-title">Target Industry Keywords</h2>
    ${keywordsContext ? `<p class="rr-keywords-hint">${esc(keywordsContext)}</p>` : ''}
    <div class="rr-skill-chips">${kwHtml}</div>
  </div>`;
  }
  return html;
}

function buildBulletRewrites(bulletRewrites) {
  if (!bulletRewrites || bulletRewrites.length === 0) return '';
  const cards = bulletRewrites.slice(0, 5).map((item, idx) => `
    <div class="rr-rewrite-card rr-avoid-break">
      <div class="rr-rewrite-label">Improvement #${idx + 1} — ${esc(item.issue ?? '')}</div>
      <div class="rr-rewrite-original"><span class="rr-rewrite-tag rr-tag-before">Before</span> ${esc(item.original ?? '')}</div>
      <div class="rr-rewrite-improved"><span class="rr-rewrite-tag rr-tag-after">After</span> ${esc(item.improved ?? '')}</div>
    </div>`).join('');
  return `
  <div class="rr-section">
    <h2 class="rr-section-title">High-Impact Bullet Rewrites (STAR / Google XYZ)</h2>
    ${cards}
  </div>`;
}

function buildJdMatch(jdMatch) {
  if (!jdMatch) return '';
  const pct   = jdMatch.percentage ?? 0;
  const color = pct >= 70 ? '#15803d' : pct >= 45 ? '#b45309' : '#be123c';
  const missing = (jdMatch.missingKeywords ?? []).join(', ') || 'All top terms matched!';
  return `
  <div class="rr-section rr-avoid-break">
    <h2 class="rr-section-title">Job Description Match</h2>
    <p><strong style="color:${color}">${pct}% Match</strong> — ${jdMatch.matchedCount ?? 0}/${jdMatch.totalChecked ?? 0} terms matched.</p>
    <p class="rr-sub">Missing terms: ${esc(missing)}</p>
  </div>`;
}

function buildFooter() {
  return `
  <div class="rr-footer">
    Generated by <strong>ResumeReviewer</strong> · ATS Diagnostics &amp; Career Architecture ·
    ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
    <br><span class="rr-footer-note">All analysis is performed client-side. No data is stored or transmitted.</span>
  </div>`;
}

// ─── Inline print stylesheet ───────────────────────────────────────────
const PRINT_STYLES = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,'Segoe UI',system-ui,sans-serif;font-size:11pt;color:#0f172a;background:#fff;}
  #pdfReportContainer{max-width:100%;padding:0;}

  /* Header */
  .rr-header{padding:18pt 24pt 14pt;border-bottom:2pt solid #0284c7;margin-bottom:16pt;}
  .rr-header-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14pt;}
  .rr-brand-name{font-size:16pt;font-weight:800;color:#0284c7;display:block;}
  .rr-brand-tag{font-size:8pt;color:#64748b;}
  .rr-meta{font-size:8pt;color:#64748b;text-align:right;line-height:1.6;}
  .rr-hero{display:flex;align-items:center;gap:24pt;}
  .rr-score-ring-wrap{position:relative;flex-shrink:0;width:90pt;height:90pt;}
  .rr-score-ring{width:90pt;height:90pt;}
  .rr-score-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .rr-score-num{font-size:22pt;font-weight:800;line-height:1;color:#0f172a;}
  .rr-score-denom{font-size:8pt;color:#64748b;}
  .rr-hero-details{flex:1;}
  .rr-candidate-name{font-size:15pt;font-weight:700;color:#0f172a;margin-bottom:6pt;}
  .rr-pills-row{display:flex;flex-wrap:wrap;gap:5pt;margin-bottom:7pt;}
  .rr-grade-pill,.rr-seniority-pill,.rr-verdict-pill{font-size:8pt;font-weight:600;padding:2pt 7pt;border-radius:999pt;border:1pt solid #c5dcee;background:#f0f6fc;}
  .rr-verdict-strong{background:#f0fdf4;color:#15803d;border-color:#86efac;}
  .rr-verdict-mod{background:#fffbeb;color:#b45309;border-color:#fde68a;}
  .rr-verdict-weak{background:#fef2f2;color:#be123c;border-color:#fecaca;}
  .rr-summary-text{font-size:9pt;color:#334155;line-height:1.5;margin-bottom:7pt;}
  .rr-quick-stats{display:flex;flex-wrap:wrap;gap:8pt;font-size:8pt;color:#64748b;}
  .rr-quick-stats span::before{content:'• ';color:#94a3b8;}

  /* Sections */
  .rr-section{padding:12pt 24pt;border-bottom:1pt solid #e2e8f0;}
  .rr-section-title{font-size:11pt;font-weight:700;color:#0f172a;margin-bottom:8pt;padding-bottom:3pt;border-bottom:1pt solid #e2e8f0;}

  /* Dimension bars */
  .rr-dim-grid{display:grid;grid-template-columns:1fr 1fr;gap:6pt 18pt;}
  .rr-dim-row{margin-bottom:4pt;}
  .rr-dim-label{font-size:8.5pt;color:#334155;margin-bottom:2pt;}
  .rr-dim-weight{font-size:7.5pt;color:#94a3b8;margin-left:4pt;}
  .rr-bar-row{display:flex;align-items:center;gap:6pt;}
  .rr-bar-track{flex:1;height:7pt;background:#e2e8f0;border-radius:999pt;overflow:hidden;}
  .rr-bar-fill{height:100%;border-radius:999pt;}
  .rr-bar-val{font-size:8pt;font-weight:700;min-width:20pt;text-align:right;}

  /* Three-column strengths/weaknesses/gaps */
  .rr-three-col{display:flex;gap:14pt;align-items:flex-start;}
  .rr-col{flex:1;}
  .rr-col-title{font-size:9pt;font-weight:700;margin-bottom:5pt;padding:3pt 6pt;border-radius:4pt;}
  .rr-col-green .rr-col-title{background:#f0fdf4;color:#15803d;}
  .rr-col-red .rr-col-title{background:#fef2f2;color:#be123c;}
  .rr-col-amber .rr-col-title{background:#fffbeb;color:#b45309;}

  /* Lists */
  .rr-list{padding-left:13pt;font-size:9pt;color:#334155;line-height:1.6;}
  .rr-list li{margin-bottom:3pt;}
  .rr-action-list li{margin-bottom:5pt;}

  /* Severity badges */
  .rr-sev{font-size:7pt;font-weight:700;padding:1pt 5pt;border-radius:999pt;margin-right:4pt;}
  .rr-sev-high{background:#fef2f2;color:#be123c;}
  .rr-sev-med{background:#fffbeb;color:#b45309;}
  .rr-sev-low{background:#f0fdf4;color:#15803d;}

  /* Skills chips */
  .rr-skill-group{margin-bottom:8pt;}
  .rr-skill-cat{font-size:8.5pt;font-weight:600;color:#334155;display:block;margin-bottom:4pt;}
  .rr-skill-chips{display:flex;flex-wrap:wrap;gap:4pt;}
  .rr-chip{font-size:7.5pt;padding:2pt 7pt;border-radius:4pt;background:#f0f6fc;border:1pt solid #c5dcee;color:#0f172a;}

  /* ATS */
  .rr-ats-row{display:flex;align-items:center;gap:10pt;margin-bottom:7pt;}
  .rr-ats-badge{font-size:9pt;font-weight:700;padding:3pt 10pt;border-radius:5pt;}
  .rr-ats-num{font-size:9pt;color:#334155;}

  /* Bullet rewrites */
  .rr-rewrite-card{background:#f8fafc;border:1pt solid #e2e8f0;border-radius:5pt;padding:8pt 10pt;margin-bottom:8pt;}
  .rr-rewrite-label{font-size:8pt;font-weight:700;color:#0284c7;margin-bottom:5pt;}
  .rr-rewrite-original,.rr-rewrite-improved{font-size:8.5pt;line-height:1.5;margin-bottom:4pt;}
  .rr-rewrite-tag{font-size:7pt;font-weight:700;padding:1pt 5pt;border-radius:3pt;margin-right:5pt;}
  .rr-tag-before{background:#fef2f2;color:#be123c;}
  .rr-tag-after{background:#f0fdf4;color:#15803d;}

  /* Keywords hint */
  .rr-keywords-hint{font-size:8.5pt;color:#64748b;margin-bottom:6pt;font-style:italic;}
  .rr-sub{font-size:8.5pt;color:#64748b;margin-top:4pt;}

  /* Footer */
  .rr-footer{padding:10pt 24pt;font-size:8pt;color:#94a3b8;text-align:center;border-top:1pt solid #e2e8f0;}
  .rr-footer-note{font-size:7.5pt;}

  /* Page-break helpers */
  .rr-avoid-break{break-inside:avoid;page-break-inside:avoid;}
`;

// ─── Main export function ──────────────────────────────────────────────

/**
 * Build the full report HTML string from a live analysis object.
 * @param {object} analysis — the object returned by analyseResumeLocally()
 * @returns {string} complete HTML document string
 */
export function buildReportHtml(analysis) {
  const a = analysis || {};
  return [
    buildHeader(a),
    buildDimensions(a.scores),
    buildSectionScores(a.sectionScores),
    buildSkills(a.diagnostics?.categorizedSkills),
    buildJdMatch(a.jdMatch),
    buildStrengthsWeaknesses(a.strengths, a.weaknesses, a.missingSections),
    buildAts(a.atsCompatibility),
    buildBulletRewrites(a.bulletRewrites),
    buildActionPlan(a.actionPlan, a.recommendedKeywords, a.keywordsContext),
    buildFooter(),
  ].join('\n');
}

/**
 * Inject the report into the DOM and trigger window.print().
 * @param {object} analysis — the object returned by analyseResumeLocally()
 * @param {function} [showToast] — optional toast callback for error display
 */
export function generatePdfReport(analysis, showToast) {
  if (!analysis) {
    if (showToast) showToast('No analysis data available. Please analyse a resume first.', 'error');
    return;
  }

  const container = document.getElementById('pdfReportContainer');
  if (!container) {
    if (showToast) showToast('PDF export element not found. Please refresh the page.', 'error');
    return;
  }

  try {
    container.innerHTML = buildReportHtml(analysis);
    container.setAttribute('data-ready', 'true');
    window.print();
  } catch (err) {
    console.error('[PDF Export] Failed to generate report:', err);
    if (showToast) showToast(`PDF export failed: ${err.message}. Please try again.`, 'error');
  } finally {
    // Clean up after print dialog closes (or is cancelled)
    // Small delay ensures the print dialog has had time to read the DOM
    setTimeout(() => {
      container.innerHTML = '';
      container.removeAttribute('data-ready');
    }, 1000);
  }
}
