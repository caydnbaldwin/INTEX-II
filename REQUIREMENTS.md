# Requirements Checklist — Definition of Done

Use this as your single source of truth for what "done" means for every requirement. Check each box when the feature is implemented AND demonstrated in the video (where applicable).

---

## IS 401 — Project Management & Systems Design

### Monday — Requirements (6.5 pts)
- [ ] Scrum Master and Product Owner identified
- [ ] Two customer personas created with justification for why they are the most important users
- [ ] Journey map showing key steps, emotions, and pain points for one persona (10+ steps)
- [ ] Problem statement clearly describes the specific problem the product will solve
- [ ] MoSCoW table listing every INTEX requirement + at least 5 nice-to-have ideas + 1 feature you chose NOT to build with reasoning
- [ ] Product backlog with clear product goal and at least 12 cards
- [ ] Monday sprint backlog with sprint goal, 8+ cards, point estimates, one person assigned per card, screenshot taken before work starts
- [ ] Burndown chart set up to track all progress through the week
- [ ] Figma wireframes for 3 most important screens in desktop view

### Tuesday — Design (4 pts)
- [ ] Tuesday sprint backlog with sprint goal, 8+ cards, point estimates, one person assigned per card, screenshot taken before work starts
- [ ] 3 screenshots of each of 3 different AI-generated UI designs (9 screenshots total)
- [ ] 5 questions asked about each of the 3 UI designs with summarized takeaways
- [ ] Design decision: which UI was chosen, short paragraph justifying why, 3 changes made to original AI output
- [ ] Tech stack diagram showing logos for frontend, backend, and database technologies

### Wednesday — One Working Page (4.5 pts)
- [ ] Wednesday sprint backlog with sprint goal, 8+ cards, point estimates, one person assigned per card, screenshot taken before work starts
- [ ] Screenshots of at least 5 pages in both desktop and mobile views
- [ ] One page that is deployed to the cloud AND persists data in the database (working end-to-end)
- [ ] User feedback: showed site to a real person, watched them use it, wrote down 5 specific changes planned
- [ ] Burndown chart updated to reflect progress through Wednesday

### Thursday — Iterate (5 pts)
- [ ] Thursday sprint backlog with sprint goal, 8+ cards, point estimates, one person assigned per card, screenshot taken before work starts
- [ ] OKR metric tracked and displayed in the app with explanation of why it's the most important measure of success
- [ ] Lighthouse accessibility score of 90%+ on every page
- [ ] Every page resizes appropriately for desktop and mobile
- [ ] Retrospective completed: each person wrote 2 going well + 2 could be better + personal greatest contribution; team reflected on how well solution solves the customer problem

---

## IS 413 — Enterprise Application Development

### Tech Stack (Required — No Alternatives)
- [ ] Backend: .NET 10 / C#
- [ ] Frontend: React / TypeScript (Vite)
- [ ] Database: Azure SQL Database, MySQL, or PostgreSQL (relational)
- [ ] App and database both deployed to cloud

### Public Pages (Non-Authenticated)

#### Home / Landing Page
- [ ] Modern, professional design
- [ ] Introduces the organization and its mission
- [ ] Clear calls to action for visitors to engage or support
- [ ] Done when: A visitor can understand what the org does and how to get involved within 10 seconds

#### Impact / Donor-Facing Dashboard
- [ ] Displays aggregated, anonymized data
- [ ] Shows organization's impact (outcomes, progress, resource use)
- [ ] Visually clear and understandable (charts/graphs, not just numbers)
- [ ] Done when: A potential donor can see measurable impact without seeing any PII

#### Login Page
- [ ] Username and password authentication
- [ ] Proper form validation (required fields, format checks)
- [ ] Error handling (wrong password, user not found)
- [ ] Done when: A user can log in, see meaningful errors on failure, and be routed to the correct portal by role

#### Privacy Policy + Cookie Consent
- [ ] GDPR-compliant privacy policy tailored to the organization (not generic boilerplate)
- [ ] Linked from footer (minimum: home page)
- [ ] GDPR-compliant cookie consent notification
- [ ] Video must state whether cookie consent is cosmetic or fully functional
- [ ] Done when: Privacy policy is accessible from every page footer, cookie banner appears on first visit

### Admin / Staff Portal (Authenticated Only)

#### Admin Dashboard
- [ ] High-level overview of key metrics
- [ ] Active residents across safehouses
- [ ] Recent donations
- [ ] Upcoming case conferences
- [ ] Summarized progress data
- [ ] Done when: An admin can see the state of the entire organization at a glance without navigating to other pages

#### Donors & Contributions
- [ ] View, create, and manage supporter profiles
- [ ] Classification by type (monetary donor, volunteer, skills contributor, etc.) and status (active/inactive)
- [ ] Track all contribution types (monetary, in-kind, time, skills, social media)
- [ ] Record and review donation activity
- [ ] View donation allocations across safehouses and program areas
- [ ] Done when: An admin can add a new supporter, record a donation, and see where funds were allocated

#### Caseload Inventory
- [ ] View, create, and update resident profiles
- [ ] All fields: demographics, case category, sub-categories, disability info, family socio-demographic profile, admission details, referral info, assigned social workers, reintegration tracking
- [ ] Filtering and searching by case status, safehouse, case category, and other key fields
- [ ] Done when: An admin can find a specific resident using filters, view her full profile, and update her case status

#### Process Recording
- [ ] Forms for entering dated counseling session notes per resident
- [ ] Captures: session date, social worker, session type (individual/group), emotional state observed, narrative summary, interventions applied, follow-up actions
- [ ] Full history of process recordings per resident displayed chronologically
- [ ] Done when: A social worker can log a session, then view the complete session history for that resident in date order

#### Home Visitation & Case Conferences
- [ ] Log home and field visits with: visit type (5 types), observations, family cooperation level, safety concerns, follow-up actions
- [ ] View case conference history and upcoming conferences per resident
- [ ] Done when: A social worker can log a visitation and view the history of visits and upcoming conferences for a resident

#### Reports & Analytics
- [ ] Donation trends over time
- [ ] Resident outcome metrics (education progress, health improvements)
- [ ] Safehouse performance comparisons
- [ ] Reintegration success rates
- [ ] Done when: An admin can view trends and comparisons across time, safehouses, and program areas with meaningful visualizations

### Code Quality
- [ ] Data validation on forms
- [ ] Error handling throughout (no unhandled crashes)
- [ ] Titles, icons, logos present
- [ ] Consistent look and feel across all pages
- [ ] Pagination on long lists
- [ ] Reasonable page load speed
- [ ] Done when: A stranger could use the app without confusion or encountering broken states

---

## IS 414 — Security (20 pts total)

**CRITICAL:** Every feature below MUST be demonstrated in the IS 414 video or it will not receive points. "We built it but forgot to show it" = 0 points.

### Confidentiality — 1.5 pts
- [ ] **(1 pt)** HTTPS/TLS on all public connections with valid certificate
  - Done when: Browser shows lock icon, no certificate warnings
- [ ] **(0.5 pt)** HTTP traffic redirects to HTTPS
  - Done when: Navigating to http://yoursite.com auto-redirects to https://

### Authentication — 5 pts
- [ ] **(3 pts)** Username/password authentication works (ASP.NET Identity)
  - Done when: A user can register, log in, log out, and stay authenticated across page navigation
- [ ] **(1 pt)** Password policies are stronger than ASP.NET Identity defaults
  - **WARNING:** Must match what was taught in class — NOT Microsoft docs defaults, NOT AI suggestions
  - Done when: Weak passwords are rejected with clear error messages
- [ ] **(1 pt)** Pages and API endpoints require auth where needed
  - Public endpoints (login, auth/me, home, privacy policy) work without auth
  - All CUD endpoints and sensitive read endpoints require auth
  - Done when: Hitting a protected API endpoint without a token returns 401/403

### Authorization (RBAC) — 1.5 pts
- [ ] **(1.5 pts)** Only admin role can Create, Update, Delete data (including API endpoints)
  - Donor role can only view own donation history and impact
  - Visitors see only public pages
  - Done when: A donor user cannot access admin endpoints; an unauthenticated user cannot access donor endpoints

### Integrity — 1 pt
- [ ] **(1 pt)** Confirmation required before deleting any data
  - Done when: Clicking delete shows a confirmation dialog; canceling prevents deletion

### Credentials — 1 pt
- [ ] **(1 pt)** Credentials stored securely, not in public repository
  - Using: .env file (gitignored), dotnet user-secrets (local), Azure App Settings (production)
  - Done when: `git log --all -p` shows zero passwords, API keys, or connection strings; video explicitly shows how secrets are managed

### Privacy — 2 pts
- [ ] **(1 pt)** Privacy policy created, customized to the organization, linked from site footer
  - Done when: Policy is accessible, reads as specific to this organization (not generic)
- [ ] **(1 pt)** GDPR cookie consent notification is fully functional
  - Done when: Banner appears on first visit, user can accept/reject, choice is persisted, video states "fully functional"

### Attack Mitigations — 2 pts
- [ ] **(2 pts)** Content-Security-Policy HTTP HEADER set properly
  - Must be a response header (NOT a meta tag)
  - Must specify only needed sources (default-src, script-src, style-src, img-src, etc.)
  - Done when: Opening DevTools → Network → Response Headers shows CSP header on page responses

### Availability — 4 pts
- [ ] **(4 pts)** Site is publicly accessible on the internet
  - Done when: Anyone with the URL can access the public pages without VPN or special access

### Additional Security Features — 2 pts (pick multiple)
- [ ] Third-party authentication (Google, Microsoft, etc.)
- [ ] Two-factor or multi-factor authentication (must have 1 admin + 1 donor WITHOUT MFA for graders)
- [ ] HSTS header enabled
- [ ] Browser-accessible cookie (NOT httponly) that saves a user setting used by React (e.g., light/dark mode)
- [ ] Data sanitization (incoming) or encoding (rendered) to prevent injection
- [ ] Both operational and identity databases deployed to real DBMS (not SQLite)
- [ ] Docker container deployment
- [ ] Other creative security features (describe in video)
- [ ] Done when: Each feature is explicitly described and demonstrated in the video

### Test Accounts Required for Submission
- [ ] Admin account WITHOUT MFA — username and password provided to graders
- [ ] Donor account WITHOUT MFA, linked to historical donations — username and password provided
- [ ] One account WITH MFA enabled — username and password provided (graders won't log in, just verify MFA is required)

---

## IS 455 — Machine Learning (20 pts total)

### Per-Pipeline Requirements

Each pipeline must be a Jupyter notebook (.ipynb) in the `ml-pipelines/` folder with a descriptive name. Each notebook must be fully executable top-to-bottom and contain ALL of the following sections:

#### 1. Problem Framing
- [ ] Clear written explanation of the business problem (not just code)
- [ ] Who in the organization cares about it and why it matters
- [ ] Explicitly state: predictive or explanatory approach
- [ ] Justify the choice using the prediction vs. explanation framework
- [ ] Done when: A non-technical reader understands what problem is being solved and why the approach was chosen

#### 2. Data Acquisition, Preparation & Exploration
- [ ] Load relevant data from CSV/database
- [ ] Visual and statistical exploration (distributions, correlations, missing values, outliers)
- [ ] Feature engineering decisions explained
- [ ] Joins across tables documented with logic explained
- [ ] Built as a reproducible pipeline (not one-off script)
- [ ] Done when: Running the notebook from scratch produces the same prepared dataset every time

#### 3. Modeling & Feature Selection
- [ ] Build both a causal/explanatory model AND a predictive model
- [ ] Compare multiple approaches where appropriate
- [ ] Justify feature selection (feature importance, selection techniques, or domain reasoning)
- [ ] Hyperparameter tuning if relevant
- [ ] Done when: At least 2 models compared with clear reasoning for final selection

#### 4. Evaluation & Interpretation
- [ ] Proper validation (train/test split or cross-validation)
- [ ] Appropriate metrics for the problem type
- [ ] Results interpreted IN BUSINESS TERMS (not just R² or accuracy)
- [ ] Discussion of real-world consequences of false positives and false negatives for this organization
- [ ] Done when: A stakeholder could understand what the model means for their decisions

#### 5. Causal and Relationship Analysis
- [ ] Written analysis of relationships discovered in data
- [ ] Most important features identified with reasoning
- [ ] Discussion of whether relationships are causal or correlational
- [ ] Honest about limitations
- [ ] Done when: Reader understands what drives the outcomes and what claims are defensible vs. speculative

#### 6. Deployment Notes
- [ ] Brief description of how model is deployed and integrated into the web app
- [ ] API endpoint, dashboard component, or interactive form referenced
- [ ] Code snippets or repo references for integration code
- [ ] Done when: A developer could find and understand the integration code from this description

### Overall ML Requirements
- [ ] As many complete pipelines as possible (quality over quantity, but both matter)
- [ ] Each pipeline addresses a DIFFERENT business problem
- [ ] Variety of modeling approaches across pipelines (at least 1 predictive + 1 explanatory)
- [ ] All notebooks are fully executable (TA can run top-to-bottom)
- [ ] Data paths correct relative to repository structure
- [ ] Model outputs integrated into deployed web application (predictions, dashboards, interactive tools)
- [ ] Done when: ML insights are visible and useful in the live app, not just in notebooks

### ML Evaluation Criteria
| Stage | What Graders Look For |
|---|---|
| Problem Framing | Business problem clearly stated, matters to org, predictive vs. explanatory justified |
| Data Prep & Exploration | Thorough exploration, missing values/outliers handled, feature engineering, reproducible pipeline, joins documented |
| Modeling & Feature Selection | Appropriate model for stated goal, multiple approaches compared, feature selection justified |
| Evaluation | Appropriate metrics, proper validation, results in business terms |
| Deployment | Model deployed, accessible, integrated meaningfully, provides real value |

---

## Presentation (20% of overall INTEX grade)

- [ ] 20-minute presentation + tech demo
- [ ] Tech demo is the MOST IMPORTANT part — prioritize showing the working system
- [ ] Present to judges who are role-playing as the client
- [ ] Pitch the system as worthy of continued investment/adoption
- [ ] Highlight business problems and how you solved them
- [ ] Do NOT spend majority of time on case background (judges know it)
- [ ] Do NOT bring handouts
- [ ] Be prepared for 5 minutes of Q&A
- [ ] Done when: Judges understand what the system does, why it matters, and want to invest in it

---

## Final Submission (Friday April 10 at 10:00 AM)

- [ ] URLs submitted via Qualtrics: Website, GitHub repo (public, correct branch), .ipynb files, video links
- [ ] GitHub repository is set to PUBLIC
- [ ] Three videos submitted (IS 413, IS 414, IS 455) — each addresses only that class's requirements
- [ ] Videos are publicly accessible (YouTube unlisted, Box, Dropbox — NOT private)
- [ ] Videos are at sufficient resolution for graders to see features
- [ ] All demonstrated features are actually complete (do not pass off unfinished work as complete)
- [ ] Credentials submitted: admin (no MFA), donor with history (no MFA), account with MFA
- [ ] No typos in submitted URLs
- [ ] Peer evaluation completed by Friday April 10 at 11:59 PM

---

## Point Distribution Summary

| Component | Points | Weight |
|---|---|---|
| IS 401 — Project Management | 20 pts | ~20% |
| IS 413 — Web Application | ~20 pts (estimated) | ~20% |
| IS 414 — Security | 20 pts | ~20% |
| IS 455 — Machine Learning | 20 pts | ~20% |
| Presentation | ~20 pts | ~20% |

**Key insight:** Each class is roughly equal weight. Don't over-invest in one area at the expense of others. A working app with basic security and 3 solid ML pipelines beats a perfect app with no ML.
