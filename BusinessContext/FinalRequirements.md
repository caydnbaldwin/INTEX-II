# INTEX II — Final Requirements Checklist

A fully enumerated, rubric-aligned requirements list extracted from `BusinessContext/Case.md`. Use this to audit whether the team would earn 100% across all four classes (IS 401, IS 413, IS 414, IS 455) plus the Final Deliverable and Presentation. Each line is either a hard requirement (must be present), a rubric-scored item (with point value), or a submission/process requirement.

**Organization:** Safe Haven (nonprofit safehouse platform for abuse/trafficking survivors)
**Final Due:** Friday, April 10, 2026 at 10:00 AM (submission); presentations begin 12:00 PM
**Branch:** `feat/frontend` (merging into `main`)

---

## Part 1 — IS 401: Project Management & Systems Design

Four one-day sprints (Mon–Thu) with Figjam board deliverables, plus Friday final.

### Monday — Requirements (6.5 pts)
- [ ] **Figjam board** — Copy template, submit link through IS 401 Learning Suite on Monday
- [ ] **Roles** — Identify a Scrum Master and a Product Owner
- [ ] **Customer personas** — Two realistic personas representing the two most important target users, with justification
- [ ] **Journey map** — Key steps users take today and their pain points
- [ ] **Problem statement** — Clear description of the specific problem the product solves
- [ ] **MoSCoW table** — Every requirement listed plus at least 5 "nice-to-have" ideas; identify one feature chosen NOT to build and why
- [ ] **Product backlog** — Clear product goal plus at least 12 backlog cards
- [ ] **Sprint "Monday" backlog** — Sprint goal + at least 8 cards, each with a point estimate and exactly one assignee; screenshot before starting Monday work
- [ ] **Burndown chart** — Set up to track progress all week
- [ ] **Figma wireframe** — Team brainstorm + desktop wireframes for the 3 most important screens

### Tuesday — Design (4 pts)
- [ ] **Sprint "Tuesday" backlog** — Goal + ≥8 cards, each with points and one assignee; screenshot before starting
- [ ] **AI-generated UI options** — 3 screenshots of each of 3 different UI designs (9 total); 5 questions asked of AI per design; 1–2 sentence takeaway per design
- [ ] **Design decision** — State which UI was chosen; paragraph justification; list 3 changes made to original AI output
- [ ] **Tech stack diagram** — Logos for chosen frontend, backend, and database technologies

### Wednesday — One Working Page (4.5 pts)
- [ ] **Sprint "Wednesday" backlog** — Goal + ≥8 cards, each with points and one assignee; screenshot before starting
- [ ] **Current state screenshots** — At least 5 pages shown in both desktop AND mobile views
- [ ] **One working page** — Deployed to cloud and persists data in the database
- [ ] **User feedback** — Show site to a real person matching target persona; document 5 specific planned changes based on their feedback
- [ ] **Burndown chart** — Updated to reflect current week-so-far progress

### Thursday — Iterate (5 pts)
- [ ] **Sprint "Thursday" backlog** — Goal + ≥8 cards, each with points and one assignee; screenshot before starting
- [ ] **OKR metric** — Track and display one meaningful metric in the app; explain why it is the most important success measure
- [ ] **Accessibility** — Lighthouse accessibility score ≥ 90% on EVERY page
- [ ] **Responsiveness** — Every page resizes appropriately for desktop and mobile
- [ ] **Retrospective** — Per person: ≥2 things going well, ≥2 things that could be better, personal greatest contribution; team reflection on how well the solution solves the customer problem

---

## Part 2 — IS 413: Enterprise Application Development (20 pts)

Built with **.NET 10 / C#** backend and **React / TypeScript (Vite)** frontend. Database: Azure SQL / MySQL / PostgreSQL. App and database must both be deployed. Use good DB design. Validate data and handle errors. Attention to finishing touches: titles, icons, logos, consistent look, pagination, speed.

### Core Rubric Items

| # | Requirement | Points |
|---|---|---|
| 1 | App compiles and runs without errors | 1 |
| 2 | Modern, professional, well-organized UI with consistent branding/navigation | 1 |
| 3 | Home / Landing page introduces the organization and gives clear calls to action | 1 |
| 4 | Login page works with proper validation and error handling | 1 |
| 5 | Privacy policy page present AND cookie consent visible | 1 |
| 6 | Public impact / donor-facing dashboard shows anonymized, aggregated impact data | 2 |
| 7 | Donor dashboard: authenticated donor can view donation history AND submit a fake donation | 1 |
| 8 | Admin dashboard provides a high-level operational summary for staff | 2 |
| 9 | Donors & Contributions page: staff can view, create, and manage supporters and contributions | 2 |
| 10 | Caseload Inventory: staff can view, create, update, search, and filter resident records | 1 |
| 11 | Process Recording: staff can enter and view dated session notes chronologically | 1 |
| 12 | Home Visitation & Case Conferences: log visits AND view case conference history/upcoming | 1 |
| 13 | Reports & Analytics: meaningful charts/summaries for donations, outcomes, or safehouse/program performance | 1 |
| 14 | At least one additional page or feature required by the case is implemented and usable | 2 |
| 15 | Database is deployed **separately** from the app | 1 |
| 16 | Data validation, error handling, and code quality present throughout | 0 (graded for baseline quality) |
| **BONUS** | Advanced or impressive use of React/.NET features | up to +1 |
| **Total** | | **20** |

### Detailed Page/Feature Requirements (from the narrative, not the rubric table)

**Public (non-authenticated):**
- [ ] Home / Landing page — modern, professional, introduces mission, clear CTAs
- [ ] Impact / Donor-Facing Dashboard — aggregated, **anonymized** data (outcomes, progress, resource use), visually clear
- [ ] Login page — username/password, validation, error handling
- [ ] Privacy Policy + Cookie Consent (links from footer at minimum on home)

**Donor role:**
- [ ] Donor Dashboard — donate (fake donation recorded in DB) AND view donation history

**Admin / Staff (authenticated):**
- [ ] **Admin Dashboard** — high-level overview: active residents across safehouses, recent donations, upcoming case conferences, summarized progress (the "command center")
- [ ] **Donors & Contributions** — view/create/manage supporter profiles (classification by type and status Active/Inactive); track all donation types (Monetary, InKind, Time, Skills, SocialMedia); record/review donation activity; view donation allocations across safehouses and program areas
- [ ] **Caseload Inventory** — full CRUD on residents including demographics, case category/sub-categories (trafficked, physical abuse, neglected, etc.), disability, 4Ps/solo parent/indigenous/informal settler info, admission, referral, assigned social workers, reintegration; filter/search by case status, safehouse, case category, other key fields
- [ ] **Process Recording** — form to enter dated session notes per resident (session date, social worker, session type Individual/Group, emotional state, narrative, interventions, follow-up); view full chronological history
- [ ] **Home Visitation & Case Conferences** — log visits with visit type (Initial Assessment / Routine Follow-Up / Reintegration Assessment / Post-Placement Monitoring / Emergency), observations, family cooperation level, safety concerns, follow-up; view case conference history + upcoming conferences per resident
- [ ] **Reports & Analytics** — donation trends over time, resident outcome metrics (education, health), safehouse performance comparisons, reintegration success rates; consider aligning to Philippine Annual Accomplishment Report format (caring, healing, teaching; beneficiary counts; program outcomes)
- [ ] **Misc / additional pages** to support security, social media, accessibility, partner features, etc.

### Tech Stack Constraints
- [ ] Backend: .NET 10 / C#
- [ ] Frontend: React + TypeScript + Vite
- [ ] Database: Azure SQL, MySQL, or PostgreSQL (security DB may live separately)
- [ ] App deployed publicly
- [ ] Database deployed (separately from app for rubric point)
- [ ] Good DB design principles
- [ ] Pagination, speed, consistent look, icons, titles, logos all polished

---

## Part 3 — IS 414: Security (20 pts)

**CRITICAL:** Every security feature MUST be demonstrated clearly in the submitted video. Features not shown in the video are treated as not existing — no appeals.

### Rubric Items

| # | Requirement | Points |
|---|---|---|
| 1 | Confidentiality: HTTPS/TLS used for all public connections (valid cert) | 1 |
| 2 | Confidentiality: HTTP redirects to HTTPS | 0.5 |
| 3 | Auth: username/password authentication (ASP.NET Identity or equivalent) | 3 |
| 4 | Auth: better passwords than default — per IS 414 class instruction | 1 |
| 5 | Auth: pages and API endpoints require auth where needed (login/auth-me open; CUD and most R require auth) | 1 |
| 6 | RBAC: only admin can CUD (including endpoints) | 1.5 |
| 7 | Integrity: confirmation required to delete data | 1 |
| 8 | Credentials: stored securely; not in public repo | 1 |
| 9 | Privacy: privacy policy created and added to site (customized) | 1 |
| 10 | Privacy: GDPR cookie consent notification fully functional | 1 |
| 11 | Attack mitigation: CSP header set properly (HTTP header, not meta tag) | 2 |
| 12 | Availability: deployed publicly | 4 |
| 13 | Additional security features | 2 |
| **Total** | | **20** |

### Detailed Requirements

**Confidentiality / Encryption**
- [ ] HTTPS on all public connections
- [ ] Valid TLS certificate (cloud-provided subdomain cert is fine)
- [ ] HTTP → HTTPS redirect configured

**Authentication**
- [ ] Username/password authentication (ASP.NET Identity recommended)
- [ ] Identity database may be SQLite or full DB server (preferably not SQLite for bonus)
- [ ] Unauthenticated visitors can browse home (and other non-auth pages)
- [ ] Authenticated users can view IS 413 pages gated by role
- [ ] `PasswordOptions` configured to be stronger than default, **matching the exact policy taught in IS 414 class/lab** (per user memory: 14 characters, no complexity requirements — this matches the course instruction, do not change)
- [ ] `/login` and `/auth/me` endpoints do NOT require auth
- [ ] All CUD endpoints require auth
- [ ] Most R (read) endpoints require auth (default to most-restrictive unless it breaks functionality)

**RBAC Authorization**
- [ ] Admin role — can add/modify/delete data
- [ ] Donor role — can see only their own donor history and impact
- [ ] Anonymous — can see home page, privacy policy, and other public pages
- [ ] Optional separate staff/employee role distinct from admin
- [ ] Only admin role can CUD on the API (not just UI hiding)

**Integrity**
- [ ] Only authorized, authenticated users can change/delete data
- [ ] Delete actions require explicit confirmation

**Credentials**
- [ ] Secrets handled via secrets manager, .env file (not in git), or OS environment variables
- [ ] No credentials committed to the public repository

**Privacy**
- [ ] GDPR-compliant privacy policy written, tailored to Safe Haven, linked from footer (minimum on home page)
- [ ] GDPR-compliant cookie consent notification enabled (video must state: cosmetic vs fully functional)

**Attack Mitigations**
- [ ] Content-Security-Policy **HTTP header** set (not `<meta>`); visible in dev tools inspector
- [ ] CSP defines only sources actually needed (e.g., `default-src`, `style-src`, `img-src`, `script-src`)

**Availability**
- [ ] Site publicly accessible via cloud deployment

**Additional Security Features** (pick what fits; 2 pts available)
- [ ] Third-party authentication (e.g., Google, GitHub, Microsoft)
- [ ] 2FA / MFA for at least one account type (must keep one admin and one non-admin account WITHOUT MFA for grading)
- [ ] HSTS header enabled
- [ ] Browser-accessible cookie (NOT httponly) saving a user setting that React uses to change the page (light/dark, color theme, language, etc.)
- [ ] Data sanitization (input) or output encoding (render) to prevent injection
- [ ] Both operational AND identity DBs deployed to "real" DBMS (not SQLite)
- [ ] Deploy via Docker containers (not raw VM)

### Video Documentation (REQUIRED)
- [ ] Every scored security feature clearly shown on screen
- [ ] Explicit narration of each feature with brief justification
- [ ] State whether cookie consent is cosmetic or fully functional
- [ ] State what additional security features were added and why

---

## Part 4 — IS 455: Machine Learning (20 pts)

Deliver as many **complete, quality ML pipelines** as possible, each addressing a **genuinely different** business problem. Each pipeline must cover the full end-to-end lifecycle. Quality beats quantity — a shallow pipeline will hurt, not help.

### Required Pipeline Lifecycle (per notebook)

Each `.ipynb` must include all of the following sections:

1. [ ] **Problem Framing** — Clear business problem statement, who cares, why it matters; **explicitly state predictive vs. explanatory** and justify using textbook framework; for each pipeline generate BOTH a causal and a predictive model; indicate impactful features and decision recommendations in the notebook
2. [ ] **Data Acquisition, Preparation & Exploration** — Load, EDA (distributions, correlations, missing values, outliers), feature engineering with reasoning, cross-table joins explained, built as a **reproducible pipeline** (Ch. 7), not a one-off script
3. [ ] **Modeling & Feature Selection** — Model(s) built, multiple approaches compared where appropriate, feature selection justified, hyperparameter tuning where relevant; explanatory → discuss structure/coefficients; predictive → focus on out-of-sample performance
4. [ ] **Evaluation & Interpretation** — Appropriate metrics, proper validation (train/test or cross-validation), results interpreted **in business terms**, discussion of real-world consequences of false positives/negatives
5. [ ] **Causal and Relationship Analysis** — Written analysis of discovered relationships, most important features and why, whether causal claims are defensible, honest on correlation vs causation, demonstrates prediction vs explanation understanding
6. [ ] **Deployment Notes** — How the model integrates into the web app (API endpoint, dashboard, interactive tool); code snippets or repo references

### Per-Pipeline Rubric Criteria
- [ ] **Problem framing** — Business problem clearly stated; matters to the org; predictive vs explanatory explicitly justified
- [ ] **Data acquisition/prep/exploration** — Thorough exploration; missing values, outliers, feature engineering handled well; reproducible pipeline; joins correct and documented
- [ ] **Modeling & feature selection** — Model matches stated goal; multiple approaches considered/compared; feature selection thoughtful and justified
- [ ] **Evaluation & selection** — Appropriate metrics; proper validation; results interpreted in business terms
- [ ] **Deployment & integration** — Deployed, accessible, integrated into the web app meaningfully, provides real user value

### Submission Requirements
- [ ] All notebooks in repo folder `ml-pipelines/`
- [ ] Descriptively named (e.g., `donor-churn-classifier.ipynb`, `reintegration-readiness.ipynb`)
- [ ] Each notebook self-contained and fully executable top-to-bottom
- [ ] Data paths correct relative to repo structure
- [ ] Each pipeline addresses a genuinely different business problem (not the same problem with different algorithms)
- [ ] Each pipeline should ideally include at least one predictive AND one explanatory model across the portfolio
- [ ] Model outputs surfaced in the deployed web application (predictions, dashboards, interactive tools)

### Candidate Business Problems (from case context)
- Donor churn / lapse prediction
- Donor upgrade potential (which donors would give more if asked)
- Reintegration readiness prediction
- "Girls at risk of falling through the cracks" early warning
- Social media post effectiveness → donation conversion
- Optimal post time/platform/content recommendation
- Safehouse performance drivers (explanatory)
- Intervention effectiveness analysis

---

## Part 5 — Final Deliverable Submission

**Due:** Friday April 10, 2026 at **10:00 AM** (morning of presentations)
**Location:** Qualtrics form (link in Case.md)

- [ ] **Group info** — correct group number and members
- [ ] **URLs (no typos!)**
  - [ ] Deployed website URL
  - [ ] GitHub repo URL **linked to the correct branch**
  - [ ] `.ipynb` files (or Azure ML Designer screenshot) for each pipeline
  - [ ] Video walkthrough links
- [ ] **GitHub repo set to PUBLIC** for grading
- [ ] **Video Summaries** — separate video per class (IS 413, IS 414, IS 455); each demonstrates all requirements for THAT class only
  - [ ] Hosted publicly (YouTube, Box, Dropbox, etc.) — not private
  - [ ] Succinct (no rambling)
  - [ ] High enough resolution to see features clearly
  - [ ] Each requirement clearly demonstrated on screen
  - [ ] Honest about anything not finished
- [ ] **User Credentials** provided for grading:
  - [ ] Admin user WITHOUT MFA
  - [ ] Donor user WITHOUT MFA, connected to historical donations
  - [ ] One account (admin or donor) WITH MFA enabled (graders won't log in, just verify MFA requirement)

---

## Part 6 — Peer Evaluation & Presentation

### Peer Evaluation
- [ ] All team members complete INTEX2 Peer Eval by **Friday April 10 at 11:59 PM** (required for INTEX grade)

### Presentation (20% of overall INTEX score)
- [ ] Verify correct room and time slot on presentation day
- [ ] Presentation + tech demo: 20 min
- [ ] Q&A: 5 min
- [ ] Judge deliberation (wait in hall): 5 min
- [ ] Feedback: 5–10 min
- [ ] NO handouts
- [ ] Pitch Safe Haven as worthy of continued investment
- [ ] Prioritize tech demo (most important part)
- [ ] Don't spend majority on case background
- [ ] Highlight business problems and how the solution solves them
- [ ] Creativity beyond minimum requirements emphasized

---

## Summary Scorecard

| Class | Points | Status |
|---|---|---|
| IS 401 — PM & Systems Design (Mon + Tue + Wed + Thu) | 6.5 + 4 + 4.5 + 5 = **20** | |
| IS 413 — Enterprise App Dev | **20** (+1 bonus) | |
| IS 414 — Security | **20** | |
| IS 455 — Machine Learning | **20** | |
| Presentation | **20% of total** | |
| Peer Eval | Gate (no grade without) | |

---

## Audit Method

To systematically check for 100%, walk through this document top-to-bottom and mark each checkbox as one of:
- ✅ Done and verifiable in deployed app / video / repo
- ⚠️ Partially done (note what's missing)
- ❌ Not started
- N/A Not applicable (justify)

Every ⚠️ and ❌ is a potential point loss. For security and ML items in particular, verify the item is **demonstrated in the class-specific video** — undocumented work is treated as missing.
