# Donor Upgrade Automation — Lunas Foundation

A mini automation system that identifies which donors would give more if personally 
contacted, scores them with a machine learning model, and simulates personalized outreach.

## Quick Start

```bash
cd donor_automation
pip install flask flask-cors apscheduler scikit-learn pandas
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
| `emailer.py` | Personalized email generator — writes to `email_log.json` instead of sending |
| `state.json` | Persists automation on/off state, run history, and model accuracy over time |
| `email_log.json` | Log of every simulated email (donor, subject, full body, timestamp) |
| `feedback_log.json` | Records donor outcomes (converted / declined) to improve the model |
| `templates/dashboard.html` | Interactive dashboard served by Flask |
| `static/styles.css` | Lunas Foundation purple branding + clean responsive layout |

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/` | Dashboard HTML |
| GET | `/api/state` | Automation state + run history |
| POST | `/api/automate/on` | Enable weekly automation |
| POST | `/api/automate/off` | Disable automation |
| GET | `/api/donors` | Scored donor list |
| GET | `/api/emails` | Email log |
| GET | `/api/feedback` | Feedback log |
| POST | `/api/feedback` | Record a donor outcome |
| POST | `/api/run-now` | Trigger immediate pipeline run |
| POST | `/api/run-now/<id>` | Email a single donor immediately |

---

## How the Feedback Loop Works

```
1. Pipeline runs → scores donors → identifies upgrade candidates
2. Scheduler emails candidates (simulated → email_log.json)
3. Admin marks outcomes in dashboard:
     Converted ✓ → donor gave again
     Declined  ✗ → donor said no
4. Outcomes saved to feedback_log.json
5. Next pipeline run reads feedback → uses real outcomes to override rule-based labels
6. Model retrains on corrected labels → upgrade_probability scores improve
7. Repeat
```

Over time, the model learns which donor profiles actually lead to upgrades — not just 
which ones match the initial rule-based heuristic.

---

## Upgrade Candidate Rules

A donor is flagged as an upgrade candidate if ALL of:
- **Frequency ≥ 2** — gave more than once (genuinely engaged)
- **Monetary_avg < 75th percentile** — below top-quartile givers (room to grow)
- **Recency ≤ 180 days** — donated within the last 6 months (still active)

Score tiers:
- **High** = candidate with 6+ donations
- **Medium** = candidate with 2–5 donations  
- **Low** = not yet a candidate

---

## Connecting to a Production System

To move from prototype to production:

1. **Real email sending** — replace `emailer.log_email()` body with an SMTP/SendGrid call
2. **Persistent scheduler** — swap APScheduler's in-memory store for SQLAlchemy/Redis 
   so jobs survive server restarts
3. **Real database** — replace CSV reads with SQLAlchemy queries to your production DB
4. **Authentication** — add Flask-Login or JWT to protect the admin dashboard
5. **Azure deployment** — containerise with Docker, deploy to Azure App Service

---

## Data Sources

CSVs are read from the parent directory (`../`):
- `supporters.csv` — donor profiles (supporter_type, acquisition_channel, etc.)
- `donations.csv` — individual donation records (amount, date, type)
