# Donor Upgrade Automation — Lunas Foundation

A mini automation system that identifies which donors would give more if personally
contacted, scores them with a machine learning model, and sends personalized outreach emails.

## Quick Start

```bash
cd MachineLearning/donor_automation
pip install flask flask-cors apscheduler scikit-learn pandas numpy resend python-dotenv
python app.py
```

Open **http://localhost:5050** in your browser.

---

## What Each File Does

| File | Purpose |
|---|---|
| `app.py` | Flask backend — serves the dashboard and exposes the JSON API on port 5050 |
| `pipeline.py` | RFM feature engineering + LogisticRegression scoring — the brain of the system |
| `scheduler.py` | APScheduler weekly runner — calls the pipeline and emailer every 7 days |
| `emailer.py` | Personalized email sender via Resend — sends real emails and logs to `email_log.json` |
| `email_templates.json` | 3 active email templates: `loyal`, `first_time`, `win_back` |
| `state.json` | Persists automation on/off state, run history, and model accuracy over time |
| `email_log.json` | Log of every email sent (donor, subject, full body, timestamp) |
| `feedback_log.json` | Records donor outcomes (converted / declined) to improve the model |
| `templates/dashboard.html` | Interactive dashboard served by Flask |
| `static/styles.css` | Lunas Foundation purple branding + clean responsive layout |
| `DonorAutomationView.tsx` | React component — drop-in admin UI for the main frontend |
| `EmailTemplatesView.tsx` | React component — template editor with live preview for the main frontend |

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/` | Dashboard HTML |
| GET | `/api/state` | Automation state + run history |
| POST | `/api/automate/on` | Enable weekly automation |
| POST | `/api/automate/off` | Disable automation |
| GET | `/api/donors` | Scored donor list from pipeline |
| GET | `/api/emails` | Email log (most recent first) |
| GET | `/api/email-log` | Alias for `/api/emails` |
| GET | `/api/feedback` | Feedback log |
| POST | `/api/feedback` | Record a donor outcome (`converted` / `declined`) |
| GET | `/api/templates` | All email templates |
| PUT | `/api/templates/<id>` | Update a template's subject and body |
| GET | `/api/templates/<id>/preview` | Render a template for a specific donor |
| POST | `/api/send-test` | Send a test email to a given address |
| GET | `/api/config` | Safe config info (no API key) |
| POST | `/api/run-now` | Trigger immediate pipeline + email run |
| POST | `/api/run-now/<id>` | Email a single donor immediately |

---

## Email Template System

There are 3 templates in `email_templates.json`. Selection logic (evaluated in order):

1. **`win_back`** — if `recency > 90` days (overrides everything)
2. **`loyal`** — if `frequency >= 3`
3. **`first_time`** — everyone else

### Supported placeholders

| Placeholder | Source |
|---|---|
| `{{first_name}}` | `supporters.csv` → `first_name` |
| `{{frequency}}` | RFM computed from `donations.csv` |
| `{{program_area}}` | Top allocation from `donation_allocations.csv` |
| `{{suggested_amount}}` | 75th percentile of donor's gift history, rounded to nearest 500 PHP (single gift: amount + 500) |
| `{{donate_button}}` | Rendered as a purple HTML button in HTML emails; plain text link in text emails |

---

## How the Feedback Loop Works

```
1. Pipeline runs → scores donors → identifies upgrade candidates
2. Scheduler emails candidates → logged to email_log.json
3. Admin marks outcomes in dashboard:
     Converted ✓ → donor gave again
     Declined  ✗ → donor said no
4. Outcomes saved to feedback_log.json
5. Next pipeline run reads feedback → uses real outcomes to override rule-based labels
6. Model retrains on corrected labels → upgrade_probability scores improve
7. Repeat
```

---

## Upgrade Candidate Rules

A donor is flagged as an upgrade candidate if ALL of:
- **Frequency ≥ 2** — gave more than once (genuinely engaged)
- **Monetary_avg < 75th percentile** — below top-quartile givers (room to grow)
- **Recency ≤ 180 days** — donated within the last 6 months (still active)

Score tiers: **High** = candidate with 6+ gifts | **Medium** = 2–5 gifts | **Low** = not a candidate

---

---

# INTEGRATION GUIDE FOR NEXT AI

> **Read this section carefully before touching any files.**
> This system was built as a standalone Flask prototype that lives inside
> `MachineLearning/donor_automation/`. The goal is to integrate it into the
> main React + .NET stack so the admin can access it through the existing
> frontend — not as a separate Flask server.

---

## 1. Understand the current architecture

```
MachineLearning/donor_automation/
  app.py                   ← Flask API on port 5050 (REPLACE with .NET controller)
  pipeline.py              ← Python ML scoring (KEEP, call from .NET via subprocess or keep as sidecar)
  emailer.py               ← Email sender via Resend (REPLACE with .NET email service)
  email_templates.json     ← Template store (MIGRATE to database or keep as file)
  DonorAutomationView.tsx  ← React admin UI (MOVE into Frontend/src/pages/admin/)
  EmailTemplatesView.tsx   ← React template editor (MOVE into Frontend/src/pages/admin/)
```

The main frontend is at `Frontend/` — React + TypeScript + Vite, using **Tailwind v4**,
**shadcn/ui (New York style)**, and **Radix UI** primitives. All routes go through
`Frontend/src/App.tsx`. The backend is at `Backend/` — .NET 10 / ASP.NET Core.

---

## 2. Move the React components into the frontend

### Step 1 — Copy files

```bash
cp MachineLearning/donor_automation/DonorAutomationView.tsx Frontend/src/pages/admin/donor-automation.tsx
cp MachineLearning/donor_automation/EmailTemplatesView.tsx  Frontend/src/pages/admin/email-templates.tsx
```

### Step 2 — Update the API base URL

Both components have this at the top:

```ts
const API_BASE = "http://localhost:5050";
```

Change it to point to the .NET backend:

```ts
const API_BASE = "/api";   // or import.meta.env.VITE_API_URL if you use env vars
```

### Step 3 — Install the tiptap dependency (already in package.json)

`EmailTemplatesView.tsx` uses `@tiptap/react` and `@tiptap/starter-kit` for the
template body editor. These are already added to `Frontend/package.json`. Run:

```bash
cd Frontend && npm install
```

### Step 4 — Register the routes

Open `Frontend/src/App.tsx` and add two admin routes inside the existing
`ProtectedRoute` / admin layout block:

```tsx
import DonorAutomation from "@/pages/admin/donor-automation";
import EmailTemplates  from "@/pages/admin/email-templates";

// inside <Routes>:
<Route path="/admin/donor-automation" element={<DonorAutomation />} />
<Route path="/admin/email-templates"  element={<EmailTemplates />} />
```

### Step 5 — Add links to the admin sidebar / nav

Find the admin navigation (likely in `Frontend/src/layouts/AdminLayout.tsx`) and
add entries for the two new pages using the same nav item pattern already in use.

---

## 3. Replace the Flask API with .NET controllers

The Flask app exposes ~12 endpoints. Each needs a matching .NET controller action.
The React components already call them — you just need to implement the backend.

**Create `Backend/Controllers/DonorAutomationController.cs`** with these endpoints:

| Flask route | .NET route | Notes |
|---|---|---|
| `GET /api/state` | `GET /api/donor-automation/state` | Read `state.json` or a DB table |
| `POST /api/automate/on` | `POST /api/donor-automation/on` | Start background job |
| `POST /api/automate/off` | `POST /api/donor-automation/off` | Stop background job |
| `GET /api/donors` | `GET /api/donor-automation/donors` | Run pipeline, return scored list |
| `GET /api/emails` | `GET /api/donor-automation/emails` | Return email log |
| `GET /api/feedback` | `GET /api/donor-automation/feedback` | Return feedback log |
| `POST /api/feedback` | `POST /api/donor-automation/feedback` | Record outcome |
| `GET /api/templates` | `GET /api/donor-automation/templates` | Return all templates |
| `PUT /api/templates/<id>` | `PUT /api/donor-automation/templates/{id}` | Update subject/body |
| `GET /api/templates/<id>/preview` | `GET /api/donor-automation/templates/{id}/preview` | Render template for a donor |
| `POST /api/send-test` | `POST /api/donor-automation/send-test` | Send one email |
| `POST /api/run-now` | `POST /api/donor-automation/run-now` | Full pipeline run |
| `POST /api/run-now/<id>` | `POST /api/donor-automation/run-now/{id}` | Email one donor |

**How to call the Python pipeline from .NET:**

Option A (simplest): Keep `pipeline.py` running as a sidecar service. The .NET
controller calls its JSON endpoints (pipeline already exposes them via Flask).

Option B (cleaner long-term): Use `System.Diagnostics.Process` to call
`python pipeline.py` and parse its stdout. The pipeline's `run_pipeline()`
function returns a DataFrame — add a `--json` flag that prints it as JSON.

**For email sending**, replace `emailer.py` with calls to the existing
`AudioAutofillService` pattern or add a `DonorEmailService` that uses Resend's
REST API directly from .NET. The Resend API key is already in the `.env` file.

---

## 4. Migrate the email templates to the database

Currently templates live in `email_templates.json`. For production, migrate them:

1. Add an `EmailTemplate` model to `Backend/Models/`
2. Add a `DbSet<EmailTemplate>` to `Backend/Data/AppDbContext.cs`
3. Seed the 3 templates from `email_templates.json` in `Backend/Data/DataSeeder.cs`
4. Update the controller to read/write from the database instead of the JSON file

---

## 5. Style the outgoing emails to match the website

**This is the most visible missing piece.** The emails currently use plain Georgia
serif body text with a single purple button. They need to be styled to match the
Lunas Foundation brand as expressed in the main frontend.

### Site design tokens (from `Frontend/src/index.css`)

| Token | Light mode value | Hex equivalent |
|---|---|---|
| Primary (purple) | `oklch(0.40 0.18 280)` | **`#5B21B6`** (close to Tailwind violet-800) |
| Primary button used in emails | `#7C3AED` | Tailwind violet-600 — already in `{{donate_button}}` |
| Background | `oklch(1 0 0)` | `#ffffff` |
| Foreground / body text | `oklch(0.09 0 0)` | `#171717` |
| Muted text | `oklch(0.45 0 0)` | `#737373` |
| Border | `oklch(0.92 0 0)` | `#ebebeb` |
| Card background | `oklch(1 0 0)` | `#ffffff` |

### Fonts

- **Headings:** Source Serif Pro (400, 600, 700)
  - Google Fonts URL: `https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap`
- **Body:** Inter (400, 500, 600)
  - Google Fonts URL: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap`

### What to build

Create a reusable HTML email layout in `emailer.py` (or a Jinja2 template in
`templates/`) with this structure:

```
┌─────────────────────────────────────────┐
│  [Lunas Foundation logo / wordmark]      │  ← purple header bar
├─────────────────────────────────────────┤
│                                          │
│  Email body text (Inter, #171717)        │
│                                          │
│        [ Donate Now button ]             │  ← #7C3AED, white text
│                                          │
├─────────────────────────────────────────┤
│  Footer: address, unsubscribe link,      │  ← muted text, small
│  "— Lunas Project"                       │
└─────────────────────────────────────────┘
```

**Email HTML rules (clients like Gmail strip external CSS):**

- Use **inline styles only** — no `<style>` tags, no CSS classes
- Use `max-width: 600px` centered container
- Use `font-family: Inter, Arial, sans-serif` for body (web-safe fallback)
- Use `font-family: Georgia, 'Times New Roman', serif` for headings as fallback
  (Source Serif Pro won't load in most email clients)
- The `{{donate_button}}` HTML is already inline-styled with `#7C3AED` — keep it
- Test in Gmail, Apple Mail, and Outlook before shipping

### Where to make the change

The HTML email is assembled in `emailer.py` → `generate_email()`. The current
implementation wraps body text in a plain `<div>` with Georgia font. Replace this
with a full branded layout. If you use a Jinja2 `.html` template file for the
email body, put it in `templates/email_base.html` and render it with
`flask.render_template_string()` or Python's `jinja2.Environment`.

---

## 6. Checklist for the next AI

- [ ] Copy `DonorAutomationView.tsx` → `Frontend/src/pages/admin/donor-automation.tsx`
- [ ] Copy `EmailTemplatesView.tsx` → `Frontend/src/pages/admin/email-templates.tsx`
- [ ] Update `API_BASE` in both components to point to the .NET backend
- [ ] Run `npm install` in `Frontend/` (tiptap is already in package.json)
- [ ] Add `/admin/donor-automation` and `/admin/email-templates` routes in `App.tsx`
- [ ] Add nav links in `AdminLayout.tsx`
- [ ] Create `DonorAutomationController.cs` with all 12 endpoints
- [ ] Migrate email templates from `email_templates.json` to the SQL database
- [ ] Build a branded HTML email layout that matches the site's design tokens
- [ ] Keep `pipeline.py` running (it's the ML brain — don't rewrite it in .NET)
- [ ] Move Resend API key to .NET `appsettings.json` / user secrets

---

## Data Sources

CSVs are read automatically from `Backend/Data/SeedData/`:
- `supporters.csv` — donor profiles (supporter_type, acquisition_channel, etc.)
- `donations.csv` — individual donation records (amount, date, type)
- `donation_allocations.csv` — which program area each donation funded

---

## Connecting to Production

1. **Real email sending** — Resend API key goes in `.env` (Flask) or user secrets (.NET)
2. **Persistent scheduler** — swap APScheduler's in-memory store for SQLAlchemy/Redis
3. **Real database** — replace CSV reads in `pipeline.py` with SQLAlchemy queries
4. **Authentication** — the existing ASP.NET Identity `AdminOnly` policy should gate
   all donor automation routes
5. **Azure deployment** — the Flask sidecar can run as a separate App Service or
   be containerised alongside the .NET app with Docker Compose
