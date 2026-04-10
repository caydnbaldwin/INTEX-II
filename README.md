# INTEX-II TA Grading Guide

Lunas is a full-stack nonprofit operations platform built for the INTEX II case and organized around the three class tracks: product/design delivery (IS 401), enterprise web application delivery (IS 413/414), and end-to-end machine learning pipelines (IS 455). This README is intentionally written for TAs so grading can be done quickly with direct evidence links.

## Quick Links (Start Here)

- Live site: https://lunas-project.site
- GitHub repo root: [./](./)
- Security proof matrix: [BusinessContext/SECURITY_POC.md](BusinessContext/SECURITY_POC.md)
- Grader credentials: [BusinessContext/TEST_CREDENTIALS.md](BusinessContext/TEST_CREDENTIALS.md)
- Requirements checklist: [BusinessContext/REQUIREMENTS.md](BusinessContext/REQUIREMENTS.md)
- IS 401 Trello board: https://trello.com/b/iR8HVFAN/intex-ii
- IS 401 FigJam board: https://www.figma.com/board/DcHf7CCSml5QtZycuQBqF9/2026W-INTEX---Group-4-7?node-id=0-1&t=xScIqW6SmGTps8pp-1

## TA Setup and Run Guide (All Classes)

### 1. Clone

```bash
git clone <repo-url>
cd INTEX-II
```

### 2. Prerequisites

- .NET 10 SDK
- Node.js 20+
- SQL Server instance (local or cloud)

### 3. Backend Configuration

Set runtime secrets/environment variables for local execution (do not commit secrets):

- `ConnectionStrings__DefaultConnection`
- `GenerateDefaultIdentityAdmin__Password`
- `GenerateDefaultIdentityDonor__Password`
- `GenerateDefaultIdentityMfa__Password`
- Optional for full feature set: `Authentication__Google__ClientId`, `Authentication__Google__ClientSecret`, `Stripe__SecretKey`, `Stripe__WebhookSecret`, `Gemini__ApiKey`, `Resend__ApiKey`

Config placeholders are intentionally blank in tracked config: [Backend/appsettings.json](Backend/appsettings.json)

### 4. Frontend Configuration

Create `Frontend/.env` with:

```bash
VITE_API_BASE_URL=https://localhost:5200
VITE_STRIPE_PUBLISHABLE_KEY=<optional-test-key>
```

Usage is defined in:

- [Frontend/src/lib/api.ts](Frontend/src/lib/api.ts)
- [Frontend/src/pages/donate.tsx](Frontend/src/pages/donate.tsx)

### 5. Run Locally

Backend:

```bash
cd Backend
dotnet restore
dotnet build
dotnet run
```

Frontend:

```bash
cd Frontend
npm install
npm run dev
```

Local defaults:

- Backend: https://localhost:5200 ([Backend/Properties/launchSettings.json](Backend/Properties/launchSettings.json))
- Frontend: http://localhost:4200 ([Frontend/vite.config.ts](Frontend/vite.config.ts))

### 6. Grader Accounts

Use seeded accounts documented in [BusinessContext/TEST_CREDENTIALS.md](BusinessContext/TEST_CREDENTIALS.md).

## IS 401 TA Note

IS 401 was submitted as a separate deliverable package. For IS 401 grading, TAs should use the FigJam board as the source of truth for requirements evidence:

- https://www.figma.com/board/DcHf7CCSml5QtZycuQBqF9/2026W-INTEX---Group-4-7?node-id=0-1&t=xScIqW6SmGTps8pp-1

## IS 413 Grading Map (Enterprise Application Development)

Test links are intentionally left blank for IS 413 per rubric instructions.

| Requirement | File links | Site links | Test links | What to show |
| --- | --- | --- | --- | --- |
| App compiles and runs without errors | [Backend/Backend.csproj](Backend/Backend.csproj), [Frontend/package.json](Frontend/package.json) | https://lunas-project.site |  | Build backend and frontend, then show running app. |
| Modern, professional UI with consistent branding/navigation | [Frontend/src/layouts/PublicLayout.tsx](Frontend/src/layouts/PublicLayout.tsx), [Frontend/src/layouts/AdminLayout.tsx](Frontend/src/layouts/AdminLayout.tsx) | https://lunas-project.site |  | Demonstrate shared navigation, coherent styling, and layout consistency. |
| Home/Landing page with mission + calls to action | [Frontend/src/pages/landing.tsx](Frontend/src/pages/landing.tsx) | https://lunas-project.site |  | Show mission framing and clear engagement actions. |
| Login with validation + error handling | [Frontend/src/pages/login.tsx](Frontend/src/pages/login.tsx), [Backend/Controllers/AuthController.cs](Backend/Controllers/AuthController.cs) | https://lunas-project.site/login |  | Show invalid and valid login paths and resulting UX. |
| Privacy policy + visible cookie consent | [Frontend/src/pages/privacy-policy.tsx](Frontend/src/pages/privacy-policy.tsx), [Frontend/src/components/CookieConsentBanner.tsx](Frontend/src/components/CookieConsentBanner.tsx) | https://lunas-project.site/privacy |  | Show policy page and consent banner interaction. |
| Public impact dashboard with anonymized aggregated impact data | [Frontend/src/pages/impact-dashboard.tsx](Frontend/src/pages/impact-dashboard.tsx), [Backend/Controllers/PublicController.cs](Backend/Controllers/PublicController.cs) | https://lunas-project.site/impact |  | Show dashboard metrics without exposing sensitive records. |
| Donor dashboard: authenticated donor can view history and submit fake donation | [Frontend/src/pages/donor/portal.tsx](Frontend/src/pages/donor/portal.tsx), [Frontend/src/pages/donate.tsx](Frontend/src/pages/donate.tsx), [Backend/Controllers/DonorPortalController.cs](Backend/Controllers/DonorPortalController.cs) | https://lunas-project.site/donor, https://lunas-project.site/donate |  | Log in as donor, show history, submit test donation flow. |
| Admin dashboard high-level operational summary | [Frontend/src/pages/admin/dashboard.tsx](Frontend/src/pages/admin/dashboard.tsx), [Backend/Controllers/ReportsController.cs](Backend/Controllers/ReportsController.cs) | https://lunas-project.site/admin |  | Show active residents, donation trends, and ops summary widgets. |
| Donors & Contributions CRUD and contribution tracking | [Frontend/src/pages/admin/donors.tsx](Frontend/src/pages/admin/donors.tsx), [Backend/Controllers/SupportersController.cs](Backend/Controllers/SupportersController.cs), [Backend/Controllers/DonationsController.cs](Backend/Controllers/DonationsController.cs) | https://lunas-project.site/admin/donors |  | Demonstrate supporter CRUD and donation/allocation visibility. |
| Caseload Inventory CRUD + search/filter | [Frontend/src/pages/admin/caseload.tsx](Frontend/src/pages/admin/caseload.tsx), [Backend/Controllers/ResidentsController.cs](Backend/Controllers/ResidentsController.cs) | https://lunas-project.site/admin/caseload |  | Show create/update plus filtering/search on resident records. |
| Process Recording dated notes in chronological history | [Frontend/src/pages/admin/process-recording.tsx](Frontend/src/pages/admin/process-recording.tsx), [Backend/Controllers/ProcessRecordingsController.cs](Backend/Controllers/ProcessRecordingsController.cs) | https://lunas-project.site/admin/process-recording |  | Add a session note and verify chronological rendering. |
| Home Visitation & Case Conferences page | [Frontend/src/pages/admin/home-visitation.tsx](Frontend/src/pages/admin/home-visitation.tsx), [Backend/Controllers/HomeVisitationsController.cs](Backend/Controllers/HomeVisitationsController.cs), [Backend/Controllers/ResidentsController.cs](Backend/Controllers/ResidentsController.cs) | https://lunas-project.site/admin/visitation |  | Log a visit and show conference history/upcoming cards. |
| Reports & Analytics meaningful charts/summaries | [Frontend/src/pages/admin/reports.tsx](Frontend/src/pages/admin/reports.tsx), [Backend/Controllers/ReportsController.cs](Backend/Controllers/ReportsController.cs) | https://lunas-project.site/admin/reports |  | Demonstrate donation/outcome/program-level trends. |
| At least one additional feature/page beyond baseline | [Frontend/src/pages/admin/social-media.tsx](Frontend/src/pages/admin/social-media.tsx), [Frontend/src/pages/admin/email-templates.tsx](Frontend/src/pages/admin/email-templates.tsx), [Frontend/src/pages/admin/expansion.tsx](Frontend/src/pages/admin/expansion.tsx) | https://lunas-project.site/admin/social-media, https://lunas-project.site/admin/email-templates, https://lunas-project.site/admin/expansion |  | Show one or more additional production features in use. |
| Database deployed separately from app | [Backend/Controllers/DbCheckController.cs](Backend/Controllers/DbCheckController.cs), [Backend/Data/AppDbContext.cs](Backend/Data/AppDbContext.cs) | https://lunas-project.site |  | Show app-service web tier with remote DB-backed data persistence. |
| Validation, error handling, and code quality | [Backend/Contracts/CrudRequests.cs](Backend/Contracts/CrudRequests.cs), [Frontend/src/lib/api.ts](Frontend/src/lib/api.ts), [Backend/Controllers](Backend/Controllers) | https://lunas-project.site |  | Demonstrate validation and user-friendly error handling on bad inputs. |

### IS 413 Bonus (Up to 1 point)

| Bonus item | File links | Site links | Test links | What to show |
| --- | --- | --- | --- | --- |
| Lazy routing optimization | [Frontend/src/App.tsx](Frontend/src/App.tsx) | https://lunas-project.site |  | Show route-level lazy loading with `React.lazy`/`Suspense` to optimize initial bundle load. |
| AI chat operations page | [Frontend/src/pages/admin/chat.tsx](Frontend/src/pages/admin/chat.tsx), [Backend/Controllers/ChatController.cs](Backend/Controllers/ChatController.cs) | https://lunas-project.site/admin/chat |  | Show admin AI chat workflow and backend integration. |
| At-risk donor ML tab and churn mitigations | [Frontend/src/pages/admin/donors.tsx](Frontend/src/pages/admin/donors.tsx), [Backend/Controllers/PipelineResultsController.cs](Backend/Controllers/PipelineResultsController.cs), [MachineLearning/ml-pipelines/donor-churn-classifier.ipynb](MachineLearning/ml-pipelines/donor-churn-classifier.ipynb) | https://lunas-project.site/admin/donors?tab=at-risk |  | Show automated churn-risk ranking and mitigation-ready targeting in the at-risk view. |
| Process recording AI-assisted transcription/summary autofill | [Frontend/src/pages/admin/process-recording.tsx](Frontend/src/pages/admin/process-recording.tsx), [Backend/Services/AudioAutofillService.cs](Backend/Services/AudioAutofillService.cs), [Backend/Services/IAudioAutofillService.cs](Backend/Services/IAudioAutofillService.cs) | https://lunas-project.site/admin/process-recording |  | Show recording intake and AI-assisted parsing/transcribe/summarize autofill into documentation fields. |
| Safehouse housing/boarding and incident-response workflow | [Frontend/src/pages/admin/boarding.tsx](Frontend/src/pages/admin/boarding.tsx), [Backend/Controllers/BoardingController.cs](Backend/Controllers/BoardingController.cs), [Backend/Controllers/ResidentsController.cs](Backend/Controllers/ResidentsController.cs) | https://lunas-project.site/admin/safehouses/boarding |  | Show housing placement operations, standing orders, and incident-response-ready operations flow. |
| ML-fueled social media recommendations | [Frontend/src/pages/admin/social-media.tsx](Frontend/src/pages/admin/social-media.tsx), [Backend/Controllers/PipelineResultsController.cs](Backend/Controllers/PipelineResultsController.cs), [MachineLearning/ml-pipelines/social-media-donation-driver.ipynb](MachineLearning/ml-pipelines/social-media-donation-driver.ipynb) | https://lunas-project.site/admin/social-media |  | Show recommendation outputs that guide post timing/content/platform decisions. |
| ML + AI expansion planning recommendations | [Frontend/src/pages/admin/expansion.tsx](Frontend/src/pages/admin/expansion.tsx), [Backend/Controllers/ExpansionController.cs](Backend/Controllers/ExpansionController.cs), [MachineLearning/ml-pipelines/safehouse-performance-analyzer.ipynb](MachineLearning/ml-pipelines/safehouse-performance-analyzer.ipynb) | https://lunas-project.site/admin/expansion |  | Show short-term and long-term expansion planning suggestions tied to modeled performance signals. |
| MFA management page | [Frontend/src/pages/ManageMFAPage.tsx](Frontend/src/pages/ManageMFAPage.tsx), [Frontend/src/pages/MfaChallengePage.tsx](Frontend/src/pages/MfaChallengePage.tsx), [Backend/Controllers/MfaController.cs](Backend/Controllers/MfaController.cs) | https://lunas-project.site/mfa |  | Show MFA status/setup/enable/disable and challenge flow. |

## IS 414 Grading Map (Security)

This section includes direct test links (the only class where test links are filled).

| Requirement | File links | Site links | Test links | What to show |
| --- | --- | --- | --- | --- |
| Confidentiality - HTTPS/TLS | [Backend/Program.cs](Backend/Program.cs) | https://lunas-project.site | [Backend.Tests/Security/Rubric1_Confidentiality_TlsTests.cs](Backend.Tests/Security/Rubric1_Confidentiality_TlsTests.cs) | Public site served over HTTPS with valid TLS. |
| Confidentiality - Redirect HTTP to HTTPS | [Backend/Program.cs](Backend/Program.cs) | http://lunas-project.site | [Backend.Tests/Security/Rubric1_Confidentiality_TlsTests.cs](Backend.Tests/Security/Rubric1_Confidentiality_TlsTests.cs) | HTTP automatically redirects to HTTPS. |
| Auth - Username/password authentication | [Backend/Controllers/AuthController.cs](Backend/Controllers/AuthController.cs), [BusinessContext/TEST_CREDENTIALS.md](BusinessContext/TEST_CREDENTIALS.md) | https://lunas-project.site/login | [Backend.Tests/Security/Rubric2_Authentication_UsernamePasswordTests.cs](Backend.Tests/Security/Rubric2_Authentication_UsernamePasswordTests.cs) | Authenticate with seeded admin/donor credentials. |
| Auth - Better passwords | [Backend/Program.cs](Backend/Program.cs) |  | [Backend.Tests/Security/Rubric3_Authentication_PasswordPolicyTests.cs](Backend.Tests/Security/Rubric3_Authentication_PasswordPolicyTests.cs) | Show stronger non-default policy (class-taught constraints). |
| Auth - Pages/endpoints require auth where needed | [Backend/Controllers/PublicController.cs](Backend/Controllers/PublicController.cs), [Backend/Controllers/HealthController.cs](Backend/Controllers/HealthController.cs), [Backend/Controllers/MfaController.cs](Backend/Controllers/MfaController.cs), [Frontend/src/App.tsx](Frontend/src/App.tsx) | https://lunas-project.site/admin | [Backend.Tests/Security/Rubric4_Authentication_EndpointProtectionTests.cs](Backend.Tests/Security/Rubric4_Authentication_EndpointProtectionTests.cs) | Show public endpoints stay open and protected endpoints return unauthorized when expected. |
| RBAC - only admin can CUD; donor-only views protected | [Backend/Controllers/ResidentsController.cs](Backend/Controllers/ResidentsController.cs), [Backend/Controllers/SupportersController.cs](Backend/Controllers/SupportersController.cs), [Backend/Controllers/DonorPortalController.cs](Backend/Controllers/DonorPortalController.cs), [Frontend/src/App.tsx](Frontend/src/App.tsx) | https://lunas-project.site/donor, https://lunas-project.site/admin | [Backend.Tests/Security/Rubric5_Rbac_AuthorizationTests.cs](Backend.Tests/Security/Rubric5_Rbac_AuthorizationTests.cs) | Show role-based access restrictions in UI and API behavior. |
| Integrity - delete confirmation required | [Frontend/src/pages/admin/user-management.tsx](Frontend/src/pages/admin/user-management.tsx), [Frontend/src/pages/admin/donors.tsx](Frontend/src/pages/admin/donors.tsx), [Frontend/src/pages/admin/process-recording.tsx](Frontend/src/pages/admin/process-recording.tsx) | https://lunas-project.site/admin/users | [Backend.Tests/Security/Rubric9_Integrity_DeleteConfirmationTests.cs](Backend.Tests/Security/Rubric9_Integrity_DeleteConfirmationTests.cs) | Show confirmation modal before destructive actions. |
| Credentials - securely stored (not in public repo) | [Backend/appsettings.json](Backend/appsettings.json) |  | [Backend.Tests/Security/Rubric8_Credentials_NotInCodeTests.cs](Backend.Tests/Security/Rubric8_Credentials_NotInCodeTests.cs) | Show blank production secrets in tracked config and explain env-based runtime values. |
| Privacy - GDPR privacy policy | [Frontend/src/pages/privacy-policy.tsx](Frontend/src/pages/privacy-policy.tsx) | https://lunas-project.site/privacy | [Backend.Tests/Security/Rubric10_Privacy_GdprTests.cs](Backend.Tests/Security/Rubric10_Privacy_GdprTests.cs) | Walk through policy coverage and footer access path. |
| Privacy - GDPR cookie consent fully functional | [Frontend/src/components/CookieConsentBanner.tsx](Frontend/src/components/CookieConsentBanner.tsx), [Frontend/src/context/CookieConsentContext.tsx](Frontend/src/context/CookieConsentContext.tsx), [Frontend/src/components/theme-provider.tsx](Frontend/src/components/theme-provider.tsx) | https://lunas-project.site | [Backend.Tests/Security/Rubric10_Privacy_GdprTests.cs](Backend.Tests/Security/Rubric10_Privacy_GdprTests.cs) | Show accept/reject flow and consent-dependent cookie behavior. |
| Attack mitigations - CSP header | [Backend/Infrastructure/SecurityHeadersMiddleware.cs](Backend/Infrastructure/SecurityHeadersMiddleware.cs) | https://lunas-project.site | [Backend.Tests/Security/Rubric6_AttackMitigation_CspTests.cs](Backend.Tests/Security/Rubric6_AttackMitigation_CspTests.cs) | In browser devtools, show CSP as an HTTP response header. |
| Availability - publicly deployed | [BusinessContext/INITIAL-SETUP.md](BusinessContext/INITIAL-SETUP.md) | https://lunas-project.site | [Backend.Tests/Security/Rubric11_Availability_PublicDeploymentTests.cs](Backend.Tests/Security/Rubric11_Availability_PublicDeploymentTests.cs) | Show public reachability without local VPN/tunnel setup. |

### IS 414 Additional Security Features (Extra Credit)

| Extra credit item | File links | Site links | Test links | What to show |
| --- | --- | --- | --- | --- |
| HSTS enabled | [Backend/Program.cs](Backend/Program.cs) | https://lunas-project.site | [Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs](Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs) | Show HSTS response behavior for non-development deployment. |
| Third-party auth (Google OAuth) | [Backend/Controllers/AuthController.cs](Backend/Controllers/AuthController.cs) | https://lunas-project.site/login | [Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs](Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs) | Show provider list and external-login flow entrypoint. |
| MFA/TOTP implementation | [Backend/Controllers/MfaController.cs](Backend/Controllers/MfaController.cs), [Frontend/src/pages/ManageMFAPage.tsx](Frontend/src/pages/ManageMFAPage.tsx), [Frontend/src/pages/MfaChallengePage.tsx](Frontend/src/pages/MfaChallengePage.tsx) | https://lunas-project.site/mfa | [Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs](Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs) | Show setup/status/enable/disable and challenge flow behavior. |
| Browser-accessible preference cookie | [Backend/Controllers/PreferencesController.cs](Backend/Controllers/PreferencesController.cs), [Frontend/src/components/theme-provider.tsx](Frontend/src/components/theme-provider.tsx) | https://lunas-project.site/admin | [Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs](Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs) | Show user-theme cookie and corresponding React UI effect. |
| Data sanitization in rendered content | [Frontend/src/lib/sanitize.ts](Frontend/src/lib/sanitize.ts) | https://lunas-project.site/admin/chat | [Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs](Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs) | Show sanitization handling for user-generated or AI-generated text. |
| Privacy-safe pseudonymization | [Frontend/src/lib/residentPseudonym.ts](Frontend/src/lib/residentPseudonym.ts), [Frontend/src/lib/publicResidentStories.ts](Frontend/src/lib/publicResidentStories.ts) | https://lunas-project.site/impact | [Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs](Backend.Tests/Security/ExtraCredit1_AdditionalSecurityFeaturesTests.cs) | Show anonymized resident stories on public surfaces. |
| Extensive automated security testing | [Backend.Tests/Security](Backend.Tests/Security), [BusinessContext/SECURITY_POC.md](BusinessContext/SECURITY_POC.md) |  | [Backend.Tests/Security](Backend.Tests/Security) | Show broad automated rubric and extra-credit coverage via the security test suite. |

## IS 455 Grading Map (Machine Learning)

Test links are intentionally left blank for IS 455 per rubric instructions.

### Submitted Pipeline Notebooks

- [MachineLearning/ml-pipelines/donor-churn-classifier.ipynb](MachineLearning/ml-pipelines/donor-churn-classifier.ipynb)
- [MachineLearning/ml-pipelines/social-media-donation-driver.ipynb](MachineLearning/ml-pipelines/social-media-donation-driver.ipynb)
- [MachineLearning/ml-pipelines/campaign-roi-analyzer.ipynb](MachineLearning/ml-pipelines/campaign-roi-analyzer.ipynb)
- [MachineLearning/ml-pipelines/resident-risk-predictor.ipynb](MachineLearning/ml-pipelines/resident-risk-predictor.ipynb)
- [MachineLearning/ml-pipelines/education-progress-predictor.ipynb](MachineLearning/ml-pipelines/education-progress-predictor.ipynb)
- [MachineLearning/ml-pipelines/visitation-outcome-predictor.ipynb](MachineLearning/ml-pipelines/visitation-outcome-predictor.ipynb)
- [MachineLearning/ml-pipelines/safehouse-performance-analyzer.ipynb](MachineLearning/ml-pipelines/safehouse-performance-analyzer.ipynb)
- [MachineLearning/Piplines/reintegration-readiness.ipynb](MachineLearning/Piplines/reintegration-readiness.ipynb)

Summary and synthesis:

- [MachineLearning/pipeline-results-summary.md](MachineLearning/pipeline-results-summary.md)
- [MachineLearning/ANALYTICS_STRATEGY.md](MachineLearning/ANALYTICS_STRATEGY.md)

### Rubric Mapping

| Requirement | File links | Site links | What to show |
| --- | --- | --- | --- |
| Problem framing is clear and business-relevant; predictive vs explanatory is explicit | [MachineLearning/ANALYTICS_STRATEGY.md](MachineLearning/ANALYTICS_STRATEGY.md), [MachineLearning/pipeline-results-summary.md](MachineLearning/pipeline-results-summary.md) | https://lunas-project.site/admin/reports | In each notebook, show business question, stakeholder, and modeling objective type. |
| Data acquisition/preparation/exploration is thorough and reproducible | [MachineLearning/ml-pipelines](MachineLearning/ml-pipelines), [MachineLearning/requirements.txt](MachineLearning/requirements.txt), [MachineLearning/refresh_all_pipelines.py](MachineLearning/refresh_all_pipelines.py) |  | Run notebook cells top-to-bottom and show reusable prep/feature engineering steps. |
| Modeling and feature selection are appropriate and justified | [MachineLearning/ml-pipelines/donor-churn-classifier.ipynb](MachineLearning/ml-pipelines/donor-churn-classifier.ipynb), [MachineLearning/ml-pipelines/resident-risk-predictor.ipynb](MachineLearning/ml-pipelines/resident-risk-predictor.ipynb), [MachineLearning/ml-pipelines/visitation-outcome-predictor.ipynb](MachineLearning/ml-pipelines/visitation-outcome-predictor.ipynb), [MachineLearning/ml-pipelines/safehouse-performance-analyzer.ipynb](MachineLearning/ml-pipelines/safehouse-performance-analyzer.ipynb) |  | Show model comparisons, selected features, and why chosen models fit each problem (including expansion planning). |
| Evaluation and selection use appropriate metrics/validation and business interpretation | [MachineLearning/pipeline-results-summary.md](MachineLearning/pipeline-results-summary.md) | https://lunas-project.site/admin/reports | Show train/test or cross-validation outputs and convert metrics into operational decisions. |
| Deployment and integration into web application provide end-user value | [Backend/Controllers/PipelineResultsController.cs](Backend/Controllers/PipelineResultsController.cs), [Frontend/src/pages/admin/reports.tsx](Frontend/src/pages/admin/reports.tsx), [Frontend/src/pages/admin/social-media.tsx](Frontend/src/pages/admin/social-media.tsx), [Frontend/src/pages/admin/expansion.tsx](Frontend/src/pages/admin/expansion.tsx) | https://lunas-project.site/admin/reports, https://lunas-project.site/admin/social-media, https://lunas-project.site/admin/expansion | Show model output surfaced in app dashboards/recommendations and tied to business actions. |

## IS 414 Test Command (Optional TA Verification)

```bash
cd Backend.Tests
dotnet test --filter Security
```