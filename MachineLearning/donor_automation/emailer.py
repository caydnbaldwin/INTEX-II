"""
emailer.py
----------
Personalized email generator for donor upgrade outreach.

What it does:
  - Takes a donor record (dict or DataFrame row)
  - Generates a subject line and full email body personalized to:
      * Their first name
      * Their acquisition channel (how they found Lunas Foundation)
      * Their giving frequency ("You've supported us X times...")
      * Their recency ("Your last gift was X days ago...")
  - Does NOT send real email — writes to email_log.json instead
  - Each entry is stamped with timestamp and status: "simulated"

How it connects to the larger system:
  scheduler.run_weekly_check() calls log_email() for each new candidate.
  app.py exposes /api/emails so the dashboard can display the log.
  In production, replace _send() with an SMTP or SendGrid call.
"""

import os
import json
from datetime import datetime

SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
EMAIL_LOG     = os.path.join(SCRIPT_DIR, "email_log.json")

# ── Channel-specific opening lines ────────────────────────────────────────────
CHANNEL_OPENERS = {
    "SocialMedia":      "As someone who found us through social media, you've seen firsthand how our community rallies around the girls we serve.",
    "Church":           "As a valued member of our church community, your faith and generosity have been a cornerstone of our mission.",
    "Website":          "As someone who sought us out directly, you understood our mission from the very beginning — and that means everything.",
    "Event":            "Ever since you connected with us at one of our events, your support has been a reminder of why this work matters.",
    "WordOfMouth":      "When a friend told you about Lunas Foundation, they passed along something precious — and so did you, with every gift.",
    "PartnerReferral":  "Through our partner network, you found your way to us — and we are so grateful you did.",
}

ORG_NAME = "Lunas Foundation"
REPLY_TO = "hello@lunasfoundation.org"


def _channel_opener(channel):
    """Return the personalized channel-specific opening sentence."""
    return CHANNEL_OPENERS.get(channel, "Your continued support means more than words can express.")


def _frequency_line(frequency):
    """Return a sentence acknowledging giving frequency."""
    if frequency == 1:
        return "You made your first gift to us, and it left a lasting impact."
    elif frequency < 5:
        return f"You have supported us {frequency} times — each gift a renewed commitment."
    elif frequency < 10:
        return f"You have given {frequency} times. That kind of consistency is rare and deeply appreciated."
    else:
        return f"With {frequency} donations on record, you are one of our most dedicated supporters."


def _recency_line(recency_days):
    """Return a sentence about how recently they last gave."""
    if recency_days <= 30:
        return "Your most recent gift was just this past month — your generosity is still fresh in our hearts."
    elif recency_days <= 90:
        return f"Your last gift was about {recency_days} days ago, and its impact is still being felt."
    else:
        return f"It has been {recency_days} days since your last gift — we have missed you and hope you are well."


def generate_email(donor):
    """
    Generate a personalized subject line and email body for a donor.

    donor: dict or pandas Series with fields:
      display_name, first_name, email, acquisition_channel,
      Frequency, Recency, Monetary_avg, upgrade_probability

    Returns: (subject: str, body: str)
    """
    first       = donor.get("first_name", donor.get("display_name", "Friend")).split()[0]
    channel     = donor.get("acquisition_channel", "")
    frequency   = int(donor.get("Frequency", 1))
    recency     = int(donor.get("Recency", 90))
    avg_gift    = float(donor.get("Monetary_avg", 0))

    opener    = _channel_opener(channel)
    freq_line = _frequency_line(frequency)
    rec_line  = _recency_line(recency)

    # Suggested upgrade amount: ~25% above their average, rounded to nearest 50
    suggested = max(100, round((avg_gift * 1.25) / 50) * 50)

    subject = f"{first}, your support could change one more life this year"

    body = f"""Dear {first},

{opener}

{freq_line} {rec_line}

The girls in our safehouses are making real progress — in their education, their health, and their sense of safety. But there are always more young women who need a place like Lunas Foundation.

We are reaching out personally because donors like you — engaged, consistent, and mission-aligned — are exactly who we rely on when we want to do more.

Would you consider a monthly gift of PHP {suggested:,.0f}? At that level, you would directly fund one girl's school supplies and wellness check for an entire month.

This is not a mass appeal. We are asking you specifically because your history of giving tells us you care deeply about this work.

To make your next gift or adjust your giving level, simply reply to this email or visit our donation page. We will personally follow up.

With gratitude,

The Lunas Foundation Team
{REPLY_TO}

---
You are receiving this personal note because you are a valued supporter of Lunas Foundation.
To update your communication preferences, reply to this email.
"""
    return subject.strip(), body.strip()


def log_email(donor, triggered_by="scheduler"):
    """
    Generate a personalized email and write it to email_log.json.

    Does NOT send a real email. In production, replace this with an
    SMTP/SendGrid call and change status from "simulated" to "sent".

    donor: dict with donor fields
    triggered_by: "scheduler" | "manual" (for audit trail)

    Returns: the log entry dict.
    """
    subject, body = generate_email(donor)

    entry = {
        "donor_id":     int(donor.get("supporter_id", 0)),
        "donor_name":   donor.get("display_name", ""),
        "email":        donor.get("email", ""),
        "timestamp":    datetime.now().isoformat(timespec="seconds"),
        "subject":      subject,
        "body":         body,
        "status":       "simulated",
        "triggered_by": triggered_by,
    }

    # Load existing log (create empty if missing)
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

    print(f"[emailer] Logged email -> {entry['donor_name']} <{entry['email']}> | {subject}")
    return entry


def was_emailed_recently(donor_id, days=30):
    """
    Check if a donor was emailed within the last `days` days.
    Used by the scheduler to avoid re-emailing too frequently.

    Returns: True if emailed within window, False otherwise.
    """
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


if __name__ == "__main__":
    # Quick test — simulate one email
    test_donor = {
        "supporter_id":      99,
        "display_name":      "Test Donor",
        "first_name":        "Test",
        "email":             "test@example.com",
        "acquisition_channel": "SocialMedia",
        "Frequency":         5,
        "Recency":           45,
        "Monetary_avg":      850.0,
        "upgrade_probability": 0.91,
    }
    entry = log_email(test_donor, triggered_by="test")
    print("\n--- Email Preview ---")
    print(f"To:      {entry['email']}")
    print(f"Subject: {entry['subject']}")
    print(f"\n{entry['body']}")
