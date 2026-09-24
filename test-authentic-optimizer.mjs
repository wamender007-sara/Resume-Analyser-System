import { 
  parseResumeIntoSections, 
  generateAiOptimizedResume, 
  optimizeBulletGrammarAndMissingWords,
  canonicalizeSkill 
} from './resume-editor.js';

console.log('=== Running Authentic AI Resume Optimizer Verification ===\n');

let passed = 0;
let total = 0;
function assert(cond, msg) {
  total++;
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

// 1. Test canonicalizeSkill
console.log('--- 1. Canonical Skill Casing ---');
assert(canonicalizeSkill('python') === 'Python', 'python -> Python');
assert(canonicalizeSkill('javascript') === 'JavaScript', 'javascript -> JavaScript');
assert(canonicalizeSkill('react') === 'React.js', 'react -> React.js');
assert(canonicalizeSkill('c++') === 'C++', 'c++ -> C++');
assert(canonicalizeSkill('sql') === 'SQL', 'sql -> SQL');
assert(canonicalizeSkill('node.js') === 'Node.js', 'node.js -> Node.js');
assert(canonicalizeSkill('html5') === 'HTML5', 'html5 -> HTML5');

// 2. Test optimizeBulletGrammarAndMissingWords
console.log('\n--- 2. Missing Words & Grammar Optimization in Bullets ---');
const b1 = optimizeBulletGrammarAndMissingWords('worked on developing web application using react');
assert(b1.includes('Engineered a web application'), `Missing article "a" added & verb upgraded: "${b1}"`);
assert(b1.includes('React'), `Canonical React casing: "${b1}"`);
assert(b1.endsWith('.'), `Ends with period: "${b1}"`);
assert(!/\b28%\b|\b35%\b|\b14%\b/.test(b1), `Zero fake percentages hallucinated: "${b1}"`);

const b2 = optimizeBulletGrammarAndMissingWords('responsible for building machine learning model with python');
assert(b2.includes('Spearheaded the creation of a machine learning model'), `Spearheaded and article "a" added: "${b2}"`);
assert(b2.includes('Python'), `Canonical Python casing: "${b2}"`);

const b3 = optimizeBulletGrammarAndMissingWords('helped with automated pipeline for testing');
assert(b3.includes('Collaborated on an automated pipeline'), `Missing article "an" added: "${b3}"`);

const b4 = optimizeBulletGrammarAndMissingWords('achieved 92% classification accuracy on 1000 sample test dataset');
assert(b4.includes('92%') && b4.includes('1000'), `Authentic user metrics preserved: "${b4}"`);

// 3. Test That No Fake Skills Are Injected
console.log('\n--- 3. Strict Truthfulness: No Fake Skills Injected ---');
const sampleAnalysis = {
  candidateName: 'Saravan Prasanna K U',
  diagnostics: {
    contacts: { email: 'saravan@example.com', phone: '9876543210' },
    uniqueSkills: ['Python', 'MySQL']
  },
  keywords: {
    missing: ['Kubernetes', 'Docker', 'AWS', 'TensorFlow', 'CI/CD'] // Missing job keywords
  },
  targetRoleFit: {
    targetRole: 'DevOps & Cloud Engineer'
  }
};

const studentResume = `
Saravan Prasanna K U
saravan@example.com | 9876543210

Technical Skills
Python, MySQL

Projects
Student Database System
• developed web application using python and mysql
• created relational database for storing records
`;

const parsed = parseResumeIntoSections(studentResume, sampleAnalysis);
assert(parsed.skills.length === 2, `Parsed skills count is 2 (only uploaded skills): ${parsed.skills.join(', ')}`);
assert(parsed.skills.includes('Python') && parsed.skills.includes('MySQL'), 'Parsed contains Python and MySQL');
assert(!parsed.skills.includes('Kubernetes'), 'Does NOT contain Kubernetes');
assert(!parsed.skills.includes('Docker'), 'Does NOT contain Docker');

const { optimized, fixesApplied } = generateAiOptimizedResume(parsed, sampleAnalysis, 'DevOps & Cloud Engineer');
assert(optimized.skills.length === 2, `Optimized skills count remains strictly 2: ${optimized.skills.join(', ')}`);
assert(!optimized.skills.includes('Kubernetes') && !optimized.skills.includes('AWS'), 'NO fake skills added from missingKeywords');

// 4. Test That No Fake Experience or Fake Company is Synthesized for Freshers
console.log('\n--- 4. Fresher Resume: No Fake Experience Synthesized ---');
assert(parsed.experience.length === 0, 'No fake company/experience in parsed');
assert(optimized.experience.length === 0, 'No fake company/experience in optimized');
assert(parsed.projects.length === 1, 'Projects parsed correctly');

// 5. Test That No Fake Links Are Injected
console.log('\n--- 5. No Fake Links Injected ---');
assert(parsed.contact.linkedin === '', 'Parsed linkedin is empty when not in resume');
assert(parsed.contact.github === '', 'Parsed github is empty when not in resume');
assert(optimized.contact.linkedin === '', 'Optimized linkedin is empty when not in resume (no linkedin.com/in/profile)');
assert(optimized.contact.github === '', 'Optimized github is empty when not in resume (no github.com/profile)');

console.log(`\n=== Final Score: ${passed}/${total} assertions passed ===`);
if (passed === total) {
  console.log('✅ ALL VERIFICATIONS PASSED PERFECTLY!\n');
} else {
  process.exit(1);
}
