/**
 * test-score-potential.mjs
 * Validates the Score Improvement Potential engine across all scenarios.
 *
 * Run: node test-score-potential.mjs
 */

import { computeScorePotential } from './score-potential.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────

/** Weak fresher resume — low scores across most dimensions */
const WEAK_ANALYSIS = {
  overallScore: 52,
  overall_score: 52,
  seniority: 'junior',
  scores: {
    keyword_match:            38,
    experience_relevance:     45,
    quantifiable_impact:      30,
    education_certifications: 70,
    ats_compatibility:        55,
    language_quality:         60,
  },
  diagnostics: {
    wordCount: 280,
    metricCount: 0,
    skillsFoundCount: 4,
    skillsFound: ['Python', 'HTML', 'CSS', 'JavaScript'],
    weakVerbsFound: ['worked', 'helped'],
    contacts: { email: 'test@example.com', phone: '+91-9876543210', linkedin: null, github: null },
  },
  keyword_analysis: { missing_keywords: ['React', 'Node.js', 'Docker'], matched_keywords: ['python', 'sql'] },
  quantifiable_impact: { weak_bullets: ['worked on project', 'helped with tasks'], strong_bullets: [] },
  language_issues: [{ issue: 'Passive phrasing', location: 'worked on developing' }],
  atsCompatibility: { score: 'Fair', numericScore: 55, issues: ['Low keyword density.'] },
  sectionScores: { workExperience: 40, skills: 55, education: 70, projects: 60 },
  strengths: ['Has Python experience.'],
  weaknesses: [{ text: 'Missing GitHub link', severity: 'medium' }],
  missingSections: ['GitHub URL', 'LinkedIn Profile'],
  actionPlan: ['Add GitHub link.'],
};

/** Strong mid-level resume — only minor gaps */
const STRONG_ANALYSIS = {
  overallScore: 84,
  overall_score: 84,
  seniority: 'mid',
  scores: {
    keyword_match:            85,
    experience_relevance:     82,
    quantifiable_impact:      75,
    education_certifications: 88,
    ats_compatibility:        90,
    language_quality:         80,
  },
  diagnostics: {
    wordCount: 620,
    metricCount: 5,
    skillsFoundCount: 14,
    skillsFound: ['React', 'Node.js', 'Python', 'Docker', 'AWS', 'MySQL', 'Git'],
    weakVerbsFound: [],
    contacts: { email: 'dev@example.com', phone: '+91-9876543210', linkedin: 'linkedin.com/in/dev', github: 'github.com/dev' },
  },
  keyword_analysis: { missing_keywords: ['Kubernetes'], matched_keywords: ['react', 'node', 'python'] },
  quantifiable_impact: { weak_bullets: ['improved performance'], strong_bullets: ['Reduced latency by 40%', 'Served 10,000 users'] },
  language_issues: [],
  atsCompatibility: { score: 'Good', numericScore: 90, issues: [] },
  sectionScores: { workExperience: 85, skills: 92, education: 88, projects: 80 },
  strengths: ['Strong skill breadth.'],
  weaknesses: [],
  missingSections: [],
  actionPlan: ['Add Kubernetes to DevOps projects.'],
};

/** Near-perfect resume — all dimensions at or above ceiling */
const PERFECT_ANALYSIS = {
  overallScore: 95,
  overall_score: 95,
  seniority: 'senior',
  scores: {
    keyword_match:            92,
    experience_relevance:     93,
    quantifiable_impact:      90,
    education_certifications: 91,
    ats_compatibility:        92,
    language_quality:         90,
  },
  diagnostics: {
    wordCount: 900,
    metricCount: 12,
    skillsFoundCount: 20,
    skillsFound: ['React', 'Node.js', 'Kubernetes', 'AWS', 'Docker', 'Python'],
    weakVerbsFound: [],
    contacts: { email: 'cto@example.com', phone: '+1-555-0100', linkedin: 'linkedin.com/in/cto', github: 'github.com/cto' },
  },
  keyword_analysis: { missing_keywords: [], matched_keywords: ['react', 'kubernetes', 'aws'] },
  quantifiable_impact: { strong_bullets: ['Reduced costs by $200k', 'Scaled to 1M RPS'], weak_bullets: [] },
  language_issues: [],
  atsCompatibility: { score: 'Good', numericScore: 92, issues: [] },
  sectionScores: { workExperience: 95, skills: 98, education: 90, projects: 92 },
  strengths: [],
  weaknesses: [],
  missingSections: [],
  actionPlan: [],
};

// ─── 1. Return shape ──────────────────────────────────────────────────
console.log('\n--- 1. Return shape is correct ---');
{
  const r = computeScorePotential(WEAK_ANALYSIS);

  assert(typeof r === 'object' && r !== null,  'Returns an object');
  assert(typeof r.currentScore === 'number',   'currentScore is a number');
  assert(typeof r.potentialScore === 'number', 'potentialScore is a number');
  assert(typeof r.pointsGain === 'number',     'pointsGain is a number');
  assert(Array.isArray(r.improvements),        'improvements is an array');
  assert(Array.isArray(r.alreadyStrong),        'alreadyStrong is an array');
  assert(Array.isArray(r._allDimensions),       '_allDimensions is an array');
  assert(r._allDimensions.length === 6,         '_allDimensions has exactly 6 entries');
}

// ─── 2. Current score is preserved unchanged ──────────────────────────
console.log('\n--- 2. Current score is NOT modified ---');
{
  const r = computeScorePotential(WEAK_ANALYSIS);
  assert(r.currentScore === 52, `currentScore matches input (${r.currentScore} === 52)`);

  const r2 = computeScorePotential(STRONG_ANALYSIS);
  assert(r2.currentScore === 84, `currentScore matches strong input (${r2.currentScore} === 84)`);
}

// ─── 3. Potential score > current score for weak resume ───────────────
console.log('\n--- 3. Potential score is higher than current for weak resume ---');
{
  const r = computeScorePotential(WEAK_ANALYSIS);
  assert(r.potentialScore > r.currentScore, `potential (${r.potentialScore}) > current (${r.currentScore})`);
  assert(r.pointsGain > 0,                  `pointsGain > 0 (got ${r.pointsGain})`);
}

// ─── 4. Potential score never exceeds 98 ─────────────────────────────
console.log('\n--- 4. Potential score is capped at 98 ---');
{
  const r1 = computeScorePotential(WEAK_ANALYSIS);
  const r2 = computeScorePotential(STRONG_ANALYSIS);
  const r3 = computeScorePotential(PERFECT_ANALYSIS);
  assert(r1.potentialScore <= 98, `Weak resume potential ≤ 98 (got ${r1.potentialScore})`);
  assert(r2.potentialScore <= 98, `Strong resume potential ≤ 98 (got ${r2.potentialScore})`);
  assert(r3.potentialScore <= 98, `Perfect resume potential ≤ 98 (got ${r3.potentialScore})`);
}

// ─── 5. Improvements capped at 3 ─────────────────────────────────────
console.log('\n--- 5. At most 3 improvement items returned ---');
{
  const r = computeScorePotential(WEAK_ANALYSIS);
  assert(r.improvements.length <= 3, `improvements.length ≤ 3 (got ${r.improvements.length})`);
  assert(r.improvements.length >= 1, `improvements.length ≥ 1 for weak resume`);
}

// ─── 6. Improvements are sorted by weighted gain descending ──────────
console.log('\n--- 6. Improvements sorted by weighted gain (highest first) ---');
{
  const r = computeScorePotential(WEAK_ANALYSIS);
  for (let i = 0; i < r.improvements.length - 1; i++) {
    assert(
      r.improvements[i].weightedGain >= r.improvements[i + 1].weightedGain,
      `Item ${i + 1} gain (${r.improvements[i].weightedGain}) ≥ item ${i + 2} gain (${r.improvements[i + 1].weightedGain})`
    );
  }
}

// ─── 7. Each improvement item has required fields ─────────────────────
console.log('\n--- 7. Improvement item shape ---');
{
  const r = computeScorePotential(WEAK_ANALYSIS);
  r.improvements.forEach((imp, i) => {
    assert(typeof imp.key === 'string' && imp.key.length > 0,    `Item ${i+1}: key is non-empty string`);
    assert(typeof imp.label === 'string' && imp.label.length > 0, `Item ${i+1}: label is non-empty string`);
    assert(typeof imp.currentScore === 'number',                   `Item ${i+1}: currentScore is number`);
    assert(typeof imp.ceiling === 'number' && imp.ceiling > 0,    `Item ${i+1}: ceiling is positive number`);
    assert(typeof imp.weightedGain === 'number' && imp.weightedGain > 0, `Item ${i+1}: weightedGain > 0`);
    assert(typeof imp.hint === 'string' && imp.hint.length > 10,   `Item ${i+1}: hint is meaningful string`);
  });
}

// ─── 8. Points gain = potential - current ────────────────────────────
console.log('\n--- 8. pointsGain === potentialScore - currentScore ---');
{
  const r = computeScorePotential(WEAK_ANALYSIS);
  assert(
    r.pointsGain === r.potentialScore - r.currentScore,
    `pointsGain (${r.pointsGain}) === potentialScore (${r.potentialScore}) - currentScore (${r.currentScore})`
  );
}

// ─── 9. Near-perfect resume has zero or small gain ───────────────────
console.log('\n--- 9. Near-perfect resume has minimal or zero gain ---');
{
  const r = computeScorePotential(PERFECT_ANALYSIS);
  // All dimensions ≥ 90, so gap < MIN_IMPROVABLE_GAP (8) for all
  assert(r.improvements.length === 0 || r.pointsGain <= 5,
    `Near-perfect: improvements ${r.improvements.length}, gain ${r.pointsGain}`);
}

// ─── 10. alreadyStrong lists dimensions scoring ≥ 80 ─────────────────
console.log('\n--- 10. alreadyStrong correctly identifies high-scoring dimensions ---');
{
  const r = computeScorePotential(WEAK_ANALYSIS);
  // In WEAK_ANALYSIS: education_certifications=70, language_quality=60 — none ≥ 80
  assert(r.alreadyStrong.length === 0, `Weak resume has 0 strong dimensions (got ${r.alreadyStrong.length})`);

  const r2 = computeScorePotential(STRONG_ANALYSIS);
  // In STRONG_ANALYSIS: keyword=85, experience=82, education=88, ats=90, language=80 → 5 dimensions ≥ 80
  assert(r2.alreadyStrong.length >= 3, `Strong resume has ≥ 3 strong dimensions (got ${r2.alreadyStrong.length})`);
}

// ─── 11. Hint content is grounded in analysis data ───────────────────
console.log('\n--- 11. Hints are grounded in actual analysis data ---');
{
  const r = computeScorePotential(WEAK_ANALYSIS);
  // keyword hint should mention the actual missing keywords
  const kwImp = r._allDimensions.find(d => d.key === 'keyword_match');
  if (kwImp) {
    assert(kwImp.hint.length > 0, 'keyword_match hint is non-empty');
    // The hint should mention React, Node.js, or Docker (from WEAK_ANALYSIS missing keywords)
    const mentionsMissing = kwImp.hint.includes('React') || kwImp.hint.includes('Node') || kwImp.hint.includes('Docker') || kwImp.hint.includes('missing');
    assert(mentionsMissing, `keyword_match hint references actual missing keywords: "${kwImp.hint.slice(0, 80)}"`);
  }

  // impact hint should mention metric count (0)
  const impImp = r._allDimensions.find(d => d.key === 'quantifiable_impact');
  if (impImp) {
    const mentionsMetrics = impImp.hint.includes('metric') || impImp.hint.includes('number') || impImp.hint.includes('bullet') || impImp.hint.includes('%');
    assert(mentionsMetrics, `quantifiable_impact hint references metrics/bullets: "${impImp.hint.slice(0, 80)}"`);
  }
}

// ─── 12. Graceful handling of null / undefined / empty ───────────────
console.log('\n--- 12. Graceful handling of bad inputs ---');
{
  let r1 = null, e1 = null;
  try { r1 = computeScorePotential(null); } catch(e) { e1 = e; }
  assert(e1 === null, 'Does not throw on null input');
  assert(r1 !== null && typeof r1 === 'object', 'Returns object on null input');

  let r2 = null, e2 = null;
  try { r2 = computeScorePotential(undefined); } catch(e) { e2 = e; }
  assert(e2 === null, 'Does not throw on undefined input');

  let r3 = null, e3 = null;
  try { r3 = computeScorePotential({}); } catch(e) { e3 = e; }
  assert(e3 === null, 'Does not throw on empty object {}');
  assert(typeof r3.currentScore === 'number', 'Returns valid shape for empty object');

  let r4 = null, e4 = null;
  try { r4 = computeScorePotential({ overallScore: 70, scores: {} }); } catch(e) { e4 = e; }
  assert(e4 === null, 'Does not throw on partial object with empty scores');
}

// ─── 13. Weighted gains use correct dimension weights ─────────────────
console.log('\n--- 13. Weighted gains respect dimension weights ---');
{
  // keyword_match weight=0.30, experience_relevance weight=0.30 → biggest gains
  // language_quality weight=0.05 → smallest max possible gain
  const r = computeScorePotential(WEAK_ANALYSIS);

  const kwDim  = r._allDimensions.find(d => d.key === 'keyword_match');
  const langDim = r._allDimensions.find(d => d.key === 'language_quality');

  if (kwDim && langDim && kwDim.gap > 0 && langDim.gap > 0) {
    // Both have non-zero gap: keyword (30% weight) should have higher weighted gain than language (5% weight)
    assert(
      kwDim.weightedGain >= langDim.weightedGain,
      `keyword_match weightedGain (${kwDim.weightedGain}) ≥ language_quality weightedGain (${langDim.weightedGain})`
    );
  } else {
    assert(true, 'Skipped — one dimension at ceiling');
  }
}

// ─── 14. Real analysis object from analyseResumeLocally ───────────────
console.log('\n--- 14. Works with real analyseResumeLocally output ---');
{
  // Mock localStorage for Node
  if (!globalThis.localStorage) {
    globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }

  const { analyseResumeLocally } = await import('./analysis-engine.js');
  const testResume = `
Priya Sharma
priya@example.com | +91-9876543210

Technical Skills
Python, JavaScript, React, MySQL, Git

Projects
Student Portal
• Developed web application using React and Python
• Created MySQL database for storing student records

Education
B.Tech Computer Science
ABC University - 2024 - CGPA: 8.1
  `.trim();

  let realResult = null, realErr = null;
  try {
    const analysis = analyseResumeLocally(testResume, 'Software Engineer', '');
    realResult = computeScorePotential(analysis);
  } catch (e) { realErr = e; }

  assert(realErr === null,                    'computeScorePotential works with real analysis output');
  assert(realResult !== null,                  'Returns a result for real analysis');
  assert(typeof realResult.currentScore === 'number', 'currentScore is a number from real output');
  assert(realResult.potentialScore >= realResult.currentScore, 'potential ≥ current for real output');
  assert(realResult._allDimensions.length === 6, '6 dimensions always present');
  assert(realResult.improvements.every(i => typeof i.hint === 'string' && i.hint.length > 5),
    'All improvement hints are meaningful strings');
}

// ─── Summary ──────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(55)}`);
console.log(`Score Potential Tests: ${passed} passed, ${failed} failed out of ${passed + failed} total`);
if (failed > 0) {
  console.error('\n❌ Some tests failed.\n');
  process.exit(1);
} else {
  console.log('✅ All score potential tests passed!\n');
}
