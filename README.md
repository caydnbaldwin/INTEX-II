# INTEX-II

Lunas platform for nonprofit safehouse operations, donor management, impact communication, and machine learning decision support.

This repository is the active implementation for the BYU IS INTEX II project and tracks progress against the official checklist in `BusinessContext/REQUIREMENTS.md`.

## Current Project State (April 2026)

The project has moved beyond initial scaffolding and now has a working cross-stack foundation:

- Backend API running on .NET 10 with ASP.NET Identity, role support, and relational data access.
- Frontend running on React + TypeScript + Vite with public routes, auth flows, and protected route gating.
- Security hardening features implemented in middleware and auth configuration.
- ML workstream producing 8 business-specific notebooks and a consolidated results summary.
- Business documentation consolidated in `BusinessContext/` for requirements, PRD, setup, and planning artifacts.

## Requirements-Aligned Progress Snapshot

This section is intentionally organized around `BusinessContext/REQUIREMENTS.md` and highlights delivered progress.

### IS 401: Project Management and Systems Design

Project and planning artifacts are centralized and versioned in `BusinessContext/`:

- `REQUIREMENTS.md` (definition of done checklist)
- `PRD.md` (problem framing, users, architecture direction)
- `INITIAL-SETUP.md` (environment and deployment guidance)
- `DATE-OVERVIEW.md`, `CASE.md`, `product-backlog.txt`, and `erd.html`

This provides an auditable project-management backbone for sprint planning, design decisions, and final presentation prep.

### IS 413: Enterprise Application Development

Required stack is in place:

- Backend: .NET 10 / C# (`Backend/Backend.csproj`)
- Frontend: React / TypeScript / Vite (`Frontend/package.json`)
- Relational database via EF Core + SQL Server provider (`Microsoft.EntityFrameworkCore.SqlServer`)

Implemented application foundation:

- Public pages/routes are wired (`/`, `/impact`, `/privacy-policy`, `/login`, `/register`).
- Authentication UX is implemented for register/login/logout and session refresh.
- Role-aware route protection is active (`ProtectedRoute`, Admin-only route support).
- App shell, navbar, footer, and mobile navigation are implemented.
- Data layer includes 17 domain entities with EF Core mappings and precision constraints.
- Seed pipeline is integrated via CSV files copied at build + startup seed execution.
- API health diagnostics are available (`/api/health`, `/api/dbcheck`).

### IS 414: Security

Security implementation is already substantial and includes major graded items:

- HTTPS redirect enabled in middleware pipeline.
- HSTS enabled for non-development environments.
- CSP is configured as an HTTP response header (not meta tag), alongside:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
- ASP.NET Identity API endpoints mapped under `/api/auth`.
- Stronger password policy configured (minimum length 14).
- Role model established (`Admin`, `Donor`) with admin policy (`AdminOnly`).
- Protected endpoints already enforce authentication (`[Authorize]`) for sensitive user actions.
- MFA backend endpoints implemented (status, setup, enable, disable) with TOTP flow.
- Third-party auth path implemented for Google OAuth.
- Browser-accessible preference cookie implemented (`user-theme`, non-HttpOnly).
- Functional cookie consent experience implemented with persisted accept/reject choice.
- Secrets strategy is configured for secure handling (`UserSecretsId`, runtime config-based credentials).

### IS 455: Machine Learning

ML pipeline work is active and broad:

- `MachineLearning/ml-pipelines/` contains 8 domain-specific notebooks:
  - donor churn classifier
  - resident risk predictor
  - campaign ROI analyzer
  - safehouse performance analyzer
  - education progress predictor
  - social media donation driver
  - social media recommender
  - visitation outcome predictor
- `MachineLearning/pipeline-results-summary.md` provides business interpretation and action recommendations for all pipelines.
- `MachineLearning/refresh_all_pipelines.py` orchestrates a single-shot refresh of every pipeline's results (run from `MachineLearning/` after creating a `.env` with DB credentials).
- Pipelines are framed around distinct organizational decisions (fundraising, operations, outcomes, and case prioritization).

## Architecture at a Glance

- `Backend/`: .NET 10 API, Identity auth, EF Core models/migrations, seed and security middleware.
- `Frontend/`: React SPA, routing, auth context, protected routes, cookie consent context.
- `BusinessContext/`: requirements, PRD, setup and project planning artifacts.
- `MachineLearning/ml-pipelines/`: executable notebooks (one per pipeline). Supporting docs, the refresh script, and `requirements.txt` live one level up in `MachineLearning/`.
- `MockFrontend/`: separate design/prototyping workspace.

## Running the Current Build Locally

## 1) Backend

From `Backend/`:

```bash
dotnet restore
dotnet build
dotnet run
```

Default local backend URL: `https://localhost:5200`

## 2) Frontend

From `Frontend/`:

```bash
npm install
npm run dev
```

Vite dev server runs on port `4200`.

## 3) Frontend Environment Variable

The frontend expects:

- `VITE_API_BASE_URL` -> backend base URL (for example `https://localhost:5200`)

## 4) Quick Verification

- Open frontend and use Home page checks for backend/database reachability.
- Confirm auth flow with register/login/logout.
- Confirm protected route behavior for admin-gated pages.

## Security and Implementation Notes

- CSP is emitted as a response header via backend middleware.
- Auth is cookie-based and configured for cross-origin local dev.
- Role seeding and default admin generation are automated at startup using configuration values.
- CSV seed files are copied to output and loaded into the relational model at startup.

## Immediate Development Focus

Current implementation momentum is concentrated on:

- Expanding scaffolded business pages (`Impact`, `Dashboard`, `Donors`, `PrivacyPolicy`, `ManageMFA`) into full feature-complete views.
- Connecting ML outputs into visible application experiences.
- Completing final presentation evidence capture against `BusinessContext/REQUIREMENTS.md`.

## Source of Truth

Project completion is tracked in:

- `BusinessContext/REQUIREMENTS.md`

Use that checklist for sprint planning, demo preparation, and final submission quality control.
