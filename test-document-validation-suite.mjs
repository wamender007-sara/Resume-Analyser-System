/**
 * test-document-validation-suite.mjs
 * Full verification test suite for resume vs non-resume document validation
 */

import { validateResumeDocument, analyseResumeLocally } from './analysis-engine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- 1. Testing Course & Completion Certificate Detection ---');

const courseraCert = `
Coursera
Verify at: coursera.org/verify/AB12CD34EF
Coursera has confirmed the identity of this individual and their participation in the course.
John Doe
has successfully completed
Machine Learning Specialization
an online non-credit course authorized by Stanford University and DeepLearning.AI and offered through Coursera
Andrew Ng
Instructor
`;
const c1 = validateResumeDocument(courseraCert, 'Coursera_ML.pdf');
assert(c1.isValid === false, 'Coursera certificate must be marked invalid as resume');
assert(c1.isCertificate === true, 'Coursera certificate must have isCertificate: true');
assert(c1.documentType === 'course_certificate', 'Document type must be course_certificate');

const udemyCert = `
Certificate of Completion
This is to certify that Jane Doe successfully completed 44 total hours of The Complete 2024 Web Development Bootcamp online course on September 12, 2024
Udemy
Certificate no: UC-abcdef12-3456
Certificate url: ude.my/UC-abcdef12-3456
Instructor: Angela Yu
`;
const c2 = validateResumeDocument(udemyCert, 'Udemy_Cert.pdf');
assert(c2.isValid === false, 'Udemy certificate must be marked invalid as resume');
assert(c2.isCertificate === true, 'Udemy certificate must have isCertificate: true');
assert(c2.documentType === 'course_certificate', 'Udemy certificate documentType must be course_certificate');

const collegeHackathonCert = `
COLLEGE OF ENGINEERING
DEPARTMENT OF INFORMATION TECHNOLOGY
CERTIFICATE OF APPRECIATION
This is to certify that Mr. Saravan Prasanna has actively participated and secured 1st place in the Web Innovation Hackathon 2024.
Head of Department
Principal
`;
const c3 = validateResumeDocument(collegeHackathonCert, 'certificate.pdf');
assert(c3.isValid === false, 'College hackathon certificate must be marked invalid as resume');
assert(c3.isCertificate === true, 'Hackathon certificate must be marked as certificate');

console.log('\n--- 2. Testing Academic Lab Manuals, Coursework & Syllabi ---');

const dsaLabManual = `
ANNA UNIVERSITY CHENNAI
DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
25CSP301 DATA STRUCTURES AND ALGORITHMS LABORATORY
LABORATORY MANUAL
REGULATION 2021
LIST OF EXPERIMENTS:
1. Implementation of Singly Linked List
2. Implementation of Stack using Arrays
3. Implementation of Queue using Linked List
4. Binary Search Tree Operations

EX NO: 1
DATE: 12/02/2024
AIM:
To write a C program to implement Singly Linked List and its operations.
ALGORITHM:
Step 1: Create a node structure with data and next pointer.
Step 2: Allocate memory dynamically using malloc.
PROGRAM:
#include <stdio.h>
#include <stdlib.h>
struct Node { int data; struct Node* next; };
OUTPUT:
1. Insert 2. Delete 3. Display
RESULT:
Thus the program was executed successfully.
` + ' Some repeated technical textbook content about binary search trees, stacks, heaps, sorting algorithms, graphs and dynamic programming.'.repeat(50);

const lab = validateResumeDocument(dsaLabManual, '25CSP301_Data_Structures_and_Algorithms_Laboratory_Manual.pdf');
assert(lab.isValid === false, 'DSA Lab Manual must be rejected as resume');
assert(lab.documentType === 'academic_material', 'DSA Lab Manual documentType must be academic_material');

// 4000+ words book/manual test
const hugeBook = 'Chapter 1: Principles of Operating Systems. In this book we describe process scheduling, virtual memory, paging, thrashing and device drivers. '.repeat(150);
const bookRes = validateResumeDocument(hugeBook, 'Operating_Systems_Book.pdf');
assert(bookRes.isValid === false, '4000-word book must be rejected');
assert(bookRes.documentType === 'large_document' || bookRes.documentType === 'unknown_document', 'Large document rejected');

console.log('\n--- 3. Testing Marksheet, Invoice, Short Text ---');

const marksheet = `
ANNA UNIVERSITY
CONSOLIDATED STATEMENT OF MARKS / GRADE SHEET
Branch: B.E. Computer Science and Engineering
Register No: 710020104050
Semester 1 to 8:
CS8151 Programming in C: Grade A+
Total Marks: 850 / 1000
SGPA: 8.5
Controller of Examinations
`;
const m1 = validateResumeDocument(marksheet, 'Marksheet_Sem8.pdf');
assert(m1.isValid === false, 'Marksheet must be marked invalid as resume');
assert(m1.documentType === 'marksheet', 'Document type must be marksheet');

const invoice = `
TAX INVOICE
Invoice No: INV-2024-9988
GSTIN: 33ABCDE1234F1Z5
Billed to: John Customer
Subtotal: $450.00
Total Amount Payable: $450.00
Payment Receipt Confirmed
`;
const inv = validateResumeDocument(invoice, 'invoice.pdf');
assert(inv.isValid === false, 'Invoice must be marked invalid as resume');
assert(inv.documentType === 'invoice', 'Document type must be invoice');

const shortText = `Hi, I am testing this platform.`;
const s1 = validateResumeDocument(shortText, 'note.txt');
assert(s1.isValid === false, 'Short text (<40 words) must be marked invalid');
assert(s1.documentType === 'insufficient_content', 'Document type must be insufficient_content');

console.log('\n--- 4. Testing Genuine Resumes (Fresher & Senior) ---');

const studentResumeWithCert = `
SARAVAN PRASANNA
Email: saravan@example.com | Phone: +91 9876543210 | Chennai, India
LinkedIn: linkedin.com/in/saravanprasanna | GitHub: github.com/saravan

EDUCATION:
B.E. Computer Science and Engineering
Anna University, Chennai — CGPA: 8.42 (2020 – 2024)

TECHNICAL SKILLS:
Languages: Python, JavaScript, TypeScript, C++, SQL
Frameworks & Libraries: React, Node.js, Express, FastAPI, Tailwind CSS
Databases: PostgreSQL, MongoDB, Redis
Developer Tools: Git, Docker, Linux, Postman

KEY PROJECTS:
Real-Time Chat & Collaboration Platform | React, Node.js, Socket.io, Redis
- Engineered low-latency bidirectional messaging system serving 500+ concurrent simulated clients with <50ms roundtrip delay.
- Implemented JWT authentication, role-based access control, and message persistence with PostgreSQL.

Automated Resume ATS Analyzer | Python, SpaCy, Flask, Vanilla JS
- Built an intelligent resume auditing engine extracting candidate skills, section boundaries, and quantifiable impact metrics.
- Designed responsive user interface and integrated PDF.js client-side text parsing.

CERTIFICATIONS & ACHIEVEMENTS:
- Coursera: Machine Learning Specialization by Andrew Ng (DeepLearning.AI)
- HackerRank: Problem Solving (Intermediate) Certificate
- AWS Certified Cloud Practitioner (2023)
`;
const r1 = validateResumeDocument(studentResumeWithCert, 'Saravan_Prasanna_Resume.pdf');
assert(r1.isValid === true, 'Student resume with certifications section MUST be valid');
assert(r1.documentType === 'resume', 'Document type must be resume');
assert(r1.metrics.resumeSectionCount >= 3, 'Must detect at least 3 resume sections in student resume');

const seniorResume = `
ALEX MORGAN
Email: alex.morgan@email.com | Phone: (555) 234-5678 | San Francisco, CA
LinkedIn: linkedin.com/in/alexmorgan | Portfolio: alexmorgan.dev

PROFESSIONAL SUMMARY:
Results-driven Senior Software Engineer with 6+ years of experience designing, scaling, and maintaining high-throughput distributed backend architectures and cloud-native microservices.

CORE COMPETENCIES:
Languages: Golang, Java, Python, TypeScript
Cloud & Infrastructure: AWS (ECS, Lambda, S3, RDS), Kubernetes, Docker, Terraform
Databases: PostgreSQL, DynamoDB, Redis, Apache Kafka
Architectures: Microservices, Event-Driven Architecture, REST APIs, gRPC

WORK EXPERIENCE:
Senior Software Engineer | Stripe (2021 – Present)
- Architected payment processing pipeline supporting 15,000+ RPS with 99.99% uptime SLA.
- Reduced p99 latency by 38% through Redis cluster caching and asynchronous batch processing.
- Mentored 5 junior engineers and led quarterly architecture RFC reviews.

Software Engineer | Twilio (2018 – 2021)
- Developed real-time notification dispatch engine processing 10M+ daily events.
- Integrated automated CI/CD deployment pipelines using GitHub Actions, cutting release cycle time by 45%.

EDUCATION:
B.S. in Computer Science | University of California, Berkeley (2014 – 2018)
`;
const r2 = validateResumeDocument(seniorResume, 'Alex_Morgan_Resume.pdf');
assert(r2.isValid === true, 'Senior resume MUST be valid');
assert(r2.documentType === 'resume', 'Senior resume documentType must be resume');

console.log('\n--- 5. Testing analyseResumeLocally Validation Field ---');
const analysisValid = analyseResumeLocally(studentResumeWithCert, 'Full Stack Developer');
assert(analysisValid.validation && analysisValid.validation.isValid === true, 'analyseResumeLocally must attach validation.isValid: true for real resumes');
assert(analysisValid.overallScore > 70, 'Real resume must score well');

console.log(`\n========================================`);
console.log(`SUMMARY: ${passed} passed, ${failed} failed.`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
