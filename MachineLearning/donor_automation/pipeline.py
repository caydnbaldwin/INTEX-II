"""
pipeline.py
-----------
Core ML scoring pipeline for the donor upgrade system.

What it does:
  1. Loads supporters.csv and donations.csv from the parent directory
  2. Computes RFM features (Recency, Frequency, Monetary) per donor
  3. Applies a rule-based upgrade_candidate label (same logic as Q2 notebook)
  4. Trains a LogisticRegression model using Leave-One-Out CV to score donors
  5. Returns a ranked DataFrame sorted by upgrade priority
  6. Appends a timestamped run summary to state.json

How it connects to the larger system:
  scheduler.py calls run_pipeline() weekly to refresh scores.
  app.py calls run_pipeline() on demand via /api/donors and /api/run-now.
  Over time, feedback from feedback_log.json will be used to re-label donors
  and retrain the model, improving accuracy with real-world outcomes.
"""

import os
import json
import warnings
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import LeaveOneOut, cross_val_predict
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score

warnings.filterwarnings("ignore")

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
STATE_FILE    = os.path.join(SCRIPT_DIR, "state.json")
FEEDBACK_FILE = os.path.join(SCRIPT_DIR, "feedback_log.json")

# Search for CSVs in multiple likely locations
_CANDIDATE_DIRS = [
    os.path.join(SCRIPT_DIR, ".."),                                  # MachineLearning/
    os.path.join(SCRIPT_DIR, "..", ".."),                             # project root
    os.path.join(SCRIPT_DIR, "..", "..", "Backend", "Data", "SeedData"),  # .NET seed data
    os.path.join(SCRIPT_DIR, "..", "..", "seedData"),
]


def _find_csv_dir():
    """Locate the directory that contains supporters.csv and donations.csv."""
    for d in _CANDIDATE_DIRS:
        s = os.path.join(d, "supporters.csv")
        dn = os.path.join(d, "donations.csv")
        if os.path.exists(s) and os.path.exists(dn):
            resolved = os.path.abspath(d)
            print(f"[pipeline] CSVs found in: {resolved}")
            return resolved
    checked = [os.path.abspath(d) for d in _CANDIDATE_DIRS]
    raise FileNotFoundError(
        f"supporters.csv / donations.csv not found. Searched: {checked}"
    )


DATA_DIR = _find_csv_dir()


def load_data():
    """
    Load and validate supporters.csv and donations.csv.
    Returns (supporters_df, monetary_donations_df).
    Raises FileNotFoundError if CSVs are missing.
    """
    supporters_path = os.path.join(DATA_DIR, "supporters.csv")
    donations_path  = os.path.join(DATA_DIR, "donations.csv")

    for p in [supporters_path, donations_path]:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Required CSV not found: {p}")

    supporters = pd.read_csv(supporters_path)
    donations  = pd.read_csv(donations_path)

    print(f"[pipeline] Loaded {len(supporters)} supporters, {len(donations)} donations")

    # Parse and clean
    donations["donation_date"] = pd.to_datetime(donations["donation_date"], errors="coerce")
    donations["amount"]        = pd.to_numeric(donations["amount"], errors="coerce")

    # Filter to MonetaryDonors and Monetary donation type only
    monetary_donors = supporters[supporters["supporter_type"] == "MonetaryDonor"].copy()
    monetary_dona   = donations[donations["donation_type"] == "Monetary"].copy()

    print(f"[pipeline] Filtered to {len(monetary_donors)} monetary donors, "
          f"{len(monetary_dona)} monetary donations")

    return monetary_donors, monetary_dona


def compute_rfm(monetary_donors, monetary_dona):
    """
    Compute one row of RFM features per donor by joining and aggregating.

    Features computed:
      Recency        – days since last donation (lower = more active)
      Frequency      – total number of donations
      Monetary_avg   – average donation amount
      Monetary_max   – largest single donation
      Monetary_total – lifetime giving
      is_recurring   – 1 if they ever set up a recurring donation
      donor_tenure_days – days between first and last donation
      latest_donation – date of most recent donation (for dashboard display)

    Returns a DataFrame with one row per donor.
    """
    ref_date = monetary_dona["donation_date"].max() + pd.Timedelta(days=1)

    rfm = (
        monetary_donors.merge(monetary_dona, on="supporter_id", how="inner")
        .groupby(["supporter_id", "display_name", "first_name", "email",
                  "acquisition_channel", "relationship_type"])
        .agg(
            Recency         = ("donation_date", lambda x: (ref_date - x.max()).days),
            Frequency       = ("donation_id",   "count"),
            Monetary_avg    = ("amount",        "mean"),
            Monetary_max    = ("amount",        "max"),
            Monetary_total  = ("amount",        "sum"),
            is_recurring    = ("is_recurring",  lambda x: int(x.astype(str).str.lower().eq("true").any())),
            latest_donation = ("donation_date", "max"),
            first_donation  = ("donation_date", "min"),
        )
        .reset_index()
    )

    rfm["latest_donation"]    = rfm["latest_donation"].dt.date.astype(str)
    rfm["donor_tenure_days"]  = (
        pd.to_datetime(rfm["latest_donation"]) - rfm["first_donation"]
    ).dt.days
    rfm["campaign_affinity"]  = 0.0  # placeholder — populated if campaign data available

    return rfm


def apply_labels(rfm, feedback_overrides=None):
    """
    Apply the rule-based upgrade_candidate label.

    Rule: candidate = 1 if ALL of:
      - Frequency >= 2      (repeat donor, genuinely engaged)
      - Monetary_avg < p75  (below top quartile — room to grow)
      - Recency <= 180      (active in last 6 months)

    feedback_overrides: dict of {supporter_id: "converted"|"declined"}
      When a donor marked "converted" via the feedback log, we trust that
      label over the rule. This is how the model improves over time.

    Returns (rfm_with_labels, p75_threshold).
    """
    p75 = rfm["Monetary_avg"].quantile(0.75)

    rfm["upgrade_candidate"] = (
        (rfm["Frequency"] >= 2) &
        (rfm["Monetary_avg"] < p75) &
        (rfm["Recency"] <= 180)
    ).astype(int)

    # Apply feedback overrides — real-world signal beats rule-based labels
    if feedback_overrides:
        for sid, outcome in feedback_overrides.items():
            mask = rfm["supporter_id"] == int(sid)
            if outcome == "converted":
                rfm.loc[mask, "upgrade_candidate"] = 1
            elif outcome == "declined":
                rfm.loc[mask, "upgrade_candidate"] = 0

    # Score tiers for display
    def tier(row):
        if row["upgrade_candidate"] == 0:
            return "Low"
        return "High" if row["Frequency"] >= 6 else "Medium"

    rfm["upgrade_score"] = rfm.apply(tier, axis=1)
    return rfm, float(p75)


def train_and_score(rfm):
    """
    Train a LogisticRegression model with Leave-One-Out CV and score all donors.

    LOO-CV is used because the dataset is small (~16 donors). It trains on all
    donors except one, tests on the held-out donor, and repeats — giving the
    most data-efficient estimate of generalization.

    Features used: Recency, Frequency, Monetary_avg, is_recurring,
                   campaign_affinity, donor_tenure_days, encoded channel/relationship.

    Returns (rfm_with_probabilities, accuracy_float).
    The model is fit on the full dataset after CV to generate final probabilities.
    """
    # Encode categoricals
    ch_dummies  = pd.get_dummies(rfm["acquisition_channel"], prefix="ch",  drop_first=True).astype(int)
    rel_dummies = pd.get_dummies(rfm["relationship_type"],   prefix="rel", drop_first=True).astype(int)

    feature_df = pd.concat([rfm, ch_dummies, rel_dummies], axis=1)
    feature_cols = (
        ["Recency", "Frequency", "Monetary_avg", "is_recurring",
         "campaign_affinity", "donor_tenure_days"]
        + list(ch_dummies.columns)
        + list(rel_dummies.columns)
    )

    X = feature_df[feature_cols].fillna(0).astype(float).values
    y = rfm["upgrade_candidate"].values

    # Guard: if all labels are the same, skip ML (can't train a classifier)
    if len(np.unique(y)) < 2:
        rfm["upgrade_probability"] = y.astype(float)
        return rfm, 1.0

    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    clf    = LogisticRegression(max_iter=1000, random_state=42)
    y_pred = cross_val_predict(clf, X_scaled, y, cv=LeaveOneOut())
    acc    = float(accuracy_score(y, y_pred))

    # Fit on full dataset for final probabilities
    clf.fit(X_scaled, y)
    rfm["upgrade_probability"] = clf.predict_proba(X_scaled)[:, 1].round(4)

    return rfm, acc


def load_feedback_overrides():
    """
    Read feedback_log.json and return a dict of {supporter_id: latest_outcome}.
    Only the most recent outcome per donor is used.
    This is the feedback loop: real-world contact results feed back into labeling.
    """
    if not os.path.exists(FEEDBACK_FILE):
        return {}
    try:
        with open(FEEDBACK_FILE, "r") as f:
            entries = json.load(f)
        overrides = {}
        for entry in entries:
            sid = str(entry.get("donor_id", ""))
            if sid:
                overrides[sid] = entry.get("outcome", "")
        return overrides
    except Exception:
        return {}


def save_run_summary(n_candidates, n_emails, accuracy, p75):
    """
    Append a run summary to state.json so the dashboard can display history.
    This powers the "model accuracy over time" line chart.
    """
    state = {"enabled": False, "last_run": None, "next_run": None, "runs": []}

    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                state = json.load(f)
        except Exception:
            pass

    run_entry = {
        "timestamp":        datetime.now().isoformat(timespec="seconds"),
        "candidates_found": n_candidates,
        "emails_sent":      n_emails,
        "model_accuracy":   round(accuracy * 100, 1),
        "p75_threshold":    round(p75, 2),
    }
    state.setdefault("runs", []).append(run_entry)
    state["last_run"] = run_entry["timestamp"]

    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def check_auto_conversions():
    """
    Auto-detect donors who donated AFTER receiving an email — mark them as
    'converted' in feedback_log.json without requiring manual input.

    Logic:
      1. Read email_log.json → find the most recent email date per donor
      2. Read donations.csv  → find any Monetary donation dated AFTER that email
      3. If found and no existing feedback entry exists for that donor →
         write a new 'converted' entry to feedback_log.json

    Called by app.py /api/donors so the dashboard always shows fresh outcomes.
    Returns: list of newly auto-converted donor names.
    """
    email_log_path = os.path.join(SCRIPT_DIR, "email_log.json")
    feedback_path  = FEEDBACK_FILE
    donations_path = os.path.join(DATA_DIR, "donations.csv")

    if not os.path.exists(email_log_path):
        return []

    # Load email log → most recent send date per donor
    with open(email_log_path, "r", encoding="utf-8") as f:
        email_log = json.load(f)

    last_emailed = {}
    for entry in email_log:
        did  = entry.get("donor_id")
        ts   = entry.get("timestamp", "")
        if did and ts:
            if did not in last_emailed or ts > last_emailed[did]:
                last_emailed[did] = ts

    if not last_emailed:
        return []

    # Load existing feedback so we don't duplicate
    existing_feedback = set()
    if os.path.exists(feedback_path):
        with open(feedback_path, "r", encoding="utf-8") as f:
            fb = json.load(f)
        for entry in fb:
            existing_feedback.add(entry.get("donor_id"))

    # Load donations and check for post-email donations
    donations = pd.read_csv(donations_path)
    donations["donation_date"] = pd.to_datetime(donations["donation_date"])
    monetary = donations[donations["donation_type"] == "Monetary"]

    # Load supporter names for readable log entries
    supporters_path = os.path.join(DATA_DIR, "supporters.csv")
    supporters = pd.read_csv(supporters_path)[["supporter_id", "display_name"]]
    name_map = dict(zip(supporters["supporter_id"], supporters["display_name"]))

    new_conversions = []
    feedback_log = []
    if os.path.exists(feedback_path):
        with open(feedback_path, "r", encoding="utf-8") as f:
            feedback_log = json.load(f)

    for donor_id, email_ts in last_emailed.items():
        if donor_id in existing_feedback:
            continue  # Already has a feedback entry — skip

        email_date = pd.to_datetime(email_ts)
        donor_donations = monetary[monetary["supporter_id"] == donor_id]
        post_email = donor_donations[donor_donations["donation_date"] > email_date]

        if not post_email.empty:
            name = name_map.get(donor_id, f"Donor {donor_id}")
            entry = {
                "donor_id":   donor_id,
                "donor_name": name,
                "outcome":    "converted",
                "timestamp":  datetime.now().isoformat(timespec="seconds"),
                "notes":      "Auto-detected: donation made after email contact",
                "auto":       True,
            }
            feedback_log.append(entry)
            existing_feedback.add(donor_id)
            new_conversions.append(name)
            print(f"[pipeline] Auto-conversion detected: {name}")

    if new_conversions:
        with open(feedback_path, "w", encoding="utf-8") as f:
            json.dump(feedback_log, f, indent=2)

    return new_conversions


def run_pipeline(save_summary=True):
    """
    Main entry point. Runs the full pipeline end-to-end.

    Steps:
      1. Load CSVs
      2. Compute RFM features
      3. Apply labels (with any feedback overrides from feedback_log.json)
      4. Train model + score all donors
      5. Sort: upgrade_candidate DESC → upgrade_probability DESC
      6. Optionally save run summary to state.json

    Returns: (scored_dataframe, accuracy_float, p75_threshold_float)

    Called by: scheduler.run_weekly_check(), app.py /api/donors endpoint
    """
    monetary_donors, monetary_dona = load_data()
    rfm = compute_rfm(monetary_donors, monetary_dona)

    feedback = load_feedback_overrides()
    rfm, p75 = apply_labels(rfm, feedback_overrides=feedback)

    try:
        rfm, acc = train_and_score(rfm)
    except Exception as e:
        print(f"[pipeline] ML model failed ({e}) — falling back to rule-based scores")
        rfm["upgrade_probability"] = rfm["upgrade_candidate"].astype(float)
        acc = 0.0

    # Sort: candidates first, then by probability descending
    rfm = rfm.sort_values(
        ["upgrade_candidate", "upgrade_probability"],
        ascending=[False, False]
    ).reset_index(drop=True)
    rfm["rank"] = rfm.index + 1

    if save_summary:
        n_candidates = int(rfm["upgrade_candidate"].sum())
        save_run_summary(n_candidates, 0, acc, p75)

    print(f"[pipeline] Run complete — {len(rfm)} donors scored, "
          f"{int(rfm['upgrade_candidate'].sum())} candidates, "
          f"accuracy={acc:.1%}, p75=PHP {p75:,.0f}")

    return rfm, acc, p75


if __name__ == "__main__":
    df, acc, p75 = run_pipeline()
    print(df[["display_name", "upgrade_score", "upgrade_probability",
              "Frequency", "Recency", "Monetary_avg"]].to_string(index=False))
