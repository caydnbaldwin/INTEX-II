"""
emailer.py
----------
Template-driven email sender for donor outreach using Resend.
"""

import os
import json
from datetime import datetime

import numpy as np
import pandas as pd
import resend
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
EMAIL_LOG = os.path.join(SCRIPT_DIR, "email_log.json")
TEMPLATES_FILE = os.path.join(SCRIPT_DIR, "email_templates.json")

_CANDIDATE_DIRS = [
    os.path.join(SCRIPT_DIR, ".."),
    os.path.join(SCRIPT_DIR, "..", ".."),
    os.path.join(SCRIPT_DIR, "..", "..", "Backend", "Data", "SeedData"),
    os.path.join(SCRIPT_DIR, "..", "..", "seedData"),
]

load_dotenv(os.path.join(SCRIPT_DIR, ".env"), override=True)

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
FROM_NAME = os.getenv("RESEND_FROM_NAME", "Lunas Foundation")
REPLY_TO = os.getenv("RESEND_REPLY_TO", "admin@lunas-project.site")
RESEND_ENV = os.getenv("RESEND_ENV", "development").strip().lower()

DEV_TEST_EMAIL = "ethansmithxela23@gmail.com"

# Donate button content
_DONATE_TEXT = "Donate here: https://lunas-project.site/donate"
_DONATE_HTML = (
    '<div style="text-align: center; margin: 32px 0;">'
    '<a href="https://lunas-project.site/donate" '
    'style="background-color: #7C3AED; color: white; padding: 14px 32px; '
    'border-radius: 8px; text-decoration: none; font-weight: 600; '
    'font-size: 16px; display: inline-block;">Donate Now</a>'
    '</div>'
)
_DONATE_SENTINEL = "__DONATE_BUTTON__"


def _find_csv_dir():
    for d in _CANDIDATE_DIRS:
        supporters = os.path.join(d, "supporters.csv")
        donations = os.path.join(d, "donations.csv")
        allocations = os.path.join(d, "donation_allocations.csv")
        if os.path.exists(supporters) and os.path.exists(donations) and os.path.exists(allocations):
            return os.path.abspath(d)
    return os.path.abspath(_CANDIDATE_DIRS[1])


DATA_DIR = _find_csv_dir()


def is_dev_mode():
    return RESEND_ENV != "production"


def load_templates():
    with open(TEMPLATES_FILE, "r", encoding="utf-8") as f:
        payload = json.load(f)
    templates = payload.get("templates", [])
    return {t["id"]: t for t in templates}


def _to_int(value, default=0):
    try:
        return int(float(value))
    except Exception:
        return default


def _to_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def select_template_id(donor):
    recency = _to_int(donor.get("Recency", donor.get("recency", 999)))
    frequency = _to_int(donor.get("Frequency", donor.get("frequency", 1)), default=1)
    if recency > 90:
        return "win_back"
    if frequency >= 3:
        return "loyal"
    return "first_time"


def _render_text(template_text, context):
    rendered = str(template_text or "")
    for key, val in context.items():
        rendered = rendered.replace("{{" + key + "}}", str(val))
    return rendered


def _resolve_program_area_for_donor(donor_id):
    donations_path = os.path.join(DATA_DIR, "donations.csv")
    allocs_path = os.path.join(DATA_DIR, "donation_allocations.csv")
    if not os.path.exists(donations_path) or not os.path.exists(allocs_path):
        return "general operations"
    try:
        donations = pd.read_csv(donations_path)
        allocs = pd.read_csv(allocs_path)
        donor_donations = donations[donations["supporter_id"] == int(donor_id)][["donation_id"]]
        if donor_donations.empty:
            return "general operations"
        merged = donor_donations.merge(allocs, on="donation_id", how="inner")
        if merged.empty:
            return "general operations"
        by_area = merged.groupby("program_area", as_index=False)["amount_allocated"].sum()
        top = by_area.sort_values("amount_allocated", ascending=False).iloc[0]
        return str(top["program_area"]).strip() or "general operations"
    except Exception:
        return "general operations"


def _get_donor_monetary_amounts(donor_id):
    """Return list of monetary donation amounts for a donor from donations.csv."""
    donations_path = os.path.join(DATA_DIR, "donations.csv")
    if not os.path.exists(donations_path):
        return []
    try:
        donations = pd.read_csv(donations_path)
        donor_donations = donations[
            (donations["supporter_id"] == int(donor_id)) &
            (donations["donation_type"] == "Monetary") &
            (donations["amount"].notna())
        ]
        return [float(a) for a in donor_donations["amount"].tolist()]
    except Exception:
        return []


def _compute_suggested_amount(donor_id, donation_history=None):
    """
    Compute suggested donation amount rounded to nearest 500 PHP.
    - Multiple donations: 75th percentile of history, rounded to nearest 500.
    - Single donation: amount + 500, rounded to nearest 500.
    - No history: PHP 500.
    Returns formatted string e.g. 'PHP 1,500'.
    """
    amounts = donation_history if donation_history is not None else _get_donor_monetary_amounts(donor_id)
    amounts = [float(a) for a in amounts if a is not None]

    if not amounts:
        return "PHP 500"

    if len(amounts) == 1:
        raw = amounts[0] + 500
    else:
        raw = float(np.percentile(amounts, 75))

    rounded = round(raw / 500) * 500
    if rounded == 0:
        rounded = 500
    return f"PHP {rounded:,.0f}"


def build_template_context(donor):
    first_name = (donor.get("first_name") or donor.get("display_name") or "Friend").split()[0]
    frequency = _to_int(donor.get("Frequency", donor.get("frequency", 1)), default=1)
    recency = _to_int(donor.get("Recency", donor.get("recency", 0)), default=0)
    tenure_days = _to_float(donor.get("donor_tenure_days", 0.0), default=0.0)
    monetary_total = _to_float(donor.get("Monetary_total", donor.get("monetary_total", 0.0)), default=0.0)
    donor_id = _to_int(donor.get("supporter_id", donor.get("donor_id", 0)), default=0)
    program_area = donor.get("program_area") or _resolve_program_area_for_donor(donor_id)
    donation_history = donor.get("_donation_history")
    suggested_amount = _compute_suggested_amount(donor_id, donation_history=donation_history)
    return {
        "first_name": first_name,
        "frequency": frequency,
        "program_area": program_area,
        "recency_days": recency,
        "tenure_years": round(tenure_days / 365.0, 1),
        "monetary_total": f"PHP {monetary_total:,.2f}",
        "suggested_amount": suggested_amount,
        "donate_button": _DONATE_SENTINEL,
    }


def render_template_for_donor(template_obj, donor):
    context = build_template_context(donor)
    subject = _render_text(template_obj.get("subject", ""), context).strip()
    body = _render_text(template_obj.get("body", ""), context).strip()
    return subject, body, context


def generate_email(donor):
    template_id = select_template_id(donor)
    templates = load_templates()
    template_obj = templates.get(template_id)
    if template_obj is None:
        raise ValueError(f"Template not found: {template_id}")
    subject, body_with_sentinel, context = render_template_for_donor(template_obj, donor)

    # Plain text: replace sentinel with plain text donate link
    body_text = body_with_sentinel.replace(_DONATE_SENTINEL, _DONATE_TEXT)

    # HTML: escape parts split around sentinel, inject HTML button between them
    parts = body_with_sentinel.split(_DONATE_SENTINEL)
    escaped_parts = [
        p.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        for p in parts
    ]
    body_html_inner = _DONATE_HTML.join(escaped_parts)
    body_html = (
        "<div style='font-family: Georgia, serif; max-width: 640px; margin:0 auto; "
        "line-height:1.7; color:#1a1a2e;'>"
        + "<p style='white-space:pre-wrap;'>"
        + body_html_inner
        + "</p></div>"
    )

    return subject, body_text, body_html, template_id, context


def _append_to_log(entry):
    """Append an entry to email_log.json."""
    log = []
    if os.path.exists(EMAIL_LOG):
        try:
            with open(EMAIL_LOG, "r", encoding="utf-8") as f:
                log = json.load(f)
        except Exception:
            log = []
    log.append(entry)
    with open(EMAIL_LOG, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)


def _resolve_recipient(donor_email):
    """
    In dev mode, redirect all emails to the test address.
    In production, send to the real donor email.
    Returns (actual_send_to, intended_email).
    """
    if is_dev_mode():
        return DEV_TEST_EMAIL, donor_email
    return donor_email, donor_email


def send_donor_email(donor, to_email=None):
    """
    Generate a personalised email for *donor* and send it via Resend.
    Also logs the result to email_log.json.

    to_email: override recipient. If None, uses donor["email"].
    In dev mode, all emails are redirected to the test address regardless.

    Returns the log entry dict (includes 'message_id' on success).
    """
    intended_email = to_email or donor.get("email", "")

    if not intended_email:
        name = donor.get("display_name", "Unknown")
        print(f"[emailer] WARNING: No email for {name} (supporter_id={donor.get('supporter_id')}) - skipping")
        subject, body_text, _, template_id, _ = generate_email(donor)
        entry = {
            "donor_id":     int(donor.get("supporter_id", 0)),
            "donor_name":   name,
            "email":        "",
            "timestamp":    datetime.now().isoformat(timespec="seconds"),
            "subject":      subject,
            "body":         body_text,
            "status":       "skipped",
            "triggered_by": donor.get("_triggered_by", "api"),
            "skip_reason":  "no_email_on_file",
            "template_id":  template_id,
        }
        _append_to_log(entry)
        return entry

    actual_send_to, _ = _resolve_recipient(intended_email)
    subject, body_text, body_html, template_id, _ = generate_email(donor)

    if is_dev_mode():
        print(f"[emailer] DEV MODE: redirecting email for {donor.get('display_name', '?')} "
              f"({intended_email}) to test address ({actual_send_to})")

    entry = {
        "donor_id":        int(donor.get("supporter_id", 0)),
        "donor_name":      donor.get("display_name", ""),
        "email":           intended_email,
        "actual_sent_to":  actual_send_to,
        "timestamp":       datetime.now().isoformat(timespec="seconds"),
        "subject":         subject,
        "body":            body_text,
        "status":          "pending",
        "triggered_by":    donor.get("_triggered_by", "api"),
        "env":             RESEND_ENV,
        "template_id":     template_id,
    }

    try:
        resp = resend.Emails.send({
            "from":     f"{FROM_NAME} <{FROM_EMAIL}>",
            "to":       [actual_send_to],
            "subject":  subject,
            "html":     body_html,
            "text":     body_text,
            "reply_to": REPLY_TO,
        })
        entry["status"]     = "sent"
        entry["message_id"] = resp.get("id", "") if isinstance(resp, dict) else getattr(resp, "id", "")
        mode_label = f"DEV:{actual_send_to}" if is_dev_mode() else actual_send_to
        print(f"[emailer] SENT -> {entry['donor_name']} <{mode_label}>")
    except Exception as exc:
        entry["status"] = "failed"
        entry["error"]  = str(exc)
        print(f"[emailer] FAILED -> {intended_email} | {exc}")

    _append_to_log(entry)
    return entry


def log_email(donor, triggered_by="scheduler"):
    """
    Backwards-compatible wrapper used by scheduler.py.
    Sends a real email to the donor's address on file and logs it.
    In dev mode, the email is redirected to the test address automatically.
    """
    donor_dict = dict(donor)
    donor_dict["_triggered_by"] = triggered_by
    return send_donor_email(donor_dict)


def was_emailed_recently(donor_id, days=30):
    """Check if a donor was emailed within the last `days` days."""
    if not os.path.exists(EMAIL_LOG):
        return False
    try:
        with open(EMAIL_LOG, "r", encoding="utf-8") as f:
            log = json.load(f)
        now = datetime.now()
        for entry in log:
            if entry.get("donor_id") == int(donor_id):
                sent = datetime.fromisoformat(entry["timestamp"])
                if (now - sent).days <= days:
                    return True
    except Exception:
        pass
    return False


def get_config():
    """Return safe-to-expose config (never includes API key)."""
    return {
        "env":        RESEND_ENV,
        "from_email": FROM_EMAIL,
        "reply_to":   REPLY_TO,
        "from_name":  FROM_NAME,
    }


def get_template_for_donor(donor):
    template_id = select_template_id(donor)
    template = load_templates().get(template_id)
    if not template:
        raise ValueError(f"Template not found: {template_id}")
    return template


# ── Test donors for __main__ ────────────────────────────────────────────────

_TEST_DONORS = [
    {
        "supporter_id":    991,
        "display_name":    "Maria Test",
        "first_name":      "Maria",
        "email":           DEV_TEST_EMAIL,
        "Frequency":       7,
        "Recency":         45,
        "program_area":    "Education",
        "_donation_history": [800, 900, 1000, 850, 950, 1100, 875],
        "_label":          "loyal",
    },
    {
        "supporter_id":    992,
        "display_name":    "Carlo Test",
        "first_name":      "Carlo",
        "email":           DEV_TEST_EMAIL,
        "Frequency":       1,
        "Recency":         30,
        "program_area":    "Wellbeing",
        "_donation_history": [500],
        "_label":          "first_time",
    },
    {
        "supporter_id":    993,
        "display_name":    "Ana Test",
        "first_name":      "Ana",
        "email":           DEV_TEST_EMAIL,
        "Frequency":       4,
        "Recency":         120,
        "program_area":    "Operations",
        "_donation_history": [600, 700, 650, 800],
        "_label":          "win_back",
    },
]


if __name__ == "__main__":
    print(f"[emailer] Mode: {RESEND_ENV}\n")
    print("=" * 60)
    print("TASK 5 — SENDING 3 TEST EMAILS")
    print("=" * 60)

    for donor in _TEST_DONORS:
        label = donor.pop("_label")
        print(f"\n--- [{label.upper()}] {donor['first_name']} ---")
        subject, body_text, body_html, template_id, context = generate_email(donor)
        body_lines = body_text.splitlines()
        preview_lines = [l for l in body_lines if l.strip()][:3]
        print(f"Template:  {template_id}")
        print(f"Subject:   {subject}")
        print(f"suggested_amount: {context['suggested_amount']}")
        print("Body (first 3 non-empty lines):")
        for line in preview_lines:
            print(f"  {line}")
        entry = send_donor_email(donor, to_email=DEV_TEST_EMAIL)
        print(f"Status:    {entry['status']}  message_id={entry.get('message_id', 'N/A')}")
        if entry.get("error"):
            print(f"Error:     {entry['error']}")

    print("\n" + "=" * 60)
    print("TASK 5 — REAL DONOR TEMPLATE ROUTING (new 3-template system)")
    print("=" * 60)
    try:
        from pipeline import run_pipeline
        df, _, _ = run_pipeline(save_summary=False)
        print(f"\n{'Donor':<25} {'Freq':>5} {'Recency':>8} {'Template':<12}")
        print("-" * 55)
        for _, row in df.iterrows():
            donor_row = row.to_dict()
            tid = select_template_id(donor_row)
            name = str(row.get("display_name", ""))
            freq = int(row.get("Frequency", 0))
            rec  = int(row.get("Recency", 0))
            print(f"{name:<25} {freq:>5} {rec:>8} {tid:<12}")
    except Exception as e:
        print(f"[emailer] Could not load pipeline for donor routing: {e}")
