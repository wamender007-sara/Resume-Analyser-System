# ResumeAI: An Intelligent, Client-Side Resume Analyser and Conversational Career Optimization Assistant

## Project Abstract and Technical Documentation

---

### 1. Executive Summary
In the contemporary recruitment landscape, over 75% of resumes are filtered out before reaching a human recruiter due to automated Applicant Tracking Systems (ATS) and misaligned keyword profiles. Job applicants often struggle with identifying structural weaknesses, quantifying achievements, and targeting specific job roles effectively.

**ResumeAI** is an interactive, browser-native web platform designed to bridge this gap. Powered by Google's large language model (Gemini API) and client-side document processing (PDF.js), the system provides instant, comprehensive, and multi-dimensional resume evaluations accompanied by an embedded, context-aware conversational AI career coach.

---

### 2. Problem Statement
* **ATS Disqualification:** Candidates frequently use non-standard templates, missing essential industry keywords and proper heading structures, leading to premature rejection by automated screening pipelines.
* **Vague & Qualitative Feedback:** Traditional resume evaluation tools offer superficial spell-checks or rigid keyword counts without understanding role relevance, career progression, or measurable metrics.
* **Lack of Actionable Guidance:** Existing tools diagnose issues but do not assist candidates in rewriting weak bullet points, restructuring content, or preparing for job-specific expectations.
* **Data Privacy & Server Overhead:** Many cloud solutions store personal contact information and career history on external databases, introducing data compliance concerns and operational server expenses.

---

### 3. Proposed Solution & Architecture
ResumeAI introduces a **decentralized, privacy-first, serverless web application** where all document parsing, rendering, and API communication occur directly in the user’s browser.

#### Key Modules:
1. **In-Browser Document Extraction Engine:**
   * Leverages **PDF.js** to parse text streams, layout blocks, and characters directly from `.pdf`, `.docx`, and `.txt` files without uploading files to an intermediate backend server.
2. **Deterministic & Structured LLM Evaluation Engine:**
   * Evaluates resume content using strict JSON schemas sent via authenticated Gemini API endpoints.
   * Computes an overall score (0–100), letter grade, and section-by-section breakdown (Contact Information, Professional Summary, Work Experience, Technical/Soft Skills, Education, Certifications, and Projects).
   * Diagnoses critical gaps: **Strengths**, **Missing/Weak Sections**, **ATS Compatibility Warnings**, and **Prioritized Severity Weaknesses** (High/Medium/Low).
   * Generates customized keyword recommendations based on target job roles (e.g., Software Engineer, Data Analyst, Cloud Architect).
3. **Embedded Co-Pilot (Context-Aware Assistant):**
   * A side-by-side interactive chatbot maintaining stateful conversation history.
   * Injects the applicant's resume content into the prompt context to perform real-time bullet-point rewrites (e.g., using the **STAR method**), compose professional summaries, and suggest strategic improvements.
4. **Resilience & Fault Tolerance:**
   * Built-in exponential backoff retry algorithms to handle network fluctuations, rate limits (`429`), and temporary upstream server load (`503`).
   * Browser-local credential storage (`localStorage`) supporting modern API key formats (`AIza...` and `AQ...`).

---

### 4. Technical Specifications

| Metric / Aspect | Implementation Details |
|---|---|
| **Frontend Stack** | Semantic HTML5, Vanilla JavaScript (ES6+ Modules), CSS3 (Custom Variables) |
| **Design Paradigm** | Dark-mode glassmorphism (`backdrop-filter: blur`), responsive CSS Grid/Flexbox |
| **Document Parser** | Mozilla PDF.js (CDN-integrated) |
| **AI/LLM Model** | Google Gemini API (Generative Language REST interface) |
| **Data Privacy** | 100% Client-side processing; zero persistent server database; keys stored in `localStorage` |
| **Visual Indicators** | Dynamic animated SVG radial gauges, CSS animated score bars, skeleton shimmer loaders |

---

### 5. Key System Features
* **Multi-Format Input:** Drag-and-drop file uploader (PDF/DOCX/TXT) and manual text paste with live character/word counters.
* **Role-Targeted Optimization:** Optional target job title field to tailor analysis and keyword suggestions to specific market requirements.
* **Visual Score Metrics:** Real-time animated score ring displaying overall rating, ATS compliance badge, and categorized action lists.
* **Step-by-Step Action Plan:** Numbered, prioritized improvement checklist ordered by impact.
* **Side-by-Side Co-Pilot:** Real-time conversational assistant for iterative resume editing and interview preparation questions.

---

### 6. Significance & Future Scope
ResumeAI democratizes executive-tier career coaching by putting an intelligent, real-time feedback loop directly into job seekers' browsers.
* **Future Enhancements:**
  * Direct side-by-side Job Description (JD) comparison with match percentage calculations.
  * Automated one-click PDF export of rewritten resumes using clean, ATS-compliant LaTeX or HTML templates.
  * Multi-language resume parsing and international localization support.
