# Product Requirements Document (PRD)

## Project: Safe Haven — Nonprofit Safe Home Management Platform

**Team:** INTEX II — BYU IS Program, Winter 2026
**Due:** Friday, April 10, 2026 at 10:00 AM
**Client:** New nonprofit modeled after Lighthouse Sanctuary (Philippines-based 501(c)(3))

---

## 1. Background & Mission

Lighthouse Sanctuary operates safe homes for girls (ages 12-18) who are survivors of sexual abuse, trafficking, and exploitation in the Philippines — a global hotspot for online sexual abuse of children (cases rose 265% during COVID-19 in 2021 alone). The organization currently runs 2 shelters and has served over 150 survivors.

Girls live in the safehouses full-time. Each child receives holistic care: food, shelter, education, counseling, church activities, and a path toward reintegration. The organization is entirely donor-funded, has no dedicated tech or marketing staff, and relies on in-country partners for service delivery.

Our client is launching a similar organization and needs a technology platform to run it effectively from day one.

---

## 2. Problem Statement

The organization's leadership juggles case management, donor relations, and social media outreach using spreadsheets, paper files, WhatsApp, and memory. This leads to three critical failures:

1. **Girls fall through the cracks** — No centralized view of resident progress, risk levels, or intervention effectiveness across safehouses.
2. **Donors lapse without warning** — No system to track donor engagement, predict churn, or connect donations to measurable outcomes.
3. **Social media effort is wasted** — No data on which platforms, content types, or posting times drive actual donations vs. vanity engagement.

---

## 3. Current Data Landscape

The organization tracks data across 17 tables in 3 domains:

### Operational Scale
- **9 active safehouses** across 3 regions: Luzon (2), Visayas (4), Mindanao (3)
- **60 residents** — 30 Active, 19 Closed, 11 Transferred
- **Total capacity:** 85 girls across all safehouses
- **Case categories:** Surrendered (21), Abandoned (18), Foundling (11), Neglected (10)
- **Risk levels:** Low (34), Medium (20), High (5), Critical (1)
- **Reintegration status:** In Progress (21), Completed (19), On Hold (13), Not Started (7)

### Case Management Volume
- **2,819 process recordings** (counseling sessions) — ~47 per resident average
- **1,337 home visitations** — Routine Follow-Up (542), Reintegration Assessment (316), Initial Assessment (233), Post-Placement Monitoring (182), Emergency (64)
- **534 education records** — monthly per resident, across 4 programs (Bridge, Secondary, Vocational, Literacy)
- **534 health/wellbeing records** — monthly per resident, tracking BMI, nutrition, sleep, energy, checkups
- **180 intervention plans** — across 6 categories (Safety, Psychosocial, Education, Physical Health, Legal, Reintegration)
- **100 incident reports** — 29 unresolved; types include RunawayAttempt (29), Behavioral (20), SelfHarm (14), Security (16)

### Donor & Outreach
- **60 supporters** across 6 types — MonetaryDonor (17), InKindDonor (15), SocialMediaAdvocate (10), Volunteer (8), SkillsContributor (6), PartnerOrganization (4); 45 Active, 15 Inactive
- **420 donations** — Monetary (234), InKind (98), Time (46), SocialMedia (23), Skills (19); 211 recurring, 209 one-time
- **4 named campaigns:** Year-End Hope (60 donations), Summer of Safety (35), Back to School (32), GivingTuesday (18); 275 donations outside campaigns
- **Acquisition channels:** WordOfMouth (14), SocialMedia (13), Website (13), Event (8), Church (6), PartnerReferral (6)
- **812 social media posts** across 7 platforms — Facebook (199), Instagram (164), Twitter (117), WhatsApp (93), TikTok (89), LinkedIn (79), YouTube (71)
- **673 posts** (83%) generated at least one donation referral
- **Post types:** ImpactStory (203), Campaign (156), EventPromotion (131), ThankYou (118), EducationalContent (114), FundraisingAppeal (90)

### Supporting Data
- **30 partners** (Education, Evaluation, SafehouseOps, Logistics, etc.) with 48 assignments
- **450 safehouse monthly metric records** — pre-aggregated operational snapshots
- **50 public impact snapshots** — monthly anonymized reports for donor communication
- **521 donation allocations** — mapping donations to safehouses and program areas

---

## 4. Target Users & Roles

| Role | Description | Access Level |
|---|---|---|
| **Admin** | Founder/director — manages all operations, donors, social media, reporting | Full CRUD on all data |
| **Staff / Social Worker** | Day-to-day case management — sessions, visitations, incident reports | CRUD on case management data, read on donor/analytics |
| **Donor** | Supporter who has donated — wants to see their history and impact | Read-only on own donation history and anonymized impact data |
| **Visitor** | Unauthenticated public user | Landing page, public impact dashboard, privacy policy |

---

## 5. Tech Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React + TypeScript (Vite) | Required by IS 413 |
| **Frontend Hosting** | Vercel | Zero-config CI/CD for Vite; auto-deploys on push to `main`; generous free tier. Per INITIAL-SETUP.md. |
| **Backend** | .NET 10 / C# | Required by IS 413 |
| **Backend Hosting** | Azure App Service (Linux, B1 tier) | Team has Azure credits and class experience. B1 avoids cold-start issues of free tier (~$13/month). Per INITIAL-SETUP.md. |
| **Auth** | ASP.NET Identity | Required by IS 414; supports RBAC, password policies, optional MFA and third-party auth |
| **Operational Database** | Azure SQL Database (Basic tier) | Azure-native, works seamlessly with EF Core. ~$5/month. Per INITIAL-SETUP.md. |
| **Identity Database** | Azure SQL Database (separate) | Earns additional security points for non-SQLite identity store |
| **ORM** | Entity Framework Core + CsvHelper (for seeding) | Models map 1:1 to CSV columns; CsvHelper handles parsing. Per INITIAL-SETUP.md. |
| **ML Model Serving** | Python (scikit-learn) exported models → predictions written to Azure SQL table, read by .NET API | Simplest deployment: no Python runtime in production. Notebooks re-run to refresh predictions. |
| **CI/CD (Backend)** | GitHub Actions → Azure App Service | Auto-deploys on push to `main` when `Backend/**` changes. Publish profile stored as GitHub Secret. Per INITIAL-SETUP.md. |
| **CI/CD (Frontend)** | Vercel (automatic) | Auto-deploys on push to `main` when `Frontend/**` changes. No workflow file needed. Per INITIAL-SETUP.md. |
| **SSL** | Azure-provided TLS certificate (backend), Vercel-provided TLS (frontend) | Both provide HTTPS by default on their subdomains |

### Repository Structure

```
repo-root/
├── Backend/                    # .NET 10 API
│   ├── Controllers/
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   ├── DataSeeder.cs
│   │   └── SeedData/           # CSV files copied here
│   ├── Models/                 # One file per table (17 models)
│   ├── Migrations/             # EF Core auto-generated
│   ├── Program.cs
│   └── Backend.csproj
├── Frontend/                   # React + TypeScript (Vite)
│   ├── src/
│   ├── .env                    # Local only (gitignored)
│   ├── .env.example            # Committed — documents required vars
│   └── package.json
├── ml-pipelines/               # Jupyter notebooks (one per pipeline)
├── lighthouse_csv_v7/          # Source CSV data
├── .github/
│   └── workflows/
│       └── deploy-backend.yml  # GitHub Actions → Azure
├── .gitignore
├── PRD.md
└── INITIAL-SETUP.md
```

### Secrets Management

Secrets live in exactly two places — never in the repository:

| Environment | Backend Secrets | Frontend Secrets |
|---|---|---|
| **Local** | `dotnet user-secrets` | `.env` file (gitignored) |
| **Production** | Azure App Service Application Settings | Vercel Environment Variables |

The connection string format for Azure SQL:
```
Server=<server>.database.windows.net;Database=intexdb;User Id=sqladmin;Password=<password>;TrustServerCertificate=False;Encrypt=True;
```

### CORS Configuration

The backend `Program.cs` must whitelist both frontend origins:
```csharp
.WithOrigins(
    "http://localhost:4200",        // local dev
    "https://<app>.vercel.app"      // production
)
```

---

## 6. Pages & Features

### 6.1 Public (Non-Authenticated)

#### Home / Landing Page
- Organization name, mission statement, and branding
- Clear calls to action (donate, learn more, login)
- Brief impact highlights pulled from `public_impact_snapshots`
- Footer with privacy policy link
- GDPR-compliant cookie consent banner (fully functional — not just cosmetic)

#### Impact / Donor-Facing Dashboard
- Aggregated, anonymized outcome data from `public_impact_snapshots` and `safehouse_monthly_metrics`
- Visualizations: residents served over time, education progress, health improvements, reintegration success rates
- NO personally identifiable resident information
- Designed to show donors how their money translates to real outcomes

#### Login Page
- Username/password authentication via ASP.NET Identity
- Proper validation and error handling
- Optional: third-party auth (Google, Microsoft) for additional security points
- Route to Admin Dashboard or Donor Portal based on role

#### Privacy Policy
- GDPR-compliant, tailored to the organization
- Linked from footer on every page (minimum: home page)
- Covers: what data is collected, how it's used, who it's shared with, user rights

### 6.2 Admin / Staff Portal (Authenticated)

#### Admin Dashboard
- **Active residents by safehouse** — counts, capacity vs. occupancy for all 9 safehouses
- **Risk level summary** — highlight High (5) and Critical (1) residents
- **Unresolved incidents** — 29 currently unresolved, surface these prominently
- **Recent donations** — latest activity, recurring vs. one-time breakdown
- **Upcoming case conferences** — from `intervention_plans.case_conference_date`
- **ML-powered alerts** — at-risk residents, at-risk donors (from ML pipelines)
- **OKR metric display** — one key metric (e.g., reintegration success rate, donor retention rate)

#### Caseload Inventory
- **List view** with filtering/search by: case status, safehouse, case category, risk level, reintegration status, assigned social worker
- **Create/Edit resident profiles** — all fields from `residents` table (40+ fields):
  - Demographics, case category, sub-categories (trafficked, sexual abuse, OSAEC, etc.)
  - Family socio-demographic profile (4Ps, solo parent, indigenous, informal settler)
  - Admission details, referral source, assigned social worker
  - Reintegration type and status
  - Risk level (initial and current)
- **Detail view** — single resident showing full profile plus linked records (sessions, visitations, education, health, incidents, intervention plans)
- **Delete with confirmation dialog** (admin only)

#### Process Recording
- **Session entry form:** session date, social worker, type (Individual/Group), duration, emotional state start/end (8 options each), narrative, interventions applied, follow-up actions, progress noted, concerns flagged, referral made
- **Chronological session history** per resident — 2,819 records across all residents
- **Emotional state trend visualization** — track progression over time per resident
- **Filter by:** resident, social worker, date range, concerns flagged

#### Home Visitation & Case Conferences
- **Visitation log form:** visit date, social worker, visit type (5 types), location, family members present, purpose, observations, cooperation level (4 levels), safety concerns, follow-up needed, outcome (Favorable/Needs Improvement/Unfavorable/Inconclusive)
- **Visitation history per resident** — chronological, with cooperation trend visible
- **Case conference view** — linked from `intervention_plans.case_conference_date`, showing plans discussed and their current status

#### Donors & Contributions
- **Supporter list** — filterable by type, status, acquisition channel, region
- **Create/Edit supporter profiles** — all fields from `supporters` table
- **Donation activity view** — all donation types (Monetary, InKind, Time, Skills, SocialMedia) with campaign attribution
- **Donation allocations** — how funds are distributed across safehouses and program areas
- **In-kind donation item details** — item-level breakdown with category, quantity, condition
- **ML-powered insights** — churn risk score, propensity to give more (from ML pipelines)

#### Reports & Analytics
- **Donation trends** — over time, by campaign, by channel source, recurring vs. one-time
- **Resident outcome metrics** — education progress, health score trends, emotional state trends
- **Safehouse performance comparison** — occupancy, education progress, health scores, incident rates across all 9 safehouses
- **Reintegration success rates** — by type (Family Reunification, Foster Care, Adoption, Independent Living)
- **Social media effectiveness** — which platform/content type/posting time drives donations vs. just engagement
- **Annual Accomplishment Report format** — aligned with Philippine social welfare agency structure: services provided (Caring, Healing, Teaching), beneficiary counts, program outcomes

### 6.3 Donor Portal (Authenticated — Donor Role)

- **Personal donation history** — all past donations with dates, amounts, types, campaigns
- **Impact of donations** — anonymized view of how their contributions were allocated and what outcomes resulted
- Read-only; no ability to modify data

---

## 7. Machine Learning Pipelines

Each pipeline follows the full lifecycle: Problem Framing, Data Prep, Exploration, Modeling, Evaluation, Feature Selection, Deployment.

### Pipeline 1: Donor Churn Predictor (Predictive)
- **Business question:** Which active donors are at risk of becoming inactive?
- **Target variable:** Donor status transition to Inactive (15 currently inactive out of 60)
- **Key features:** Donation frequency, recency, amount trends, donation type, acquisition channel, campaign participation, recurring vs. one-time, social media referral history
- **Data sources:** `supporters`, `donations`, `donation_allocations`
- **Deployment:** Risk score displayed on Donors & Contributions page; flagged on Admin Dashboard
- **Business value:** Enables proactive outreach to at-risk donors before they lapse

### Pipeline 2: Resident Risk / Regression Predictor (Predictive)
- **Business question:** Which residents are at risk of regression or escalating risk level?
- **Target variable:** Risk level change (initial vs. current), incident occurrence, concerns flagged in sessions
- **Key features:** Emotional state trends (from process recordings), education attendance/progress, health scores, incident history, session frequency, visitation outcomes, intervention plan status
- **Data sources:** `residents`, `process_recordings`, `education_records`, `health_wellbeing_records`, `incident_reports`, `intervention_plans`, `home_visitations`
- **Deployment:** Risk alerts on Admin Dashboard; risk indicator on Caseload Inventory detail view
- **Business value:** Directly addresses "girls falling through the cracks" — the organization's core fear

### Pipeline 3: Social Media Donation Driver (Explanatory + Predictive)
- **Business question:** What social media post attributes actually drive donations (not just engagement)?
- **Target variable:** `donation_referrals` and `estimated_donation_value_php` per post
- **Key features:** Platform, post type, media type, sentiment tone, content topic, post hour, day of week, caption length, has call to action, CTA type, features resident story, is boosted, campaign name, num hashtags
- **Data sources:** `social_media_posts`, with linkage to `donations` via `referral_post_id`
- **Deployment:** Recommendations on Reports & Analytics page (best platform, best time, best content type); could power a "post advisor" tool
- **Business value:** Turns sporadic posting into data-driven strategy — critical since social media is their only marketing channel

### Pipeline 4 (Stretch): Campaign ROI Analyzer (Explanatory)
- **Business question:** Which campaigns and channels drive the most donation value, and why?
- **Target variable:** Total donation amount per campaign
- **Key features:** Campaign name, channel source, donation type mix, recurring rate, season/timing, social media post volume during campaign
- **Data sources:** `donations`, `social_media_posts`, `donation_allocations`
- **Deployment:** Campaign comparison view in Reports & Analytics
- **Business value:** Helps the organization decide which campaigns to repeat and which to cut

### Pipeline 5 (Stretch): Reintegration Readiness (Predictive)
- **Business question:** When is a resident ready for reintegration?
- **Target variable:** `reintegration_status` = Completed (19 completed cases as training data)
- **Key features:** Length of stay, education completion, health scores, emotional state trends, home visitation outcomes (family cooperation trajectory), intervention plan achievement rates, incident frequency
- **Data sources:** `residents`, `education_records`, `health_wellbeing_records`, `process_recordings`, `home_visitations`, `intervention_plans`, `incident_reports`
- **Deployment:** Readiness score on resident detail page
- **Business value:** Helps staff make the most consequential decision — when a girl is safe to leave

### Pipeline 6 (Stretch): Intervention Effectiveness (Explanatory)
- **Business question:** Which interventions and services produce the best outcomes?
- **Target variable:** Improvement in risk level, education progress, health scores
- **Key features:** Intervention category, services provided, session type, session frequency, social worker, safehouse
- **Data sources:** `intervention_plans`, `process_recordings`, `education_records`, `health_wellbeing_records`, `residents`
- **Deployment:** Insights on Reports & Analytics; recommendations during intervention planning
- **Business value:** Allocate limited resources to what actually works

---

## 8. Security Requirements

### Authentication & Authorization
- [x] Username/password authentication via ASP.NET Identity
- [x] Stronger-than-default password policies (per IS 414 class instruction — NOT Microsoft docs defaults)
- [x] Role-Based Access Control (RBAC): Admin, Donor, Visitor (optional: Staff role)
- [x] All CUD API endpoints require Admin role
- [x] Donor role can only read own donation history and anonymized impact
- [x] Login and auth/me endpoints excluded from auth requirements
- [x] Provide test accounts: admin (no MFA), donor with history (no MFA), one account with MFA

### Confidentiality
- [x] HTTPS/TLS on all public connections (Azure-provided certificate)
- [x] HTTP to HTTPS redirect

### Integrity
- [x] Delete operations require confirmation dialog
- [x] Only authorized, authenticated users can modify data

### Credentials
- [x] Secrets in `.env` file or Azure environment variables
- [x] `.gitignore` excludes `.env`, credentials, keys (already configured)
- [x] No credentials in source code or public repository

### Privacy
- [x] GDPR-compliant privacy policy tailored to the organization, linked in footer
- [x] Fully functional GDPR cookie consent notification (not just cosmetic)

### Attack Mitigations
- [x] Content-Security-Policy (CSP) HTTP header with specific source directives (default-src, style-src, script-src, img-src as needed)
- [x] Verified via browser developer tools inspector

### Availability
- [x] Publicly deployed to Azure

### Additional Security Features (pick from)
- Third-party authentication (Google or Microsoft)
- Two-factor / multi-factor authentication on at least one account
- HSTS header
- Browser-accessible cookie for user preference (e.g., light/dark mode)
- Data sanitization / encoding to prevent injection
- Both operational and identity databases deployed to Azure SQL (not SQLite)
- Docker container deployment

---

## 9. Database Design

### Source Tables (from provided dataset — adapt as needed)

**Donor & Support Domain**
| Table | Rows | Purpose |
|---|---|---|
| `safehouses` | 9 | Physical safehouse locations |
| `partners` | 30 | Service delivery partners |
| `partner_assignments` | 48 | Partner-to-safehouse-to-program mappings |
| `supporters` | 60 | Donor/supporter profiles |
| `donations` | 420 | All donation events |
| `in_kind_donation_items` | 129 | Line items for in-kind donations |
| `donation_allocations` | 521 | How donations map to safehouses/programs |

**Case Management Domain**
| Table | Rows | Purpose |
|---|---|---|
| `residents` | 60 | Resident case records |
| `process_recordings` | 2,819 | Counseling session notes |
| `home_visitations` | 1,337 | Home/field visit records |
| `education_records` | 534 | Monthly education progress |
| `health_wellbeing_records` | 534 | Monthly health metrics |
| `intervention_plans` | 180 | Goals, plans, services |
| `incident_reports` | 100 | Safety/behavioral incidents |

**Outreach & Communication Domain**
| Table | Rows | Purpose |
|---|---|---|
| `social_media_posts` | 812 | Social media activity and engagement |
| `safehouse_monthly_metrics` | 450 | Aggregated monthly safehouse data |
| `public_impact_snapshots` | 50 | Public-facing anonymized reports |

### Known Data Issues to Address
- `intervention_plans` has column alignment issues — some `status` values contain dates/numbers from adjacent columns. Needs cleaning during import.
- `residents.age_upon_admission`, `present_age`, and `length_of_stay` are stored as strings (e.g., "15 Years 9 months") — consider computing from dates instead.
- `residents.referral_source` column index appears shifted in CSV — verify column mapping during import.

### Potential Additional Tables
- **Users** — ASP.NET Identity tables (separate or same database)
- **AuditLog** — Track who changed what and when (supports integrity requirement)
- **MLPredictions** — Store model outputs (churn scores, risk scores) for display in the app

---

## 10. Deployment Architecture

```
[Browser]
    |
    ├──→ [Vercel: React/Vite Frontend]     (HTTPS via Vercel TLS)
    |         |
    |         | API calls (axios)
    |         v
    └──→ [Azure App Service (B1 Linux): .NET 10 API]  (HTTPS via Azure TLS)
              |
              ├──→ [Azure SQL Database: Operational DB]
              |         - 17 tables seeded from CSV on first startup
              |         - ML prediction results stored here
              |
              └──→ [Azure SQL Database: Identity DB]
                        - ASP.NET Identity tables
                        - Roles: Admin, Donor
```

### CI/CD Flow
```
git push main
    ├──→ GitHub Actions: build & publish Backend → Azure App Service
    └──→ Vercel: auto-detect Frontend changes → build & deploy
```

### Azure Resource Summary
| Resource | Name Pattern | SKU | Est. Cost |
|---|---|---|---|
| Resource Group | `intex-rg` | — | Free |
| SQL Server | `intex-sql-server` | — | Free (container) |
| SQL Database (operational) | `intexdb` | Basic | ~$5/month |
| SQL Database (identity) | `intex-identity-db` | Basic | ~$5/month |
| App Service Plan | `intex-plan` | B1 Linux | ~$13/month |
| App Service | `intex-api-<teamname>` | (on B1 plan) | Included |

Total: ~$23/month — well within Azure for Students credits.

### Data Seeding
On first startup, the backend automatically:
1. Applies pending EF Core migrations (`db.Database.Migrate()`)
2. Runs `DataSeeder.SeedAsync()` which reads CSV files from `Backend/Data/SeedData/`
3. Inserts rows only if tables are empty (safe to run on every startup)
4. Parent tables seed before child tables to respect FK ordering

---

## 11. Sprint Plan Overview

| Day | Focus | Key Deliverables |
|---|---|---|
| **Monday** | Requirements & Planning | Personas, journey map, MoSCoW, product backlog, sprint backlog, wireframes, PRD |
| **Tuesday** | Design & Tech Stack | 3 AI-generated UI designs, design decision, tech stack diagram, database setup, project scaffolding |
| **Wednesday** | End-to-End Feature | 5 pages (desktop + mobile screenshots), 1 fully working deployed page with DB persistence, user feedback |
| **Thursday** | Polish & ML | OKR metric in app, Lighthouse accessibility 90%+, responsive design, ML pipeline integration, retrospective |
| **Friday** | Presentation & Submission | Videos (IS 413, IS 414, IS 455), deployed app, GitHub repo (public), ML notebooks, credentials submitted |

---

## 12. MoSCoW Priority Summary

### Must Have
- Landing page with mission and CTA
- Login with username/password auth + RBAC (Admin, Donor)
- Admin Dashboard with key metrics
- Caseload Inventory (full CRUD with search/filter)
- Process Recording (create, view chronological history per resident)
- Home Visitation log
- Donors & Contributions (view, create, manage)
- At least 3 ML pipelines (Donor Churn, Resident Risk, Social Media Donation Driver)
- HTTPS + HTTP redirect
- Privacy policy + functional cookie consent
- CSP header
- Public deployment to Azure
- Responsive design (desktop + mobile)
- Accessibility score 90%+ on all pages

### Should Have
- Impact / Donor-Facing Dashboard with visualizations
- Reports & Analytics page with donation trends and resident outcomes
- Donor portal (authenticated donors see their history + impact)
- Delete confirmation dialogs on all destructive actions
- Stronger password policies
- Third-party auth (Google/Microsoft)
- Data validation on all forms

### Could Have
- MFA on at least one account
- HSTS header
- Light/dark mode preference cookie
- Docker container deployment
- Additional ML pipelines (Campaign ROI, Reintegration Readiness, Intervention Effectiveness)
- Social media "post advisor" tool
- Audit logging

### Won't Have (This Week)
- Real-time notifications / push alerts
- Multi-language support (Tagalog/English)
- Mobile native app
- Integration with actual social media platform APIs
- Payment processing for online donations
