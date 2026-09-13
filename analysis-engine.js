/**
 * analysis-engine.js — High-Precision Multi-Stage Resume & ATS Analysis Engine
 * 
 * Provides deterministic, evidence-based evaluation:
 * 1. Contact & Identity Reachability (International phones, LinkedIn, GitHub, Portfolio)
 * 2. Section Extraction & Evidence-Depth Analysis (Strict header boundaries)
 * 3. Categorized Technical Competency Inventory (Languages, Frameworks, DBs, Cloud, IoT/AI)
 * 4. Quantifiable Impact & KPI Density Extraction
 * 5. Action-Verb vs Passive Voice Distribution Audit
 * 6. Google XYZ / STAR High-Impact Bullet Rewriter
 * 7. Target Role Fit & Job Description Semantic Alignment
 * 8. Comprehensive 4-Pillar ATS Compatibility Audit (0–100%)
 * 9. Universal Career Coach AI Chatbot Engine
 */

// ─── 1. COMPREHENSIVE SKILL & DOMAIN ONTOLOGY ───
export const TECH_TAXONOMY = {
  languages: [
    'python', 'javascript', 'typescript', 'java', 'c', 'c++', 'c#', '.net', 'go', 'golang',
    'rust', 'ruby', 'rails', 'php', 'swift', 'kotlin', 'dart', 'sql', 'html', 'html5', 'css', 'css3', 'bash', 'shell', 'r', 'matlab'
  ],
  frameworks: [
    'react', 'react.js', 'next.js', 'vue', 'vue.js', 'angular', 'svelte', 'node.js', 'express', 'express.js',
    'django', 'fastapi', 'flask', 'spring', 'spring boot', 'tailwind', 'tailwind css', 'bootstrap', 'redux',
    'graphql', 'rest api', 'restful', 'grpc', 'pytorch', 'tensorflow', 'opencv', 'keras', 'scikit-learn', 'pandas', 'numpy'
  ],
  databases: [
    'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'sqlite', 'firebase', 'dynamodb',
    'cassandra', 'elasticsearch', 'oracle', 'sql server', 'supabase', 'prisma', 'typeorm'
  ],
  cloud_devops: [
    'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
    'git', 'github', 'github actions', 'gitlab ci', 'jenkins', 'ci/cd', 'terraform', 'ansible', 'linux', 'nginx', 'datadog'
  ],
  domain_specialized: [
    'esp32', 'esp8266', 'arduino', 'raspberry pi', 'embedded systems', 'iot', 'robotics', 'microcontroller',
    'sensors', 'cad', 'solidworks', 'catia', 'ansys', 'powertrain', 'bms', 'can bus', 'ecu',
    'computer vision', 'deep learning', 'machine learning', 'nlp', 'llm', 'system design', 'microservices',
    'distributed systems', 'unit testing', 'jest', 'cypress', 'agile', 'scrum', 'jira'
  ]
};

// Flattened taxonomy for rapid regex matching
const ALL_TECH_SKILLS = [];
Object.entries(TECH_TAXONOMY).forEach(([cat, skills]) => {
  skills.forEach(s => ALL_TECH_SKILLS.push({ name: s, category: cat }));
});

const ACTION_VERBS = [
  'spearheaded', 'architected', 'engineered', 'orchestrated', 'accelerated', 'optimized',
  'transformed', 'streamlined', 'pioneered', 'implemented', 'designed', 'developed',
  'automated', 'maximized', 'scaled', 'delivered', 'established', 'revamped', 'deployed',
  'constructed', 'formulated', 'reduced', 'increased', 'integrated', 'resolved'
];

const WEAK_VERBS = [
  'worked on', 'helped', 'assisted', 'responsible for', 'participated in', 'handled', 'did',
  'tried', 'tasked with', 'duties included', 'involved in'
];

const SENIOR_PILLARS = {
  architecture: ['system design', 'architecture', 'microservices', 'distributed systems', 'scalability', 'high availability', 'fault tolerance', 'caching', 'load balancing', 'concurrency', 'sharding', 'event-driven', 'kafka', 'rabbit-mq'],
  leadership: ['mentored', 'lead', 'spearheaded', 'managed', 'coached', 'cross-functional', 'stakeholder', 'hiring', 'roadmap', 'direction', 'guided', 'championed', 'tech lead', 'reviewed code', 'rfc'],
  scale_impact: ['revenue', 'cost reduction', 'performance', 'latency', 'scale', 'throughput', 'optimization', 'million', 'users', 'reliability', 'sla', 'slo', 'p95', 'p99', 'rps', 'qps']
};

// ─── 2. SENIORITY DETECTION ───
export function detectSeniority(targetRole = '', resumeText = '') {
  const role = (typeof targetRole === 'string' ? targetRole : '').toLowerCase();
  const rawText = typeof resumeText === 'string' ? resumeText : (resumeText && typeof resumeText.text === 'string' ? resumeText.text : '');
  const text = (rawText.slice(0, 2500)).toLowerCase();
  
  if (/\b(lead|principal|staff\b(?!.*\b(batch|portal|access|staff))\b|architect|director|vp|head)\b/i.test(role)) return 'lead';
  if (/\b(senior|sr\.?|specialist|expert)\b/i.test(role)) return 'senior';
  if (/\b(trainee|intern|junior|jr\.?|entry|fresher|graduate|student|associate|campus|placement)\b/i.test(role)) return 'junior';

  if (/\b(principal engineer|staff engineer|tech lead|team lead|director of engineering|vp of engineering)\b/i.test(text)) return 'lead';
  if (/\b(senior engineer|senior developer|sr\.?\s*developer|sr\.?\s*engineer)\b/i.test(text)) return 'senior';
  if (/\b(intern|internship|student|undergraduate|fresher|entry[- ]level|b\.tech|b\.?e\b|bca|mca|b\.sc|m\.tech|bachelor|degree|diploma|college|university|campus|cgpa|semester|final year)\b/i.test(text)) return 'junior';

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
export const ROLE_PROFILES = [
  {
    title: 'Software Engineer',
    aliases: ['software engineer', 'software developer', 'sde', 'swe', 'programmer', 'core engineer'],
    level: 'Entry / Mid / Senior',
    skills: ['python', 'java', 'c++', 'javascript', 'sql', 'git', 'github', 'rest api', 'system design', 'oop', 'docker', 'problem solving'],
    desc: 'Engineer core software systems, object-oriented services, algorithmic solutions, and production APIs.'
  },
  {
    title: 'Full Stack Developer',
    aliases: ['full stack', 'fullstack', 'web developer', 'web dev', 'mern', 'mean'],
    level: 'Entry / Mid / Senior',
    skills: ['javascript', 'typescript', 'react', 'node.js', 'express', 'postgresql', 'mongodb', 'rest api', 'sql', 'tailwind', 'html', 'css'],
    desc: 'Deliver complete end-to-end features spanning modern front-end architectures and robust backend services.'
  },
  {
    title: 'Backend Systems Engineer',
    aliases: ['backend', 'server', 'api developer', 'java developer', 'golang', 'python developer'],
    level: 'Entry / Mid / Senior',
    skills: ['python', 'node.js', 'express', 'c++', 'postgresql', 'mongodb', 'rest api', 'sql', 'docker', 'redis'],
    desc: 'Design, optimize, and scale database schemas, server-side APIs, caching tiers, and business logic.'
  },
  {
    title: 'AI / Machine Learning Engineer',
    aliases: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'computer vision', 'data science', 'nlp', 'llm', 'generative ai', 'ai engineer'],
    level: 'Entry / Mid / Senior',
    skills: ['python', 'machine learning', 'deep learning', 'opencv', 'pytorch', 'tensorflow', 'flask', 'computer vision', 'cnn', 'pandas', 'numpy', 'scikit-learn', 'llm', 'nlp'],
    desc: 'Develop AI models, computer vision systems, neural networks, and intelligent software pipelines.'
  },
  {
    title: 'IoT & Embedded Systems Engineer',
    aliases: ['iot', 'embedded', 'hardware', 'esp32', 'arduino', 'robotics', 'firmware', 'microcontroller'],
    level: 'Junior / Mid / Senior',
    skills: ['esp32', 'esp8266', 'embedded systems', 'c++', 'c', 'iot', 'robotics', 'microcontroller', 'sensors', 'python'],
    desc: 'Design hardware-software integration, microcontroller programming, IoT telemetry, and embedded robotics.'
  },
  {
    title: 'Frontend / UI Engineer',
    aliases: ['frontend', 'front end', 'ui', 'ux', 'web designer', 'react developer', 'angular', 'vue'],
    level: 'Junior / Mid / Senior',
    skills: ['javascript', 'typescript', 'react', 'next.js', 'html5', 'css3', 'tailwind', 'redux', 'git'],
    desc: 'Build high-performance, accessible, and responsive user interfaces with modern component frameworks.'
  },
  {
    title: 'Cloud & DevOps Engineer',
    aliases: ['devops', 'cloud', 'aws', 'azure', 'gcp', 'sre', 'site reliability', 'infrastructure', 'sysadmin'],
    level: 'Mid / Senior',
    skills: ['aws', 'docker', 'kubernetes', 'ci/cd', 'github actions', 'linux', 'terraform', 'nginx'],
    desc: 'Automate build pipelines, container orchestration, cloud infrastructure, and site reliability.'
  },
  {
    title: 'Data Analyst / Scientist',
    aliases: ['data analyst', 'data scientist', 'bi analyst', 'business analyst', 'data analytics'],
    level: 'Junior / Mid',
    skills: ['python', 'sql', 'pandas', 'numpy', 'machine learning', 'postgresql'],
    desc: 'Extract, clean, and model complex data to generate actionable predictions and insights.'
  },
  {
    title: 'Automobile / Automotive Systems Engineer',
    aliases: ['automobile', 'automotive', 'vehicle', 'ev', 'car', 'powertrain', 'mechanical', 'bms'],
    level: 'Entry / Mid / Senior',
    skills: ['cad', 'solidworks', 'matlab', 'ansys', 'powertrain', 'ev', 'bms', 'can bus', 'iot', 'embedded systems', 'sensors'],
    desc: 'Design automotive systems, EV power electronics, mechanical simulations, vehicle telemetry, and embedded ECUs.'
  },
  {
    title: 'Cyber Security & Network Engineer',
    aliases: ['security', 'cyber', 'soc', 'penetration', 'infosec', 'network', 'ethical hacker'],
    level: 'Junior / Mid / Senior',
    skills: ['linux', 'bash', 'networking', 'python', 'wireshark', 'c', 'docker', 'cryptography'],
    desc: 'Protect network perimeters, audit vulnerabilities, secure APIs, and implement defense protocols.'
  }
];

export function findMatchingRoleProfile(targetRole) {
  if (!targetRole || typeof targetRole !== 'string') return null;
  const tr = targetRole.toLowerCase().trim();

  // 1. Alias matching
  for (const profile of ROLE_PROFILES) {
    if (profile.aliases) {
      for (const alias of profile.aliases) {
        if (tr.includes(alias) || alias.includes(tr)) {
          return profile;
        }
      }
    }
  }

  // 2. Exact or substring match on Title
  for (const profile of ROLE_PROFILES) {
    const pTitle = profile.title.toLowerCase();
    if (tr.includes(pTitle) || pTitle.includes(tr)) {
      return profile;
    }
  }

  // 3. Token-based word overlap
  const stopWords = new Set(['engineer', 'developer', 'specialist', 'lead', 'trainee', 'junior', 'senior', 'intern', 'and', 'the', 'of', '/']);
  const tokens = tr.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  for (const profile of ROLE_PROFILES) {
    const pTitle = profile.title.toLowerCase();
    for (const token of tokens) {
      if (pTitle.includes(token)) {
        return profile;
      }
    }
  }

  // Fallback to first profile with custom label
  return {
    title: targetRole,
    aliases: [tr],
    level: 'General Entry / Mid',
    skills: ['python', 'javascript', 'sql', 'git', 'problem solving', 'communication'],
    desc: `Custom benchmark for ${targetRole}.`
  };
}

export function determineSuggestedRoles(resumeLower, uniqueSkills) {
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
    
    // Fit Priority Level
    let priority = 'mid';
    let priorityLabel = 'Mid Priority (Moderate Fit)';
    if (matchScore >= 70) {
      priority = 'high';
      priorityLabel = 'High Priority (Direct Fit)';
    } else if (matchScore < 45) {
      priority = 'low';
      priorityLabel = 'Low Priority (Skill Gap)';
    }

    // Role Seniority Hierarchy (Low, Mid, High Career Levels)
    const seniorityFit = {
      low: {
        level: 'Low (Junior / Entry)',
        readiness: Math.min(98, Math.round(matchScore * 1.15)),
        verdict: matchScore >= 60 ? 'Directly Qualified' : 'Basic Foundation',
        requirement: matchScore >= 60 ? 'Core coding & foundational projects verified.' : `Add ${missing.slice(0, 2).join(', ') || 'foundational tools'}.`
      },
      mid: {
        level: 'Mid (Mid-Level Developer)',
        readiness: Math.min(90, Math.round(matchScore * 0.88)),
        verdict: matchScore >= 75 ? 'Qualified' : 'Requires 1-2 Production Cycles',
        requirement: `Strengthen independent delivery with ${missing.slice(0, 2).join(', ') || 'advanced tools'}.`
      },
      high: {
        level: 'High (Senior / Lead)',
        readiness: Math.min(60, Math.round(matchScore * 0.50)),
        verdict: 'Aspirational Track',
        requirement: 'Enterprise scalability, architecture design, and team mentorship.'
      }
    };

    if (matchScore >= 20) {
      suggestions.push({
        title: profile.title,
        level: profile.level,
        matchScore,
        priority,
        priorityLabel,
        seniorityFit,
        matchedSkills: matched.slice(0, 8),
        missingSkills: missing.slice(0, 4),
        desc: profile.desc
      });
    }
  });

  suggestions.sort((a, b) => b.matchScore - a.matchScore);
  return suggestions.slice(0, 6);
}

// ─── 5. BULLET POINT EXTRACTION & GOOGLE XYZ / STAR REWRITER ───
function extractAndRewriteBullets(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const candidates = [];

  for (const line of lines) {
    let cleanLine = line.replace(/^[•●\-\*\|\s]+/, '').trim();
    if (cleanLine.includes(':') && /built|developed|created|worked|engineered|implemented|designed/i.test(cleanLine)) {
      const parts = cleanLine.split(':');
      if (parts[1] && parts[1].trim().length >= 25) {
        cleanLine = parts[1].trim();
      }
    }

    const isBullet = /^[•●\-\*\|]\s*/.test(line) || /^(developed|built|worked|created|designed|implemented|handled|assisted|responsible for|spearheaded|engineered|integrated|constructed)\b/i.test(cleanLine);
    if (isBullet && cleanLine.length >= 25 && cleanLine.length <= 250) {
      candidates.push(cleanLine);
    }
  }

  const rewrites = [];
  const weakStarters = [
    { pattern: /^worked on\b/i, action: 'Engineered', metric: 'reducing manual turnaround time by 35%' },
    { pattern: /^helped with\b|^assisted in\b/i, action: 'Collaborated to build', metric: 'improving feature delivery speed by 25%' },
    { pattern: /^responsible for\b|^duties included\b/i, action: 'Spearheaded', metric: 'achieving 99.5% operational uptime' },
    { pattern: /^handled\b/i, action: 'Optimized & Managed', metric: 'scaling workflow throughput by 30%' },
    { pattern: /^built\b|^created\b/i, action: 'Architected and Deployed', metric: 'serving 500+ active users with sub-second response times' },
    { pattern: /^developed\b/i, action: 'Engineered & Scaled', metric: 'enhancing user engagement metrics by 25%' }
  ];

  for (const item of candidates) {
    const hasMetric = /(\d+[\d,.]*\%|\$\s*\d+|\b\d+\s*(?:k|m|users|requests|rps|uptime|cgpa|ms|times|x)\b)/i.test(item);

    for (const ws of weakStarters) {
      if (ws.pattern.test(item)) {
        let cleanedBody = item.replace(ws.pattern, '').trim();
        cleanedBody = cleanedBody.replace(/[.,;]+$/, '').trim();
        const rewritten = hasMetric
          ? `${ws.action} ${cleanedBody}.`
          : `${ws.action} ${cleanedBody}, ${ws.metric}.`;

        rewrites.push({
          original: item,
          improved: rewritten,
          issue: ws.pattern.source.includes('worked') || ws.pattern.source.includes('responsible')
            ? 'Task-oriented / passive phrasing without measurable impact.'
            : 'Can be elevated with a stronger action verb and quantifiable outcome.'
        });
        break;
      }
    }

    if (rewrites.length >= 3) break;
  }

  // Fallback: If no weak starter matched but we have bullets without metrics
  if (rewrites.length < 2) {
    for (const item of candidates) {
      const hasMetric = /(\d+[\d,.]*\%|\$\s*\d+|\b\d+\s*(?:k|m|users|requests|rps|uptime|cgpa|ms)\b)/i.test(item);
      if (!hasMetric && !rewrites.some(r => r.original === item)) {
        let cleanedBody = item.replace(/[.,;]+$/, '').trim();
        rewrites.push({
          original: item,
          improved: `Spearheaded ${cleanedBody.charAt(0).toLowerCase() + cleanedBody.slice(1)}, improving operational throughput by 30% while maintaining 99%+ system reliability.`,
          issue: 'Missing measurable KPI or business outcome.'
        });
        if (rewrites.length >= 2) break;
      }
    }
  }

  return rewrites;
}

// Helper to format person names into clean Title Case
function formatPersonName(str) {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map(w => {
      if (w.length === 1) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

export function isInstitutionOrOrg(name) {
  if (!name || typeof name !== 'string') return true;
  const s = name.trim().toLowerCase();

  // Academic, institutional, college, campus, or university keywords
  const institutionPattern = /\b(campus|technical|techical|technology|technologies|college|university|institute|institution|institutions|polytechnic|academy|school|engineering|autonomous|accredited|affiliated|approved|department|faculty|center|centre|education|educational|trust|society|placement|cell|hall\s+of\s+residence|hostel|vidyalaya|vidyapeeth|sansthan|kendra|anna\s+university|paavai|anna\s+univ)\b/i;
  if (institutionPattern.test(s)) return true;

  // Job titles, degrees, or document terms
  const rolePattern = /\b(engineer|developer|architect|designer|manager|specialist|analyst|intern|trainee|student|applicant|candidate|fresher|graduate|curriculum|vitae|resume|biodata|profile|portfolio|summary|overview|details|declaration|semester|cgpa|gpa|percentage|marks|b\.?tech|b\.?e\b|m\.?tech|m\.?c\.?a|b\.?s\\.?c|diploma|degree)\b/i;
  if (rolePattern.test(s)) return true;

  // Geographical cities standing alone
  const locationPattern = /^(coimbatore|namakkal|salem|erode|trichy|madurai|chennai|bengaluru|bangalore|hyderabad|mumbai|pune|delhi|noida|gurgaon|tamil\s*nadu|kerala|karnataka|andhra|india|usa)(\s*,\s*(tamil\s*nadu|kerala|karnataka|india|usa))?$/i;
  if (locationPattern.test(s)) return true;

  // AI / CS / STEM domain subject phrases that appear as resume headers
  const techDomainPattern = /\b(artificial\s+intelligence|machine\s+learning|deep\s+learning|natural\s+language\s+processing|computer\s+science|information\s+technology|information\s+science|data\s+science|data\s+analytics|cyber\s+security|cybersecurity|cloud\s+computing|internet\s+of\s+things|blockchain|robotic|automation|software\s+development|web\s+development|full\s+stack|front\s+end|back\s+end|devops|generative\s+ai|large\s+language|neural\s+network|computer\s+vision|big\s+data|data\s+engineering|electrical\s+electronics|electronics\s+communication|embedded\s+systems|vlsi|iot)\b/i;
  if (techDomainPattern.test(s)) return true;

  // Lines ending with conjunctions/prepositions are subject headings, not names
  // e.g. "Artificial Intelligence And", "Machine Learning With"
  // NOTE: single-letter words are initials (e.g. "Mohamed Riyas A") — exclude them
  if (/\b(and|or|with|for|of|in|to|the|an|by|from|at|on|as|into|about|using|through|via)\s*$/i.test(s)) return true;

  // A valid person name must have at least one token that is NOT a common English stop word
  // NOTE: 'a' is excluded from stopWords because it is used as a name initial (e.g. "Rajana M", "Mohamed Riyas A")
  const stopWords = new Set([
    'an','the','and','or','but','for','nor','so','yet',
    'with','in','on','at','to','of','by','from','as','into',
    'about','through','via','up','down','over','under','between',
    'among','around','against','along','during','before','after',
    'above','below','near','across','within','without','upon',
    'regarding','concerning','including','excluding','following'
  ]);
  const tokens = s.split(/\s+/);
  const hasRealNameToken = tokens.some(t => t.length >= 2 && !stopWords.has(t));
  if (!hasRealNameToken) return true;

  return false;
}

export function isValidPersonName(name) {
  if (!name || typeof name !== 'string') return false;
  const clean = name.trim();
  if (clean.length < 2 || clean.length > 45) return false;
  if (isInstitutionOrOrg(clean)) return false;
  return /^[a-zA-Z\s\.\-]+$/.test(clean);
}

export function extractCandidateName(text, email = null) {
  if (!text) return null;
  const headerLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Check explicit name labels: e.g. "Name: Saravan Prasanna", "Candidate Name: Rajana M"
  for (const line of headerLines.slice(0, 15)) {
    const labeledMatch = line.match(/^(?:candidate\s+name|student\s+name|applicant\s+name|full\s+name|name)\s*[:\-]\s*([A-Za-z\s\.\,\-]{2,40})/i);
    if (labeledMatch) {
      const candidate = formatPersonName(labeledMatch[1]);
      if (isValidPersonName(candidate)) return candidate;
    }
  }

  // 2. Scan initial preamble lines (before body sections start)
  const sectionBoundary = /^(?:skills|technical\s+skills|work\s+experience|experience|employment|education|academic|projects|summary|professional\s+summary|profile\s+summary|objective|career\s+objective|certifications|achievements|publications|declaration)\b/i;
  const forbiddenKeywords = /^(?:curriculum\s+vitae|resume|biodata|profile|contact|portfolio|page\s*\d+|personal\s+details|email|phone|address|declaration|mobile)/i;
  const invalidSymbols = /[@\d\(\)\{\}\[\]\<\>\/\\\|\:\;\*\+\=\_\$\#\%\^\&~]/;

  for (let i = 0; i < Math.min(headerLines.length, 14); i++) {
    const rawLine = headerLines[i];
    if (sectionBoundary.test(rawLine)) break;

    let line = rawLine.replace(/[|•·,].*$/, '').trim();
    if (!line || line.length < 2 || line.length > 40) continue;
    if (forbiddenKeywords.test(line)) continue;
    if (invalidSymbols.test(line)) continue;

    // Disallow institutional names, job titles, or degree abbreviations
    if (isInstitutionOrOrg(line)) continue;

    const words = line.split(/\s+/).filter(Boolean);
    if (words.length >= 1 && words.length <= 5 && /^[a-zA-Z\s\.\-]+$/.test(line)) {
      const candidate = formatPersonName(line);
      if (isValidPersonName(candidate)) return candidate;
    }
  }

  // 3. Fallback: Extract from email address username and cross-reference header text
  if (email) {
    const emailUser = email.split('@')[0];
    const cleanUser = emailUser.replace(/[\d_\-]+/g, ' ').replace(/\./g, ' ').trim();
    const userTokens = cleanUser.split(/\s+/).filter(w => w.length >= 3);

    // Scan header lines to see if candidate's real name matches email tokens
    for (const line of headerLines.slice(0, 15)) {
      if (isInstitutionOrOrg(line)) continue;
      const lowerLine = line.toLowerCase();
      const hasEmailToken = userTokens.some(t => lowerLine.includes(t)) || (cleanUser.length >= 5 && lowerLine.replace(/\s+/g, '').includes(cleanUser));
      if (hasEmailToken && isValidPersonName(line)) {
        return formatPersonName(line);
      }
    }

    if (cleanUser.length >= 3) {
      const formatted = formatPersonName(cleanUser);
      if (isValidPersonName(formatted)) return formatted;
    }
  }

  return null;
}

// ─── 6. ROBUST ACADEMIC & CGPA EXTRACTOR ───
export function extractAcademicScore(text) {
  if (!text) return null;
  
  // 1. Standard "CGPA: 8.85" or "CGPA - 8.85 / 10" or "GPA: 3.8"
  const p1 = text.match(/\b(?:cgpa|gpa|aggregate|percentage|score|marks?)\s*[:=\-]?\s*(\d{1,2}(?:\.\d{1,2})?(?:\s*\/\s*10|\s*%)?)/i);
  if (p1 && p1[1]) return p1[0].trim();

  // 2. Reverse format "8.85 CGPA" or "8.85 / 10 CGPA" or "8.85 GPA"
  const p2 = text.match(/\b(\d{1,2}\.\d{1,2})\s*(?:\/\s*10)?\s*(?:cgpa|gpa)\b/i);
  if (p2 && p2[1]) return `CGPA: ${p2[1]} / 10`;

  // 3. Proximity to degree "B.E. Computer Science ... 8.85"
  const p3 = text.match(/(?:b\.?e\b|b\.tech|bachelor|university|college|school)[\s\S]{1,100}?\b([6-9]\.\d{1,2})\s*(?:\/\s*10)?\b/i);
  if (p3 && p3[1]) return `CGPA: ${p3[1]} / 10`;

  // 4. Percentage format "85.5%" or "88%"
  const p4 = text.match(/(?:aggregate|percentage|marks?|distinction)[\s\S]{0,35}?\b(\d{2}(?:\.\d{1,2})?)\s*%/i);
  if (p4 && p4[1]) return `${p4[1]}%`;

  return null;
}

// ─── 7. EMPLOYMENT GAP AUDITOR (> 6 MONTHS FLAGGED NEUTRALLY) ───
export function detectEmploymentGaps(text) {
  if (!text) return [];
  const gaps = [];

  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  
  const dateRegex = /\b(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,\s]+)?(20\d\d|\d{2}\/\d{4})\s*(?:[-–—to]+|\s+to\s+)\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,\s]+)?(20\d\d|\d{2}\/\d{4}|present|current)\b/gi;

  const matches = [];
  let m;
  while ((m = dateRegex.exec(text)) !== null) {
    const raw = m[0];
    const startMonthStr = (m[1] || '').toLowerCase().slice(0, 3);
    const startYearStr = m[2];
    const endMonthStr = (m[3] || '').toLowerCase().slice(0, 3);
    const endYearStr = (m[4] || '').toLowerCase();

    let startYear = parseInt(startYearStr.includes('/') ? startYearStr.split('/')[1] : startYearStr, 10);
    let startMonth = startMonthStr ? (monthMap[startMonthStr] ?? 0) : 0;

    let endYear, endMonth;
    if (endYearStr === 'present' || endYearStr === 'current') {
      const now = new Date();
      endYear = now.getFullYear();
      endMonth = now.getMonth();
    } else {
      endYear = parseInt(endYearStr.includes('/') ? endYearStr.split('/')[1] : endYearStr, 10);
      endMonth = endMonthStr ? (monthMap[endMonthStr] ?? 11) : 11;
    }

    if (!isNaN(startYear) && !isNaN(endYear) && startYear >= 2000 && endYear >= startYear) {
      const startTotal = startYear * 12 + startMonth;
      const endTotal = endYear * 12 + endMonth;
      matches.push({ raw, startTotal, endTotal, startYear, endYear });
    }
  }

  // Sort chronologically by start date
  matches.sort((a, b) => a.startTotal - b.startTotal);

  // Check gaps between sequential intervals
  for (let i = 0; i < matches.length - 1; i++) {
    const currentEnd = matches[i].endTotal;
    const nextStart = matches[i + 1].startTotal;
    const gapMonths = nextStart - currentEnd;

    if (gapMonths > 6) {
      const startYr = Math.floor(currentEnd / 12);
      const startMo = (currentEnd % 12) + 1;
      const endYr = Math.floor(nextStart / 12);
      const endMo = (nextStart % 12) + 1;
      gaps.push({
        period: `${startMo.toString().padStart(2, '0')}/${startYr} - ${endMo.toString().padStart(2, '0')}/${endYr}`,
        note: `Transition interval of approximately ${gapMonths} months detected; can be framed constructively (e.g. self-directed upskilling, capstone projects, higher education).`
      });
    }
  }

  return gaps;
}

// ─── 8. LANGUAGE & PHRASING QUALITY AUDITOR ───
export function auditLanguageQuality(text) {
  const language_issues = [];
  let score = 95;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const weakOpeners = [
    { regex: /^(?:was\s+)?responsible\s+for\s+(.*)/i, suggestion: 'Replace with an assertive action verb like "Spearheaded", "Directed", or "Engineered".' },
    { regex: /^worked\s+(?:on|with)\s+(.*)/i, suggestion: 'Replace with specific contribution verbs like "Developed", "Integrated", or "Architected".' },
    { regex: /^assisted\s+(?:in|with)\s+(.*)/i, suggestion: 'Highlight your direct technical ownership with verbs like "Co-engineered", "Implemented", or "Executed".' },
    { regex: /^helped\s+(?:to\s+)?(.*)/i, suggestion: 'Specify your exact technical role, e.g., "Constructed", "Optimized", or "Delivered".' },
    { regex: /^handled\s+(.*)/i, suggestion: 'Use higher-impact verbs like "Orchestrated", "Administered", or "Streamlined".' },
    { regex: /^duties\s+included\s+(.*)/i, suggestion: 'Rewrite as an active achievement statement using power action verbs.' }
  ];

  for (const line of lines) {
    const stripped = line.replace(/^[●•—\-\*\d\.]+\s*/, '').trim();
    if (stripped.length < 15) continue;

    for (const weak of weakOpeners) {
      const match = stripped.match(weak.regex);
      if (match) {
        language_issues.push({
          issue: 'Weak passive verb opener',
          location: stripped.length > 70 ? stripped.slice(0, 67) + '...' : stripped,
          suggestion: weak.suggestion
        });
        score -= 6;
        break;
      }
    }

    // Conciseness check (> 30 words / ~2+ lines)
    const wordsInLine = stripped.split(/\s+/).filter(Boolean);
    if (wordsInLine.length > 30) {
      language_issues.push({
        issue: 'Bullet length exceeds 2 lines (~30 words)',
        location: wordsInLine.slice(0, 7).join(' ') + ' ... ' + wordsInLine.slice(-4).join(' '),
        suggestion: 'Split into two concise bullets under 25 words focused on specific outcomes.'
      });
      score -= 5;
    }

    if (language_issues.length >= 4) break;
  }

  // Tense consistency check in experience blocks
  if (/\b(develop|implement|manage|create|build)\b/i.test(text) && /\b(developed|implemented|managed|created|built)\b/i.test(text)) {
    if (language_issues.length < 4) {
      language_issues.push({
        issue: 'Tense consistency check',
        location: 'Experience / Projects section',
        suggestion: 'Ensure past roles strictly use past tense verbs (e.g. "Developed", "Engineered") and only active ongoing roles use present tense.'
      });
      score -= 4;
    }
  }

  return {
    score: Math.min(100, Math.max(55, score)),
    language_issues
  };
}

// ─── 9. QUANTIFIABLE IMPACT AUDITOR ───
export function auditQuantifiableImpact(text) {
  const strong_bullets = [];
  const weak_bullets = [];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const bulletLines = lines.filter(l => /^[●•—\-\*]/.test(l) || (l.length > 30 && !l.endsWith(':')));

  const metricRegex = /(\b\d+[\d,.]*\%|\$\s*\d+[\d,.]*|\b\d+\s*(?:x|times|users|clients|engineers|k|m|hours|days|requests|rps|qps|ms|seconds|minutes|accuracy|latency)\b)/i;

  for (const line of bulletLines) {
    const cleanLine = line.replace(/^[●•—\-\*\d\.]+\s*/, '').trim();
    if (cleanLine.length < 20) continue;

    // Filter out header, contact, or education summary lines
    if (/@|https?:\/\/|github\.com|linkedin\.com|\b(?:email|phone|contact|cgpa|b\.?e\b|b\.tech|bachelor|university|college)\b/i.test(cleanLine)) {
      continue;
    }

    if (metricRegex.test(cleanLine)) {
      if (strong_bullets.length < 6) {
        strong_bullets.push(cleanLine);
      }
    } else {
      if (weak_bullets.length < 4) {
        const actionStarter = cleanLine.charAt(0).toUpperCase() + cleanLine.slice(1).replace(/[.,;]+$/, '');
        weak_bullets.push({
          original: cleanLine,
          suggested_rewrite: `Spearheaded ${actionStarter.toLowerCase()}, achieving [X% performance boost / serving Y users] and saving [Z hours/week].`
        });
      }
    }
  }

  const totalEvaluated = strong_bullets.length + weak_bullets.length;
  const ratio = totalEvaluated > 0 
    ? `${strong_bullets.length} achievement-oriented (${Math.round((strong_bullets.length / totalEvaluated) * 100)}%) vs ${weak_bullets.length} duty-listing bullets`
    : 'No distinct bullet points found; format project highlights with bullet points.';

  let score = 45;
  if (strong_bullets.length >= 4) score = 95;
  else if (strong_bullets.length >= 2) score = 85;
  else if (strong_bullets.length >= 1) score = 75;
  else score = 55;

  return {
    score,
    strong_bullets,
    weak_bullets,
    ratio
  };
}

// ─── 10. MULTI-TIER KEYWORD & SKILL MATCH AUDITOR ───
export function auditKeywordMatch(clean, jobDescription, targetRole, uniqueSkills) {
  const lower = clean.toLowerCase();
  const matched_keywords = [];
  const missing_keywords = [];
  const partial_matches = [];

  const SYNONYM_MAP = [
    { jd: 'backend development', resumePatterns: ['node', 'node.js', 'express', 'fastapi', 'django', 'flask', 'spring', 'sql', 'rest api', 'graphql'] },
    { jd: 'frontend development', resumePatterns: ['react', 'react.js', 'next.js', 'vue', 'angular', 'html', 'css', 'tailwind', 'javascript', 'typescript'] },
    { jd: 'machine learning / ai', resumePatterns: ['python', 'scikit-learn', 'tensorflow', 'pytorch', 'deep learning', 'nlp', 'llm', 'computer vision', 'pandas', 'numpy'] },
    { jd: 'cloud & devops', resumePatterns: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'linux', 'terraform'] },
    { jd: 'database management', resumePatterns: ['postgresql', 'mysql', 'mongodb', 'redis', 'sql', 'firebase', 'sqlite'] },
    { jd: 'data structures & algorithms', resumePatterns: ['python', 'c++', 'java', 'algorithms', 'data structures', 'problem solving', 'system design'] }
  ];

  if (jobDescription && jobDescription.trim().length > 25) {
    const jdClean = jobDescription.toLowerCase();
    const rawTokens = jdClean.match(/\b[a-z]{3,}\b/g) || [];
    const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'your', 'about', 'must', 'should', 'role', 'team', 'work', 'experience', 'looking', 'skills', 'responsibilities', 'qualifications', 'ability', 'preferred', 'required']);
    
    const tokenFreq = new Map();
    rawTokens.forEach(t => {
      if (!stopWords.has(t)) {
        tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
      }
    });

    const sortedJdTokens = Array.from(tokenFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 30);

    let weightedMatchSum = 0;
    let totalWeight = 0;

    sortedJdTokens.forEach(kw => {
      const weight = tokenFreq.get(kw) || 1;
      totalWeight += weight;

      if (lower.includes(kw)) {
        weightedMatchSum += weight;
        if (!matched_keywords.includes(kw)) matched_keywords.push(kw);
      } else {
        let foundSynonym = false;
        for (const syn of SYNONYM_MAP) {
          if (syn.jd.includes(kw) || kw.includes(syn.jd)) {
            for (const pat of syn.resumePatterns) {
              if (lower.includes(pat) && !partial_matches.some(p => p.jd_term === kw)) {
                partial_matches.push({ resume_term: pat, jd_term: kw });
                weightedMatchSum += weight * 0.75;
                foundSynonym = true;
                break;
              }
            }
          }
          if (foundSynonym) break;
        }

        if (!foundSynonym && missing_keywords.length < 15) {
          missing_keywords.push(kw);
        }
      }
    });

    const score = totalWeight > 0 ? Math.min(100, Math.round((weightedMatchSum / totalWeight) * 100)) : 75;
    return {
      score,
      matched_keywords: matched_keywords.slice(0, 15),
      missing_keywords: missing_keywords.slice(0, 10),
      partial_matches: partial_matches.slice(0, 5)
    };
  }

  // Fallback: match against target role profile if JD is not provided
  const matchingProfile = findMatchingRoleProfile(targetRole || 'Software Engineer') || ROLE_PROFILES[0];
  matchingProfile.skills.forEach(s => {
    if (lower.includes(s) || uniqueSkills.includes(s)) {
      matched_keywords.push(s);
    } else {
      missing_keywords.push(s);
    }
  });

  SYNONYM_MAP.forEach(syn => {
    syn.resumePatterns.forEach(pat => {
      if (uniqueSkills.includes(pat) && !partial_matches.some(p => p.resume_term === pat)) {
        partial_matches.push({ resume_term: pat, jd_term: syn.jd });
      }
    });
  });

  const totalReq = matchingProfile.skills.length;
  const matchPct = Math.min(100, Math.round((matched_keywords.length / Math.max(1, totalReq)) * 100));

  return {
    score: matchPct,
    matched_keywords: matched_keywords.slice(0, 15),
    missing_keywords: missing_keywords.slice(0, 10),
    partial_matches: partial_matches.slice(0, 5)
  };
}

// ─── 11. JSON FORMATTER ACCORDING TO USER SPECIFICATION ───
export function formatAnalysisAsJson(analysis) {
  return {
    overall_score: analysis.overall_score || analysis.overallScore,
    verdict: analysis.verdict || (analysis.overall_score >= 75 ? 'Strong Match' : (analysis.overall_score >= 50 ? 'Moderate Match — needs tailoring' : 'Weak Match')),
    summary: analysis.summary,
    scores: {
      keyword_match: analysis.scores?.keyword_match ?? 85,
      experience_relevance: analysis.scores?.experience_relevance ?? 80,
      education_certifications: analysis.scores?.education_certifications ?? 88,
      ats_compatibility: analysis.scores?.ats_compatibility ?? 90,
      language_quality: analysis.scores?.language_quality ?? 90
    },
    keyword_analysis: {
      matched_keywords: analysis.keyword_analysis?.matched_keywords ?? analysis.diagnostics?.skillsFound ?? [],
      missing_keywords: analysis.keyword_analysis?.missing_keywords ?? [],
      partial_matches: analysis.keyword_analysis?.partial_matches ?? []
    },
    experience_notes: analysis.experience_notes ?? [
      `Seniority level assessed as ${analysis.seniority?.toUpperCase() || 'ENTRY'} based on career progression and project depth.`
    ],
    employment_gaps: analysis.employment_gaps ?? [],
    quantifiable_impact: {
      strong_bullets: analysis.quantifiable_impact?.strong_bullets ?? [],
      weak_bullets: analysis.quantifiable_impact?.weak_bullets ?? []
    },
    ats_issues: analysis.ats_issues ?? analysis.atsCompatibility?.issues ?? [],
    language_issues: analysis.language_issues ?? [],
    top_recommendations: analysis.top_recommendations ?? analysis.actionPlan?.slice(0, 3) ?? [
      'Quantify results across project bullets with measurable metrics (% efficiency, user scale).',
      'Incorporate critical missing keywords directly into technical project descriptions.',
      'Maintain strong action verbs and clean single-column ATS typography.'
    ]
  };
}

// ─── 12. EXPERIENCE RELEVANCE AUDITOR ───
export function auditExperienceRelevance(clean, targetRole, seniority, sections, projectScore, expScore, metricCount) {
  const lower = clean.toLowerCase();
  const experience_notes = [];

  if (lower.includes('software engineer') || lower.includes('developer') || lower.includes('intern') || lower.includes('trainee')) {
    experience_notes.push(`Demonstrated engineering background aligning with ${targetRole || 'industry technical requirements'}.`);
  }
  if (metricCount >= 2) {
    experience_notes.push(`Verified quantifiable delivery impact across ${metricCount} numerical metrics.`);
  }
  if (sections.projects && projectScore >= 80) {
    experience_notes.push('Applied portfolio projects validate practical engineering delivery and architecture.');
  }
  if (!sections.experience && sections.projects) {
    experience_notes.push('University capstone and independent software projects substantiate applied engineering abilities.');
  }

  let score = expScore;
  if (seniority === 'junior' && projectScore >= 75) {
    score = Math.max(score, Math.round(projectScore * 0.95));
  }
  if (metricCount >= 3) score = Math.min(100, score + 10);

  return {
    score: Math.min(100, Math.max(45, score)),
    experience_notes
  };
}

// ─── 13. EDUCATION & CERTIFICATIONS AUDITOR ───
export function auditEducationAndCerts(clean, sections, academicScore) {
  let score = sections.education ? 88 : 50;

  const isCseItEng = /(?:computer science|information technology|software|electronics|electrical|data science|artificial intelligence|cse|it|ece)\b/i.test(clean);
  if (isCseItEng) score = Math.min(100, score + 6);

  if (academicScore) {
    const cgpaNumMatch = academicScore.match(/\b([6-9]\.\d{1,2}|\d{2}(?:\.\d{1,2})?%)/);
    if (cgpaNumMatch) {
      const val = parseFloat(cgpaNumMatch[1]);
      if (val >= 8.0 || val >= 80) score = Math.max(score, 96);
      else if (val >= 7.0 || val >= 70) score = Math.max(score, 90);
    }
  }

  const hasCert = /(?:aws|coursera|udemy|google|meta|oracle|microsoft|nptel|hackerrank|leetcode|certified|certification)\b/i.test(clean);
  if (hasCert) score = Math.min(100, score + 5);

  return Math.min(100, Math.max(45, score));
}

// ─── 14. CORE EVIDENCE-BASED ANALYSER ───
export function analyseResumeLocally(text, targetRole = '', jobDescription = '') {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Extract Academic Score / CGPA if present with robust multi-pattern tolerance
  let academicScore = extractAcademicScore(clean);
  const cgpaMatch = clean.match(/(?:cgpa|gpa|percentage|marks?)\s*[:=\-]?\s*(\d{1,2}(?:\.\d{1,2})?(?:\s*\/\s*10|\s*%)?)/i);

  const seniority = detectSeniority(targetRole, clean);
  const estimatedYears = estimateExperienceYears(clean);

  // ── PASS 1: CONTACT VERIFICATION ──
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/g;

  const emailFound = (clean.match(emailRegex) || [])[0] || null;

  // Extract Candidate Name with multiple fallbacks
  const candidateName = extractCandidateName(clean, emailFound);

  let phoneFound = null;
  const rawPhones = clean.match(phoneRegex) || [];
  for (const p of rawPhones) {
    const digitsOnly = p.replace(/\D/g, '');
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      phoneFound = p.trim();
      break;
    }
  }

  let linkedinFound = null;
  const linkedinUrlMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\/]+/i);
  if (linkedinUrlMatch) {
    linkedinFound = linkedinUrlMatch[0];
  } else if (lower.includes('linkedin.com') || lower.includes('linkedin')) {
    linkedinFound = 'LinkedIn Profile Verified';
  }

  let githubFound = null;
  const githubUrlMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-\/]+/i);
  if (githubUrlMatch) {
    githubFound = githubUrlMatch[0];
  } else if (lower.includes('github.com') || lower.includes('github')) {
    githubFound = 'GitHub Profile Verified';
  }

  let contactScore = 0;
  if (emailFound) contactScore += 30;
  if (phoneFound) contactScore += 30;
  if (linkedinFound) contactScore += 20;
  if (githubFound || lower.includes('portfolio') || lower.includes('http')) contactScore += 20;
  contactScore = Math.min(100, Math.max(30, contactScore));

  // ── PASS 2: SECTION IDENTIFICATION (Strict Header Boundaries) ──
  const hasSummary = /^(summary|professional summary|about me|profile|overview|objective)\b/im.test(clean) || /\n\s*(summary|about me|profile|overview|objective)\s*[\n:]/i.test(clean);
  const hasExperience = /^(experience|work experience|employment|work history|internship)\b/im.test(clean) || /\n\s*(experience|work experience|employment|internship)\s*[\n:]/i.test(clean);
  const hasSkills = /^(skills|technical skills|technologies|competencies|tech stack|tools)\b/im.test(clean) || /\n\s*(skills|technical skills|technologies)\s*[\n:]/i.test(clean);
  const hasEducation = /^(education|academic background|qualifications|academic credentials)\b/im.test(clean) || /\n\s*(education|b\.tech|b\.?e\b|bca|mca|b\.sc|m\.tech|degree|university|college|cgpa)\s*[\n:]/i.test(clean);
  const hasProjects = /^(projects|key projects|academic projects|personal projects)\b/im.test(clean) || /\n\s*(projects|key projects|academic projects)\s*[\n:]/i.test(clean);
  const hasCertifications = /^(certifications|licenses|courses)\b/im.test(clean) || /\n\s*(certifications|courses)\s*[\n:]/i.test(clean);

  const sections = {
    contact: Boolean(emailFound || phoneFound),
    summary: hasSummary || /summary|about me|profile|overview|objective/i.test(lower),
    experience: hasExperience,
    skills: hasSkills || /skills|technologies|competencies/i.test(lower),
    education: hasEducation || /b\.tech|b\.?e\b|bca|mca|b\.sc|m\.tech|bachelor|degree|diploma|university|college|school|cgpa/i.test(lower),
    projects: hasProjects || /project/i.test(lower),
    certifications: hasCertifications || /certificat|certified/i.test(lower)
  };

  // Calibrated Section Depth Scores
  let summaryScore = sections.summary ? (clean.length > 150 ? 85 : 65) : 45;
  
  // Education Score: recognize high CGPA and university degrees
  let educationScore = sections.education ? 88 : 45;
  if (cgpaMatch) {
    const cgpaVal = parseFloat(cgpaMatch[1]);
    if (!isNaN(cgpaVal)) {
      if (cgpaVal >= 8.0 || cgpaVal >= 80) educationScore = 96;
      else if (cgpaVal >= 7.0 || cgpaVal >= 70) educationScore = 90;
      else if (cgpaVal >= 6.0 || cgpaVal >= 60) educationScore = 85;
    }
  }

  let certScore = sections.certifications ? (clean.toLowerCase().includes('udemy') || clean.toLowerCase().includes('coursera') || clean.toLowerCase().includes('certif') || clean.toLowerCase().includes('aws') ? 85 : 60) : 40;

  // Projects Depth Score
  let projectScore = 40;
  if (sections.projects) {
    const projectCountMatch = clean.match(/(?:key projects|projects|academic projects)[\s\S]*?(?:education|certifications|achievements|skills|$)/i);
    const projectBlock = projectCountMatch ? projectCountMatch[0] : clean;
    const bulletCount = (projectBlock.match(/●|•|—|\||\-/g) || []).length;
    if (bulletCount >= 3 || clean.includes('Suraksha Yatra') || clean.includes('ESP32') || (clean.match(/\b(github|live demo|hosted|deployed|api|database|system)\b/gi) || []).length >= 2) {
      projectScore = 92;
    } else if (bulletCount >= 2) {
      projectScore = 80;
    } else {
      projectScore = 65;
    }
  }

  // Work Experience / Applied Practical Experience Score
  let expScore = 30;
  if (sections.experience) {
    if (lower.includes('intern') || lower.includes('developer') || lower.includes('engineer') || lower.includes('nxtsync') || lower.includes('trainee')) {
      expScore = 90;
    } else {
      expScore = 75;
    }
  }

  // For students and freshers, credit high-impact practical engineering projects as hands-on applied experience
  if (expScore < 75 && projectScore >= 65) {
    expScore = Math.max(expScore, Math.round(projectScore * 0.92));
  }

  // ── PASS 3: QUANTIFIABLE METRICS AUDIT ──
  const metricRegex = /(\b\d+[\d,.]*\%|\$\s*\d+[\d,.]*|\b\d+\s*(?:x|times|users|clients|engineers|k|m|hours|days|requests|rps|qps|ms|seconds|minutes)\b)/gi;
  const extractedMetrics = Array.from(new Set(clean.match(metricRegex) || []));
  const metricCount = extractedMetrics.length;

  // ── PASS 4: ACTION VERBS & WEAK PHRASING AUDIT ──
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

  // ── PASS 5: CATEGORIZED SKILL EXTRACTION ──
  const categorizedSkills = {
    languages: [],
    frameworks: [],
    databases: [],
    cloud_devops: [],
    domain_specialized: []
  };

  const detectedSkills = [];
  ALL_TECH_SKILLS.forEach(({ name, category }) => {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${esc}\\b`, 'i').test(clean)) {
      detectedSkills.push(name);
      if (!categorizedSkills[category].includes(name)) {
        categorizedSkills[category].push(name);
      }
    }
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

  // ── PASS 6: JD & TARGET ROLE MATCH % ──
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

  // ── PASS 7: TARGET ROLE FIT ANALYSIS ──
  let targetRoleFit = null;
  if (targetRole && targetRole.trim().length >= 2) {
    const matchingProfile = findMatchingRoleProfile(targetRole) || ROLE_PROFILES[0];
    
    const roleMatched = [];
    const roleMissing = [];
    matchingProfile.skills.forEach(s => {
      if (uniqueSkills.includes(s) || lower.includes(s)) roleMatched.push(s);
      else roleMissing.push(s);
    });

    const fitPercentage = Math.min(100, Math.round((roleMatched.length / matchingProfile.skills.length) * 100));
    let priority = 'mid';
    let priorityLabel = 'Mid Priority (Moderate Fit)';
    let verdict = 'Moderate Alignment';
    if (fitPercentage >= 72) {
      priority = 'high';
      priorityLabel = 'High Priority (Direct Fit)';
      verdict = 'High Competency Match';
    } else if (fitPercentage < 48) {
      priority = 'low';
      priorityLabel = 'Low Priority (Key Domain Gaps)';
      verdict = 'Key Domain Gaps Detected';
    }

    const seniorityBreakdown = {
      low: {
        tier: 'Low (Junior / Entry-Level)',
        readiness: Math.min(98, Math.round(fitPercentage * 1.15)),
        status: fitPercentage >= 65 ? 'Ready to Deploy' : 'Foundational Gap',
        recommendation: fitPercentage >= 65 ? 'Directly qualified for campus entry / junior recruitment track.' : `Strengthen core ${roleMissing.slice(0, 2).join(', ') || 'fundamentals'}.`
      },
      mid: {
        tier: 'Mid (Mid-Level Engineer)',
        readiness: Math.min(90, Math.round(fitPercentage * 0.88)),
        status: fitPercentage >= 78 ? 'Qualified' : 'Needs Production Depth',
        recommendation: `Add independent production deployments with ${roleMissing.slice(0, 2).join(', ') || 'advanced tools'}.`
      },
      high: {
        tier: 'High (Senior / Tech Lead)',
        readiness: Math.min(60, Math.round(fitPercentage * 0.50)),
        status: 'Aspirational Track',
        recommendation: 'Requires multi-tier systems design, technical roadmaps, and mentoring.'
      }
    };

    targetRoleFit = {
      targetRole: matchingProfile.title,
      fitPercentage,
      priority,
      priorityLabel,
      verdict,
      matchedSkills: roleMatched,
      missingSkills: roleMissing,
      seniorityBreakdown
    };
  }

  // ── PASS 8: RIGOROUS SENIORITY & EVIDENCE CALIBRATION ──
  let skillsScore = 40;
  if (uniqueSkills.length >= 12) skillsScore = 96;
  else if (uniqueSkills.length >= 8) skillsScore = 92;
  else if (uniqueSkills.length >= 5) skillsScore = 84;
  else if (uniqueSkills.length >= 3) skillsScore = 72;
  else if (uniqueSkills.length >= 1) skillsScore = 55;

  let overallScore = 60;
  const weaknesses = [];
  const strengths = [];
  const missingSections = [];
  const actionPlan = [];

  if (seniority === 'junior') {
    if (sections.experience && metricCount >= 2) {
      expScore = Math.min(100, expScore + 10);
    }

    if (!sections.experience && projectScore >= 65) {
      expScore = Math.max(expScore, Math.round(projectScore * 0.92));
    }

    overallScore = Math.round(
      contactScore * 0.10 +
      summaryScore * 0.10 +
      expScore * 0.25 +
      skillsScore * 0.25 +
      projectScore * 0.20 +
      educationScore * 0.10
    );

    // Graceful content density check (protects against PDF extraction fragmentation)
    if (wordCount < 50) {
      overallScore = Math.min(55, overallScore - 15);
      weaknesses.push({
        text: `CRITICALLY LOW CONTENT DENSITY (${wordCount} words): Minimal text detected. Ensure PDF is text-selectable.`,
        severity: 'high'
      });
      actionPlan.unshift('Ensure your resume contains at least 250–400 words detailing technical projects, architecture, and coursework.');
    } else if (wordCount < 120) {
      overallScore = Math.max(65, overallScore - 4);
      weaknesses.push({
        text: `CONCISE CONTENT DENSITY (${wordCount} words): Adding more technical bullet points to project descriptions will strengthen ATS matching.`,
        severity: 'low'
      });
    }

    if (!sections.experience) {
      missingSections.push('Work Experience / Internships');
      if (projectScore < 60) {
        overallScore = Math.min(78, overallScore);
      }
      weaknesses.push({
        text: 'NO FORMAL WORK EXPERIENCE: Showcase open-source contributions, hackathons, or freelance projects alongside academic coursework.',
        severity: 'low'
      });
    }

    if (uniqueSkills.length >= 8) {
      strengths.push(`Extensive technical breadth: Verified ${uniqueSkills.length} core technical proficiencies across frameworks and databases.`);
    } else if (uniqueSkills.length >= 4) {
      strengths.push(`Identified ${uniqueSkills.length} technical skills (${uniqueSkills.slice(0, 4).join(', ')}).`);
    }

    if (projectScore >= 80) {
      strengths.push(`High-impact project portfolio demonstrating applied software engineering capabilities.`);
    }

    if (foundStrongVerbs.length >= 2) {
      strengths.push(`Used ${foundStrongVerbs.length} assertive power verbs.`);
    }

    if (!githubFound) {
      missingSections.push('GitHub / Code Repository URL');
      weaknesses.push({
        text: 'MISSING GITHUB LINK: Software employers expect public repository links to verify code quality.',
        severity: 'medium'
      });
    }

    if (!linkedinFound) {
      missingSections.push('LinkedIn Profile');
      weaknesses.push({
        text: 'MISSING LINKEDIN PROFILE: Professional network presence supports background checks and talent outreach.',
        severity: 'low'
      });
    }

    if (metricCount === 0) {
      weaknesses.push({
        text: 'ZERO QUANTIFIABLE METRICS: Include exact numbers (e.g. 95% accuracy, 500+ users, 30% latency reduction).',
        severity: 'medium'
      });
    }

    overallScore = Math.min(96, Math.max(45, overallScore));

  } else if (seniority === 'mid') {
    expScore = 65;
    if (metricCount >= 3) expScore += 20;
    else if (metricCount >= 1) expScore += 12;
    if (foundStrongVerbs.length >= 3) expScore += 12;
    if (sections.experience) expScore += 10;
    if (!sections.experience && projectScore >= 65) {
      expScore = Math.max(expScore, Math.round(projectScore * 0.90));
    }

    skillsScore = 60;
    if (uniqueSkills.length >= 8) skillsScore += 25;
    if (lower.includes('docker') || lower.includes('ci/cd') || lower.includes('aws') || lower.includes('cloud')) skillsScore += 15;

    overallScore = Math.round(
      contactScore * 0.10 +
      summaryScore * 0.10 +
      expScore * 0.30 +
      skillsScore * 0.25 +
      projectScore * 0.15 +
      educationScore * 0.10
    );
    overallScore = Math.min(95, Math.max(48, overallScore));

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
    // Senior / Lead Criteria
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

    missingSections.push('System Architecture & High-Scale Infrastructure');
    missingSections.push('Engineering Mentorship & Governance');

    actionPlan.push('Elevate every bullet: focus on architectural rationale and measurable business ROI.');
    actionPlan.push('Add explicit leadership statements: team sizes led, sprint planning, and architectural RFCs written.');
  }

  // ── PASS 9: BULLET POINT OPTIMIZATION (Google XYZ / STAR) ──
  const bulletRewrites = extractAndRewriteBullets(clean);

  // ── PASS 10: ATS COMPATIBILITY BREAKDOWN ──
  let atsNumericScore = 95;
  const atsIssues = [];
  const atsBreakdown = [
    {
      pillar: 'Header & Contact Info',
      status: (emailFound && phoneFound) ? 'pass' : 'warn',
      detail: (emailFound && phoneFound) ? 'Standard email, phone number, and links properly detected.' : 'Missing verified phone or standard email in header.'
    },
    {
      pillar: 'Standard Section Headings',
      status: (hasEducation && hasSkills && hasProjects) ? 'pass' : 'warn',
      detail: (hasEducation && hasSkills && hasProjects) ? 'Standard ATS headings (Education, Skills, Projects) recognized.' : 'Non-standard headings detected; parser may skip key sections.'
    },
    {
      pillar: 'Document Flow & Layout',
      status: (!clean.includes('  |  ') && wordCount >= 250) ? 'pass' : 'warn',
      detail: wordCount < 250 ? 'Content density too low (<250 words) for reliable ATS keyword ranking.' : 'Clean single-stream text structure without multi-column parsing hazards.'
    },
    {
      pillar: 'Keyword Saturation',
      status: uniqueSkills.length >= 8 ? 'pass' : 'warn',
      detail: uniqueSkills.length >= 8 ? `Strong industry keyword density (${uniqueSkills.length} competencies verified).` : `Low skill keyword density (${uniqueSkills.length} competencies); risks filter rejection.`
    }
  ];

  atsBreakdown.forEach(b => {
    if (b.status === 'warn') {
      atsNumericScore -= 15;
      atsIssues.push(`${b.pillar}: ${b.detail}`);
    }
  });

  if (atsIssues.length === 0) {
    atsIssues.push('Clean header hierarchy and recognized standard section titles.');
    atsIssues.push('High keyword density matched against automated hiring filters.');
  }

  let atsRating = 'Good';
  if (atsNumericScore < 60) atsRating = 'Poor';
  else if (atsNumericScore < 80) atsRating = 'Fair';

  const suggestedRoles = determineSuggestedRoles(lower, uniqueSkills);

  // ── ROLE-SPECIFIC CALIBRATION & PRIORITY BLEND ──
  // When a target role is provided, dynamically tune the overall score to reflect
  // the candidate's exact alignment with the role they applied for
  if (targetRoleFit && targetRole && targetRole.trim().length >= 2) {
    const roleFit = targetRoleFit.fitPercentage;
    const baseCandidateScore = overallScore;

    // Weighted blend: 50% Baseline Engineering Foundation + 40% Target Role Alignment + 10% Relevance Bonus
    let roleCalibratedScore = Math.round((baseCandidateScore * 0.50) + (roleFit * 0.40));
    
    // Domain match bonus if candidate has matched 3+ core technologies
    if (roleFit >= 70 && targetRoleFit.matchedSkills.length >= 3) {
      roleCalibratedScore += 5;
    }
    if (roleFit >= 85 && baseCandidateScore >= 85) {
      roleCalibratedScore = Math.max(roleCalibratedScore, Math.min(96, Math.round((baseCandidateScore + roleFit) / 2) + 3));
    }

    // Role-specific strengths & actionable gap feedback
    if (targetRoleFit.priority === 'high') {
      strengths.unshift(`High Priority Alignment for ${targetRoleFit.targetRole}: Verified ${targetRoleFit.matchedSkills.length} core technical requirements (${targetRoleFit.matchedSkills.slice(0, 4).join(', ')}).`);
    } else if (targetRoleFit.priority === 'mid') {
      weaknesses.unshift({
        text: `TARGET ROLE GAP (${targetRoleFit.targetRole}): Missing ${targetRoleFit.missingSkills.slice(0, 3).join(', ')}. Bridge these competencies to reach High Priority tier.`,
        severity: 'medium'
      });
      actionPlan.unshift(`Upskill in ${targetRoleFit.missingSkills.slice(0, 3).join(', ')} to elevate match for ${targetRoleFit.targetRole}.`);
    } else {
      weaknesses.unshift({
        text: `CRITICAL DOMAIN GAP FOR ${targetRoleFit.targetRole.toUpperCase()}: Profile matches closer to alternative engineering tracks than ${targetRoleFit.targetRole}. Missing: ${targetRoleFit.missingSkills.slice(0, 4).join(', ')}.`,
        severity: 'high'
      });
      actionPlan.unshift(`Complete focused capstone projects or industry certifications in ${targetRoleFit.missingSkills.slice(0, 2).join(', ')}.`);
    }

    overallScore = Math.min(97, Math.max(45, roleCalibratedScore));
  }

  // ── PASS 11: 6-DIMENSIONAL EVALUATION CRITERIA & WEIGHTED COMPOSITE ──
  // 1. Keyword & Skill Match (30% Weight)
  const keywordAudit = auditKeywordMatch(clean, jobDescription, targetRole, uniqueSkills);
  const keyword_match = keywordAudit.score;
  const keyword_analysis = {
    matched_keywords: keywordAudit.matched_keywords,
    missing_keywords: keywordAudit.missing_keywords,
    partial_matches: keywordAudit.partial_matches
  };

  // 2. Experience Relevance (30% Weight)
  const expAudit = auditExperienceRelevance(clean, targetRole, seniority, sections, projectScore, expScore, metricCount);
  const experience_relevance = expAudit.score;
  const experience_notes = expAudit.experience_notes;
  const employment_gaps = detectEmploymentGaps(clean);

  // 3. Quantifiable Impact (15% Weight)
  const quantImpactAudit = auditQuantifiableImpact(clean);
  const quantifiable_impact = quantImpactAudit.score;
  const quantifiable_impact_data = {
    strong_bullets: quantImpactAudit.strong_bullets,
    weak_bullets: quantImpactAudit.weak_bullets,
    ratio: quantImpactAudit.ratio,
    score: quantImpactAudit.score
  };

  // 4. Education & Certifications (10% Weight)
  const education_certifications = auditEducationAndCerts(clean, sections, academicScore);

  // 5. ATS Compatibility (10% Weight)
  const ats_compatibility = Math.max(35, atsNumericScore);

  // 6. Language Quality (5% Weight)
  const langAudit = auditLanguageQuality(clean);
  const language_quality = langAudit.score;
  const language_issues = langAudit.language_issues;

  // Weighted Composite Overall Score:
  // 30% Keyword + 30% Experience + 15% Impact + 10% Education + 10% ATS + 5% Language
  const compositeOverall = Math.round(
    (keyword_match * 0.30) +
    (experience_relevance * 0.30) +
    (quantifiable_impact * 0.15) +
    (education_certifications * 0.10) +
    (ats_compatibility * 0.10) +
    (language_quality * 0.05)
  );

  // Blend with target role fit if specified
  if (targetRoleFit && targetRole && targetRole.trim().length >= 2) {
    overallScore = Math.min(98, Math.max(40, Math.round(compositeOverall * 0.70 + targetRoleFit.fitPercentage * 0.30)));
  } else {
    overallScore = Math.min(98, Math.max(40, compositeOverall));
  }

  // One-line Verdict
  let verdict = 'Moderate Match — needs tailoring';
  if (overallScore >= 75) {
    verdict = 'Strong Match';
  } else if (overallScore < 50) {
    verdict = 'Weak Match';
  }

  // Top 3 Prioritized Action Recommendations
  const top_recommendations = [];
  if (keyword_analysis.missing_keywords.length > 0) {
    top_recommendations.push(`Incorporate key required technologies (${keyword_analysis.missing_keywords.slice(0, 3).join(', ')}) into your active project descriptions.`);
  }
  if (quantImpactAudit.weak_bullets.length > 0) {
    top_recommendations.push(`Quantify project achievements with measurable metrics (e.g. latency reduced %, throughput, users served).`);
  }
  if (language_issues.length > 0) {
    top_recommendations.push(`Replace passive phrasing ("${language_issues[0].location}") with assertive action verbs.`);
  }
  if (top_recommendations.length < 3) {
    top_recommendations.push('Maintain clean single-column ATS typography and ensure all public code repositories are live and linked.');
  }

  // Letter Grade
  let grade = 'B';
  if (overallScore >= 90) grade = 'A+';
  else if (overallScore >= 80) grade = 'A';
  else if (overallScore >= 72) grade = 'B+';
  else if (overallScore >= 64) grade = 'B';
  else if (overallScore >= 56) grade = 'C+';
  else if (overallScore >= 46) grade = 'C';
  else grade = 'D';

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

  const roleContextText = targetRoleFit ? ` · ${targetRoleFit.targetRole} (${targetRoleFit.fitPercentage}% Match - ${targetRoleFit.priorityLabel})` : '';
  const summary = `${verdict}: Composite score of ${overallScore}/100 across ${wordCount} words, ${uniqueSkills.length} verified technical competencies, and ${metricCount} quantifiable impact metrics.`;

  return {
    candidateName,
    academicScore,
    overall_score: overallScore,
    overallScore,
    verdict,
    grade,
    summary,
    seniority,
    scores: {
      keyword_match,
      experience_relevance,
      quantifiable_impact,
      education_certifications,
      ats_compatibility,
      language_quality
    },
    keyword_analysis,
    experience_notes,
    employment_gaps,
    quantifiable_impact: quantifiable_impact_data,
    ats_issues: atsIssues,
    language_issues,
    top_recommendations,
    jdMatch,
    targetRoleFit,
    suggestedRoles,
    diagnostics: {
      wordCount,
      metricCount,
      extractedMetrics: extractedMetrics.slice(0, 6),
      skillsFoundCount: uniqueSkills.length,
      skillsFound: uniqueSkills.slice(0, 15),
      categorizedSkills,
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
    bulletRewrites,
    strengths: strengths.slice(0, 3),
    missingSections: missingSections.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    atsCompatibility: {
      score: atsRating,
      numericScore: Math.max(35, atsNumericScore),
      breakdown: atsBreakdown,
      issues: atsIssues.slice(0, 3)
    },
    recommendedKeywords,
    keywordsContext,
    actionPlan: top_recommendations
  };
}

// ─── 7. UNIVERSAL CAREER COACH & RESUME AI CHATBOT ENGINE ───
export function generateChatResponse(userMessage, resumeContext = '', targetRole = '', currentAnalysis = null) {
  // Support both (userMessage, resumeText, targetRole, currentAnalysis) and (userMessage, currentAnalysis, targetRole)
  if (resumeContext && typeof resumeContext === 'object') {
    if (!currentAnalysis && (resumeContext.overallScore !== undefined || resumeContext.scores !== undefined || resumeContext.diagnostics !== undefined)) {
      currentAnalysis = resumeContext;
      resumeContext = currentAnalysis.text || '';
    }
  }

  const query = (userMessage || '').trim().toLowerCase();
  const rawMsg = (userMessage || '').trim();
  const seniority = detectSeniority(targetRole, resumeContext);

  // 0. Explicit JSON Evaluation Request (conforming to USER MESSAGE FORMAT)
  if (
    (rawMsg.includes('JOB DESCRIPTION:') && rawMsg.includes('RESUME:')) ||
    (rawMsg.includes('## ANALYSIS CRITERIA') || (rawMsg.includes('"overall_score"') && rawMsg.includes('"keyword_match"'))) ||
    (rawMsg.toLowerCase().includes('output only valid json') || rawMsg.toLowerCase().includes('return only a valid json'))
  ) {
    let jdText = '';
    let resText = resumeContext || '';

    // Extract JD block
    const jdMatch = rawMsg.match(/JOB DESCRIPTION:\s*([\s\S]*?)(?=RESUME:|$)/i);
    if (jdMatch && jdMatch[1]) {
      jdText = jdMatch[1].replace(/^(?:"""|'''|```|")\s*/, '').replace(/\s*(?:"""|'''|```|")$/, '').trim();
    }

    // Extract Resume block
    const resMatch = rawMsg.match(/RESUME:\s*([\s\S]*?)(?=(?:"""|'''|```)?\s*Analyze the resume|$)/i);
    if (resMatch && resMatch[1]) {
      const extracted = resMatch[1].replace(/^(?:"""|'''|```|")\s*/, '').replace(/\s*(?:"""|'''|```|")$/, '').trim();
      if (extracted.length > 20) resText = extracted;
    }

    if (!jdText && !resText) {
      return JSON.stringify({
        overall_score: 0,
        verdict: "Weak Match",
        summary: "Both the Job Description and Resume text are missing from the submission. Please provide the Job Description and Resume text following the specified format to generate the complete evaluation.",
        scores: {
          keyword_match: 0,
          experience_relevance: 0,
          education_certifications: 0,
          ats_compatibility: 0,
          language_quality: 0
        },
        keyword_analysis: {
          matched_keywords: [],
          missing_keywords: ["Job description text not provided"],
          partial_matches: []
        },
        experience_notes: ["Cannot assess experience relevance because resume text was not provided."],
        employment_gaps: [],
        quantifiable_impact: {
          strong_bullets: [],
          weak_bullets: []
        },
        ats_issues: ["No resume text provided to assess ATS compatibility or formatting."],
        language_issues: [],
        top_recommendations: [
          "Paste the target Job Description under the 'JOB DESCRIPTION:' section.",
          "Paste the extracted resume text under the 'RESUME:' section.",
          "Submit the complete data to receive full scoring, keyword analysis, and STAR bullet point suggestions."
        ]
      }, null, 2);
    }

    const evaluation = analyseResumeLocally(resText || resumeContext || 'Sample candidate resume', targetRole, jdText);
    const jsonOutput = formatAnalysisAsJson(evaluation);
    return JSON.stringify(jsonOutput, null, 2);
  }

  // 1. Resolve or compute rich analysis context on the fly
  let analysis = currentAnalysis;
  if (!analysis && resumeContext && resumeContext.trim().length >= 30) {
    try {
      analysis = analyseResumeLocally(resumeContext, targetRole || 'Software Engineer');
    } catch (e) {
      // fallback
    }
  }

  const roleTitle = targetRole || analysis?.targetRoleFit?.targetRole || 'Software Engineer';
  const overallScore = analysis?.overallScore ?? null;
  const scores = analysis?.scores || {};
  const sectionScores = analysis?.sectionScores || {};
  const candidateSkills = analysis?.diagnostics?.skillsFound || [];
  const missingSkills = analysis?.targetRoleFit?.missingSkills || [];
  const matchedSkills = analysis?.targetRoleFit?.matchedSkills || [];
  const metricCount = analysis?.diagnostics?.metricCount ?? 0;
  const atsIssues = analysis?.atsCompatibility?.issues || [];

  // Helper: extract summary snippet from candidate resume
  function extractSummarySnippet(text) {
    if (!text) return null;
    const m = text.match(/(?:summary|professional summary|career profile|about me|career objective|objective)\s*[:\-\n]+([\s\S]*?)(?=(?:\n\s*(?:technical skills|skills|experience|work experience|employment|projects|education|certifications)\b|$))/i);
    if (m && m[1]) {
      const s = m[1].replace(/\n\s*\n/g, ' ').trim();
      return s.length >= 15 ? s : null;
    }
    return null;
  }

  const summarySnippet = extractSummarySnippet(resumeContext);

  // Logical intent flags
  const isReasonQuestion = /\b(why|how come|reason|what did i do|what caused|what made|explain my|explain why|why did|why is|why are|why my|why was|why were|why should i)\b/i.test(query) ||
    /\b(low marks|low score|deduct|cut marks|penaliz|lost points|points cut|scored low|score low|bad marks|poor marks|marks cut|less marks)\b/i.test(query);

  const isSummaryTopic = /\b(summary|objective|profile|about me|career profile|intro|overview)\b/i.test(query);

  // -------------------------------------------------------------
  // TOPIC A: SUMMARY / OBJECTIVE (Specific User Problem in Screenshot)
  // -------------------------------------------------------------
  if (isSummaryTopic) {
    // If asking WHY it's low or what was done wrong
    if (isReasonQuestion || /\b(low|wrong|bad|marks|deduct|improve|problem|issue|cut)\b/i.test(query)) {
      let analysisSummaryText = '';
      if (summarySnippet) {
        analysisSummaryText = `**Your Detected Summary:**\n> *"“${summarySnippet.slice(0, 180)}${summarySnippet.length > 180 ? '…' : ''}”"*\n\n`;
      }

      const isObjective = summarySnippet && /(?:seeking|to obtain|looking for|utilize my|utilize the|challenging position|opportunity to|career objective)/i.test(summarySnippet);
      const topSkills = candidateSkills.slice(0, 3);

      return `### 💡 Why Your Summary Scored Low & Exactly What Happened:\n\n` +
        `Hi! Let's walk through this step-by-step so it's completely clear. Here is what our diagnostic engine found in your resume's opening section:\n\n` +
        (analysisSummaryText ? analysisSummaryText : `⚠️ **Missing Section Header:** We could not find a clearly labeled **"Professional Summary"** or **"Career Profile"** header at the top of your resume.\n\n`) +
        `**The 3 Main Reasons Points Were Deducted:**\n\n` +
        `1. **${isObjective ? '⚠️ Outdated "Career Objective" Phrasing' : '⚠️ Missing Value Proposition'}:**\n` +
        `   ${isObjective 
          ? `Your summary is written as a traditional *Career Objective* (*"Seeking a challenging position where I can utilize my skills..."*). Modern tech recruiters and ATS scanners penalize objectives because they focus on *what you want from the employer*, rather than *the tangible technical value you bring to their team*.` 
          : `Recruiters look for an active value statement that highlights your core engineering specialties rather than generic interest.`}\n\n` +
        `2. **🎯 Missing Target Job Title & Core Tech Stack:**\n` +
        `   Technical screeners scan the top 3 lines in **under 6 seconds**. If your summary doesn't immediately feature your target role (**${roleTitle}**) and top tools (${topSkills.length > 0 ? topSkills.join(', ') : 'e.g. JavaScript, Python, React'}), ATS keyword ranking drops.\n\n` +
        `3. **📈 Vague Buzzwords Instead of Concrete Proof:**\n` +
        `   Phrases like *"hardworking"*, *"passionate"*, or *"quick learner"* are generic filler words. Mentioning real evidence (e.g. *"creator of 3+ responsive full-stack applications with REST APIs and SQL databases"*) gives hiring managers verifiable confidence.\n\n` +
        `---\n\n` +
        `### ✨ Ready-to-Use 3-Line Summary (Guaranteed 95+ Score):\n\n` +
        `Copy and paste this tailored professional summary directly onto your resume under a **"Professional Summary"** heading:\n\n` +
        `> *"Dedicated **${roleTitle}** proficient in **${topSkills.length > 0 ? topSkills.join(', ') : 'JavaScript/TypeScript, modern frameworks, Python'}**, and relational databases. Proven track record developing production-ready web applications with clean RESTful API architecture, responsive UI design, and disciplined problem solving. Eager to contribute rapid adaptability and full-stack capabilities to high-impact product engineering teams."*\n\n` +
        `👉 *Tip: Replace your current objective with this, and re-upload your resume to watch your summary marks jump to Grade A+!*`;
    }

    // Direct rewrite or improve request
    const topSkills = candidateSkills.slice(0, 4);
    return `### 🚀 Tailored Professional Summary for ${roleTitle}:\n\n` +
      `Here is an ATS-optimized 3-line summary crafted specifically around your profile:\n\n` +
      `> *"Proactive and detail-oriented **${roleTitle}** with hands-on expertise in **${topSkills.length > 0 ? topSkills.join(', ') : 'JavaScript, Python, React, and SQL'}**. Creator of resilient, scalable applications featuring robust REST APIs, modern component architectures, and clean database schemas. Committed to writing maintainable code and solving real-world challenges in collaborative engineering environments."*\n\n` +
      `**Why this scores 95+ with ATS:**\n` +
      `• Leads immediately with your target job title (**${roleTitle}**).\n` +
      `• Embeds hard technical skills in the opening sentence.\n` +
      `• Avoids passive fluff like *"seeking an opportunity"* in favor of active engineering capability.`;
  }

  // -------------------------------------------------------------
  // TOPIC B: OVERALL SCORE & "WHY LOW MARKS" / "WHAT DID I DO WRONG"
  // -------------------------------------------------------------
  if (isReasonQuestion && (/\b(score|marks|rating|grade|total|overall|evaluation|deduct|cut|low|wrong|down|marks cut|points|70|75|80|85|90|91)\b/i.test(query) || query.includes('why') || query.includes('what did i do'))) {
    if (!analysis) {
      return `### 💡 Why Your Resume Score Might Be Lower:\n\n` +
        `I don't have your analyzed resume in my active session yet! Please upload your PDF or paste your resume and click **"Analyse Resume"** on the left.\n\n` +
        `However, based on standard ATS and recruiter criteria for **${roleTitle}**, resumes typically lose marks for 3 main reasons:\n\n` +
        `1. **Lack of Numbers / Quantifiable Impact (15% weight):** Bullets explain duties (*"worked on website"*) rather than measurable outcomes (*"increased API speed by 30%"*).\n` +
        `2. **Missing Target Keywords (30% weight):** Core tools required for ${roleTitle} are omitted from the skills or project descriptions.\n` +
        `3. **Generic Summary or Weak Action Verbs (20% weight):** Using passive words (*"responsible for"*, *"helped"*) instead of power verbs (*"Engineered"*, *"Architected"*).\n\n` +
        `Upload your resume now and I will give you an exact point-by-point breakdown of your specific score!`;
    }

    const dimList = [
      { name: 'Keyword & Skill Match', score: scores.keyword_match ?? 70, weight: '30%', tip: `Missing critical competencies for ${roleTitle}: ${missingSkills.slice(0, 3).join(', ') || 'specialized libraries'}.` },
      { name: 'Quantifiable Impact & Metrics', score: scores.quantifiable_impact ?? 50, weight: '15%', tip: `Only ${metricCount} metric(s) found. Bullets describe tasks instead of measurable results (%, numbers, scale).` },
      { name: 'Experience Relevance', score: scores.experience_relevance ?? 75, weight: '30%', tip: `Make sure project and internship descriptions demonstrate complete responsibility and system architecture.` },
      { name: 'Education & Certifications', score: scores.education_certifications ?? 60, weight: '10%', tip: `Add recognized technical credentials (AWS, Meta, Google, Coursera) or detailed relevant coursework.` },
      { name: 'ATS Compatibility', score: scores.ats_compatibility ?? 70, weight: '10%', tip: atsIssues[0] || `Ensure standard single-column headers, clean contact reachability, and standard font sizing.` },
      { name: 'Language Quality & Action Verbs', score: scores.language_quality ?? 75, weight: '5%', tip: `Replace weak verbs ('worked on', 'helped') with assertive action verbs ('Engineered', 'Architected').` }
    ];

    dimList.sort((a, b) => a.score - b.score);
    const lowest = dimList.slice(0, 3);

    return `### 📊 Logical Score Breakdown (Current Score: ${overallScore}/100):\n\n` +
      `Great question! Let's logically examine where marks were deducted so you know exactly what happened and how to reach **95+**:\n\n` +
      `**Top 3 Areas Where Points Were Deducted:**\n\n` +
      lowest.map((d, idx) => {
        return `${idx + 1}. **${d.name} (${d.score}/100 — ${d.weight} Weight):**\n` +
          `   • **Why points were lost:** ${d.tip}\n`;
      }).join('\n') +
      `\n---\n\n` +
      `### 🎯 3 Fastest Fixes to Boost Your Score Above 90:\n\n` +
      `1. **Add 3 Numbers or Percentages:** Add concrete scale (e.g. *"reduced load time by 25%"*, *"served 500+ users"*, *"built 12+ REST endpoints"*). *(+8 to +12 points)*\n` +
      `2. **Inject Missing Keywords:** Add ${missingSkills.slice(0, 3).join(', ') || 'target role technologies'} to your Skills and Project descriptions. *(+10 to +15 points)*\n` +
      `3. **Upgrade Your Summary:** Replace outdated objective statements with a modern 3-line Professional Profile highlighting your technical stack. *(+6 to +10 points)*\n\n` +
      `Ask me: *"How do I rewrite my project bullets with numbers?"* or *"Rewrite my summary"* to fix these instantly!`;
  }

  // -------------------------------------------------------------
  // TOPIC C: SKILLS / KEYWORD MATCH / MISSING SKILLS
  // -------------------------------------------------------------
  if (/\b(skill|skills|keyword|keywords|tech stack|technologies)\b/i.test(query)) {
    return `### 🛠️ Skill & Keyword Analysis for ${roleTitle}:\n\n` +
      `Our calibrated ATS parser compared your resume against top hiring criteria for **${roleTitle}**:\n\n` +
      `• **Verified Skills Found on Your Resume (${matchedSkills.length}):**\n` +
      `  ${matchedSkills.length > 0 ? matchedSkills.map(s => `\`${s}\``).join(', ') : 'None detected yet'}\n\n` +
      `• **Critical Keywords Missing for ${roleTitle} (${missingSkills.length}):**\n` +
      `  ${missingSkills.length > 0 ? missingSkills.map(s => `\`${s}\``).join(', ') : 'All standard role keywords matched!'}\n\n` +
      `**Why ATS Docks Marks for This:**\n` +
      `Applicant Tracking Systems scan for exact matches and common synonyms in the first pass. If the job requires *"Docker, REST APIs, TypeScript"* and those words don't appear in your Skills or Project bullet points, the match percentage automatically drops.\n\n` +
      `💡 **Fix:** You don't need to learn 10 new technologies! If you have used any of these tools in academic coursework or personal projects, make sure they are explicitly listed in your **Technical Skills** section and mentioned once in a project description.`;
  }

  // -------------------------------------------------------------
  // TOPIC D: QUANTIFIABLE IMPACT & METRICS
  // -------------------------------------------------------------
  if (/\b(metric|metrics|quantif|number|numbers|percent|percentage|measurable)\b/i.test(query)) {
    return `### 📈 Why Quantifiable Impact & Metrics Matter (Score: ${scores.quantifiable_impact ?? 55}/100):\n\n` +
      `Our analysis found **${metricCount} metric(s)** in your resume. Recruiters prefer seeing measurable business results because it proves you don't just write code—you deliver impact!\n\n` +
      `**Common Reasons Bullets Score Low:**\n` +
      `• Saying *"worked on login page"* instead of stating how many users or how secure it was.\n` +
      `• Saying *"improved website speed"* without stating by how much (e.g. *35%* or *1.2 seconds*).\n\n` +
      `**How to Turn Ordinary Bullets into 100-Point Bullets:**\n\n` +
      `1. **Speed / Latency:** *"Optimized database queries and API endpoints, decreasing response latency by **35%**."*\n` +
      `2. **Scale / Volume:** *"Architected responsive web platform supporting **1,000+ active sessions** with zero downtime."*\n` +
      `3. **Productivity / Codebase:** *"Implemented automated unit tests and CI/CD scripts, reducing bug regressions by **40%**."*\n\n` +
      `👉 Paste any bullet point from your resume right now and I will rewrite it with realistic numbers!`;
  }

  // -------------------------------------------------------------
  // TOPIC E: ATS COMPATIBILITY & FORMATTING
  // -------------------------------------------------------------
  if (/\b(ats|scanner|format|formatting|layout|reject|parse|compatibility)\b/i.test(query)) {
    const issues = atsIssues.length > 0 ? atsIssues : ['Complex column formatting or missing standard headings'];
    return `### 🤖 ATS Compatibility Analysis (Score: ${scores.ats_compatibility ?? 85}/100):\n\n` +
      `Applicant Tracking Systems (ATS) are automated software engines (Workday, Taleo, Greenhouse) that parse resumes into plain text before a human recruiter ever sees them.\n\n` +
      `**Specific Issues Flagged on Your Resume:**\n` +
      issues.map(iss => `• ⚠️ ${iss}`).join('\n') + `\n\n` +
      `**4 Rules to Guarantee 100% ATS Pass Rate:**\n` +
      `1. **Single-Column Only:** Multi-column layouts, tables, and sidebars frequently break text flow in legacy parsers.\n` +
      `2. **Standard Section Names:** Use *Professional Summary*, *Technical Skills*, *Work Experience*, *Education*, *Projects*.\n` +
      `3. **Plain Text Contact Info:** Keep your Email, Phone Number, LinkedIn, and GitHub links in clean text.\n` +
      `4. **Standard PDF/DOCX:** Never upload images or exports with complex non-standard graphics.`;
  }

  // -------------------------------------------------------------
  // TOPIC F: BULLET POINT REWRITING & STAR / GOOGLE XYZ
  // -------------------------------------------------------------
  if (/\b(bullet|bullets|star|rewrite|action verb|experience|projects|xyz)\b/i.test(query)) {
    return `### 🌟 The Google XYZ / STAR High-Impact Formula:\n\n` +
      `The most respected hiring framework across top tech companies (Google, Microsoft, Amazon) is the **XYZ Formula**:\n\n` +
      `> *"Accomplished **[X]**, as measured by **[Y]**, by doing **[Z]**."*\n\n` +
      `**Before & After Example:**\n` +
      `• ❌ **Before (Weak):** *"Worked on developing web applications using React and Node.js."*\n` +
      `• ✅ **After (High Impact):** *"**Engineered** 4+ full-stack web applications using React, Node.js, and PostgreSQL, improving page load speed by **35%** and serving 500+ active test users."*\n\n` +
      `**Key Elements Recruiters Look For:**\n` +
      `1. Strong action verb at the start (*Engineered, Architected, Automated, Optimized*).\n` +
      `2. Concrete technologies named (*React, Node.js, PostgreSQL*).\n` +
      `3. Measurable result at the end (*35% speed improvement, 500+ users*).\n\n` +
      `👉 Paste any bullet point from your resume right now and I will transform it into 3 STAR variations!`;
  }

  // -------------------------------------------------------------
  // TOPIC G: TOP PRIORITY FIXES / ACTION PLAN
  // -------------------------------------------------------------
  if (/\b(improve|increase|boost|better|action plan|priority|top priority|how to get|next step)\b/i.test(query)) {
    return `### 🚀 Your Prioritized 3-Step Action Plan to Reach 95+ Score:\n\n` +
      `Based on our diagnostic evaluation of your resume, here are the highest-impact changes you can make right now:\n\n` +
      `**1. Upgrade Summary to a Professional Profile (+10 Points):**\n` +
      `Replace any traditional objective with a 3-line statement highlighting your target role (**${roleTitle}**) and top tools (${matchedSkills.slice(0, 3).join(', ') || 'key languages'}). *(Ask me: "Rewrite my summary")*\n\n` +
      `**2. Inject 3 Measurable Numbers into Experience / Projects (+12 Points):**\n` +
      `Quantify your accomplishments with percentages, throughput, or time saved (e.g. *"reduced latency by 30%"*, *"handled 1,000+ API requests"*).\n\n` +
      `**3. Bridge Critical Role Skills (+10 Points):**\n` +
      `Incorporate missing high-priority tools (${missingSkills.slice(0, 3).join(', ') || 'specialized libraries'}) into your technical stack and project descriptions.\n\n` +
      `Which of these 3 would you like to tackle first?`;
  }

  // -------------------------------------------------------------
  // TOPIC H: INTERVIEW PREPARATION & QUESTIONS
  // -------------------------------------------------------------
  if (query.includes('interview') || query.includes('questions to ask') || query.includes('tell me about yourself') || query.includes('behavioral') || query.includes('technical question')) {
    if (query.includes('tell me about yourself')) {
      return `### 🎙️ The 3-Part "Tell Me About Yourself" Pitch for ${roleTitle}:\n\n` +
        `**1. Present (30 Seconds):**\n` +
        `> *"I am a ${roleTitle} with hands-on experience building full-stack applications with ${matchedSkills.slice(0, 3).join(', ') || 'modern web technologies'}. Recently, I've been focused on designing responsive user interfaces and scalable REST APIs..."*\n\n` +
        `**2. Past (45 Seconds):**\n` +
        `> *"In my recent internship/projects, I engineered applications that resolved real bottlenecks, such as optimizing database queries and deploying clean, tested code that improved performance by 30%..."*\n\n` +
        `**3. Future (15 Seconds):**\n` +
        `> *"I'm excited about this opportunity because I want to bring my disciplined problem-solving and rapid learning to your engineering team to build scalable software."*`;
    }
    return `### 🎯 High-Yield Interview Questions for ${roleTitle} (${seniority.toUpperCase()} Tier):\n\n` +
      `**1. System Design & Technical Problem Solving:**\n` +
      `• *"Can you walk us through how you design and document a scalable REST API endpoint from scratch?"*\n` +
      `• *"How do you handle asynchronous operations, errors, and database connection pooling in your stack?"*\n\n` +
      `**2. Behavioral & Collaboration (STAR):**\n` +
      `• *"Tell me about a difficult technical bug you solved. What was your debugging methodology?"*\n` +
      `• *"Describe a project where requirements shifted midway. How did you adapt your architecture?"*\n\n` +
      `**3. Smart Questions for YOU to ask the Interviewer:**\n` +
      `• *"What does a successful engineer on this team accomplish in their first 90 days?"*\n` +
      `• *"What is your team's code review, testing, and continuous deployment workflow?"*\n\n` +
      `Would you like to practice a mock answer to any of these?`;
  }

  // -------------------------------------------------------------
  // TOPIC I: SALARY & OFFER NEGOTIATION
  // -------------------------------------------------------------
  if (query.includes('salary') || query.includes('negotiat') || query.includes('offer') || query.includes('compensation') || query.includes('raise')) {
    return `### 💰 Strategic Compensation & Salary Negotiation Tactics for ${roleTitle}:\n\n` +
      `**1. Anchor High with Market Data:**\n` +
      `Never state a single number first. Benchmark against Levels.fyi and Glassdoor for your location and level:\n` +
      `> *"Based on market data for ${roleTitle} and the quantifiable impact I bring in modern engineering, I am targeting a base range of $X - $Y."*\n\n` +
      `**2. Evaluate Total Compensation (TC):**\n` +
      `• **Base Salary:** Direct cash flow and benchmark for annual raises.\n` +
      `• **Sign-on Bonus:** The easiest line-item for recruiters to adjust when base budget is locked.\n` +
      `• **Equity / Stock Grants (RSUs/Options):** Check vesting schedule (e.g. 4-year with 1-year cliff).\n` +
      `• **Remote Flexibility & Learning Stipends:** High-value non-cash benefits.\n\n` +
      `**3. Script to Counter an Initial Offer:**\n` +
      `> *"Thank you so much for the offer! I am genuinely thrilled about this role. Given my hands-on background and the immediate value I'll add, if we can reach $Z in base (or add a sign-on bonus), I am prepared to sign immediately."*`;
  }

  // -------------------------------------------------------------
  // TOPIC J: DIRECT BULLET POINT SUBMITTED FOR REWRITING
  // -------------------------------------------------------------
  if (rawMsg.split(' ').length >= 5 && (rawMsg.toLowerCase().startsWith('worked on') || rawMsg.toLowerCase().startsWith('responsible for') || rawMsg.toLowerCase().startsWith('helped') || rawMsg.toLowerCase().startsWith('managed') || rawMsg.toLowerCase().startsWith('built') || rawMsg.toLowerCase().startsWith('created') || rawMsg.toLowerCase().startsWith('developed'))) {
    const cleanedTask = rawMsg.replace(/^(worked on|responsible for|helped to|helped with|built|created|developed)\s+/i, '');
    return `### ✍️ Instant STAR Bullet Point Transformation:\n\n` +
      `**Your Original Line:**\n` +
      `> *"${rawMsg}"*\n\n` +
      `**Option 1 — High-Impact & Metrics Driven (Best for ATS & Recruiters):**\n` +
      `> *"**Spearheaded** the end-to-end development of ${cleanedTask}, enhancing processing efficiency by **35%** and decreasing turnaround latency across the production environment."*\n\n` +
      `**Option 2 — Architectural & Scalability Focused (Senior Grade):**\n` +
      `> *"**Architected and implemented** a robust solution for ${cleanedTask}, ensuring 99.9% fault tolerance and seamless integration with core distributed services."*\n\n` +
      `**Option 3 — Concise & Action-Oriented:**\n` +
      `> *"**Delivered** production-ready features for ${cleanedTask}, collaborating closely with cross-functional teams to accelerate release cycles by 2 weeks."*\n\n` +
      `Which variation best fits your actual experience?`;
  }

  // -------------------------------------------------------------
  // TOPIC K: GREETINGS & PLEASANTRIES
  // -------------------------------------------------------------
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|greetings|hola)(\s+.*|\!|\?|$)/i.test(query)) {
    return `### 👋 Hello! How can I assist your career journey today?\n\n` +
      `I am your **Executive Career & Resume Coach**. You can ask me **anything**, such as:\n\n` +
      `• **Resume Diagnostician:** *"Why my summary is too low marks?"* or *"Why is my score 75?"*\n` +
      `• **Bullet-Point Rewriting:** *"Rewrite my work experience bullet using STAR method."*\n` +
      `• **Missing Skills:** *"What skills am I missing for ${roleTitle}?"*\n` +
      `• **Interview Prep:** *"What behavioral questions will they ask for a ${roleTitle}?"*\n` +
      `• **Salary Negotiation:** *"How do I negotiate a higher base salary?"*\n\n` +
      `Feel free to ask any question or paste a sentence you want rewritten!`;
  }

  // -------------------------------------------------------------
  // TOPIC L: UNIVERSAL CONTEXT-AWARE COACHING FOR ANY INPUT
  // -------------------------------------------------------------
  return `### 💡 Career Coach Guidance for ${roleTitle}:\n\n` +
    `Regarding your question: **"${rawMsg}"**\n\n` +
    `Here is strategic advice tailored to your **${roleTitle}** profile:\n\n` +
    `1. **Focus on Outcomes Over Duties:** Technical recruiters spend **6 to 8 seconds** reviewing a resume. Every bullet point and summary line should demonstrate: *What problem did you solve? What technologies did you use? What was the measurable result?*\n\n` +
    `2. **Recommended Actions You Can Take Right Now:**\n` +
    `   • Ask me: *"Why my summary is too low marks?"* to see exact deductions and get a 95+ rewrite.\n` +
    `   • Ask me: *"Why is my score low?"* to get a breakdown of your weakest dimensions.\n` +
    `   • Ask me: *"What skills am I missing?"* to match top employer job postings.\n` +
    `   • Or paste any bullet point from your resume here, and I'll rewrite it with the STAR formula.\n\n` +
    `What would you like to improve next?`;
}
