/**
 * score-potential.js — Score Improvement Potential Engine
 *
 * Pure computation module — no DOM, no side effects, fully testable.
 *
 * Takes the existing analysis object (already computed by analyseResumeLocally)
 * and calculates:
 *   - Which dimensions have the most room to improve
 *   - A realistic potential score (assuming top 3 weakest dimensions reach 85)
 *   - Concrete, grounded action items for each improvable dimension
 *
 * IMPORTANT: Does NOT re-run or modify the scoring engine.
 *            Uses only data already present in the analysis object.
 */

// ─── Dimension metadata (mirrors ui.js EVAL_DIMENSIONS order) ─────────
const DIMENSIONS = [
  { key: 'keyword_match',            label: 'Keyword & Skill Match',    weight: 0.30 },
  { key: 'experience_relevance',     label: 'Experience Relevance',     weight: 0.30 },
  { key: 'quantifiable_impact',      label: 'Quantifiable Impact',      weight: 0.15 },
  { key: 'education_certifications', label: 'Education & Certifications', weight: 0.10 },
  { key: 'ats_compatibility',        label: 'ATS Compatibility',         weight: 0.10 },
  { key: 'language_quality',         label: 'Language Quality',          weight: 0.05 },
];

// Realistic ceiling: what an "excellent but humanly achievable" score looks like.
// Capped at 90 rather than 100 to avoid misleading "just do X and get 100" messaging.
const REALISTIC_CEILING = 90;

// Minimum gap worth surfacing to the user (avoids noise for near-perfect dimensions)
const MIN_IMPROVABLE_GAP = 8;

// ─── Action hint generators ────────────────────────────────────────────
// Each returns a string grounded in real analysis data, or a solid default.

function hintKeyword(analysis) {
  const missing = analysis?.keyword_analysis?.missing_keywords ?? [];
  const count   = analysis?.diagnostics?.skillsFoundCount ?? 0;
  if (missing.length > 0) {
    const top = missing.slice(0, 3).join(', ');
    return `Add missing keywords to your Skills section or project descriptions: ${top}.`;
  }
  if (count < 8) {
    return `Expand your Skills section — only ${count} technical competencies detected. Aim for 10–15.`;
  }
  return 'Align skills phrasing directly with job description language to boost keyword density.';
}

function hintExperience(analysis) {
  const seniority = analysis?.seniority ?? 'junior';
  const hasExp    = Boolean(analysis?.sectionScores?.workExperience > 50);
  const metrics   = analysis?.diagnostics?.metricCount ?? 0;

  if (seniority === 'senior') {
    return 'Add system-architecture decisions, mentorship records, and high-scale impact metrics (cost saved, RPS, SLA).';
  }
  if (!hasExp) {
    return 'Add an Internships or Projects section with clear role, tech stack, and outcomes for each entry.';
  }
  if (metrics < 2) {
    return `Only ${metrics} quantifiable metric${metrics === 1 ? '' : 's'} found. Add numbers: users served, accuracy %, latency reduction, or lines of code.`;
  }
  return 'Rewrite experience bullets using the STAR method: Situation → Task → Action → Result.';
}

function hintImpact(analysis) {
  const metrics  = analysis?.diagnostics?.metricCount ?? 0;
  const weak     = analysis?.quantifiable_impact?.weak_bullets ?? [];
  if (weak.length > 0) {
    return `${weak.length} weak bullet point${weak.length > 1 ? 's' : ''} detected. Convert to achievement statements with measurable outcomes (%, $, users, speed).`;
  }
  if (metrics === 0) {
    return 'No quantifiable metrics found. Add at least 3 impact numbers across your project and experience bullets.';
  }
  return `Increase metric density — ${metrics} metric${metrics > 1 ? 's' : ''} found. Recruiters want to see 5–8 across the resume.`;
}

function hintEducation(analysis) {
  const hasCerts = Boolean(
    analysis?.sectionScores?.certifications > 50 ||
    (analysis?.diagnostics?.skillsFound ?? []).some(s =>
      ['aws', 'google cloud', 'azure', 'coursera', 'udemy'].includes((s ?? '').toLowerCase())
    )
  );
  const academic = analysis?.academicScore;
  if (!hasCerts) {
    return 'Add relevant certifications (AWS, Google, Coursera, or industry-specific) to strengthen this dimension.';
  }
  if (academic && academic !== 'N/A') {
    return `CGPA/score noted (${academic}). Add a "Relevant Coursework" or "Academic Projects" subsection to reinforce depth.`;
  }
  return 'List your degree, institution, graduation year, and CGPA/percentage explicitly in the Education section.';
}

function hintAts(analysis) {
  const issues    = analysis?.atsCompatibility?.issues ?? [];
  const contacts  = analysis?.diagnostics?.contacts ?? {};
  const skillsCnt = analysis?.diagnostics?.skillsFoundCount ?? 0;

  if (!contacts.email || !contacts.phone) {
    return 'ATS parsers require a clearly formatted email and phone number in the header. Ensure both are present.';
  }
  if (skillsCnt < 8) {
    return `Low keyword density (${skillsCnt} skills). ATS filters often reject resumes below 8–10 matched competencies.`;
  }
  if (issues.length > 0) {
    return issues[0].replace(/^[A-Z]+:/, '').trim() || 'Use standard section headings (Experience, Skills, Education) that ATS systems recognise reliably.';
  }
  return 'Avoid tables, multi-column layouts, and custom fonts. Use a clean single-column structure throughout.';
}

function hintLanguage(analysis) {
  const langIssues = analysis?.language_issues ?? [];
  const weakVerbs  = analysis?.diagnostics?.weakVerbsFound ?? [];
  if (langIssues.length > 0) {
    const first = langIssues[0];
    return `Replace passive phrasing: "${first.location ?? ''}" → use assertive action verbs like Engineered, Led, Optimised.`;
  }
  if (weakVerbs.length > 0) {
    return `Weak verbs detected: "${weakVerbs.slice(0, 2).join('", "')}". Upgrade to power verbs: Built, Delivered, Architected, Spearheaded.`;
  }
  return 'Tighten phrasing — remove "responsible for" and "helped with". Start every bullet with a strong past-tense action verb.';
}

const HINT_GENERATORS = {
  keyword_match:            hintKeyword,
  experience_relevance:     hintExperience,
  quantifiable_impact:      hintImpact,
  education_certifications: hintEducation,
  ats_compatibility:        hintAts,
  language_quality:         hintLanguage,
};

// ─── Main export ───────────────────────────────────────────────────────

/**
 * Compute score improvement potential from an existing analysis object.
 *
 * @param {object} analysis — object returned by analyseResumeLocally()
 * @returns {{
 *   currentScore: number,
 *   potentialScore: number,
 *   pointsGain: number,
 *   improvements: Array<{
 *     key: string,
 *     label: string,
 *     currentScore: number,
 *     ceiling: number,
 *     weightedGain: number,
 *     hint: string
 *   }>,
 *   alreadyStrong: string[]
 * }}
 */
export function computeScorePotential(analysis) {
  const currentScore = analysis?.overallScore ?? analysis?.overall_score ?? 0;
  const scores       = analysis?.scores ?? {};

  // Evaluate each dimension
  const dimensionResults = DIMENSIONS.map(dim => {
    const current     = Math.round(scores[dim.key] ?? 50);
    const gap         = Math.max(0, REALISTIC_CEILING - current);
    const weightedGain = Math.round(gap * dim.weight);
    const hint        = (HINT_GENERATORS[dim.key] ?? (() => ''))(analysis);
    return {
      key:          dim.key,
      label:        dim.label,
      weight:       dim.weight,
      currentScore: current,
      ceiling:      REALISTIC_CEILING,
      gap,
      weightedGain,
      hint,
    };
  });

  // Sort by weighted gain (highest first), filter by minimum useful gap
  const improvable = dimensionResults
    .filter(d => d.gap >= MIN_IMPROVABLE_GAP)
    .sort((a, b) => b.weightedGain - a.weightedGain);

  // Top 3 highest-impact improvements
  const top3 = improvable.slice(0, 3);

  // Potential score: current + sum of weighted gains from top 3
  const totalGain    = top3.reduce((sum, d) => sum + d.weightedGain, 0);
  const potentialScore = Math.min(98, currentScore + totalGain);

  // Dimensions already performing well (score ≥ 80 OR gap < MIN_IMPROVABLE_GAP)
  const alreadyStrong = dimensionResults
    .filter(d => d.currentScore >= 80)
    .map(d => d.label);

  return {
    currentScore,
    potentialScore,
    pointsGain: potentialScore - currentScore,
    improvements: top3,
    alreadyStrong,
    // expose all dimension results for testing / advanced use
    _allDimensions: dimensionResults,
  };
}
