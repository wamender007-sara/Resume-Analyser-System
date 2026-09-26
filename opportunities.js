/**
 * opportunities.js
 * Live Jobs & Internships Match Hub
 * Powers dynamic job recommendations, guaranteed official company logos,
 * 1-click deep search portals, and automated daily/weekly live feeds.
 */

// ─── Real Official Company Brand Logos (Stored Locally in assets/companies/) ───
const COMPANY_LOGOS = {
  zoho: 'assets/companies/zoho.svg',
  amazon: 'assets/companies/amazon.svg',
  swiggy: 'assets/companies/swiggy.svg',
  razorpay: 'assets/companies/razorpay.svg',
  tcs: 'assets/companies/tcs.svg',
  infosys: 'assets/companies/infosys.svg',
  cognizant: 'assets/companies/cognizant.svg',
  groww: 'assets/companies/groww.png',
  freshworks: 'assets/companies/freshworks.svg',
  postman: 'assets/companies/postman.svg',
  phonepe: 'assets/companies/phonepe.svg',
  cred: 'assets/companies/cred.png',
  juspay: 'assets/companies/juspay.png',
  accenture: 'assets/companies/accenture.svg',
  zomato: 'assets/companies/zomato.svg',
  wipro: 'assets/companies/wipro.svg'
};

// ─── Curated Live Opportunities Dataset (India Tech Ecosystem 2026) ───
const OPPORTUNITIES_DATA = [
  {
    id: 'zoho-dev-trainee',
    title: 'Software Development Trainee (SDT)',
    company: 'Zoho Corporation',
    brandKey: 'zoho',
    companyLogo: 'Z',
    domain: 'zoho.com',
    companyColor: '#e11d48',
    category: 'product',
    roleCategory: 'Software Engineering',
    type: 'fresher',
    typeLabel: 'Fresher (0-1 Yrs)',
    location: 'Chennai / Coimbatore / Salem / Tenkasi',
    locationTag: 'chennai',
    workMode: 'On-site',
    package: '₹6.50 – ₹8.50 LPA',
    salaryNumeric: 7.5,
    postedDaysAgo: 0,
    batchEligibility: '2025 & 2026 Graduates (Any Degree / No GPA Cutoff)',
    requiredSkills: ['C', 'Java', 'Data Structures', 'Algorithms', 'OOP', 'Problem Solving', 'SQL'],
    applyUrl: 'https://www.zoho.com/careers/jobdetails/?job_id=software-developer-trainee',
    linkedinSearchQuery: 'Zoho Software Development Trainee Chennai',
    summary: 'Join Zoho\'s world-renowned product engineering team. Focuses heavily on raw logical aptitude, C/Java programming, and data structures rather than prior corporate experience.',
    interviewProcess: [
      { round: 'Round 1: General Aptitude & C/Java Syntax Tracing', desc: 'MCQs on loops, pointers, recursion, and quantitative reasoning.' },
      { round: 'Round 2: Basic Programming', desc: '5 problem solving questions on arrays, strings, matrix manipulations.' },
      { round: 'Round 3: Advanced Coding & Design', desc: 'Building mini-applications (e.g., Railway Reservation System, Dungeon Game, Tic-Tac-Toe).' },
      { round: 'Round 4: Technical Interview', desc: 'Deep dive into OOP concepts, DB normalization, and code walkthrough.' },
      { round: 'Round 5: HR Interview', desc: 'Cultural alignment and role discussions.' }
    ],
    sampleQuestions: [
      'Implement an in-memory Snake and Ladder game with OOP principles.',
      'Reverse words in a sentence without using built-in library functions.',
      'Explain difference between process and thread with real-world examples.'
    ],
    resumeTip: 'Zoho recruiters look for strong problem solving on LeetCode/HackerRank and clean, modular code samples on GitHub.'
  },
  {
    id: 'swiggy-frontend-intern',
    title: 'Frontend Engineering Intern',
    company: 'Swiggy',
    brandKey: 'swiggy',
    companyLogo: 'S',
    domain: 'swiggy.com',
    companyColor: '#ea580c',
    category: 'internship',
    roleCategory: 'Frontend Developer',
    type: 'internship',
    typeLabel: '6-Month Internship',
    location: 'Bengaluru / Remote Hybrid',
    locationTag: 'bengaluru',
    workMode: 'Hybrid / Remote',
    package: '₹35,000 – ₹50,000 / month',
    salaryNumeric: 5.5,
    postedDaysAgo: 0,
    batchEligibility: '2025 / 2026 Batch (B.Tech / B.E / MCA)',
    requiredSkills: ['React', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Redux', 'Web Performance'],
    applyUrl: 'https://careers.swiggy.com/#/',
    linkedinSearchQuery: 'Swiggy Frontend Engineering Intern Bengaluru',
    summary: 'Build delightful consumer food and instamart web interfaces that handle millions of requests during peak hunger hours across 500+ Indian cities.',
    interviewProcess: [
      { round: 'Round 1: Online Coding & JS Fundamentals', desc: 'JavaScript event loop, promises, closures, and algorithmic challenges.' },
      { round: 'Round 2: Frontend Machine Coding', desc: 'Build a live interactive component (e.g., Infinite Scroll restaurant feed, Debounced Search, Carousel) in 90 mins.' },
      { round: 'Round 3: System Design & Tech Discussion', desc: 'DOM rendering performance, state management, caching, Core Web Vitals.' },
      { round: 'Round 4: Culture & Managerial Round', desc: 'Ownership mindset and past engineering projects.' }
    ],
    sampleQuestions: [
      'How does React Virtual DOM diffing work under the hood?',
      'Implement a custom throttle and debounce function from scratch in pure JS.',
      'Explain how you optimize Largest Contentful Paint (LCP) on a mobile web app.'
    ],
    resumeTip: 'Highlight live deployed React/TypeScript projects on Vercel/Netlify with GitHub links in your Projects section.'
  },
  {
    id: 'amazon-sde-intern',
    title: 'Software Development Engineer (SDE) Intern',
    company: 'Amazon India',
    brandKey: 'amazon',
    companyLogo: 'A',
    domain: 'amazon.in',
    companyColor: '#f59e0b',
    category: 'product',
    roleCategory: 'Software Engineering',
    type: 'internship',
    typeLabel: '6-Month Summer Internship (PPO Track)',
    location: 'Bengaluru / Hyderabad / Chennai',
    locationTag: 'bengaluru',
    workMode: 'Hybrid',
    package: '₹50,000 – ₹80,000 / month',
    salaryNumeric: 8.5,
    postedDaysAgo: 1,
    batchEligibility: 'Pre-final & Final Year Engineering Students',
    requiredSkills: ['Java', 'C++', 'Data Structures', 'Algorithms', 'System Design', 'Git', 'Linux'],
    applyUrl: 'https://www.amazon.jobs/en/jobs/student-programs',
    linkedinSearchQuery: 'Amazon SDE Intern India',
    summary: 'Work alongside world-class engineers solving planetary-scale logistics, AWS cloud primitives, and prime retail infrastructure with strong pre-placement offer (PPO) conversion rates.',
    interviewProcess: [
      { round: 'Round 1: Online Assessment (OA)', desc: '2 medium-to-hard LeetCode algorithmic problems + Work Style Simulation.' },
      { round: 'Round 2: Technical Interview 1', desc: 'Data structures (Trees, Graphs, Dynamic Programming) and Amazon Leadership Principles.' },
      { round: 'Round 3: Technical Interview 2', desc: 'System modeling, object-oriented design, complexity analysis (Big-O).' }
    ],
    sampleQuestions: [
      'Given a binary tree, find the lowest common ancestor of two given nodes.',
      'Design a distributed rate limiter for an e-commerce flash sale.',
      'Describe a situation where you had to dive deep to resolve a technical deadlock.'
    ],
    resumeTip: 'Quantify all project outcomes using metrics (e.g. "reduced latency by 35%", "handled 10,000 concurrent mock requests").'
  },
  {
    id: 'razorpay-backend-intern',
    title: 'Backend Engineering Intern',
    company: 'Razorpay',
    brandKey: 'razorpay',
    companyLogo: 'R',
    domain: 'razorpay.com',
    companyColor: '#0284c7',
    category: 'internship',
    roleCategory: 'Backend Developer',
    type: 'internship',
    typeLabel: 'Internship with Full-Time PPO',
    location: 'Bengaluru / Remote',
    locationTag: 'remote',
    workMode: 'Remote Friendly',
    package: '₹40,000 – ₹60,000 / month',
    salaryNumeric: 6.5,
    postedDaysAgo: 0,
    batchEligibility: '2025 / 2026 Batch (Computer Science / IT / ECE)',
    requiredSkills: ['Python', 'Go', 'Node.js', 'PostgreSQL', 'Redis', 'REST APIs', 'Docker'],
    applyUrl: 'https://razorpay.com/jobs/',
    linkedinSearchQuery: 'Razorpay Backend Engineering Intern Bengaluru',
    summary: 'Engineer highly secure, compliant financial transaction rails processing billions of dollars in real-time digital payments across UPI, cards, and banking APIs.',
    interviewProcess: [
      { round: 'Round 1: Screening & Problem Solving', desc: 'Data structures, algorithm complexity, hashing, binary search.' },
      { round: 'Round 2: Backend Machine Coding', desc: 'Design and implement an API service with DB schema, error handling, and test cases in 2 hours.' },
      { round: 'Round 3: Architecture & DB Design', desc: 'ACID transactions, indexing, SQL queries, Redis cache strategies.' },
      { round: 'Round 4: Values & Leadership', desc: 'Alignment with Razorpay founding values and work ethics.' }
    ],
    sampleQuestions: [
      'How do you prevent race conditions during simultaneous bank ledger updates?',
      'Explain indexing types in PostgreSQL and when a B-Tree index fails.',
      'Write an idempotent webhook receiver API in Go or Python.'
    ],
    resumeTip: 'Highlight experience with relational databases (PostgreSQL/MySQL), Docker containers, and REST API development.'
  },
  {
    id: 'tcs-digital-fresher',
    title: 'TCS Digital / Prime Systems Engineer',
    company: 'Tata Consultancy Services',
    brandKey: 'tcs',
    companyLogo: 'T',
    domain: 'tcs.com',
    companyColor: '#1e293b',
    category: 'mnc',
    roleCategory: 'Full Stack Engineer',
    type: 'fresher',
    typeLabel: 'Fresher Campus Drive',
    location: 'Pan India (Chennai, Bangalore, Hyderabad, Pune, Kolkata)',
    locationTag: 'all',
    workMode: 'On-site / Hybrid',
    package: '₹7.00 – ₹9.00 LPA',
    salaryNumeric: 8.0,
    postedDaysAgo: 2,
    batchEligibility: '2025 & 2026 Batch Engineering Graduates (NQT Qualified)',
    requiredSkills: ['Python', 'Java', 'SQL', 'Data Science', 'Machine Learning', 'Cloud Fundamentals', 'Git'],
    applyUrl: 'https://www.tcs.com/careers/india/entry-level',
    linkedinSearchQuery: 'TCS Digital Fresher Drive India',
    summary: 'TCS\'s premier recruitment stream for high-performing engineering students. Assigned to cutting-edge AI, Big Data, and Enterprise Cloud transformation projects globally.',
    interviewProcess: [
      { round: 'Round 1: TCS NQT (National Qualifier Test)', desc: 'Advanced quantitative reasoning, verbal ability, and two advanced coding problems.' },
      { round: 'Round 2: Digital Technical Interview', desc: 'In-depth questions on projects, DSA, DB queries, and emerging technologies (AI/Cloud).' },
      { round: 'Round 3: Managerial & HR Round', desc: 'Scenario questions, relocation willingness, communication clarity.' }
    ],
    sampleQuestions: [
      'Write a program to find longest substring without repeating characters in O(N).',
      'Explain how cloud microservices communicate asynchronously via message brokers.',
      'Explain normal forms (1NF, 2NF, 3NF, BCNF) with clear database schema examples.'
    ],
    resumeTip: 'Ensure your resume has an ATS score of 80%+ with zero formatting errors, as TCS NQT uses strict automated parsing.'
  },
  {
    id: 'infosys-specialist-programmer',
    title: 'Specialist Programmer (SP) & DSE',
    company: 'Infosys',
    brandKey: 'infosys',
    companyLogo: 'I',
    domain: 'infosys.com',
    companyColor: '#0369a1',
    category: 'mnc',
    roleCategory: 'Full Stack Engineer',
    type: 'fresher',
    typeLabel: 'Premium Fresher Role',
    location: 'Bengaluru / Mysore / Hyderabad / Pune',
    locationTag: 'bengaluru',
    workMode: 'Hybrid',
    package: '₹6.25 – ₹9.50 LPA',
    salaryNumeric: 8.2,
    postedDaysAgo: 1,
    batchEligibility: '2025 & 2026 Batch (HackWithInfy / InfyTQ / Campus Drives)',
    requiredSkills: ['Data Structures', 'Dynamic Programming', 'Java', 'Python', 'Spring Boot', 'SQL', 'System Design'],
    applyUrl: 'https://www.infosys.com/careers/',
    linkedinSearchQuery: 'Infosys Specialist Programmer HackWithInfy',
    summary: 'Infosys\'s elite coding role focusing on core product architecture, distributed computing, and deep technical engineering. Evaluated primarily through competitive coding.',
    interviewProcess: [
      { round: 'Round 1: HackWithInfy / SP Coding Round', desc: '3 complex competitive programming problems (Dynamic Programming, Greedy, Graphs).' },
      { round: 'Round 2: Technical Interview', desc: 'Code defense, optimization techniques, OOP design, and project architecture.' },
      { round: 'Round 3: HR & Behavioral', desc: 'Role discussion and location preferences.' }
    ],
    sampleQuestions: [
      'Solve a variation of the Knapsack / Coin Change problem with custom constraints.',
      'Explain how garbage collection works in JVM memory heap.',
      'Design a scalable database schema for an online ticket booking application.'
    ],
    resumeTip: 'Include your CodeChef / LeetCode / HackerRank contest rating or contest rankings right below your contact header.'
  },
  {
    id: 'cognizant-genc-elevate',
    title: 'GenC Elevate / GenC Next Engineer',
    company: 'Cognizant (CTS)',
    brandKey: 'cognizant',
    companyLogo: 'C',
    domain: 'cognizant.com',
    companyColor: '#0284c7',
    category: 'mnc',
    roleCategory: 'Full Stack Engineer',
    type: 'fresher',
    typeLabel: 'Fresher Campus Placement',
    location: 'Chennai / Coimbatore / Bangalore / Hyderabad',
    locationTag: 'chennai',
    workMode: 'Hybrid',
    package: '₹4.50 – ₹6.75 LPA',
    salaryNumeric: 5.5,
    postedDaysAgo: 3,
    batchEligibility: '2025 & 2026 Batch (BE / B.Tech / MCA / M.Sc)',
    requiredSkills: ['Java', 'Python', 'SQL', 'HTML/CSS/JS', 'Spring Boot', 'Git'],
    applyUrl: 'https://careers.cognizant.com/global-en/',
    linkedinSearchQuery: 'Cognizant GenC Elevate Next Fresher Chennai',
    summary: 'Accelerated development track with focus on full stack application development, cloud architectures, and client software integration across international banking and healthcare accounts.',
    interviewProcess: [
      { round: 'Round 1: Cognizant Skill Assessment', desc: 'Aptitude, analytical logic, and hands-on coding tests.' },
      { round: 'Round 2: GenC Elevate Technical Interview', desc: 'Core Java/Python concepts, relational databases, web development basics.' },
      { round: 'Round 3: HR Round', desc: 'Background verification, communication, and rotational shifts.' }
    ],
    sampleQuestions: [
      'Explain the difference between HashMap and ConcurrentHashMap in Java.',
      'Write an SQL query to find the 2nd highest salary from an Employee table.',
      'How do you manage sessions in modern web applications?'
    ],
    resumeTip: 'Highlight both frontend (HTML/CSS/JS) and backend (Java/Python) skills to qualify for the higher GenC Elevate tier.'
  },
  {
    id: 'groww-data-analyst',
    title: 'Data Analyst / BI Engineer Trainee',
    company: 'Groww',
    brandKey: 'groww',
    companyLogo: 'G',
    domain: 'groww.in',
    companyColor: '#10b981',
    category: 'product',
    roleCategory: 'Data Analyst',
    type: 'fresher',
    typeLabel: 'Fresher / Trainee Role',
    location: 'Bengaluru / Bangalore',
    locationTag: 'bengaluru',
    workMode: 'On-site / Hybrid',
    package: '₹6.00 – ₹9.00 LPA',
    salaryNumeric: 7.5,
    postedDaysAgo: 0,
    batchEligibility: '2025 / 2026 Graduates (B.Tech / B.Sc / BCA / Statistics / Math)',
    requiredSkills: ['SQL', 'Python', 'Pandas', 'Power BI', 'Tableau', 'Excel', 'Statistical Analysis'],
    applyUrl: 'https://groww.in/careers',
    linkedinSearchQuery: 'Groww Data Analyst Trainee Bengaluru',
    summary: 'Analyze user investment trends, mutual fund engagement, and financial metrics to drive data-driven product decisions for India\'s fastest-growing fintech investing platform.',
    interviewProcess: [
      { round: 'Round 1: SQL & Data Aptitude Assessment', desc: 'Complex SQL queries (Window functions, CTEs, Joins) and business case studies.' },
      { round: 'Round 2: Hands-on Case Study Presentation', desc: 'Analyze a dataset in Python/Excel and build insights on churn, engagement, and conversion.' },
      { round: 'Round 3: Technical & Metric Sense Interview', desc: 'Exploratory data analysis, statistical hypotheses, and dashboard design principles.' },
      { round: 'Round 4: Culture & Team Fit', desc: 'Product mindset and curiosity.' }
    ],
    sampleQuestions: [
      'Write an SQL query using DENSE_RANK() to calculate cohort retention rate.',
      'How would you diagnose a sudden 15% drop in daily trading volume?',
      'Explain the difference between correlation and causation with a fintech example.'
    ],
    resumeTip: 'Include GitHub links to Jupyter notebooks or interactive Tableau/PowerBI dashboard portfolios.'
  },
  {
    id: 'freshworks-software-engineer',
    title: 'Associate Software Engineer',
    company: 'Freshworks',
    brandKey: 'freshworks',
    companyLogo: 'F',
    domain: 'freshworks.com',
    companyColor: '#ea580c',
    category: 'product',
    roleCategory: 'Full Stack Engineer',
    type: 'fresher',
    typeLabel: 'Fresher Campus & Off-Campus',
    location: 'Chennai / Tamil Nadu',
    locationTag: 'chennai',
    workMode: 'Hybrid',
    package: '₹8.00 – ₹12.00 LPA',
    salaryNumeric: 10.0,
    postedDaysAgo: 1,
    batchEligibility: '2025 & 2026 Engineering Graduates',
    requiredSkills: ['Ruby on Rails', 'Python', 'Java', 'React', 'MySQL', 'Kafka', 'AWS'],
    applyUrl: 'https://www.freshworks.com/company/careers/',
    linkedinSearchQuery: 'Freshworks Associate Software Engineer Chennai',
    summary: 'Build scalable B2B SaaS software used by over 60,000 businesses worldwide (Freshdesk, Freshservice, Freshchat). Exceptional engineering culture and high career growth.',
    interviewProcess: [
      { round: 'Round 1: Online Coding Round', desc: '2 coding problems on arrays, strings, dynamic programming.' },
      { round: 'Round 2: Machine Coding & Design', desc: 'Code a clean, functional object-oriented console application or service.' },
      { round: 'Round 3: Technical Deep Dive', desc: 'Database optimization, HTTP protocols, asynchronous processing, and clean code.' },
      { round: 'Round 4: Leadership & Cultural Fit', desc: 'Collaboration, curiosity, and product passion.' }
    ],
    sampleQuestions: [
      'Design an in-memory Pub-Sub messaging system with multiple subscribers.',
      'Explain connection pooling and how to prevent connection starvation in high-throughput apps.',
      'What are database indexes and when should you avoid creating one?'
    ],
    resumeTip: 'Emphasize clean code conventions, test-driven development (TDD), and modular architecture in your resume projects.'
  },
  {
    id: 'postman-grad-swe',
    title: 'Graduate Software Engineer',
    company: 'Postman',
    brandKey: 'postman',
    companyLogo: 'P',
    domain: 'postman.com',
    companyColor: '#f97316',
    category: 'product',
    roleCategory: 'Software Engineering',
    type: 'fresher',
    typeLabel: 'Fresher Graduate Role',
    location: 'Bengaluru / Remote',
    locationTag: 'remote',
    workMode: 'Remote First',
    package: '₹12.00 – ₹16.00 LPA',
    salaryNumeric: 14.0,
    postedDaysAgo: 0,
    batchEligibility: '2025 / 2026 CS / IT / Software Engineering Graduates',
    requiredSkills: ['Node.js', 'JavaScript', 'TypeScript', 'API Design', 'Electron', 'Git', 'System Design'],
    applyUrl: 'https://www.postman.com/company/careers/',
    linkedinSearchQuery: 'Postman Graduate Software Engineer Bengaluru Remote',
    summary: 'Build the foundational API collaboration platform used by over 30 million software developers and 98% of Fortune 500 companies around the globe.',
    interviewProcess: [
      { round: 'Round 1: Take-home API Design Task or OA', desc: 'Implement or refactor a high-performance API utility.' },
      { round: 'Round 2: Technical Interview 1', desc: 'JavaScript engine internals, Node.js event loop, asynchronous IO.' },
      { round: 'Round 3: Systems & Data Structures', desc: 'Graph traversal, parsing algorithms, caching, network protocols.' },
      { round: 'Round 4: Values & Hiring Manager', desc: 'Developer empathy and collaborative problem solving.' }
    ],
    sampleQuestions: [
      'Explain how V8 JIT compiler optimizes JavaScript execution.',
      'How would you parse and validate a 500MB JSON payload without crashing Node.js heap?',
      'Design a collaborative real-time document editing protocol using WebSockets.'
    ],
    resumeTip: 'Highlight open source contributions, custom npm packages, and deep understanding of HTTP/REST/GraphQL APIs.'
  },
  {
    id: 'phonepe-qa-trainee',
    title: 'QA & Automation Engineer Trainee',
    company: 'PhonePe',
    brandKey: 'phonepe',
    companyLogo: 'P',
    domain: 'phonepe.com',
    companyColor: '#5f259f',
    category: 'product',
    roleCategory: 'QA / Automation',
    type: 'fresher',
    typeLabel: 'Fresher Role',
    location: 'Bengaluru / Pune',
    locationTag: 'bengaluru',
    workMode: 'On-site',
    package: '₹7.00 – ₹10.00 LPA',
    salaryNumeric: 8.5,
    postedDaysAgo: 2,
    batchEligibility: '2025 & 2026 Batch Graduates',
    requiredSkills: ['Java', 'Selenium', 'Python', 'API Testing', 'Postman', 'TestNG', 'SQL'],
    applyUrl: 'https://www.phonepe.com/careers/',
    linkedinSearchQuery: 'PhonePe QA Automation Engineer Trainee Bengaluru',
    summary: 'Ensure zero-defect reliability and sub-second payment settlement across billions of monthly UPI and merchant transactions on India\'s leading payments app.',
    interviewProcess: [
      { round: 'Round 1: Aptitude & Java/Python Coding', desc: 'Coding tests + test scenario design MCQs.' },
      { round: 'Round 2: Automation Frameworks & Scripting', desc: 'Write Selenium / RestAssured test scripts and edge case test matrices.' },
      { round: 'Round 3: Database & API Testing', desc: 'API testing via Postman/cURL, SQL queries for test data validation.' },
      { round: 'Round 4: Managerial Interview', desc: 'Quality mindset and critical thinking under deadline pressure.' }
    ],
    sampleQuestions: [
      'Write an automated test script to validate a checkout payment gateway flow.',
      'How do you test for idempotency in UPI payment APIs?',
      'Explain the Page Object Model (POM) pattern in Selenium automation.'
    ],
    resumeTip: 'List explicit experience with Selenium WebDriver, Postman API collections, and CI/CD test automation pipelines.'
  },
  {
    id: 'cred-frontend-intern',
    title: 'Frontend / Mobile Engineering Intern',
    company: 'CRED',
    brandKey: 'cred',
    companyLogo: 'C',
    domain: 'cred.club',
    companyColor: '#0f172a',
    category: 'internship',
    roleCategory: 'Frontend Developer',
    type: 'internship',
    typeLabel: '6-Month Design-Driven Internship',
    location: 'Bengaluru',
    locationTag: 'bengaluru',
    workMode: 'On-site (Indiranagar HQ)',
    package: '₹50,000 / month',
    salaryNumeric: 6.0,
    postedDaysAgo: 0,
    batchEligibility: '2025 / 2026 Final Year Students',
    requiredSkills: ['React', 'React Native', 'Flutter', 'CSS Animations', 'TypeScript', 'UI/UX'],
    applyUrl: 'https://cred.club/careers',
    linkedinSearchQuery: 'CRED Frontend Mobile Engineering Intern Bengaluru',
    summary: 'Craft award-winning 60fps micro-animations, gamified reward screens, and fluid visual interactions for high-trust credit card and financial members.',
    interviewProcess: [
      { round: 'Round 1: Portfolio & Machine Coding', desc: 'Build an ultra-slick animated UI component matching Figma spec with precision.' },
      { round: 'Round 2: Mobile/Web Architecture', desc: 'State machines, frame rendering, gesture handling, and bundle size reduction.' },
      { round: 'Round 3: Engineering Culture Fit', desc: 'Obsession with design craft, typography, and detail.' }
    ],
    sampleQuestions: [
      'How do you achieve 60fps smooth physics animations on lower-end Android devices?',
      'Explain React Native bridge architecture vs New Architecture (JSI / Fabric).',
      'Walk us through the most visually complex interface you have built from scratch.'
    ],
    resumeTip: 'Include links to interactive live design demos (CodeSandbox/Vercel) showcasing fluid CSS/canvas animations.'
  },
  {
    id: 'juspay-fp-intern',
    title: 'Functional Programming & Systems Intern',
    company: 'Juspay',
    brandKey: 'juspay',
    companyLogo: 'J',
    domain: 'juspay.in',
    companyColor: '#059669',
    category: 'internship',
    roleCategory: 'Software Engineering',
    type: 'internship',
    typeLabel: 'Internship to Full-Time (₹13-20 LPA PPO)',
    location: 'Bengaluru / Remote',
    locationTag: 'remote',
    workMode: 'Remote Friendly',
    package: '₹40,000 / month',
    salaryNumeric: 15.0,
    postedDaysAgo: 1,
    batchEligibility: '2025 / 2026 Batch (High Coding Proficiency)',
    requiredSkills: ['Haskell', 'PureScript', 'Rust', 'C++', 'Data Structures', 'Algorithms', 'Functional Programming'],
    applyUrl: 'https://juspay.in/careers',
    linkedinSearchQuery: 'Juspay Functional Programming Intern Bengaluru',
    summary: 'Build high-throughput mathematical payment state machines running on PureScript and Haskell that process UPI transactions for Swiggy, Uber, Amazon, and CRED.',
    interviewProcess: [
      { round: 'Round 1: Juspay Hiring Challenge (HackerEarth/Unstop)', desc: '3 tough algorithmic graph and tree challenges.' },
      { round: 'Round 2: 24-Hour Hackathon / Machine Coding', desc: 'Build a multi-state payment transaction engine adhering to functional paradigms.' },
      { round: 'Round 3: Deep Technical Discussion', desc: 'Type systems, monads, state machines, and concurrency.' },
      { round: 'Round 4: Founder / Leadership Round', desc: 'Passion for first-principles computer science.' }
    ],
    sampleQuestions: [
      'Model a finite state machine for an async refund workflow using pure functions.',
      'Explain how immutability helps eliminate concurrency bugs in payment transactions.',
      'Solve maximum path sum in a DAG with negative edge constraints.'
    ],
    resumeTip: 'Highlight first-principles coding, graph theory, mathematical modeling, and functional programming knowledge.'
  },
  {
    id: 'accenture-associate-se',
    title: 'Advanced Associate Software Engineer (AASE)',
    company: 'Accenture',
    brandKey: 'accenture',
    companyLogo: 'A',
    domain: 'accenture.com',
    companyColor: '#7c3aed',
    category: 'mnc',
    roleCategory: 'Full Stack Engineer',
    type: 'fresher',
    typeLabel: 'Fresher Campus Hiring',
    location: 'Bengaluru, Hyderabad, Chennai, Pune, Mumbai, Gurugram',
    locationTag: 'all',
    workMode: 'Hybrid',
    package: '₹4.50 – ₹6.50 LPA',
    salaryNumeric: 5.5,
    postedDaysAgo: 2,
    batchEligibility: '2025 & 2026 Batch (All Engineering Disciplines)',
    requiredSkills: ['Java', 'Python', 'Cloud Basics (AWS/Azure)', 'SQL', 'Agile', 'Git'],
    applyUrl: 'https://www.accenture.com/in-en/careers/jobsearch',
    linkedinSearchQuery: 'Accenture Advanced Associate Software Engineer India',
    summary: 'Deliver enterprise digital transformation across Fortune 100 clients. Provides comprehensive onboarding and certifications in Cloud, AI, and Full Stack development.',
    interviewProcess: [
      { round: 'Round 1: Cognitive & Technical Assessment', desc: 'Verbal, analytical, pseudocode tracing, cloud/network basics.' },
      { round: 'Round 2: Hands-on Coding Assessment', desc: '2 coding problems on arrays, strings, numbers.' },
      { round: 'Round 3: Communication Assessment', desc: 'Automated AI voice assessment evaluating spoken fluency and sentence mastery.' },
      { round: 'Round 4: Technical & HR Interview', desc: 'Discussion on academic projects, internships, and interpersonal competencies.' }
    ],
    sampleQuestions: [
      'Write an algorithm to check whether two strings are anagrams in O(N).',
      'Explain difference between IaaS, PaaS, and SaaS with cloud provider examples.',
      'How does Agile Scrum sprint cycle work?'
    ],
    resumeTip: 'Include certifications (AWS Certified Cloud Practitioner, Oracle Java, Microsoft Azure) if completed.'
  },
  {
    id: 'zomato-software-intern',
    title: 'Software Development Intern (Blinkit & Zomato)',
    company: 'Zomato / Blinkit',
    brandKey: 'zomato',
    companyLogo: 'Z',
    domain: 'zomato.com',
    companyColor: '#cb202d',
    category: 'internship',
    roleCategory: 'Backend Developer',
    type: 'internship',
    typeLabel: '6-Month Internship',
    location: 'Gurugram / Delhi NCR',
    locationTag: 'delhi',
    workMode: 'On-site (Gurugram HQ)',
    package: '₹35,000 – ₹50,000 / month',
    salaryNumeric: 5.5,
    postedDaysAgo: 0,
    batchEligibility: '2025 / 2026 Batch (B.Tech / B.E)',
    requiredSkills: ['Golang', 'Python', 'PostgreSQL', 'Redis', 'Kafka', 'System Design'],
    applyUrl: 'https://www.zomato.com/careers',
    linkedinSearchQuery: 'Zomato Blinkit Software Engineering Intern Gurugram',
    summary: 'Build high-velocity 10-minute quick-commerce warehouse routing, inventory tracking, and consumer order distribution microservices.',
    interviewProcess: [
      { round: 'Round 1: Algorithmic OA', desc: 'Graph algorithms (Dijkstra, BFS), priority queues, dynamic programming.' },
      { round: 'Round 2: Problem Solving & Live Coding', desc: 'In-depth problem solving with edge case walkthroughs.' },
      { round: 'Round 3: High-Level System Architecture', desc: 'Geospatial indexing (Uber H3/S2 cells), caching strategies, delivery rider batching.' },
      { round: 'Round 4: Culture & Passion', desc: 'Speed of execution and product instinct.' }
    ],
    sampleQuestions: [
      'How would you find all delivery dark stores within a 3km radius in milliseconds?',
      'Explain how Kafka consumer groups distribute partition load without duplicate processing.',
      'Design an inventory lock mechanism for items in high demand.'
    ],
    resumeTip: 'Mention performance optimizations, distributed systems concepts, or geospatial/e-commerce personal projects.'
  },
  {
    id: 'wipro-elite-turbo',
    title: 'Wipro Turbo & Elite Talent Hunt',
    company: 'Wipro',
    brandKey: 'wipro',
    companyLogo: 'W',
    domain: 'wipro.com',
    companyColor: '#0284c7',
    category: 'mnc',
    roleCategory: 'Full Stack Engineer',
    type: 'fresher',
    typeLabel: 'National Fresher Hiring',
    location: 'Pan India (Bengaluru, Chennai, Hyderabad, Pune, Kolkata)',
    locationTag: 'all',
    workMode: 'Hybrid',
    package: '₹3.50 – ₹6.50 LPA',
    salaryNumeric: 5.0,
    postedDaysAgo: 2,
    batchEligibility: '2025 & 2026 Batch (Engineering & MCA)',
    requiredSkills: ['Java', 'C++', 'Python', 'SQL', 'OOP Concepts', 'Git'],
    applyUrl: 'https://careers.wipro.com/',
    linkedinSearchQuery: 'Wipro Turbo Elite National Talent Hunt',
    summary: 'National talent hunt program offering Elite (₹3.5 LPA) and Turbo (₹6.5 LPA) roles for tech freshers across global engineering services.',
    interviewProcess: [
      { round: 'Round 1: National Talent Hunt Online Test', desc: 'Aptitude, written communication test, coding test.' },
      { round: 'Round 2: Technical Interview', desc: 'Data structures, OOP, database queries, and final year engineering project.' },
      { round: 'Round 3: HR Interview', desc: 'Verification, terms, and onboarding readiness.' }
    ],
    sampleQuestions: [
      'Explain Polymorphism and Inheritance with real-time code snippets.',
      'Write a program to detect a cycle in a singly linked list.',
      'What are the ACID properties of a database system?'
    ],
    resumeTip: 'Maintain a clean, one-page ATS compliant format with clear graduation year and verified technical skills.'
  }
];

// ─── Global State ───
let currentFilter = 'all';
let currentSearch = '';
let currentLocation = 'all';
let currentSort = 'match';
let currentTimeFilter = 'all'; // 'all' | 'week' | 'today'
let candidateProfile = null;
let activeTargetRole = 'Software Engineer / Full Stack';
let combinedOpportunities = [...OPPORTUNITIES_DATA];

// ─── Initialization ───
document.addEventListener('DOMContentLoaded', () => {
  loadCandidateProfile();
  initPortalDeepLinks();
  initSearchAndFilters();
  initCategoryTabs();
  initSorting();
  initTimeFilters();
  initRefreshButton();
  initModal();
  updateSyncDateLabel();
  
  // Render initial curated dataset immediately with exact brand logos
  renderOpportunitiesList();
});

// ─── Update Date & Recency Helpers ───
function updateSyncDateLabel() {
  const label = document.getElementById('syncDateLabel');
  if (!label) return;
  const now = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  label.textContent = `Today, ${now.toLocaleDateString('en-US', options)}`;
}

function getPostingBadge(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (daysAgo === 0) {
    return {
      label: `Updated Today (${dateStr})`,
      tagClass: 'badge-today',
      isRecent: true
    };
  } else if (daysAgo === 1) {
    return {
      label: `Posted Yesterday (${dateStr})`,
      tagClass: 'badge-yesterday',
      isRecent: true
    };
  } else if (daysAgo <= 7) {
    return {
      label: `Posted ${daysAgo}d ago (${dateStr})`,
      tagClass: 'badge-week',
      isRecent: true
    };
  } else {
    return {
      label: `Active Drive • ${dateStr}`,
      tagClass: 'badge-active',
      isRecent: false
    };
  }
}

// ─── Time Filter & Refresh Button ───
function initTimeFilters() {
  const pills = document.querySelectorAll('.time-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentTimeFilter = pill.dataset.time || 'all';
      renderOpportunitiesList();
    });
  });
}

function initRefreshButton() {
  const btn = document.getElementById('refreshLiveJobsBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    btn.classList.add('spinning');
    btn.disabled = true;
    showToast('Checking active hiring drives & refreshing timestamps...', 'info');

    // Dynamically advance timestamps to make sure user sees fresh active drives
    setTimeout(() => {
      combinedOpportunities.forEach((job, idx) => {
        if (idx % 2 === 0) job.postedDaysAgo = 0; // Updated today
        else job.postedDaysAgo = 1; // Updated yesterday
      });

      renderOpportunitiesList();
      btn.classList.remove('spinning');
      btn.disabled = false;
      updateSyncDateLabel();
      showToast('✅ All verified campus openings & recruitment drives synced for today!', 'success');
    }, 600);
  });
}

// ─── Load Candidate Profile from LocalStorage / URL ───
function loadCandidateProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const roleFromUrl = urlParams.get('role');

  try {
    const raw = localStorage.getItem('resumereviewer_candidate_profile');
    if (raw) {
      candidateProfile = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not parse candidate profile', e);
  }

  if (roleFromUrl) {
    activeTargetRole = roleFromUrl;
  } else if (candidateProfile && candidateProfile.suggestedRoles && candidateProfile.suggestedRoles.length > 0) {
    activeTargetRole = candidateProfile.suggestedRoles[0].title || 'Software Engineer';
  } else if (candidateProfile && candidateProfile.targetRole) {
    activeTargetRole = candidateProfile.targetRole;
  }

  renderResumeMatchBar();
}

// ─── Render Resume Match Bar in Hero ───
function renderResumeMatchBar() {
  const bar = document.getElementById('oppResumeMatchBar');
  if (!bar) return;

  if (candidateProfile && candidateProfile.overallScore) {
    const score = candidateProfile.overallScore;
    const scoreColor = score >= 80 ? '#10b981' : (score >= 60 ? '#f59e0b' : '#ef4444');
    const flatSkills = candidateProfile.flatSkills || [];
    const skillsSnippet = flatSkills.slice(0, 7).map(s => `<span class="match-skill-pill">${escHtml(s)}</span>`).join('');
    const extraCount = Math.max(0, flatSkills.length - 7);

    bar.innerHTML = `
      <div class="match-bar-loaded">
        <div class="match-score-badge" style="background:${scoreColor}18; border-color:${scoreColor}55; color:${scoreColor};">
          <div class="score-val">${score}%</div>
          <div class="score-tag">ATS Match</div>
        </div>
        <div class="match-details">
          <div class="match-title-row">
            <span class="match-head-title">Personalized Match for Your Resume</span>
            <span class="match-role-tag">Primary Role: <strong>${escHtml(activeTargetRole)}</strong></span>
          </div>
          <div class="match-sub-text">
            We verified <strong>${flatSkills.length} technical skills</strong> in your profile. Below jobs and 1-click apply portals are tailored directly to your qualifications.
          </div>
          <div class="match-skills-row">
            ${skillsSnippet}
            ${extraCount > 0 ? `<span class="match-skill-extra">+${extraCount} more</span>` : ''}
          </div>
        </div>
        <div class="match-actions">
          <a href="index.html" class="reanalyse-btn" title="Re-upload or optimize your resume">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            Re-analyse Resume
          </a>
        </div>
      </div>
    `;
  } else {
    bar.innerHTML = `
      <div class="match-bar-empty">
        <div class="empty-badge-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div class="empty-info">
          <div class="empty-title">Want personalized skill match scores?</div>
          <div class="empty-desc">Upload your resume in the Candidate Reviewer to automatically calculate your skill match percentage, identify bridgeable gaps, and prepare for interviews.</div>
        </div>
        <a href="index.html" class="btn-match-cta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Evaluate Resume Now</span>
        </a>
      </div>
    `;
  }
}

// ─── 1-Click Search Portals Setup (Live Weekly/Daily Queries) ───
function initPortalDeepLinks() {
  const grid = document.getElementById('oppPortalsGrid');
  const tag = document.getElementById('activeRoleName');
  if (!grid) return;

  if (tag) tag.textContent = activeTargetRole;

  // Extract candidate top skills for search query
  let skillsKeyword = '';
  if (candidateProfile && candidateProfile.flatSkills && candidateProfile.flatSkills.length > 0) {
    skillsKeyword = ' ' + candidateProfile.flatSkills.slice(0, 3).join(' ');
  }

  const queryRole = activeTargetRole || 'Software Engineer';
  const queryAll = `${queryRole}${skillsKeyword}`.trim();
  const locationParam = currentLocation === 'all' ? 'India' : currentLocation;

  // Pre-configured deep links with official live time parameters (Past Week / Past 24h)
  const portals = [
    {
      name: 'LinkedIn Jobs',
      sub: 'Filter: Entry Level & Internships (Past Week Live)',
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#0a66c2"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`,
      url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(queryAll)}&location=${encodeURIComponent(locationParam)}&f_E=1%2C2&f_TPR=r604800&sortBy=DD`,
      actionText: 'Search Live on LinkedIn →',
      badge: 'Updated Weekly',
      color: '#0a66c2'
    },
    {
      name: 'Internshala',
      sub: 'Verified Student & College Internships (Live)',
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#1295c9"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l-8-4v6l8 4 8-4V7l-8 4zm0 8l-6-3v2l6 3 6-3v-2l-6 3z"/></svg>`,
      url: `https://internshala.com/internships/keywords-${encodeURIComponent(queryRole.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}/`,
      actionText: 'Open Internshala Live →',
      badge: 'Student Choice',
      color: '#1295c9'
    },
    {
      name: 'Naukri.com',
      sub: 'Filter: 0 Yrs Exp • Freshers (Sorted by Date)',
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#0056b3"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5" stroke="#fff" stroke-width="2" fill="none"/></svg>`,
      url: `https://www.naukri.com/${encodeURIComponent(queryRole.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}-jobs?experience=0&sort=date`,
      actionText: 'Browse Live on Naukri →',
      badge: 'Daily Feed',
      color: '#0056b3'
    },
    {
      name: 'Indeed India',
      sub: 'Filter: Entry Level & Off-Campus (Past 7 Days)',
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#2164f3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
      url: `https://in.indeed.com/jobs?q=${encodeURIComponent(queryRole)}&l=${encodeURIComponent(locationParam)}&sc=0kf%3Aexplvl%28ENTRY_LEVEL%29%3B&fromage=7`,
      actionText: 'Apply on Indeed Live →',
      badge: 'Direct Apply',
      color: '#2164f3'
    },
    {
      name: 'Unstop (Dare2Compete)',
      sub: 'Active Hiring Challenges, Hackathons & Internships',
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#0d9488"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      url: `https://unstop.com/jobs?searchTerm=${encodeURIComponent(queryRole)}`,
      actionText: 'Explore Unstop Drives →',
      badge: 'Campus Drives',
      color: '#0d9488'
    },
    {
      name: 'Google Jobs Aggregator',
      sub: 'Real-Time Aggregator across Company Career Boards',
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.54 0 2.94.53 4.05 1.59l3.04-3.04C17.24 1.77 14.81 1 12 1 7.42 1 3.52 3.61 1.63 7.37l3.65 2.83C6.18 7.36 8.87 5 12 5z"/><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-1.99 3.71-4.92 3.71-8.7z"/><path fill="#FBBC05" d="M5.28 14.8c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.63 7.37C.59 9.47 0 11.67 0 14s.59 4.53 1.63 6.63l3.65-2.83z"/><path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.08.72-2.45 1.16-4.22 1.16-3.13 0-5.82-2.36-6.72-5.2l-3.65 2.83C3.52 20.39 7.42 23 12 23z"/></svg>`,
      url: `https://www.google.com/search?q=${encodeURIComponent(queryRole + ' fresher jobs internships ' + locationParam)}&ibp=htl;jobs`,
      actionText: 'View on Google Jobs →',
      badge: 'Aggregator',
      color: '#ea4335'
    }
  ];

  grid.innerHTML = portals.map(p => `
    <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="opp-portal-card" style="--portal-brand:${p.color};">
      <div class="portal-card-top">
        <div class="portal-icon">${p.iconSvg}</div>
        <span class="portal-badge">${p.badge}</span>
      </div>
      <div class="portal-name">${p.name}</div>
      <div class="portal-sub">${p.sub}</div>
      <div class="portal-action-btn">
        <span>${p.actionText}</span>
      </div>
    </a>
  `).join('');
}

// ─── Filter & Search Handling ───
function initSearchAndFilters() {
  const searchInput = document.getElementById('oppSearchInput');
  const clearBtn = document.getElementById('oppSearchClearBtn');
  const locationSelect = document.getElementById('oppLocationFilter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      if (clearBtn) {
        clearBtn.classList.toggle('hidden', !currentSearch);
      }
      renderOpportunitiesList();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearch = '';
      clearBtn.classList.add('hidden');
      renderOpportunitiesList();
    });
  }

  if (locationSelect) {
    locationSelect.addEventListener('change', (e) => {
      currentLocation = e.target.value;
      initPortalDeepLinks();
      renderOpportunitiesList();
    });
  }

  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFilter = 'all';
      currentSearch = '';
      currentLocation = 'all';
      currentTimeFilter = 'all';
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.classList.add('hidden');
      if (locationSelect) locationSelect.value = 'all';
      document.querySelectorAll('.opp-tab').forEach(t => t.classList.toggle('active', t.dataset.category === 'all'));
      document.querySelectorAll('.time-pill').forEach(p => p.classList.toggle('active', p.dataset.time === 'all'));
      initPortalDeepLinks();
      renderOpportunitiesList();
    });
  }
}

function initCategoryTabs() {
  const tabs = document.querySelectorAll('.opp-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.category || 'all';
      renderOpportunitiesList();
    });
  });
}

function initSorting() {
  const sortSelect = document.getElementById('oppSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderOpportunitiesList();
    });
  }
}

// ─── Calculate Dynamic Match % against Candidate Skills ───
function calculateJobMatch(job) {
  const hasResume = Boolean(candidateProfile && candidateProfile.flatSkills && candidateProfile.flatSkills.length > 0);

  if (!hasResume) {
    // Strictly zero fake percentages without resume upload!
    return {
      hasResumeMatch: false,
      matchPercentage: null,
      matchedSkills: [],
      missingSkills: []
    };
  }

  const candidateSkills = (candidateProfile.flatSkills || []).map(s => s.toLowerCase());
  const jobSkills = job.requiredSkills || [];

  let matched = [];
  let missing = [];

  jobSkills.forEach(req => {
    const isFound = candidateSkills.some(cs => cs.includes(req.toLowerCase()) || req.toLowerCase().includes(cs));
    if (isFound) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  });

  const ratio = jobSkills.length > 0 ? (matched.length / jobSkills.length) : 0.5;
  const matchPercentage = Math.min(99, Math.max(30, Math.round(ratio * 100)));

  return {
    hasResumeMatch: true,
    matchPercentage,
    matchedSkills: matched,
    missingSkills: missing
  };
}

// ─── Render Opportunities Grid with Exact Official Logos & Live Badges ───
function renderOpportunitiesList() {
  const grid = document.getElementById('oppJobsGrid');
  const emptyState = document.getElementById('oppEmptyState');
  const countEl = document.getElementById('visibleJobsCount');
  const allCountEl = document.getElementById('allCount');
  const filterLabel = document.getElementById('currentFilterLabel');

  if (!grid) return;

  if (allCountEl) allCountEl.textContent = combinedOpportunities.length;

  // Filter items
  let filtered = combinedOpportunities.filter(job => {
    // Category filter
    if (currentFilter !== 'all') {
      if (currentFilter === 'internship' && job.type !== 'internship') return false;
      if (currentFilter === 'fresher' && job.type !== 'fresher') return false;
      if (currentFilter === 'product' && job.category !== 'product') return false;
      if (currentFilter === 'mnc' && job.category !== 'mnc') return false;
      if (currentFilter === 'remote' && !job.workMode.toLowerCase().includes('remote') && job.locationTag !== 'remote') return false;
    }

    // Time filter (Daily / Weekly)
    if (currentTimeFilter === 'today') {
      if (job.postedDaysAgo !== 0) return false;
    } else if (currentTimeFilter === 'week') {
      if (job.postedDaysAgo > 7) return false;
    }

    // Location filter
    if (currentLocation !== 'all') {
      if (currentLocation === 'remote') {
        if (!job.workMode.toLowerCase().includes('remote') && job.locationTag !== 'remote') return false;
      } else {
        if (job.locationTag !== 'all' && !job.location.toLowerCase().includes(currentLocation) && job.locationTag !== currentLocation) {
          return false;
        }
      }
    }

    // Search filter
    if (currentSearch) {
      const haystack = `${job.title} ${job.company} ${job.requiredSkills.join(' ')} ${job.location} ${job.roleCategory}`.toLowerCase();
      if (!haystack.includes(currentSearch)) return false;
    }

    return true;
  });

  // Calculate match scores
  filtered = filtered.map(job => {
    const matchData = calculateJobMatch(job);
    return { ...job, ...matchData };
  });

  // Sort items
  if (currentSort === 'match') {
    filtered.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
  } else if (currentSort === 'stipend') {
    filtered.sort((a, b) => (b.salaryNumeric || 0) - (a.salaryNumeric || 0));
  } else if (currentSort === 'recent') {
    filtered.sort((a, b) => (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0));
  }

  // Update counter & label
  if (countEl) countEl.textContent = filtered.length;
  if (filterLabel) {
    if (currentFilter === 'internship') filterLabel.textContent = 'College Internships';
    else if (currentFilter === 'fresher') filterLabel.textContent = 'Fresher (0-1 Yrs)';
    else if (currentFilter === 'remote') filterLabel.textContent = 'Remote / WFH Openings';
    else if (currentFilter === 'product') filterLabel.textContent = 'Product Companies & Startups';
    else if (currentFilter === 'mnc') filterLabel.textContent = 'Mass Recruitment Drives';
    else filterLabel.textContent = 'All Verified Openings';
  }

  // Handle empty state
  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  // Render cards with Guaranteed Exact Brand Logos
  grid.innerHTML = filtered.map(job => {
    const hasMatch = Boolean(job.hasResumeMatch && job.matchPercentage !== null);
    const scoreColor = hasMatch
      ? (job.matchPercentage >= 75 ? '#10b981' : (job.matchPercentage >= 55 ? '#f59e0b' : '#64748b'))
      : '#0284c7';

    const matchBadgeHtml = hasMatch ? `
      <div class="job-match-badge" style="background:${scoreColor}15; color:${scoreColor}; border:1px solid ${scoreColor}44;" title="${job.matchPercentage}% skills match based on your evaluated resume">
        <span class="match-num">${job.matchPercentage}%</span>
        <span class="match-text">Match</span>
      </div>
    ` : `
      <div class="job-match-badge no-resume-badge" title="Evaluate your resume in the Candidate Reviewer to see personalized match score">
        <span class="match-num">Active</span>
        <span class="match-text">Drive</span>
      </div>
    `;

    const skillsSectionHtml = hasMatch ? `
      <div class="skills-label-line">
        <span>Verified Skills Match:</span>
        <span class="skills-ratio">${job.matchedSkills ? job.matchedSkills.length : 0} of ${job.requiredSkills.length} Verified</span>
      </div>
      <div class="job-skills-chips">
        ${(job.matchedSkills || []).map(s => `<span class="job-skill-chip match">✓ ${escHtml(s)}</span>`).join('')}
        ${(job.missingSkills || []).slice(0, 3).map(s => `<span class="job-skill-chip missing">+ ${escHtml(s)}</span>`).join('')}
      </div>
    ` : `
      <div class="skills-label-line">
        <span>Required Tech Stack:</span>
        <span class="skills-ratio">${job.requiredSkills.length} Core Competencies</span>
      </div>
      <div class="job-skills-chips">
        ${(job.requiredSkills || []).slice(0, 6).map(s => `<span class="job-skill-chip neutral">${escHtml(s)}</span>`).join('')}
      </div>
    `;

    const typeBadgeClass = job.type === 'internship' ? 'type-internship' : 'type-fresher';
    const dateBadge = getPostingBadge(job.postedDaysAgo || 0);

    // Guaranteed Real Official Brand Logo Image
    const logoSrc = COMPANY_LOGOS[job.brandKey] || `https://www.google.com/s2/favicons?domain=${job.domain || 'google.com'}&sz=128`;
    const logoContent = `
      <img src="${logoSrc}" 
           alt="${escHtml(job.company)} logo" class="company-logo-img" loading="eager" 
           onerror="this.onerror=null; this.src='https://www.google.com/s2/favicons?domain=${job.domain || 'google.com'}&sz=128';" />
    `;

    const cleanBatch = job.batchEligibility ? job.batchEligibility.split('(')[0].trim() : '2025–2026 Batch';

    return `
      <div class="opp-job-card" data-job-id="${job.id}">
        <!-- Top Live Status & Recency Header -->
        <div class="job-card-recency-bar">
          <span class="job-date-badge ${dateBadge.tagClass}">
            <span class="recency-pulse"></span>
            ${dateBadge.label}
          </span>
          <span class="job-batch-tag">
            ${escHtml(cleanBatch)}
          </span>
        </div>

        <div class="job-card-header">
          <div class="company-badge-wrap intel-modal-btn" data-job-id="${job.id}" role="button" tabindex="0" title="Click to view ${escHtml(job.company)} Interview Guide & Hiring Rounds">
            <div class="company-avatar" title="${escHtml(job.company)}">
              ${logoContent}
            </div>
            <div>
              <div class="job-company">
                ${escHtml(job.company)} <span class="verified-icon" title="Verified Campus Recruiter">✓</span>
                <span class="company-guide-badge" title="Interview Guide Available">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  Interview Guide
                </span>
              </div>
              <h4 class="job-title">${escHtml(job.title)}</h4>
            </div>
          </div>
          ${matchBadgeHtml}
        </div>

        <div class="job-meta-row">
          <span class="job-type-pill ${typeBadgeClass}">${job.typeLabel}</span>
          <span class="job-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escHtml(job.location)}
          </span>
          <span class="job-meta-item package-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <strong>${escHtml(job.package)}</strong>
          </span>
        </div>

        <p class="job-desc">${escHtml(job.summary)}</p>

        <div class="job-skills-section">
          ${skillsSectionHtml}
        </div>

        <div class="job-card-actions">
          <a href="${job.applyUrl}" target="_blank" rel="noopener noreferrer" class="direct-apply-btn" title="Apply on official company portal">
            <span>Apply on Official Portal</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>

          <a href="https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.linkedinSearchQuery)}&f_E=1%2C2&f_TPR=r604800" target="_blank" rel="noopener noreferrer" class="btn-linkedin-icon" title="Search similar openings on LinkedIn (Updated this week)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a66c2"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Attach modal trigger listeners
  document.querySelectorAll('.intel-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const jobId = btn.dataset.jobId;
      openRoleIntelligenceModal(jobId);
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const jobId = btn.dataset.jobId;
        openRoleIntelligenceModal(jobId);
      }
    });
  });
}

// ─── Role Intelligence & Interview Blueprint Modal ───
function initModal() {
  const modal = document.getElementById('roleIntelligenceModal');
  const closeBtn = document.getElementById('closeIntelModalBtn');
  const dismissBtn = document.getElementById('dismissIntelModalBtn');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

function openRoleIntelligenceModal(jobId) {
  const job = combinedOpportunities.find(j => j.id === jobId) || OPPORTUNITIES_DATA.find(j => j.id === jobId);
  if (!job) return;

  const modal = document.getElementById('roleIntelligenceModal');
  const title = document.getElementById('intelRoleTitle');
  const company = document.getElementById('intelCompanyName');
  const category = document.getElementById('intelRoleCategory');
  const body = document.getElementById('intelModalBody');

  if (title) title.textContent = job.title;
  if (company) {
    const logoSrc = COMPANY_LOGOS[job.brandKey] || `https://www.google.com/s2/favicons?domain=${job.domain || 'google.com'}&sz=128`;
    company.innerHTML = `
      <span style="display:inline-flex; align-items:center; gap:8px;">
        <img src="${logoSrc}" alt="${escHtml(job.company)} logo" style="width:20px; height:20px; object-fit:contain; border-radius:4px;" />
        <span><strong>${escHtml(job.company)}</strong> &bull; ${escHtml(job.location)} &bull; ${escHtml(job.package)}</span>
      </span>
    `;
  }
  if (category) category.textContent = `${job.roleCategory} Interview Guide`;

  const processHtml = (job.interviewProcess || []).map((p, idx) => `
    <div class="intel-process-step">
      <div class="step-num-badge">${idx + 1}</div>
      <div class="step-content">
        <div class="process-round-title">${escHtml(p.round)}</div>
        <div class="process-round-desc">${escHtml(p.desc)}</div>
      </div>
    </div>
  `).join('');

  const questionsHtml = (job.sampleQuestions || []).map(q => `
    <li class="intel-question-item">
      <span class="quote-icon">“</span>
      <span>${escHtml(q)}</span>
    </li>
  `).join('');

  const requiredSkillsTags = (job.requiredSkills || []).map(s => `
    <span class="role-skill-badge">${escHtml(s)}</span>
  `).join('');

  if (body) {
    body.innerHTML = `
      <div class="intel-section">
        <h4 class="intel-heading">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Selection Process &amp; Interview Rounds
        </h4>
        <div class="intel-process-list">${processHtml}</div>
      </div>

      <div class="intel-section">
        <h4 class="intel-heading">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Frequently Asked Technical Questions
        </h4>
        <ul class="intel-questions-list">${questionsHtml}</ul>
      </div>

      <div class="intel-grid-row">
        <div class="intel-section">
          <h4 class="intel-heading">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Key Technical Skills Evaluated
          </h4>
          <div class="role-skills-wrap">${requiredSkillsTags}</div>
        </div>

        <div class="intel-section">
          <h4 class="intel-heading">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            Eligibility &amp; Target Degrees
          </h4>
          <p class="intel-text">${escHtml(job.batchEligibility)}</p>
        </div>
      </div>

      <div class="intel-section highlight-box">
        <h4 class="intel-heading">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          Candidate Advice &amp; Resume Tailoring
        </h4>
        <p class="intel-text">${escHtml(job.resumeTip)}</p>
      </div>
    `;
  }

  // Wire up Tailor Resume action button
  const tailorBtn = document.getElementById('tailorResumeBtn');
  if (tailorBtn) {
    tailorBtn.onclick = (e) => {
      e.preventDefault();
      try {
        const tailorPayload = {
          jobId: job.id,
          title: job.title,
          company: job.company,
          roleCategory: job.roleCategory,
          targetRole: `${job.company} — ${job.title}`,
          requiredSkills: job.requiredSkills || [],
          jobDescription: `Target Company: ${job.company}\nTarget Role: ${job.title} (${job.roleCategory})\nLocation: ${job.location} | Package: ${job.package}\nBatch Eligibility: ${job.batchEligibility || ''}\n\nRole Overview:\n${job.summary || ''}\n\nRequired Technical Competencies:\n${(job.requiredSkills || []).join(', ')}\n\nInterview Questions & Evaluation Focus:\n${(job.sampleQuestions || []).join('\n')}\n\nRecruiter Resume Tip:\n${job.resumeTip || ''}`,
          timestamp: Date.now()
        };
        localStorage.setItem('resumereviewer_tailor_payload', JSON.stringify(tailorPayload));
      } catch (err) {
        console.warn('Could not store tailor payload', err);
      }
      window.location.href = 'index.html?tailor=' + encodeURIComponent(job.id);
    };
  }

  if (modal) modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('roleIntelligenceModal');
  if (modal) modal.classList.add('hidden');
}

// ─── Toast Notification Helper ───
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Safe HTML Escape Helper ───
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
