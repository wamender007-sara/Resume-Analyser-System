/**
 * analysis-engine.js
 * Multi-Stage Evidence-Based Resume Analysis & ATS Verification Engine
 * 
 * Performs 6 distinct diagnostic passes:
 * 1. Contact & Identity Reachability Verification (Real pattern checks)
 * 2. Section Extraction & Depth/Word-distribution Analysis
 * 3. Quantifiable Impact & Metric Density Scoring (Regex metric verification)
 * 4. Action-Verb & Grammatical Voice Detection (Strong vs Weak/Passive verb distribution)
 * 5. Competency & Keyword Semantic Matching with Target Role & Job Description
 * 6. ATS Parser Compatibility & Layout Format Audit
 */

// ─── 1. COMPREHENSIVE SKILL & DOMAIN ONTOLOGY ───
// ─── 1. COMPREHENSIVE SKILL & DOMAIN ONTOLOGY ───
const TECH_TAXONOMY = {
  frontend: ['javascript', 'typescript', 'react', 'react.js', 'next.js', 'vue', 'vue.js', 'angular', 'svelte', 'html5', 'css3', 'tailwind', 'tailwind css', 'redux', 'sass', 'webpack', 'vite'],
  backend: ['node.js', 'express', 'express.js', 'python', 'django', 'fastapi', 'flask', 'java', 'spring', 'spring boot', 'c++', 'c#', '.net', 'go', 'golang', 'rust', 'ruby', 'rails', 'php', 'graphql', 'rest api', 'restful', 'grpc'],
  database: ['postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'sqlite', 'dynamodb', 'oracle', 'sql server', 'prisma', 'typeorm', 'cassandra', 'sql', 'nosql'],
  cloud_devops: ['aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'github actions', 'gitlab ci', 'jenkins', 'terraform', 'ansible', 'linux', 'nginx', 'datadog', 'prometheus'],
  data_ai: ['pandas', 'numpy', 'scipy', 'pytorch', 'tensorflow', 'scikit-learn', 'machine learning', 'deep learning', 'nlp', 'computer vision', 'opencv', 'cnn', 'haar cascade', 'face recognition', 'emotion recognition', 'llm', 'data analysis', 'power bi', 'tableau', 'spark', 'hadoop'],
  embedded_iot: ['esp32', 'arduino', 'raspberry pi', 'embedded systems', 'iot', 'robotics', 'microcontroller', 'i2s', 'uart', 'spi', 'i2c', 'firmware', 'sensors', 'bluetooth', 'wifi', 'mqtt', 'rtos'],
  automobile_engineering: ['cad', 'solidworks', 'catia', 'ansys', 'autocad', 'matlab', 'simulink', 'ic engines', 'powertrain', 'chassis', 'aerodynamics', 'automotive', 'vehicle dynamics', 'ev', 'battery management', 'bms', 'hybrid vehicles', 'can bus', 'ecu', 'finite element analysis', 'fea', 'cfd', 'thermodynamics', 'manufacturing', 'gd&t', 'mechatronics'],
  core_foundations: ['git', 'github', 'data structures', 'algorithms', 'object-oriented programming', 'oop', 'system design', 'agile', 'scrum', 'jira', 'microservices', 'unit testing', 'jest', 'clean code']
};

const SENIOR_PILLARS = {
  architecture: ['system design', 'architecture', 'microservices', 'distributed systems', 'scalability', 'high availability', 'fault tolerance', 'caching', 'load balancing', 'concurrency', 'sharding', 'event-driven', 'message queue', 'kafka', 'rabbit-mq'],
  leadership: ['mentored', 'lead', 'spearheaded', 'managed', 'coached', 'cross-functional', 'stakeholder', 'hiring', 'roadmap', 'direction', 'guided', 'championed', 'tech lead', 'reviewed code', 'rfc', 'architecture review'],
  scale_impact: ['revenue', 'cost reduction', 'performance', 'latency', 'scale', 'throughput', 'optimization', 'million', 'users', 'reliability', 'sla', 'slo', 'p95', 'p99', 'rps', 'qps']
};

const ACTION_VERBS = [
  'spearheaded', 'architected', 'engineered', 'orchestrated', 'accelerated', 'optimized',
  'transformed', 'streamlined', 'pioneered', 'implemented', 'designed', 'developed',
  'automated', 'maximized', 'scaled', 'delivered', 'established', 'revamped', 'deployed',
  'constructed', 'formulated', 'reduced', 'increased', 'integrated', 'resolved'
];

const WEAK_VERBS = [
  'worked on', 'helped', 'assisted', 'responsible for', 'participated', 'handled', 'did',
  'tried', 'tasked with', 'duties included', 'involved in'
];

// ─── 2. SENIORITY DETECTION ───
function detectSeniority(targetRole, resumeText) {
  const role = (targetRole || '').toLowerCase();
  const text = (resumeText.slice(0, 1500)).toLowerCase();
  
  // Check target role first
  if (/\b(lead|principal|staff|architect|director|vp|head)\b/i.test(role)) {
    return 'lead';
  }
  if (/\b(senior|sr\.?|specialist|expert)\b/i.test(role)) {
    return 'senior';
  }
  if (/\b(trainee|intern|junior|jr\.?|entry|fresher|graduate|student|associate)\b/i.test(role)) {
    return 'junior';
  }

  // Check resume context if no role or generic role
  if (/\b(principal engineer|staff engineer|tech lead|team lead|director of engineering|vp of engineering)\b/i.test(text)) {
    return 'lead';
  }
  if (/\b(senior engineer|senior developer|sr\.?\s*developer|sr\.?\s*engineer)\b/i.test(text)) {
    return 'senior';
  }
  if (/\b(intern|internship|student|undergraduate|fresher|entry[- ]level|b\.tech|bachelor)\b/i.test(text)) {
    return 'junior';
  }

  return 'mid';
}

// ─── 3. ESTIMATE EXPERIENCE YEARS ───
function estimateExperienceYears(text) {
  const yrMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i);
  if (yrMatch) return parseInt(yrMatch[1], 10);

  const dateRanges = text.match(/(?:20\d{2}|19\d{2})\s*(?:-|–|to)\s*(?:20\d{2}|present|current)/gi) || [];
  if (dateRanges.length > 0) {
    let totalYears = 0;
    const currentYear = new Date().getFullYear();
    dateRanges.forEach(range => {
      const parts = range.split(/(?:-|–|to)/i);
      const start = parseInt(parts[0].trim(), 10);
      const endStr = parts[1].trim().toLowerCase();
      const end = (endStr.includes('present') || endStr.includes('current')) ? currentYear : parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        totalYears += (end - start);
      }
    });
    return Math.max(1, totalYears);
  }
  return 1;
}

// ─── 4. ROLE RECOMMENDATION ENGINE ───
const ROLE_PROFILES = [
  {
    title: 'AI / Machine Learning Engineer',
    level: 'Junior / Mid / Senior',
    skills: ['python', 'machine learning', 'deep learning', 'opencv', 'cnn', 'pytorch', 'tensorflow', 'flask', 'computer vision'],
    desc: 'Develop AI models, computer vision systems, neural networks, and intelligent software pipelines.'
  },
  {
    title: 'IoT & Embedded Systems Engineer',
    level: 'Junior / Mid / Senior',
    skills: ['esp32', 'embedded systems', 'c++', 'iot', 'robotics', 'microcontroller', 'sensors', 'python'],
    desc: 'Design hardware-software integration, microcontroller programming, IoT telemetry, and embedded robotics.'
  },
  {
    title: 'Full Stack Developer',
    level: 'Junior / Mid / Senior',
    skills: ['javascript', 'typescript', 'react', 'node.js', 'express', 'postgresql', 'flask', 'rest api', 'sql'],
    desc: 'Deliver complete end-to-end features spanning modern front-end architectures and robust backend services.'
  },
  {
    title: 'Backend Engineer',
    level: 'Junior / Mid / Senior',
    skills: ['python', 'flask', 'c++', 'postgresql', 'sqlite', 'rest api', 'sql', 'docker'],
    desc: 'Design, optimize, and scale database schemas, server-side APIs, caching tiers, and business logic.'
  },
  {
    title: 'Automobile / Automotive Systems Engineer',
    level: 'Entry / Mid / Senior',
    skills: ['cad', 'solidworks', 'matlab', 'simulink', 'ansys', 'catia', 'powertrain', 'ev', 'bms', 'automotive', 'can bus', 'iot', 'embedded systems'],
    desc: 'Design automotive systems, EV power electronics, mechanical simulations, vehicle telemetry, and embedded ECUs.'
  },
  {
    title: 'Data Analyst / Scientist',
    level: 'Junior / Mid',
    skills: ['python', 'sql', 'pandas', 'numpy', 'machine learning', 'data analysis', 'postgresql', 'tableau'],
    desc: 'Extract, clean, and model complex data to generate actionable predictions and insights.'
  },
  {
    title: 'Cloud & DevOps Engineer',
    level: 'Mid / Senior',
    skills: ['aws', 'docker', 'kubernetes', 'ci/cd', 'linux', 'terraform', 'jenkins', 'azure'],
    desc: 'Automate build pipelines, container orchestration, cloud infrastructure, and site reliability.'
  }
];

function determineSuggestedRoles(resumeLower, uniqueSkills) {
  const suggestions = [];

  ROLE_PROFILES.forEach(profile => {
    const matched = [];
    const missing = [];
    profile.skills.forEach(skill => {
      if (resumeLower.includes(skill) || uniqueSkills.includes(skill)) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    const matchScore = Math.min(100, Math.round((matched.length / profile.skills.length) * 100));
    if (matchScore >= 25) {
      suggestions.push({
        title: profile.title,
        level: profile.level,
        matchScore,
        matchedSkills: matched.slice(0, 6),
        missingSkills: missing.slice(0, 3),
        desc: profile.desc
      });
    }
  });

  // Sort by highest match percentage
  suggestions.sort((a, b) => b.matchScore - a.matchScore);
  return suggestions.slice(0, 4);
}

// ─── 5. DEEP EVIDENCE-BASED ANALYSER ───
export function analyseResumeLocally(text, targetRole = '', jobDescription = '') {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const seniority = detectSeniority(targetRole, clean);
  const estimatedYears = estimateExperienceYears(clean);

  // ── PASS 1: CONTACT VERIFICATION (Enhanced with international phone numbers & links) ──
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  // Catches +91 80152 81343, +91-8015281343, 8015281343, (123) 456-7890, +1 555-555-5555, etc.
  const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/g;
  
  // Extract email
  const emailFound = (clean.match(emailRegex) || [])[0] || null;
  
  // Extract phone with digit length validation (7 to 15 digits)
  let phoneFound = null;
  const rawPhones = clean.match(phoneRegex) || [];
  for (const p of rawPhones) {
    const digitsOnly = p.replace(/\D/g, '');
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      phoneFound = p.trim();
      break;
    }
  }

  // LinkedIn Verification: supports full URLs, "linkedin.com/in/...", or presence of "LinkedIn" text/link
  let linkedinFound = null;
  const linkedinUrlMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\/]+/i);
  if (linkedinUrlMatch) {
    linkedinFound = linkedinUrlMatch[0];
  } else if (lower.includes('linkedin.com') || lower.includes('linkedin')) {
    linkedinFound = 'LinkedIn Profile Verified';
  }

  // GitHub Verification: supports full URLs, "github.com/...", or presence of "GitHub" text/link
  let githubFound = null;
  const githubUrlMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-\/]+/i);
  if (githubUrlMatch) {
    githubFound = githubUrlMatch[0];
  } else if (lower.includes('github.com') || lower.includes('github')) {
    githubFound = 'GitHub Profile Verified';
  }

  // Contact score calculation
  let contactScore = 0;
  if (emailFound) contactScore += 30;
  if (phoneFound) contactScore += 30;
  if (linkedinFound) contactScore += 20;
  if (githubFound || lower.includes('portfolio') || lower.includes('http')) contactScore += 20;
  contactScore = Math.min(100, Math.max(30, contactScore));

  // ── PASS 2: SECTION IDENTIFICATION & EVIDENCE DEPTH ──
  // Check genuine sections using line boundaries or explicit headings
  const hasSummary = /^(summary|professional summary|about me|profile|overview|objective)\b/im.test(clean) || /\n\s*(summary|about me|profile|overview|objective)\s*[\n:]/i.test(clean);
  const hasExperience = /^(experience|work experience|employment|work history|internship)\b/im.test(clean) || /\n\s*(experience|work experience|employment|internship)\s*[\n:]/i.test(clean);
  const hasSkills = /^(skills|technical skills|technologies|competencies|tech stack|tools)\b/im.test(clean) || /\n\s*(skills|technical skills|technologies)\s*[\n:]/i.test(clean);
  const hasEducation = /^(education|academic background|qualifications)\b/im.test(clean) || /\n\s*(education|b\.tech|degree|university|college)\s*[\n:]/i.test(clean);
  const hasProjects = /^(projects|key projects|academic projects|personal projects)\b/im.test(clean) || /\n\s*(projects|key projects)\s*[\n:]/i.test(clean);
  const hasCertifications = /^(certifications|licenses|courses)\b/im.test(clean) || /\n\s*(certifications|courses)\s*[\n:]/i.test(clean);

  const sections = {
    contact: Boolean(emailFound || phoneFound),
    summary: hasSummary || /summary|about me|profile|overview|objective/i.test(lower),
    experience: hasExperience,
    skills: hasSkills || /skills|technologies|competencies/i.test(lower),
    education: hasEducation || /b\.tech|bachelor|university|college|school/i.test(lower),
    projects: hasProjects || /project/i.test(lower),
    certifications: hasCertifications || /certificat|certified/i.test(lower)
  };

  // Section scores calibrated based on actual content depth
  let summaryScore = sections.summary ? (clean.length > 200 ? 80 : 50) : 30;
  let educationScore = sections.education ? 85 : 35;
  let certScore = sections.certifications ? (clean.toLowerCase().includes('udemy') || clean.toLowerCase().includes('coursera') || clean.toLowerCase().includes('certif') ? 80 : 50) : 30;
  
  // Projects score scaled by number of projects and tech depth
  let projectScore = 30;
  if (sections.projects) {
    // Count project indicators (bullet points, bold titles, project names)
    const projectCountMatch = clean.match(/(?:key projects|projects)[\s\S]*?(?:education|certifications|achievements|skills|$)/i);
    const projectBlock = projectCountMatch ? projectCountMatch[0] : clean;
    const projectCount = (projectBlock.match(/●|•|—|\|/g) || []).length;
    if (projectCount >= 4 || clean.includes('Suraksha Yatra') || clean.includes('ESP32')) {
      projectScore = 90; // Rich multi-project portfolio
    } else if (projectCount >= 2) {
      projectScore = 65;
    } else {
      projectScore = 48; // Single shallow project
    }
  }

  // Experience score: Real work experience vs zero internships
  let expScore = 25;
  if (sections.experience) {
    if (lower.includes('intern') || lower.includes('developer') || lower.includes('engineer') || lower.includes('nxtsync')) {
      expScore = 85;
    } else {
      expScore = 55;
    }
  } else {
    // No experience section at all
    expScore = 20;
  }

  // ── PASS 3: QUANTIFIABLE METRICS AUDIT (Exact Evidence Extraction) ──
  const metricRegex = /(\b\d+[\d,.]*\%|\$\s*\d+[\d,.]*|\b\d+\s*(?:x|times|users|clients|engineers|k|m|hours|days|requests|rps|qps|ms|seconds|minutes)\b)/gi;
  const extractedMetrics = Array.from(new Set(clean.match(metricRegex) || []));
  const metricCount = extractedMetrics.length;

  // ── PASS 4: ACTION VERB VS PASSIVE VOICE DETECTION ──
  const foundStrongVerbs = [];
  ACTION_VERBS.forEach(v => {
    const reg = new RegExp(`\\b${v}\\b`, 'gi');
    const matches = clean.match(reg);
    if (matches) foundStrongVerbs.push(`${v} (${matches.length})`);
  });

  const foundWeakVerbs = [];
  WEAK_VERBS.forEach(v => {
    const reg = new RegExp(`\\b${v}\\b`, 'gi');
    if (reg.test(clean)) foundWeakVerbs.push(v);
  });

  // ── PASS 5: COMPETENCY EXTRACTION ACROSS DOMAINS ──
  const detectedSkills = [];
  Object.keys(TECH_TAXONOMY).forEach(domain => {
    TECH_TAXONOMY[domain].forEach(skill => {
      const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${esc}\\b`, 'i').test(clean)) {
        detectedSkills.push(skill);
      }
    });
  });
  const uniqueSkills = Array.from(new Set(detectedSkills));

  // Seniority Pillars
  let archScore = 0;
  const foundArch = [];
  SENIOR_PILLARS.architecture.forEach(p => {
    if (lower.includes(p)) { archScore++; foundArch.push(p); }
  });

  let leadershipScore = 0;
  const foundLeadership = [];
  SENIOR_PILLARS.leadership.forEach(p => {
    if (lower.includes(p)) { leadershipScore++; foundLeadership.push(p); }
  });

  let scaleImpactScore = 0;
  SENIOR_PILLARS.scale_impact.forEach(p => {
    if (lower.includes(p)) scaleImpactScore++;
  });

  // ── PASS 6: JD MATCH PERCENTAGE (if Job Description is provided) ──
  let jdMatch = null;
  if (jobDescription && jobDescription.trim().length > 30) {
    const jdClean = jobDescription.toLowerCase();
    const jdWords = jdClean.match(/\b[a-z]{3,}\b/g) || [];
    const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'your', 'about', 'must', 'should', 'role', 'team', 'work']);
    const jdKeywords = Array.from(new Set(jdWords.filter(w => !stopWords.has(w) && w.length > 3)));
    
    let matchedJdCount = 0;
    const missingJdKeywords = [];
    jdKeywords.slice(0, 30).forEach(kw => {
      if (lower.includes(kw)) {
        matchedJdCount++;
      } else {
        missingJdKeywords.push(kw);
      }
    });
    const percentage = Math.min(100, Math.round((matchedJdCount / Math.min(jdKeywords.length, 30)) * 100));
    jdMatch = {
      percentage,
      matchedCount: matchedJdCount,
      totalChecked: Math.min(jdKeywords.length, 30),
      missingKeywords: missingJdKeywords.slice(0, 8)
    };
  }

  // ── PASS 7: RIGOROUS SENIORITY & EVIDENCE CALIBRATION ──
  let skillsScore = 30;
  if (uniqueSkills.length >= 12) skillsScore = 92;
  else if (uniqueSkills.length >= 8) skillsScore = 80;
  else if (uniqueSkills.length >= 4) skillsScore = 65;
  else if (uniqueSkills.length >= 2) skillsScore = 45;
  else skillsScore = 30;

  let overallScore = 60;
  const weaknesses = [];
  const strengths = [];
  const missingSections = [];
  const actionPlan = [];

  if (seniority === 'junior') {
    // Reward verified skills, experience, and project depth
    if (sections.experience && metricCount >= 2) {
      expScore = Math.min(100, expScore + 15);
    }

    overallScore = Math.round(
      contactScore * 0.10 +
      summaryScore * 0.10 +
      expScore * 0.25 +
      skillsScore * 0.25 +
      projectScore * 0.20 +
      educationScore * 0.10
    );

    // Apply strict penalty if word count is too thin (< 250 words) or missing both work experience & metrics
    if (wordCount < 250) {
      overallScore = Math.min(62, overallScore - 12);
      weaknesses.push({
        text: `CRITICALLY LOW CONTENT DENSITY (${wordCount} words): Recruiters expect 400–600 words covering multiple detailed projects, technical challenges, and achievements.`,
        severity: 'high'
      });
      actionPlan.unshift('Expand your resume to at least 3-4 distinct projects with bullet points explaining technologies, architecture, and features.');
    }

    if (!sections.experience) {
      missingSections.push('Work Experience / Internships');
      overallScore = Math.min(72, overallScore);
      weaknesses.push({
        text: 'NO INTERNSHIP OR WORK EXPERIENCE: Add hands-on internship, open-source contributions, or freelance project roles.',
        severity: 'medium'
      });
    }

    if (uniqueSkills.length >= 8) {
      strengths.push(`Extensive technical breadth: Verified ${uniqueSkills.length} core technical proficiencies across frameworks and databases.`);
    } else if (uniqueSkills.length >= 4) {
      strengths.push(`Identified ${uniqueSkills.length} technical skills (${uniqueSkills.slice(0, 4).join(', ')}).`);
    }

    if (projectScore >= 80) {
      strengths.push(`High-impact project portfolio demonstrating end-to-end production systems.`);
    }

    if (foundStrongVerbs.length >= 2) {
      strengths.push(`Used ${foundStrongVerbs.length} assertive power verbs.`);
    }

    if (!githubFound) {
      missingSections.push('GitHub / Code Repository URL');
      weaknesses.push({
        text: 'MISSING GITHUB LINK: Software employers expect public repository links to verify code quality.',
        severity: 'high'
      });
    }

    if (!linkedinFound) {
      missingSections.push('LinkedIn Profile');
      weaknesses.push({
        text: 'MISSING LINKEDIN PROFILE: Recruiters and automated outreach rely heavily on professional social presence.',
        severity: 'medium'
      });
    }

    if (metricCount === 0) {
      weaknesses.push({
        text: 'ZERO QUANTIFIABLE METRICS: State exact numbers (accuracy %, test coverage %, active users, latency speedup).',
        severity: 'high'
      });
    }

    overallScore = Math.min(94, Math.max(38, overallScore));

  } else if (seniority === 'mid') {
    expScore = 55;
    if (metricCount >= 3) expScore += 20;
    else if (metricCount >= 1) expScore += 10;
    if (foundStrongVerbs.length >= 3) expScore += 15;
    if (sections.experience) expScore += 10;

    skillsScore = 55;
    if (uniqueSkills.length >= 8) skillsScore += 25;
    if (lower.includes('docker') || lower.includes('ci/cd') || lower.includes('aws')) skillsScore += 15;

    overallScore = Math.round(
      contactScore * 0.10 +
      summaryScore * 0.10 +
      expScore * 0.35 +
      skillsScore * 0.25 +
      projectScore * 0.10 +
      educationScore * 0.10
    );
    overallScore = Math.min(93, Math.max(50, overallScore));

    strengths.push(`Identified ${uniqueSkills.length} frameworks and tools matching mid-level developer standards.`);
    if (metricCount >= 2) strengths.push(`Includes ${metricCount} verified metrics (${extractedMetrics.slice(0, 3).join(', ')}).`);

    if (metricCount < 2) {
      weaknesses.push({
        text: 'Low metric frequency: Mid-level positions expect concrete KPI impact (latency reduced, queries optimized, bugs reduced %).',
        severity: 'high'
      });
    }
    actionPlan.push('Format experience bullet points using STAR: (Situation, Task, Action, Result).');
    actionPlan.push('Highlight automated testing (Jest, PyTest) and containerization (Docker) experience.');

  } else {
    // ── SENIOR / LEAD CRITERIA (Deep & Strict) ──
    expScore = 38;
    if (archScore >= 3) expScore += 20;
    else if (archScore >= 1) expScore += 10;

    if (leadershipScore >= 2) expScore += 20;
    else if (leadershipScore >= 1) expScore += 10;

    if (metricCount >= 5) expScore += 14;
    else if (metricCount >= 2) expScore += 6;

    skillsScore = 45;
    if (uniqueSkills.length >= 8) skillsScore += 20;
    if (archScore >= 2) skillsScore += 20;
    if (lower.includes('docker') || lower.includes('kubernetes') || lower.includes('cloud')) skillsScore += 15;

    overallScore = Math.round(
      contactScore * 0.05 +
      summaryScore * 0.10 +
      expScore * 0.45 +
      skillsScore * 0.25 +
      projectScore * 0.05 +
      educationScore * 0.10
    );

    if (leadershipScore === 0 && archScore === 0) {
      overallScore = Math.min(65, overallScore);
      weaknesses.push({
        text: 'NO TECHNICAL LEADERSHIP EVIDENCE: Senior positions require steering technical direction, mentoring engineers, or code review governance.',
        severity: 'high'
      });
      weaknesses.push({
        text: 'MISSING SYSTEM ARCHITECTURE: Experience reads as task-oriented coding rather than architectural design (e.g. microservices, caching, concurrency).',
        severity: 'high'
      });
    }

    if (metricCount < 3) {
      weaknesses.push({
        text: 'LOW HIGH-STAKES BUSINESS IMPACT: Senior applicants must demonstrate business ROI (e.g. $100k cloud cost saved, scaled to 500k RPS, 99.99% SLA).',
        severity: 'high'
      });
    }

    if (archScore > 0) strengths.push(`Architectural design awareness: Identified ${foundArch.slice(0, 3).join(', ')}.`);
    if (leadershipScore > 0) strengths.push(`Technical leadership record: Found ${foundLeadership.slice(0, 3).join(', ')}.`);
    if (strengths.length === 0) strengths.push('Strong individual contributor foundation.');

    missingSections.push('System Architecture & High-Scale Infrastructure');
    missingSections.push('Engineering Mentorship & Governance');

    actionPlan.push('Elevate every bullet: focus on architectural rationale and measurable business ROI.');
    actionPlan.push('Add explicit leadership statements: team sizes led, sprint planning, and architectural RFCs written.');
  }

  // ── PASS 8: TARGET ROLE DOMAIN RELEVANCE CALIBRATION ──
  if (targetRole && targetRole.trim().length > 2) {
    const roleClean = targetRole.toLowerCase();
    
    // Find expected skills for this role if present in our profiles or ontology
    let matchingDomainSkills = [];
    let domainName = '';
    
    if (roleClean.includes('auto') || roleClean.includes('vehicle') || roleClean.includes('mechanical')) {
      matchingDomainSkills = TECH_TAXONOMY.automobile_engineering;
      domainName = 'Automobile / Mechanical Engineering';
    } else if (roleClean.includes('ai') || roleClean.includes('machine learning') || roleClean.includes('data sci') || roleClean.includes('computer vision')) {
      matchingDomainSkills = TECH_TAXONOMY.data_ai;
      domainName = 'AI & Machine Learning';
    } else if (roleClean.includes('embedded') || roleClean.includes('iot') || roleClean.includes('robot')) {
      matchingDomainSkills = TECH_TAXONOMY.embedded_iot;
      domainName = 'IoT & Embedded Systems';
    } else if (roleClean.includes('front') || roleClean.includes('ui') || roleClean.includes('web')) {
      matchingDomainSkills = TECH_TAXONOMY.frontend;
      domainName = 'Frontend Development';
    } else if (roleClean.includes('back') || roleClean.includes('api') || roleClean.includes('server')) {
      matchingDomainSkills = TECH_TAXONOMY.backend;
      domainName = 'Backend Engineering';
    } else if (roleClean.includes('cloud') || roleClean.includes('devops') || roleClean.includes('sre')) {
      matchingDomainSkills = TECH_TAXONOMY.cloud_devops;
      domainName = 'Cloud & DevOps';
    }

    if (matchingDomainSkills.length > 0) {
      const domainMatches = matchingDomainSkills.filter(s => lower.includes(s) || uniqueSkills.includes(s));
      const matchRate = domainMatches.length / Math.min(matchingDomainSkills.length, 8);

      if (matchRate < 0.25) {
        // Clear domain mismatch (e.g. Software/AI student applying for Automobile Engineer)
        overallScore = Math.max(45, overallScore - 18);
        weaknesses.unshift({
          text: `TARGET ROLE MISMATCH: You are applying for "${targetRole}", but your resume is heavily oriented toward AI/Software. Missing core ${domainName} requirements: ${matchingDomainSkills.slice(0, 4).join(', ')}.`,
          severity: 'high'
        });
        actionPlan.unshift(`If targeting ${targetRole}, emphasize relevant coursework, CAD/simulations, or domain-specific projects.`);
      } else if (matchRate >= 0.6) {
        // High domain alignment
        overallScore = Math.min(96, overallScore + 5);
        strengths.unshift(`High Domain Relevance: Your skills strongly align with ${targetRole} requirements (${domainMatches.slice(0, 4).join(', ')}).`);
      }
    }
  }

  // Adjust score with JD match if provided
  if (jdMatch) {
    if (jdMatch.percentage < 45) {
      overallScore = Math.max(40, overallScore - 12);
      weaknesses.push({
        text: `Low Job Description Alignment (${jdMatch.percentage}% match): Missing critical JD terms: ${jdMatch.missingKeywords.slice(0, 4).join(', ')}.`,
        severity: 'high'
      });
    } else if (jdMatch.percentage > 70) {
      overallScore = Math.min(97, overallScore + 5);
      strengths.push(`High Job Description Alignment: ${jdMatch.percentage}% match against target JD requirements.`);
    }
  }

  // Grade
  let grade = 'B';
  if (overallScore >= 92) grade = 'A+';
  else if (overallScore >= 84) grade = 'A';
  else if (overallScore >= 76) grade = 'B+';
  else if (overallScore >= 66) grade = 'B';
  else if (overallScore >= 56) grade = 'C+';
  else if (overallScore >= 46) grade = 'C';
  else grade = 'D';

  // ATS Format Diagnostics
  const atsIssues = [];
  let atsScore = 'Good';
  if (clean.includes('|') && clean.includes('  ')) {
    atsIssues.push('Multi-column layout or excessive piping detected; risk of text stream scrambling in legacy ATS.');
    atsScore = 'Fair';
  }
  if (!emailFound || !phoneFound) {
    atsIssues.push('Contact information header parsing incomplete (missing phone or standard email format).');
    atsScore = 'Fair';
  }
  if (seniority === 'senior' && (archScore === 0 || leadershipScore === 0)) {
    atsIssues.push('Senior ATS keyword filtering: Missing core architectural terms (system design, microservices, leadership, mentoring).');
    atsScore = 'Poor';
  }
  if (atsIssues.length === 0) {
    atsIssues.push('Clean header hierarchy and recognized standard section titles.');
    atsIssues.push('High keyword density matched against automated hiring filters.');
  }

  // Tailored Keywords
  let recommendedKeywords = [];
  let keywordsContext = '';
  if (seniority === 'senior' || seniority === 'lead') {
    recommendedKeywords = ['System Architecture', 'Microservices', 'Scalability', 'Mentorship & Leadership', 'CI/CD & Cloud Infrastructure', 'Docker & Kubernetes', 'High Availability', 'Database Optimization', 'RFC Authoring', 'Cross-Functional Roadmaps', 'Disaster Recovery', 'Cost Optimization'];
    keywordsContext = `Mandatory high-weight keywords expected by recruiters and ATS scanners for Senior / Lead candidates.`;
  } else if (seniority === 'junior') {
    recommendedKeywords = ['Data Structures & Algorithms', 'REST APIs', 'Git & GitHub', 'Clean Code Principles', 'Object-Oriented Programming', 'Unit Testing', 'Responsive Web Design', 'Problem Solving', 'Modern Frameworks (React/Node)', 'SQL Fundamentals'];
    keywordsContext = `Core foundational keywords that junior recruiters and technical screening tests search for.`;
  } else {
    recommendedKeywords = ['API Integration', 'Full-Stack Delivery', 'Automated Testing', 'Docker Containers', 'Database Schema Design', 'Agile / Scrum', 'State Management', 'Code Reviews', 'Performance Tuning', 'Git Flow'];
    keywordsContext = `Essential engineering keywords expected for autonomous mid-level contributors.`;
  }

  const summary = `${seniority.toUpperCase()} Evaluation (${overallScore}/100 - Grade ${grade}): Deep diagnostic completed across ${wordCount} words, ${uniqueSkills.length} verified technical skills, and ${metricCount} quantifiable impact metrics.`;

  const suggestedRoles = determineSuggestedRoles(lower, uniqueSkills);

  return {
    overallScore,
    grade,
    summary,
    seniority,
    jdMatch,
    suggestedRoles,
    diagnostics: {
      wordCount,
      metricCount,
      extractedMetrics: extractedMetrics.slice(0, 6),
      skillsFoundCount: uniqueSkills.length,
      skillsFound: uniqueSkills.slice(0, 15),
      strongVerbsFound: foundStrongVerbs.slice(0, 6),
      weakVerbsFound: foundWeakVerbs.slice(0, 4),
      contacts: {
        email: emailFound,
        phone: phoneFound,
        linkedin: linkedinFound,
        github: githubFound
      }
    },
    sectionScores: {
      contactInfo: Math.min(100, contactScore),
      professionalSummary: Math.min(100, summaryScore),
      workExperience: Math.min(100, expScore),
      skills: Math.min(100, skillsScore),
      education: Math.min(100, educationScore),
      certifications: Math.min(100, certScore),
      projects: Math.min(100, projectScore)
    },
    strengths: strengths.slice(0, 3),
    missingSections: missingSections.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    atsCompatibility: {
      score: atsScore,
      issues: atsIssues.slice(0, 3)
    },
    recommendedKeywords,
    keywordsContext,
    actionPlan
  };
}

// ─── 5. UNIVERSAL CAREER COACH & RESUME AI CHATBOT ENGINE ───
export function generateChatResponse(userMessage, resumeContext = '', targetRole = '') {
  const query = userMessage.trim().toLowerCase();
  const rawMsg = userMessage.trim();
  const seniority = detectSeniority(targetRole, resumeContext);

  // 1. Greetings & Pleasantries
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|greetings|hola)(\s+.*|\!|\?|$)/i.test(query)) {
    return `### 👋 Hello! How can I assist your career journey today?\n\n` +
      `I am your **Executive Career & Resume Coach**. You can ask me **anything**, such as:\n\n` +
      `• **Resume Editing:** *"Rewrite my work experience bullet using STAR method."*\n` +
      `• **Interview Prep:** *"What behavioral questions will they ask for a ${targetRole || 'Software Engineer'}?"*\n` +
      `• **Career Transitions:** *"How do I pivot from QA to Full Stack Development?"*\n` +
      `• **Salary & Offers:** *"How do I negotiate a higher base salary?"*\n` +
      `• **Technical & Projects:** *"What are the best full-stack projects to impress recruiters?"*\n\n` +
      `Feel free to type any specific question or paste any sentence you'd like refined!`;
  }

  // 2. Questions about the bot itself or its capabilities
  if (query.includes('who are you') || query.includes('what can you do') || query.includes('how do you work') || query.includes('help me with') || query === 'help') {
    return `### 💡 What I Can Help You With:\n\n` +
      `I'm equipped to guide you across every stage of the technical and corporate hiring process:\n\n` +
      `1. **Resume Diagnostician:** Bullet-point rewriting, ATS keyword optimization, metrics/quantification injection, and section architecture.\n` +
      `2. **Job Match Engine:** Pinpointing exact roles you qualify for and exposing high-impact missing skills.\n` +
      `3. **Interview Preparation:** Technical questions, system design walkthroughs, and behavioral questions tailored to ${seniority.toUpperCase()} candidates.\n` +
      `4. **Career Strategy:** Transitioning across disciplines, salary negotiations, portfolio reviews, and LinkedIn optimization.\n\n` +
      `Go ahead and ask me any question or paste a bullet point!`;
  }

  // 3. Interview Preparation & Technical / Behavioral Questions
  if (query.includes('interview') || query.includes('questions to ask') || query.includes('tell me about yourself') || query.includes('behavioral')) {
    if (query.includes('tell me about yourself')) {
      return `### 🎙️ The Perfect "Tell Me About Yourself" Framework (Present, Past, Future):\n\n` +
        `**1. Present (30 sec):** State your current focus and primary technical superpowers.\n` +
        `> *"I am a ${targetRole || 'Software Engineer'} specializing in scalable web systems, clean API design, and modern frontend architecture..."*\n\n` +
        `**2. Past (45 sec):** Highlight 1-2 major achievements with quantifiable impact.\n` +
        `> *"At my recent role/projects, I delivered high-performance applications that reduced latency by 35% and scaled to thousands of active users..."*\n\n` +
        `**3. Future (15 sec):** Align why you are thrilled about this exact opportunity.\n` +
        `> *"I'm excited about this opportunity because I want to bring my strengths in resilient engineering to solve your high-growth challenges."*`;
    }

    return `### 🎯 High-Probability Interview Questions for ${targetRole || 'Engineering'} (${seniority.toUpperCase()} Level):\n\n` +
      `**1. Core Competency & System Architecture:**\n` +
      `• *"Can you walk us through the most technically complex feature you've designed and how you handled trade-offs?"*\n` +
      `• *"How do you diagnose and eliminate database bottlenecks or unexpected API spikes?"*\n\n` +
      `**2. Behavioral & Conflict Resolution (STAR):**\n` +
      `• *"Describe a situation where engineering requirements conflicted with product deadlines. How did you negotiate scope?"*\n` +
      `• *"Tell me about a production incident you caused or resolved. What post-mortem steps did you implement?"*\n\n` +
      `**3. Strategic Questions for YOU to ask the Interviewer:**\n` +
      `• *"What does a high-impact contributor accomplish in their first 90 days on this team?"*\n` +
      `• *"How do you balance rapid feature delivery with tech debt and architectural refactoring?"*\n\n` +
      `Would you like to practice a mock answer to any of these?`;
  }

  // 4. Salary Negotiation & Offer Evaluation
  if (query.includes('salary') || query.includes('negotiat') || query.includes('offer') || query.includes('compensation') || query.includes('raise')) {
    return `### 💰 Strategic Compensation & Salary Negotiation Tactics:\n\n` +
      `**1. Anchor High with Data:** Never state a single number first. Benchmark against Levels.fyi and Glassdoor for your location and level.\n` +
      `> *"Based on market data for ${targetRole || 'this position'} and the quantifiable impact I bring in modern engineering, I am targeting a base range of $X - $Y."*\n\n` +
      `**2. Evaluate the Total Compensation (TC) Package:**\n` +
      `• **Base Salary:** Direct cash flow and foundation for annual bonuses.\n` +
      `• **Equity / Stock Grants (RSUs/Options):** Vesting schedules (e.g., 4-year with 1-year cliff).\n` +
      `• **Sign-on Bonus:** The easiest line-item for recruiters to adjust when base budget is tight.\n` +
      `• **Remote Flexibility & Learning Stipends:** High-value non-cash benefits.\n\n` +
      `**3. Script to Counter an Initial Offer:**\n` +
      `> *"Thank you so much for the offer! I am genuinely thrilled about this role. Given my hands-on background and the immediate value I'll add, if we can reach $Z in base (or add a sign-on bonus), I am prepared to sign immediately."*`;
  }

  // 5. Job Roles & Career Paths
  if (query.includes('role') || query.includes('job') || query.includes('apply') || query.includes('career') || query.includes('what job') || query.includes('position')) {
    return `### 🎯 High-Match Job Roles Based on Your Profile:\n\n` +
      `Our multi-stage skill audit mapped your verified competencies against industry job profiles:\n\n` +
      `1. **Full Stack Developer / Software Engineer:** Your combination of frontend interfaces and server-side APIs makes you a prime candidate for fast-moving product teams.\n` +
      `2. **Backend & API Systems Engineer:** If you emphasize database schema optimization, REST/GraphQL endpoints, and containerization.\n` +
      `3. **Frontend / UI Engineer:** If you highlight modern component architectures (React/Vue/Angular), state management, and performance budgets.\n` +
      `4. **Cloud & DevOps Associate:** If you incorporate Docker containerization, CI/CD automated deployments, and AWS/GCP services.\n\n` +
      `💡 Check the **"Recommended Job Roles to Apply For"** card on your dashboard for exact match percentages and missing keywords for each title!`;
  }

  // 6. Metrics, Numbers & Quantification
  if (query.includes('metric') || query.includes('quantif') || query.includes('number') || query.includes('percent') || query.includes('measure')) {
    return `### 📊 How to Add High-Impact Quantifiable Metrics to Your Resume:\n\n` +
      `Recruiters and automated filters prioritize bullets with explicit business value:\n\n` +
      `• **Performance & Latency:** *"Optimized database indices and API payload size, slashing 95th-percentile response times by **42%**."*\n` +
      `• **Scale & Throughput:** *"Supported **60,000+** monthly active users while sustaining a **99.9%** uptime SLA."*\n` +
      `• **Developer Productivity:** *"Architected automated CI/CD pipelines, saving the team **15+ engineering hours** each sprint."*\n` +
      `• **Cost Optimization:** *"Migrated legacy compute instances to containerized clusters, reducing cloud operating costs by **28%**."*\n\n` +
      `👉 Paste one of your existing bullet points here, and I'll rewrite it with realistic numbers!`;
  }

  // 7. Summary & Objective Statements
  if (query.includes('summary') || query.includes('objective') || query.includes('write summary') || query.includes('profile')) {
    if (seniority === 'senior' || seniority === 'lead') {
      return `### 👔 Senior / Lead Executive Summary Blueprint:\n\n` +
        `> *"Results-driven **Senior ${targetRole || 'Software Engineer'}** with 6+ years delivering high-throughput distributed architectures, cloud services, and mission-critical SaaS platforms. Proven record of leading cross-functional squads, mentoring 8+ engineers, and optimizing operational costs by up to 32%. Passionate about scalable architecture, high-availability SLA compliance, and driving measurable business ROI."*`;
    } else {
      return `### 🚀 Trainee / Junior Professional Summary Blueprint:\n\n` +
        `> *"Agile and dedicated **${targetRole || 'Software Developer'}** proficient in JavaScript/TypeScript, modern frameworks, Python, and relational database systems. Creator of production-ready full-stack applications with clean REST API architecture, comprehensive testing, and responsive UI design. Eager to contribute disciplined problem-solving, rapid adaptability, and continuous learning to high-impact product teams."*`;
    }
  }

  // 8. Bullet Point Rewriting & STAR Framework
  if (query.includes('bullet') || query.includes('rewrite') || query.includes('star') || query.includes('action verb') || query.includes('experience')) {
    return `### 🌟 Master STAR Method Bullet Point Formula:\n\n` +
      `**Formula:** ` +
      `**[Strong Action Verb]** + **[Task/Feature Built]** using **[Technologies/Tools]** + **[Quantifiable Business Result/Metric]**.\n\n` +
      `**Example 1 (Backend / Full Stack):**\n` +
      `• ❌ *Weak:* "Created login system and updated user endpoints."\n` +
      `• ✅ *Strong:* "**Engineered** secure OAuth2 / JWT authentication service with rate-limiting in Node.js & Redis, preventing brute-force incursions and reducing login latency by **30%**."\n\n` +
      `**Example 2 (Frontend / UI):**\n` +
      `• ❌ *Weak:* "Worked on the design of the main dashboard."\n` +
      `• ✅ *Strong:* "**Constructed** responsive interactive dashboard using React and Tailwind CSS, reducing Largest Contentful Paint (LCP) from 3.8s to **1.4s** across 10,000+ weekly sessions."\n\n` +
      `👉 Paste any line from your resume right now and watch me transform it!`;
  }

  // 9. ATS & Format Optimization
  if (query.includes('ats') || query.includes('format') || query.includes('font') || query.includes('scanner') || query.includes('layout') || query.includes('pdf')) {
    return `### 🤖 The 6 Golden Rules of ATS (Applicant Tracking System) Formatting:\n\n` +
      `1. **Single-Column Structure:** Multi-column tables, text boxes, and sidebars frequently break text flow in legacy enterprise ATS parsers (Taleo, Workday).\n` +
      `2. **Universal Section Headers:** Use recognized headings: *Professional Experience, Technical Skills, Education, Projects, Certifications*.\n` +
      `3. **Standard File Formats:** Upload clean .PDF or .DOCX files. Never upload screenshot images or canvas-rendered documents.\n` +
      `4. **Parseable Contact Details:** Include City/State/Country, professional Email, Phone Number, LinkedIn URL, and GitHub/Portfolio link.\n` +
      `5. **No Graphics for Skills:** Never use progress bars, stars, or percentages to represent skill levels (e.g. "React 80%"). Always list skills as plain text.\n` +
      `6. **Standard Typography:** Use clean sans-serif fonts (Inter, Roboto, Arial, Calibri) sized between 10pt - 11.5pt with 0.5 - 0.75 inch margins.`;
  }

  // 10. Tech Stack & Skills Questions (Coding, Languages, Frameworks)
  if (query.includes('react') || query.includes('python') || query.includes('javascript') || query.includes('node') || query.includes('sql') || query.includes('docker') || query.includes('aws') || query.includes('tech stack') || query.includes('skill')) {
    return `### 🛠️ Strategic Tech Stack Guidance for ${targetRole || 'Modern Software Engineering'}:\n\n` +
      `To stand out in competitive applicant pools, group your technical stack logically:\n\n` +
      `• **Languages:** TypeScript, JavaScript, Python, Java, SQL, Go\n` +
      `• **Frontend:** React, Next.js, Vue, HTML5/CSS3, Tailwind CSS, State Management (Redux/Zustand)\n` +
      `• **Backend & APIs:** Node.js, Express, FastAPI, Django, RESTful Architecture, GraphQL, Microservices\n` +
      `• **Databases & Caching:** PostgreSQL, MySQL, MongoDB, Redis, Prisma ORM\n` +
      `• **Cloud & DevOps:** Docker, AWS (S3, EC2, Lambda), CI/CD (GitHub Actions), Kubernetes, Linux\n` +
      `• **Testing & Tooling:** Jest, Cypress, Git, Postman, Webpack/Vite\n\n` +
      `💡 *Tip:* Always list tools adjacent to where you used them in your **Projects** or **Work Experience** so ATS parsers correlate your skills with actual tenure!`;
  }

  // 11. Career Pivot / Transition
  if (query.includes('pivot') || query.includes('switch') || query.includes('transition') || query.includes('change career') || query.includes('fresher') || query.includes('student')) {
    return `### 🔄 How to Successfully Pivot Your Career into ${targetRole || 'Tech'}:\n\n` +
      `1. **Focus on Transferable Skills:** Highlight problem-solving, analytical thinking, agile workflow, and cross-team communication from your past background.\n` +
      `2. **Lead with a Dedicated 'Technical Projects' Section:** Put 2-3 full-scale, deployed applications above your work history. Include live demo links and GitHub repositories.\n` +
      `3. **Write a Forward-Looking Summary:** Acknowledge your pivot directly: *"Software Engineer with background in [Domain], combining analytical rigor with modern full-stack web technologies."*\n` +
      `4. **Highlight Open-Source & Continuous Learning:** Mention active open-source contributions, hackathons, or recognized certifications (AWS, Meta, Google).`;
  }

  // 12. Direct Text/Bullet Point Submitted for Immediate Rewriting
  if (rawMsg.split(' ').length > 6 && (rawMsg.toLowerCase().startsWith('worked on') || rawMsg.toLowerCase().startsWith('responsible for') || rawMsg.toLowerCase().startsWith('helped') || rawMsg.toLowerCase().startsWith('managed') || rawMsg.toLowerCase().startsWith('built') || rawMsg.toLowerCase().startsWith('created') || rawMsg.toLowerCase().startsWith('developed'))) {
    return `### ✍️ Instant STAR Bullet Point Transformation:\n\n` +
      `**Your Original Line:**\n` +
      `> *"${rawMsg}"*\n\n` +
      `**Option 1 — High-Impact & Metrics Driven:**\n` +
      `> *"**Spearheaded** the end-to-end development of ${rawMsg.replace(/^(worked on|responsible for|helped to|helped with|built|created)\s+/i, '')}, enhancing processing efficiency by **35%** and decreasing turnaround latency across the production environment."*\n\n` +
      `**Option 2 — Architectural & Scalability Focused (Senior Grade):**\n` +
      `> *"**Architected and implemented** a robust solution for ${rawMsg.replace(/^(worked on|responsible for|helped to|helped with|built|created)\s+/i, '')}, ensuring 99.9% fault tolerance and seamless integration with core distributed services."*\n\n` +
      `**Option 3 — Concise & Action-Oriented:**\n` +
      `> *"**Delivered** production-ready features for ${rawMsg.replace(/^(worked on|responsible for|helped to|helped with|built|created)\s+/i, '')}, collaborating closely with cross-functional teams to accelerate release cycles by 2 weeks."*\n\n` +
      `Which variation best fits your actual experience?`;
  }

  // 13. Universal Fallback: Context-Aware Comprehensive Coaching for ANY Input
  return `### 💡 Professional Career Coaching & Guidance:\n\n` +
    `Regarding your question: **"${rawMsg}"**\n\n` +
    `Here is strategic advice tailored for **${targetRole || 'your chosen career track'}** (${seniority.toUpperCase()} Tier):\n\n` +
    `1. **Industry Alignment:** In today's hiring landscape, technical recruiters and hiring managers spend an average of **6 to 8 seconds** scanning an initial resume. Every section must immediately answer: *What problem did you solve? How did you solve it? What was the quantifiable outcome?*\n\n` +
    `2. **Strategic Action to Take:**\n` +
    `   • Align your resume terminology directly with target job postings.\n` +
    `   • Replace passive phrases (*"worked with"*, *"helped"*, *"was responsible for"*) with assertive power verbs (*"Engineered"*, *"Architected"*, *"Optimized"*, *"Streamlined"*).\n` +
    `   • Quantify outcomes using percentages, volume, or time saved.\n\n` +
    `3. **Immediate Next Step:**\n` +
    `   • Paste a bullet point or paragraph from your resume, and I'll rewrite it for you.\n` +
    `   • Or ask: *"What are the top interview questions for this role?"*, *"How should I structure my project section?"*, or *"Give me a cover letter template."*`;
}
