"""
app.py
------
Flask backend for the Donor Upgrade Automation Dashboard.

Runs on port 5050.
Serves the dashboard HTML and provides a JSON API for all dynamic data.

Routes:
  GET  /                    → dashboard HTML
  GET  /api/state           → automation state (enabled, last_run, next_run, runs)
  POST /api/automate/on     → enable automation + run immediately
  POST /api/automate/off    → disable automation
  GET  /api/donors          → scored donor list from pipeline
  GET  /api/emails          → email_log.json contents
  GET  /api/feedback        → feedback_log.json contents
  POST /api/feedback        → record a donor outcome (converted/declined)
  POST /api/run-now         → trigger immediate pipeline + email run
  POST /api/run-now/<id>    → email a single donor immediately

How it connects to the larger system:
  In production, this Flask app would be containerised and fronted by nginx.
  The scheduler would use a persistent job store (Redis/SQLAlchemy).
  The emailer would call a real SMTP provider (SendGrid, AWS SES).
"""

import os
import json
from datetime import datetime
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

import pipeline  as pl
import emailer   as em
import scheduler as sc

SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
STATE_FILE    = os.path.join(SCRIPT_DIR, "state.json")
EMAIL_LOG     = os.path.join(SCRIPT_DIR, "email_log.json")
FEEDBACK_FILE = os.path.join(SCRIPT_DIR, "feedback_log.json")

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)  # Allow cross-origin requests (needed for dev / Azure deployment)


# ── Helper ─────────────────────────────────────────────────────────────────────

def read_json(path, default=None):
    """Safely read a JSON file, returning default if missing or corrupt."""
    if default is None:
        default = []
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the dashboard HTML template."""
    return render_template("dashboard.html")


@app.route("/api/state")
def get_state():
    """
    Return current automation state.
    Response shape:
      { enabled, last_run, next_run, runs: [...], emails_this_week, scheduler_running }
    """
    state = read_json(STATE_FILE, default={
        "enabled": False, "last_run": None, "next_run": None, "runs": []
    })
    state["scheduler_running"] = sc.is_running()
    state["emails_this_week"]  = sc.count_emails_this_week()
    return jsonify(state)


@app.route("/api/automate/on", methods=["POST"])
def automate_on():
    """
    Enable weekly automation:
      1. Start the APScheduler background job (every 7 days)
      2. Trigger an immediate run so the admin sees results right away
    """
    sc.start_scheduler()
    result = sc.run_weekly_check(triggered_by="api-on")
    return jsonify({"status": "enabled", "run_result": result})


@app.route("/api/automate/off", methods=["POST"])
def automate_off():
    """Disable automation — stop the scheduler."""
    sc.stop_scheduler()
    return jsonify({"status": "disabled"})


@app.route("/api/donors")
def get_donors():
    """
    Run the pipeline and return the scored donor list as JSON.
    Each donor includes: rank, display_name, email, upgrade_score,
    upgrade_candidate, upgrade_probability, RFM fields, latest_donation.
    """
    try:
        # Auto-detect conversions before scoring so the model uses fresh labels
        pl.check_auto_conversions()

        rfm, acc, p75 = pl.run_pipeline(save_summary=False)
        donors = rfm[[
            "rank", "supporter_id", "display_name", "first_name", "email",
            "upgrade_score", "upgrade_candidate", "upgrade_probability",
            "Monetary_avg", "Monetary_total", "Frequency", "Recency",
            "latest_donation", "acquisition_channel",
        ]].copy()

        # Round floats for clean JSON
        donors["Monetary_avg"]         = donors["Monetary_avg"].round(2)
        donors["Monetary_total"]        = donors["Monetary_total"].round(2)
        donors["upgrade_probability"]   = donors["upgrade_probability"].round(4)

        return jsonify({
            "donors":   donors.to_dict(orient="records"),
            "accuracy": round(acc * 100, 1),
            "p75":      round(p75, 2),
            "total":    len(donors),
            "candidates": int((donors["upgrade_candidate"] == 1).sum()),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/emails")
def get_emails():
    """Return the full email log (most recent first)."""
    log = read_json(EMAIL_LOG, default=[])
    return jsonify(list(reversed(log)))


@app.route("/api/feedback", methods=["GET"])
def get_feedback():
    """Return the full feedback log."""
    return jsonify(read_json(FEEDBACK_FILE, default=[]))


@app.route("/api/feedback", methods=["POST"])
def post_feedback():
    """
    Record a donor outcome (converted or declined).
    Body: { "donor_id": int, "donor_name": str, "outcome": "converted"|"declined" }

    This is the core feedback loop:
      Admin marks a donor as converted → next pipeline run uses this as a
      positive label → model learns that this donor profile leads to upgrades.
    """
    data = request.get_json(force=True)
    required = ["donor_id", "outcome"]
    if not all(k in data for k in required):
        return jsonify({"error": f"Missing fields: {required}"}), 400
    if data["outcome"] not in ("converted", "declined"):
        return jsonify({"error": "outcome must be 'converted' or 'declined'"}), 400

    entry = {
        "donor_id":   int(data["donor_id"]),
        "donor_name": data.get("donor_name", ""),
        "outcome":    data["outcome"],
        "timestamp":  datetime.now().isoformat(timespec="seconds"),
        "notes":      data.get("notes", ""),
    }

    log = read_json(FEEDBACK_FILE, default=[])
    log.append(entry)
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2)

    print(f"[app] Feedback recorded: {entry['donor_name']} → {entry['outcome']}")
    return jsonify({"status": "recorded", "entry": entry})


@app.route("/api/run-now", methods=["POST"])
def run_now():
    """Trigger an immediate full pipeline + email run (non-blocking)."""
    result = sc.run_now(triggered_by="api-manual")
    return jsonify(result)


@app.route("/api/run-now/<int:donor_id>", methods=["POST"])
def run_now_single(donor_id):
    """
    Email a single donor immediately.
    Looks up the donor in the current pipeline output and logs their email.
    """
    try:
        rfm, _, _ = pl.run_pipeline(save_summary=False)
        match = rfm[rfm["supporter_id"] == donor_id]
        if match.empty:
            return jsonify({"error": f"Donor {donor_id} not found"}), 404

        donor_dict = match.iloc[0].to_dict()
        entry = em.log_email(donor_dict, triggered_by="manual-single")
        return jsonify({"status": "logged", "email": entry})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 50)
    print("  Lunas Foundation — Donor Upgrade Dashboard")
    print("  http://localhost:5050")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5050, debug=False, use_reloader=False)
