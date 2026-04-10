"""
scheduler.py
------------
Weekly automation logic for the donor upgrade pipeline.

What it does:
  - run_weekly_check(): the main job that runs the full pipeline end-to-end,
    checks for new candidates, reads feedback history, and logs emails
  - start_scheduler(): starts an APScheduler BackgroundScheduler that calls
    run_weekly_check() every 7 days
  - stop_scheduler(): cleanly shuts down the scheduler
  - run_now(): convenience wrapper used by the Flask API /api/run-now endpoint

How it connects to the larger system:
  app.py calls start_scheduler() when automation is toggled ON.
  app.py calls stop_scheduler() when automation is toggled OFF.
  app.py calls run_now() for immediate manual runs.
  The state.json file is updated after every run so the dashboard
  always reflects current status.
"""

import os
import json
import threading
from datetime import datetime, timedelta

from pipeline import run_pipeline
from emailer  import log_email, was_emailed_recently

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False
    print("[scheduler] APScheduler not installed — scheduler.start() will be a no-op")

SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
STATE_FILE    = os.path.join(SCRIPT_DIR, "state.json")
FEEDBACK_FILE = os.path.join(SCRIPT_DIR, "feedback_log.json")
EMAIL_LOG     = os.path.join(SCRIPT_DIR, "email_log.json")

# Global scheduler instance (singleton)
_scheduler = None
_scheduler_lock = threading.Lock()


# ── State helpers ──────────────────────────────────────────────────────────────

def load_state():
    """Load state.json, returning defaults if missing or corrupt."""
    default = {"enabled": False, "last_run": None, "next_run": None, "runs": []}
    if not os.path.exists(STATE_FILE):
        return default
    try:
        with open(STATE_FILE, "r") as f:
            return {**default, **json.load(f)}
    except Exception:
        return default


def save_state(state):
    """Write state dict to state.json."""
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def load_feedback():
    """
    Load feedback_log.json and return a dict of {donor_id: [entries]}.
    Used to log model feedback in the run summary.
    """
    if not os.path.exists(FEEDBACK_FILE):
        return {}
    try:
        with open(FEEDBACK_FILE, "r") as f:
            entries = json.load(f)
        result = {}
        for e in entries:
            did = e.get("donor_id")
            if did:
                result.setdefault(did, []).append(e)
        return result
    except Exception:
        return {}


def count_emails_this_week():
    """Count emails logged in the last 7 days (for dashboard stats)."""
    if not os.path.exists(EMAIL_LOG):
        return 0
    try:
        with open(EMAIL_LOG, "r") as f:
            log = json.load(f)
        cutoff = datetime.now() - timedelta(days=7)
        return sum(
            1 for e in log
            if datetime.fromisoformat(e["timestamp"]) > cutoff
        )
    except Exception:
        return 0


# ── Main weekly job ────────────────────────────────────────────────────────────

def run_weekly_check(triggered_by="scheduler"):
    """
    The core automation job. Called weekly by APScheduler (and on demand).

    Steps:
      1. Run the ML pipeline to get fresh scores
      2. Identify upgrade candidates
      3. Check feedback_log for past invitees that converted/declined
         → log that as model signal (pipeline.py uses it for re-labeling)
      4. For each candidate NOT emailed in last 30 days → log a personalized email
      5. Update state.json with run summary

    triggered_by: "scheduler" | "manual" | "api" — stored in run log for audit.
    """
    print(f"\n[scheduler] === Weekly check started ({triggered_by}) ===")

    # Step 1: Run pipeline
    try:
        rfm, accuracy, p75 = run_pipeline(save_summary=False)
    except Exception as e:
        print(f"[scheduler] Pipeline error: {e}")
        return {"error": str(e)}

    # Step 2: Email outreach population (all scored donors)
    outreach = rfm.copy()
    n_outreach = len(outreach)
    print(f"[scheduler] Found {n_outreach} donors in outreach")

    # Step 3: Check feedback — log any new conversions/declines as model signal
    feedback = load_feedback()
    conversions = sum(
        1 for entries in feedback.values()
        for e in entries if e.get("outcome") == "converted"
    )
    declines = sum(
        1 for entries in feedback.values()
        for e in entries if e.get("outcome") == "declined"
    )
    if conversions or declines:
        print(f"[scheduler] Feedback found: {conversions} converted, {declines} declined — "
              f"these are used to re-label donors on next pipeline run")

    # Step 4: Email donors not contacted in last 30 days
    emails_sent = 0
    emails_failed = 0
    emails_skipped_no_email = 0
    emails_skipped_cooldown = 0
    for _, donor in outreach.iterrows():
        donor_dict = donor.to_dict()
        donor_name = donor_dict.get("display_name", "?")
        donor_email = donor_dict.get("email", "")

        if not donor_email:
            print(f"[scheduler] Skipping {donor_name} — no email on file")
            emails_skipped_no_email += 1
            continue

        if was_emailed_recently(donor_dict["supporter_id"], days=30):
            print(f"[scheduler] Skipping {donor_name} <{donor_email}> — emailed recently")
            emails_skipped_cooldown += 1
            continue

        ts = datetime.now().isoformat(timespec="seconds")
        entry = log_email(donor_dict, triggered_by=triggered_by)
        status = entry.get("status", "unknown")

        if status == "sent":
            emails_sent += 1
            print(f"[scheduler] SENT {donor_name} <{donor_email}> at {ts}")
        elif status == "failed":
            emails_failed += 1
            print(f"[scheduler] FAIL {donor_name} <{donor_email}> at {ts} — {entry.get('error', '')}")
        else:
            emails_sent += 1
            print(f"[scheduler] LOGGED {donor_name} <{donor_email}> at {ts} status={status}")

    print(f"[scheduler] Emails sent: {emails_sent}, failed: {emails_failed}, "
          f"skipped (no email): {emails_skipped_no_email}, skipped (cooldown): {emails_skipped_cooldown}")

    # Step 5: Save run summary to state.json
    state = load_state()
    run_entry = {
        "timestamp":        datetime.now().isoformat(timespec="seconds"),
        "candidates_found": n_outreach,
        "emails_sent":      emails_sent,
        "model_accuracy":   round(accuracy * 100, 1),
        "p75_threshold":    round(p75, 2),
        "triggered_by":     triggered_by,
        "feedback_conversions": conversions,
        "feedback_declines":    declines,
        "outreach_total": n_outreach,
        "skipped_cooldown": emails_skipped_cooldown,
    }
    state.setdefault("runs", []).append(run_entry)
    state["last_run"] = run_entry["timestamp"]

    # Compute next_run if scheduler is active
    if state.get("enabled"):
        next_dt = datetime.now() + timedelta(days=7)
        state["next_run"] = next_dt.isoformat(timespec="seconds")

    save_state(state)
    print(f"[scheduler] Run complete. State saved.\n")
    return run_entry


# ── APScheduler control ────────────────────────────────────────────────────────

def start_scheduler():
    """
    Start the APScheduler BackgroundScheduler to call run_weekly_check()
    every 7 days. Safe to call multiple times — won't double-start.

    In production this would use a persistent job store (e.g. SQLAlchemy)
    so jobs survive server restarts.
    """
    global _scheduler

    if not APSCHEDULER_AVAILABLE:
        print("[scheduler] APScheduler not available — skipping scheduler start")
        return

    with _scheduler_lock:
        if _scheduler is not None and _scheduler.running:
            print("[scheduler] Already running — skipping start")
            return

        _scheduler = BackgroundScheduler(daemon=True)
        _scheduler.add_job(
            func=run_weekly_check,
            trigger="interval",
            days=7,
            id="weekly_donor_check",
            replace_existing=True,
            kwargs={"triggered_by": "scheduler"},
        )
        _scheduler.start()

        # Update state
        state = load_state()
        state["enabled"]  = True
        state["next_run"] = (datetime.now() + timedelta(days=7)).isoformat(timespec="seconds")
        save_state(state)

        print("[scheduler] Started — next run in 7 days")


def stop_scheduler():
    """
    Cleanly shut down the APScheduler instance and update state.json.
    Called when the admin toggles automation OFF.
    """
    global _scheduler

    with _scheduler_lock:
        if _scheduler is not None and _scheduler.running:
            _scheduler.shutdown(wait=False)
            _scheduler = None
            print("[scheduler] Stopped")

    state = load_state()
    state["enabled"]  = False
    state["next_run"] = None
    save_state(state)


def is_running():
    """Return True if the background scheduler is currently active."""
    return _scheduler is not None and _scheduler.running


def run_now(triggered_by="api"):
    """
    Trigger an immediate run of run_weekly_check().
    Called by app.py /api/run-now endpoint.
    Runs in a background thread so the HTTP response isn't blocked.
    """
    thread = threading.Thread(
        target=run_weekly_check,
        kwargs={"triggered_by": triggered_by},
        daemon=True,
    )
    thread.start()
    return {"status": "triggered", "triggered_by": triggered_by,
            "timestamp": datetime.now().isoformat(timespec="seconds")}


if __name__ == "__main__":
    # Manual test run
    result = run_weekly_check(triggered_by="manual-test")
    print(json.dumps(result, indent=2))
