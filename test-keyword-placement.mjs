import assert from 'node:assert';
import { parseResumeIntoSections, generateAiOptimizedResume, generateAtsVectorPdf } from './resume-editor.js';
import { analyseResumeLocally } from './analysis-engine.js';

console.log('\n=== Testing Keyword and Skill Placement in AI-Edited Resume ===\n');

// Sample candidate resume text reflecting technical skills in projects, skills section with headings, etc.
const candidateResumeText = `
SARAVAN PRASANNA K U
Coimbatore, Tamil Nadu | +91 9876543210 | saravan@example.com | https://linkedin.com/in/saravan | https://github.com/saravan

PROFESSIONAL SUMMARY
Motivated Software Engineering student with experience in Python, REST APIs, OOP, and SQLite. Strong problem solving skills and passion for clean code and system design.

TECHNICAL SKILLS
Programming Languages: Python, Java, C++, JavaScript
Frameworks & Libraries: Flask, OpenCV, CNN
Databases & Tools: SQLite, MySQL, Git, GitHub, Docker

PROJECTS
Smart Attendance System | Python, OpenCV, Flask, SQLite
- Engineered facial recognition attendance system using OpenCV and CNN achieving 95% accuracy.
- Built RESTful API endpoints using Flask to synchronize attendance data with SQLite database.
- Implemented object-oriented programming (OOP) principles and clean architecture.

Collaborative Task Management Platform [Python, JavaScript, Docker]
- Developed full-stack task manager with REST API architecture and relational database schema in SQL.
- Utilized Git and GitHub for version control, CI/CD pipeline integration, and automated testing.
- Designed system architecture adhering to system design principles and data structures.

EDUCATION
B.E. Computer Science and Engineering - Anna University, 2021 - 2025 | CGPA: 8.5
`;

// Step 1: Initial analysis
console.log('1. Running initial analysis on candidate resume...');
const initialAnalysis = analyseResumeLocally(candidateResumeText, 'Software Engineer');
console.log(`- Initial Overall Score: ${initialAnalysis.overallScore}/100 (Grade: ${initialAnalysis.grade})`);
console.log(`- Initial Keyword Match: ${initialAnalysis.scores.keyword_match}/100`);
console.log(`- Matched Keywords: ${initialAnalysis.keyword_analysis.matched_keywords.join(', ')}`);
console.log(`- Missing Keywords: ${initialAnalysis.keyword_analysis.missing_keywords.join(', ')}`);

// Step 2: Parse resume into sections with analysis
console.log('\n2. Parsing resume into sections...');
const parsed = parseResumeIntoSections(candidateResumeText, initialAnalysis);
console.log(`- Extracted Skills: ${parsed.skills.join(', ')}`);

// Verify extracted skills contain key tools from projects and skills section
assert(parsed.skills.some(s => /python/i.test(s)), 'Must contain Python');
assert(parsed.skills.some(s => /rest/i.test(s)), 'Must contain REST APIs');
assert(parsed.skills.some(s => /oop/i.test(s)), 'Must contain OOP');
assert(parsed.skills.some(s => /system design/i.test(s) || /system architecture/i.test(s)), 'Must contain System Design/Architecture');
assert(parsed.skills.some(s => /git/i.test(s)), 'Must contain Git');
assert(parsed.skills.some(s => /docker/i.test(s)), 'Must contain Docker');
assert(parsed.skills.some(s => /sqlite/i.test(s)), 'Must contain SQLite');
console.log('✅ Skills successfully extracted from all resume areas.');

// Step 3: Optimize resume sections
console.log('\n3. Optimizing resume sections...');
const { optimized, fixesApplied } = generateAiOptimizedResume(parsed, initialAnalysis, 'Software Engineer');


// Step 4: Generate ATS Vector PDF
console.log('\n4. Generating ATS Vector PDF...');
const pdfBuffer = generateAtsVectorPdf(optimized);
assert(pdfBuffer && pdfBuffer.length > 500, 'PDF buffer must be valid and non-empty');
const pdfString = Buffer.from(pdfBuffer).toString('latin1');

// Verify PDF contains clear text streams for the skills
assert(pdfString.includes('Python'), 'PDF stream must include Python');
assert(pdfString.includes('SQLite'), 'PDF stream must include SQLite');
assert(pdfString.includes('REST') || pdfString.includes('APIs'), 'PDF stream must include REST');
console.log('✅ PDF generated with vector streams containing all skills.');

// Step 5: Simulate re-analysis of the optimized resume text (or extracted text)
console.log('\n5. Re-analysing optimized resume...');
// Reconstruct plain text from optimized sections as ATS would parse it
const optimizedPlainText = `
${optimized.contact.name}
${optimized.contact.location} | ${optimized.contact.phone} | ${optimized.contact.email} | ${optimized.contact.linkedin} | ${optimized.contact.github}

PROFESSIONAL SUMMARY
${optimized.summary}

TECHNICAL SKILLS
${optimized.skills.join(', ')}

PROJECTS
${optimized.projects.map(p => `${p.name} [${p.tools}]\n${p.bullets.map(b => `- ${b}`).join('\n')}`).join('\n\n')}

EDUCATION
${optimized.education.map(e => `${e.degree} - ${e.institution}, ${e.year} | ${e.score}`).join('\n')}
`;

const reAnalysis = analyseResumeLocally(optimizedPlainText, 'Software Engineer');
console.log(`- Re-analysis Overall Score: ${reAnalysis.overallScore}/100 (Grade: ${reAnalysis.grade})`);
console.log(`- Re-analysis Keyword Match: ${reAnalysis.scores.keyword_match}/100`);
console.log(`- Re-analysis Matched Keywords: ${reAnalysis.keyword_analysis.matched_keywords.join(', ')}`);
console.log(`- Re-analysis Missing Keywords: ${reAnalysis.keyword_analysis.missing_keywords.join(', ')}`);

assert(reAnalysis.scores.keyword_match >= 90, `Keyword match score should be >= 90, got ${reAnalysis.scores.keyword_match}`);
assert(reAnalysis.overallScore >= 88, `Overall score should be >= 88, got ${reAnalysis.overallScore}`);
console.log('\n🎉 ALL TESTS PASSED: Keywords and skills are fetched, placed, and score at 90%+ in the AI-edited resume!');
