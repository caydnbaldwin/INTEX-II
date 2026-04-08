# Donor Automation — Handoff

## What This Is
ML-powered donor upgrade system for Lunas Foundation. Scores donors via Logistic Regression on RFM features, identifies upgrade candidates, sends personalized outreach emails via Resend, and feeds outcomes back into the model.

## Stack
- **Flask** on port 5050 (`app.py`) — API + dashboard
- **Python** — `pipeline.py` (ML scoring), `emailer.py` (Resend sender), `scheduler.py` (APScheduler weekly)
- **React/TSX** — `DonorAutomationView.tsx` (shadcn/ui component, not yet wired into router)
- **Data** — CSVs in `Backend/Data/SeedData/` (supporters.csv, donations.csv)

## API Endpoints
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/` | Dashboard HTML |
| GET | `/api/state` | Automation state + run history |
| GET | `/api/donors` | Scored donor list (includes email + email_masked) |
| GET | `/api/emails` | Email log |
| GET | `/api/feedback` | Feedback log |
| GET | `/api/config` | Safe config (env, from_email, reply_to — no API key) |
| POST | `/api/automate/on` | Enable weekly automation |
| POST | `/api/automate/off` | Disable automation |
| POST | `/api/send-test` | Send email — `{donor_id}` for real donor, `{}` for fake profile |
| POST | `/api/run-now` | Full pipeline + email run |
| POST | `/api/run-now/<id>` | Email single donor |
| POST | `/api/feedback` | Record converted/declined outcome |

## Dev vs Production Mode (`RESEND_ENV` in `.env`)
- **development** — All emails redirect to `ethansmithxela23@gmail.com` with a `[DEV MODE]` banner. No real donors are contacted.
- **production** — Emails go to real donor addresses. Requires verified sending domain in Resend.

## Key Files
```
MachineLearning/donor_automation/
├── app.py              ← Flask server (port 5050)
├── pipeline.py         ← ML scoring (RFM + LogReg + LOO-CV)
├── emailer.py          ← Resend email sender + dev/prod mode
├── scheduler.py        ← APScheduler weekly automation
├── .env                ← API keys + RESEND_ENV (gitignored)
├── .env.example        ← Safe placeholder version
├── state.json          ← Automation state + run history
├── email_log.json      ← All sent/simulated emails
├── feedback_log.json   ← Donor outcomes for model retraining
├── DonorAutomationView.tsx  ← React component (copy to Frontend/src/pages/)
├── templates/dashboard.html ← Flask-served dashboard
└── static/styles.css        ← Dashboard styles (Lunas design tokens)
```

## Current State (2026-04-08)
- 16 monetary donors scored, 9 upgrade candidates, 81.2% accuracy
- All 16 donors have email addresses
- Resend API key is live, dev mode confirmed working
- Dashboard styled to match Lunas Foundation site (Inter + Source Serif Pro, purple accent, shadcn patterns)

## To Go Live
1. Verify `lunas-project.site` in [Resend domains](https://resend.com/domains)
2. In `.env`: change `RESEND_ENV=production` and `RESEND_FROM_EMAIL=noreply@lunas-project.site`
3. Restart `app.py`

## To Integrate TSX Component
1. Copy `DonorAutomationView.tsx` to `Frontend/src/pages/`
2. Add route (e.g. `/admin/donor-outreach`)
3. Ensure `<Toaster />` from sonner is in root layout

## How to Run
```bash
cd MachineLearning/donor_automation
pip install flask flask-cors apscheduler scikit-learn pandas resend python-dotenv
python app.py
# Open http://localhost:5050
```
