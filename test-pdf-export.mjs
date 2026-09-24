/**
 * test-pdf-export.mjs
 * Validates the PDF report builder produces correct, safe HTML from
 * a known analysis object — without calling window.print() or the DOM.
 *
 * Run: node test-pdf-export.mjs
 */

// ─── Minimal browser-API stubs needed by pdf-export.js ───────────────
globalThis.window    = { print: () => {} };
globalThis.document  = {
  getElementById: () => ({ innerHTML: '', setAttribute: () => {}, removeAttribute: () => {} }),
};
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

import { buildReportHtml } from './pdf-export.js';

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

// ─── Fixture: realistic analysis object ──────────────────────────────
const SAMPLE_ANALYSIS = {
  candidateName: 'Arjun Kumar',
  overallScore:  74,
  overall_score: 74,
  grade:         'B+',
  verdict:       'Strong Match',
  seniority:     'junior',
  summary:       'Solid fresher profile with strong Python skills and project depth. Add GitHub link and quantifiable metrics.',
  scores: {
    keyword_match:            78,
    experience_relevance:     70,
    quantifiable_impact:      50,
    education_certifications: 88,
    ats_compatibility:        80,
    language_quality:         72,
  },
  sectionScores: {
    contactInfo:         80,
    professionalSummary: 65,
    workExperience:      55,
    skills:              90,
    education:           88,
    certifications:      60,
    projects:            85,
  },
  diagnostics: {
    wordCount:        420,
    metricCount:      3,
    skillsFoundCount: 10,
    skillsFound:      ['Python', 'React', 'Node.js', 'MySQL', 'Git'],
    categorizedSkills: {
      languages:          ['Python', 'JavaScript'],
      frameworks:         ['React.js', 'Node.js'],
      databases:          ['MySQL'],
      cloud_devops:       ['Git', 'Docker'],
      domain_specialized: [],
    },
    contacts: { email: 'arjun@example.com', phone: '+91-9876543210', linkedin: null, github: null },
  },
  strengths:       ['Strong technical breadth: 10 verified skills.', 'High-impact project portfolio.'],
  weaknesses:      [{ text: 'MISSING GITHUB LINK', severity: 'medium' }, { text: 'ZERO QUANTIFIABLE METRICS', severity: 'medium' }],
  missingSections: ['GitHub / Code Repository URL', 'LinkedIn Profile'],
  atsCompatibility:{ score: 'Good', numericScore: 80, issues: ['Strong keyword density.'] },
  actionPlan:      ['Add GitHub link.', 'Add 2-3 metrics to project bullets.', 'Include LinkedIn profile URL.'],
  recommendedKeywords: ['Data Structures & Algorithms', 'REST APIs', 'Git & GitHub'],
  keywordsContext: 'Core foundational keywords for junior roles.',
  bulletRewrites:  [
    { issue: 'Passive phrasing', original: 'worked on web app', improved: 'Engineered a full-stack web application.' }
  ],
  jdMatch: { percentage: 68, matchedCount: 20, totalChecked: 30, missingKeywords: ['Kubernetes', 'CI/CD'] },
};

// ─── 1. buildReportHtml returns a non-empty string ───────────────────
console.log('\n--- 1. buildReportHtml produces output ---');
{
  let html = null, err = null;
  try { html = buildReportHtml(SAMPLE_ANALYSIS); } catch (e) { err = e; }

  assert(err === null,          'buildReportHtml does not throw');
  assert(typeof html === 'string', 'returns a string');
  assert(html.length > 500,    `output is non-trivial (${html?.length} chars)`);
}

const html = buildReportHtml(SAMPLE_ANALYSIS);

// ─── 2. Candidate data present ───────────────────────────────────────
console.log('\n--- 2. Candidate name and score ---');
assert(html.includes('Arjun Kumar'),   'Candidate name is in the report');
assert(html.includes('74'),            'Overall score is in the report');
assert(html.includes('B+'),            'Grade is in the report');
assert(html.includes('Strong Match'),  'Verdict is in the report');
assert(html.includes('JUNIOR'),        'Seniority level is in the report');
assert(html.includes('420'),           'Word count from diagnostics is present');

// ─── 3. Section scores present ───────────────────────────────────────
console.log('\n--- 3. Section breakdown scores ---');
assert(html.includes('Contact Info'),         'Section label "Contact Info" present');
assert(html.includes('Work Experience'),      'Section label "Work Experience" present');
assert(html.includes('Professional Summary'), 'Section label "Professional Summary" present');

// ─── 4. 6 Dimension labels present ───────────────────────────────────
console.log('\n--- 4. Evaluative dimension labels ---');
assert(html.includes('Keyword &amp; Skill Match'),   'Dimension: Keyword Match');
assert(html.includes('Experience Relevance'),        'Dimension: Experience Relevance');
assert(html.includes('Quantifiable Impact'),         'Dimension: Quantifiable Impact');
assert(html.includes('Education &amp; Certifications') || html.includes('Education & Certifications'), 'Dimension: Education');
assert(html.includes('ATS Compatibility'),           'Dimension: ATS Compatibility');
assert(html.includes('Language Quality'),            'Dimension: Language Quality');

// ─── 5. Strengths and weaknesses ─────────────────────────────────────
console.log('\n--- 5. Strengths and weaknesses ---');
assert(html.includes('Strong technical breadth'), 'Strength text present');
assert(html.includes('MISSING GITHUB LINK'),       'Weakness text present');
assert(html.includes('GitHub / Code Repository'),  'Missing section present');
assert(html.includes('rr-sev-med'),                'Severity badge class present');

// ─── 6. ATS section ──────────────────────────────────────────────────
console.log('\n--- 6. ATS compatibility section ---');
assert(html.includes('ATS Compatibility'),  'ATS section heading present');
assert(html.includes('80% Compatible'),     'ATS numeric score present');
assert(html.includes('Good'),               'ATS rating present');

// ─── 7. Action plan ──────────────────────────────────────────────────
console.log('\n--- 7. Action plan items ---');
assert(html.includes('Add GitHub link'),            'Action plan item 1 present');
assert(html.includes('Add 2-3 metrics'),            'Action plan item 2 present');
assert(html.includes('Include LinkedIn profile'),   'Action plan item 3 present');

// ─── 8. Keywords section ─────────────────────────────────────────────
console.log('\n--- 8. Target keywords ---');
assert(html.includes('Data Structures'), 'Keyword present in report');
assert(html.includes('REST APIs'),        'Keyword 2 present in report');

// ─── 9. Bullet rewrites ──────────────────────────────────────────────
console.log('\n--- 9. Bullet rewrites ---');
assert(html.includes('worked on web app'),            'Original bullet present');
assert(html.includes('Engineered a full-stack'),      'Improved bullet present');
assert(html.includes('rr-tag-before'),                'Before tag class present');
assert(html.includes('rr-tag-after'),                 'After tag class present');

// ─── 10. JD Match section ────────────────────────────────────────────
console.log('\n--- 10. JD match section ---');
assert(html.includes('68% Match'),    'JD match percentage present');
assert(html.includes('Kubernetes'),   'Missing JD keyword present');

// ─── 11. Skills inventory ────────────────────────────────────────────
console.log('\n--- 11. Skills inventory ---');
assert(html.includes('Python'),   'Skill Python present');
assert(html.includes('React.js'), 'Skill React.js present');
assert(html.includes('MySQL'),    'Skill MySQL present');

// ─── 12. No API keys or raw resume text ──────────────────────────────
console.log('\n--- 12. Security — no API keys or credentials ---');
assert(!html.includes('AIzaSy'),         'No Google API key in report');
assert(!html.includes('AQ.'),            'No AQ. key prefix in report');
assert(!html.includes('localStorage'),   'No localStorage reference in report');
assert(!html.includes('resumeai_apikey'),'No key storage identifier in report');

// ─── 13. XSS safety — HTML-escaped output ────────────────────────────
console.log('\n--- 13. XSS safety — user content is HTML-escaped ---');
const xssAnalysis = {
  ...SAMPLE_ANALYSIS,
  candidateName: '<script>alert("xss")</script>',
  summary: 'Normal summary with <b>bold</b> attempt',
};
const xssHtml = buildReportHtml(xssAnalysis);
assert(!xssHtml.includes('<script>alert'),          'Raw <script> tag is escaped');
assert(xssHtml.includes('&lt;script&gt;'),          '<script> is properly HTML-escaped');
assert(!xssHtml.includes('<b>bold</b>'),            'Raw <b> tag in summary is escaped');

// ─── 14. Handles missing/null fields gracefully ───────────────────────
console.log('\n--- 14. Graceful handling of missing/null fields ---');
let minHtml = null, minErr = null;
try {
  minHtml = buildReportHtml({
    overallScore: 55,
    grade: 'C+',
    verdict: 'Moderate Match',
    seniority: 'mid',
    summary: 'Minimal data test.',
  });
} catch (e) { minErr = e; }

assert(minErr === null,            'Does not throw with minimal analysis object');
assert(typeof minHtml === 'string','Returns string with minimal data');
assert(minHtml.length > 100,       'Output has content even with minimal data');

// ─── 15. Empty analysis object doesn't crash ─────────────────────────
console.log('\n--- 15. Empty object and null input ---');
let emptyHtml = null, emptyErr = null;
try { emptyHtml = buildReportHtml({}); } catch (e) { emptyErr = e; }
assert(emptyErr === null, 'Does not throw with empty object {}');

let nullHtml = null, nullErr = null;
try { nullHtml = buildReportHtml(null); } catch (e) { nullErr = e; }
assert(nullErr === null, 'Does not throw with null input');

// ─── Summary ─────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(55)}`);
console.log(`PDF Export Tests: ${passed} passed, ${failed} failed out of ${passed + failed} total`);
if (failed > 0) {
  console.error('\n❌ Some tests failed.\n');
  process.exit(1);
} else {
  console.log('✅ All PDF export tests passed!\n');
}
