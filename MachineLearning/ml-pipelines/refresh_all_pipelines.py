"""
Refresh all ML pipeline results in the PipelineResults table.

Run this script whenever significant new data has been added
(new residents, donations, visitations, etc.) to keep ML
predictions current.

Usage:
    cd MachineLearning/ml-pipelines
    pip install -r requirements.txt
    python refresh_all_pipelines.py
"""

import os
import json
import warnings
from datetime import datetime

import numpy as np
import pandas as pd
import pymssql
from dotenv import load_dotenv
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor, RandomForestClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer

warnings.filterwarnings("ignore")
load_dotenv()

SERVER = os.getenv("DB_SERVER")
DATABASE = os.getenv("DB_DATABASE")
USERNAME = os.getenv("DB_USERNAME")
PASSWORD = os.getenv("DB_PASSWORD")


def get_connection():
    return pymssql.connect(server=SERVER, user=USERNAME, password=PASSWORD, database=DATABASE)


def get_next_id(conn):
    return int(pd.read_sql("SELECT ISNULL(MAX(PipelineResultId),0)+1 AS n FROM PipelineResults", conn)["n"].iloc[0])


def write_results(conn, pipeline_name, rows):
    """Delete old results and insert new ones. rows is a list of dicts with keys:
    ResultType, EntityId, EntityType, Score, Label, DetailsJson
    """
    cursor = conn.cursor()
    cursor.execute("DELETE FROM PipelineResults WHERE PipelineName = %s", (pipeline_name,))
    next_id = get_next_id(conn)
    now = datetime.utcnow()
    for i, row in enumerate(rows):
        details = json.dumps(row["DetailsJson"]) if row["DetailsJson"] is not None else None
        cursor.execute(
            """INSERT INTO PipelineResults
               (PipelineResultId, PipelineName, ResultType, EntityId, EntityType, Score, Label, DetailsJson, GeneratedAt)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                next_id + i,
                pipeline_name,
                row["ResultType"],
                int(row["EntityId"]),
                row["EntityType"],
                float(row["Score"]),
                row["Label"],
                details,
                now,
            ),
        )
    conn.commit()
    return len(rows)


# ---------------------------------------------------------------------------
# Pipeline 1: Donor Churn Classifier
# ---------------------------------------------------------------------------
def refresh_donor_churn(conn):
    supporters = pd.read_sql("SELECT * FROM Supporters", conn)
    donations = pd.read_sql("SELECT * FROM Donations", conn)

    # Feature engineering
    don_agg = donations.groupby("SupporterId").agg(
        donation_count=("DonationId", "count"),
        total_amount=("AmountPhp", "sum"),
        avg_amount=("AmountPhp", "mean"),
        last_date=("DonationDate", "max"),
        first_date=("DonationDate", "min"),
        unique_campaigns=("CampaignName", "nunique"),
        donation_type_count=("DonationType", "nunique"),
    ).reset_index()

    now_ts = pd.Timestamp.now()
    don_agg["days_since_last_donation"] = (now_ts - pd.to_datetime(don_agg["last_date"])).dt.days
    don_agg["days_since_first_donation"] = (now_ts - pd.to_datetime(don_agg["first_date"])).dt.days
    don_agg["donation_frequency"] = don_agg["donation_count"] / don_agg["days_since_first_donation"].clip(lower=1)

    df = supporters.merge(don_agg, left_on="SupporterId", right_on="SupporterId", how="left")
    num_cols = ["donation_count", "total_amount", "avg_amount", "days_since_last_donation",
                "days_since_first_donation", "donation_frequency", "unique_campaigns", "donation_type_count"]
    df[num_cols] = df[num_cols].fillna(0)

    target = (df["SupporterStatus"] == "Inactive").astype(int)
    cat_cols = ["SupporterType", "RelationshipType", "AcquisitionChannel"]
    for c in cat_cols:
        df[c] = df[c].fillna("Unknown")

    preprocessor = ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
    ])

    model = Pipeline([("pre", preprocessor), ("clf", RandomForestClassifier(n_estimators=200, max_depth=5, random_state=42))])
    model.fit(df[num_cols + cat_cols], target)
    probs = model.predict_proba(df[num_cols + cat_cols])[:, 1]

    rows = []
    for idx, row in df.iterrows():
        p = float(probs[idx])
        rows.append({
            "ResultType": "Prediction",
            "EntityId": row["SupporterId"],
            "EntityType": "Supporter",
            "Score": p,
            "Label": "AtRisk" if p >= 0.5 else "Safe",
            "DetailsJson": {"predicted_churn": int(p >= 0.5)},
        })
    return write_results(conn, "DonorChurn", rows)


# ---------------------------------------------------------------------------
# Pipeline 2: Resident Risk Predictor
# ---------------------------------------------------------------------------
def refresh_resident_risk(conn):
    residents = pd.read_sql("SELECT * FROM Residents", conn)
    proc = pd.read_sql("SELECT * FROM ProcessRecordings", conn)
    edu = pd.read_sql("SELECT * FROM EducationRecords", conn)
    health = pd.read_sql("SELECT * FROM HealthWellbeingRecords", conn)
    incidents = pd.read_sql("SELECT * FROM IncidentReports", conn)
    plans = pd.read_sql("SELECT * FROM InterventionPlans", conn)
    visits = pd.read_sql("SELECT * FROM HomeVisitations", conn)

    df = residents[["ResidentId", "InitialRiskScore", "CurrentRiskScore", "CaseCategory"]].copy()

    # Process recordings
    if not proc.empty:
        pr = proc.groupby("ResidentId").agg(
            session_count=("ProcessRecordingId", "count"),
            avg_session_duration=("SessionDurationMinutes", "mean"),
        ).reset_index()
        df = df.merge(pr, on="ResidentId", how="left")
    else:
        df["session_count"] = 0
        df["avg_session_duration"] = 0

    # Education
    if not edu.empty:
        ed = edu.groupby("ResidentId").agg(
            avg_attendance=("AttendanceRate", "mean"),
            avg_ed_progress=("ProgressPercent", "mean"),
        ).reset_index()
        df = df.merge(ed, on="ResidentId", how="left")
    else:
        df["avg_attendance"] = 0
        df["avg_ed_progress"] = 0

    # Health
    if not health.empty:
        hl = health.groupby("ResidentId").agg(
            avg_health=("OverallHealthScore", "mean"),
            avg_nutrition=("NutritionScore", "mean"),
            avg_sleep=("SleepQualityScore", "mean"),
        ).reset_index()
        df = df.merge(hl, on="ResidentId", how="left")
    else:
        df["avg_health"] = 0
        df["avg_nutrition"] = 0
        df["avg_sleep"] = 0

    # Incidents
    if not incidents.empty:
        sev_map = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
        incidents["severity_weight"] = incidents["SeverityLevel"].map(sev_map).fillna(1)
        inc = incidents.groupby("ResidentId").agg(
            incident_count=("IncidentId", "count"),
            max_severity=("severity_weight", "max"),
        ).reset_index()
        df = df.merge(inc, on="ResidentId", how="left")
    else:
        df["incident_count"] = 0
        df["max_severity"] = 0

    # Visitations
    if not visits.empty:
        coop_map = {"Uncooperative": 1, "Reluctant": 2, "Neutral": 3, "Cooperative": 4, "Very Cooperative": 5}
        visits["coop_score"] = visits["CooperationLevel"].map(coop_map).fillna(3)
        vs = visits.groupby("ResidentId").agg(
            visit_count=("VisitationId", "count"),
            avg_cooperation=("coop_score", "mean"),
        ).reset_index()
        df = df.merge(vs, on="ResidentId", how="left")
    else:
        df["visit_count"] = 0
        df["avg_cooperation"] = 3

    # Plans
    if not plans.empty:
        pl = plans.groupby("ResidentId").agg(
            plan_count=("PlanId", "count"),
        ).reset_index()
        achieved = plans[plans["PlanStatus"] == "Achieved"].groupby("ResidentId").size().reset_index(name="achieved_count")
        pl = pl.merge(achieved, on="ResidentId", how="left")
        pl["achieved_count"] = pl["achieved_count"].fillna(0)
        pl["pct_achieved"] = pl["achieved_count"] / pl["plan_count"]
        df = df.merge(pl[["ResidentId", "plan_count", "pct_achieved"]], on="ResidentId", how="left")
    else:
        df["plan_count"] = 0
        df["pct_achieved"] = 0

    num_cols = ["InitialRiskScore", "session_count", "avg_session_duration",
                "avg_attendance", "avg_ed_progress", "avg_health", "avg_nutrition", "avg_sleep",
                "incident_count", "max_severity", "visit_count", "avg_cooperation",
                "plan_count", "pct_achieved"]
    df[num_cols] = df[num_cols].fillna(0)

    target = (df["CurrentRiskScore"] < df["InitialRiskScore"]).astype(int)

    preprocessor = ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), num_cols),
    ])

    model = Pipeline([("pre", preprocessor), ("clf", RandomForestClassifier(n_estimators=200, max_depth=5, random_state=42))])
    model.fit(df[num_cols], target)
    improvement_probs = model.predict_proba(df[num_cols])[:, 1]

    rows = []
    for idx, row in df.iterrows():
        imp_p = float(improvement_probs[idx])
        score = 1 - imp_p  # higher = higher risk
        if score >= 0.75:
            label = "Critical"
        elif score >= 0.5:
            label = "High"
        elif score >= 0.25:
            label = "Medium"
        else:
            label = "Low"
        rows.append({
            "ResultType": "Prediction",
            "EntityId": row["ResidentId"],
            "EntityType": "Resident",
            "Score": score,
            "Label": label,
            "DetailsJson": {"improvement_prob": round(imp_p, 4)},
        })
    return write_results(conn, "ResidentRisk", rows)


# ---------------------------------------------------------------------------
# Pipeline 3: Campaign ROI Analyzer
# ---------------------------------------------------------------------------
def refresh_campaign_roi(conn):
    donations = pd.read_sql("SELECT * FROM Donations WHERE DonationType = 'Monetary'", conn)
    supporters = pd.read_sql("SELECT * FROM Supporters", conn)
    social = pd.read_sql("SELECT * FROM SocialMediaPosts", conn)

    df = donations.merge(supporters, on="SupporterId", how="left")

    # Campaign-level aggregation
    campaign = df.groupby("CampaignName").agg(
        total_raised=("AmountPhp", "sum"),
        donor_count=("SupporterId", "nunique"),
        donation_count=("DonationId", "count"),
        avg_donation=("AmountPhp", "mean"),
    ).reset_index()

    max_raised = campaign["total_raised"].max()
    campaign["score"] = campaign["total_raised"] / max_raised if max_raised > 0 else 0

    rows = []
    for i, row in campaign.iterrows():
        s = float(row["score"])
        if s >= 0.66:
            label = "HighROI"
        elif s >= 0.33:
            label = "MediumROI"
        else:
            label = "LowROI"
        rows.append({
            "ResultType": "Ranking",
            "EntityId": i + 1,
            "EntityType": "Campaign",
            "Score": s,
            "Label": label,
            "DetailsJson": {
                "campaign_name": row["CampaignName"],
                "total_raised": round(float(row["total_raised"]), 2),
                "donor_count": int(row["donor_count"]),
                "avg_donation": round(float(row["avg_donation"]), 2),
            },
        })
    return write_results(conn, "CampaignROI", rows)


# ---------------------------------------------------------------------------
# Pipeline 4: Safehouse Performance Analyzer
# ---------------------------------------------------------------------------
def refresh_safehouse_performance(conn):
    metrics = pd.read_sql("SELECT * FROM SafehouseMonthlyMetrics", conn)
    incidents = pd.read_sql("SELECT * FROM IncidentReports", conn)
    safehouses = pd.read_sql("SELECT * FROM Safehouses", conn)

    agg = metrics.groupby("SafehouseId").agg(
        avg_education=("EducationScore", "mean"),
        avg_health=("HealthWellbeingScore", "mean"),
        total_visits=("HomeVisitCount", "sum"),
        total_recordings=("ProcessRecordingCount", "sum"),
        avg_residents=("ActiveResidentCount", "mean"),
    ).reset_index()

    sev_map = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
    incidents["severity_weight"] = incidents["SeverityLevel"].map(sev_map).fillna(1)
    inc = incidents.groupby("SafehouseId").agg(
        weighted_incidents=("severity_weight", "sum"),
        unresolved=("ResolutionStatus", lambda x: (x != "Resolved").sum()),
    ).reset_index()

    df = safehouses[["SafehouseId", "Name", "Region"]].merge(agg, on="SafehouseId", how="left")
    df = df.merge(inc, on="SafehouseId", how="left")
    df = df.fillna(0)

    df["service_per_resident"] = (df["total_visits"] + df["total_recordings"]) / df["avg_residents"].clip(lower=1)

    scaler = MinMaxScaler()
    for col in ["avg_education", "avg_health", "service_per_resident"]:
        if df[col].max() > df[col].min():
            df[col + "_norm"] = scaler.fit_transform(df[[col]])
        else:
            df[col + "_norm"] = 0.5

    max_wi = df["weighted_incidents"].max()
    df["safety"] = 1 - (df["weighted_incidents"] / max_wi) if max_wi > 0 else 1

    df["composite"] = 0.25 * df["avg_education_norm"] + 0.25 * df["avg_health_norm"] + 0.25 * df["safety"] + 0.25 * df["service_per_resident_norm"]

    rows = []
    for _, row in df.iterrows():
        s = float(row["composite"])
        if s > 0.7:
            label = "HighPerforming"
        elif s >= 0.4:
            label = "Average"
        else:
            label = "NeedsAttention"
        rows.append({
            "ResultType": "Ranking",
            "EntityId": row["SafehouseId"],
            "EntityType": "Safehouse",
            "Score": s,
            "Label": label,
            "DetailsJson": {
                "name": row["Name"],
                "region": row["Region"],
                "education": round(float(row["avg_education_norm"]), 4),
                "health": round(float(row["avg_health_norm"]), 4),
                "safety": round(float(row["safety"]), 4),
                "service": round(float(row["service_per_resident_norm"]), 4),
                "weighted_incidents": int(row["weighted_incidents"]),
                "unresolved": int(row["unresolved"]),
            },
        })
    return write_results(conn, "SafehousePerformance", rows)


# ---------------------------------------------------------------------------
# Pipeline 5: Education Progress Predictor
# ---------------------------------------------------------------------------
def refresh_education_progress(conn):
    edu = pd.read_sql("SELECT * FROM EducationRecords", conn)
    residents = pd.read_sql("SELECT * FROM Residents", conn)

    # Latest record per resident
    edu_sorted = edu.sort_values("RecordDate", ascending=False)
    latest = edu_sorted.groupby("ResidentId").first().reset_index()

    # Aggregate stats
    edu_agg = edu.groupby("ResidentId").agg(
        record_count=("EducationRecordId", "count"),
        avg_attendance=("AttendanceRate", "mean"),
        avg_progress=("ProgressPercent", "mean"),
    ).reset_index()

    df = latest[["ResidentId", "AttendanceRate", "ProgressPercent", "EducationLevel"]].merge(
        edu_agg, on="ResidentId", how="left"
    )
    df = df.merge(
        residents[["ResidentId", "CurrentRiskLevel", "CaseCategory", "LengthOfStayDays", "HasSpecialNeeds"]],
        on="ResidentId", how="left"
    )
    df = df.fillna(0)

    med_att = df["AttendanceRate"].median()
    med_prog = df["ProgressPercent"].median()
    target = ((df["AttendanceRate"] < med_att) & (df["ProgressPercent"] < med_prog)).astype(int)

    num_cols = ["AttendanceRate", "ProgressPercent", "record_count", "avg_attendance", "avg_progress", "LengthOfStayDays"]
    cat_cols = ["EducationLevel", "CurrentRiskLevel", "CaseCategory"]
    for c in cat_cols:
        df[c] = df[c].astype(str)

    preprocessor = ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
    ])

    model = Pipeline([("pre", preprocessor), ("clf", LogisticRegression(max_iter=1000, random_state=42))])
    model.fit(df[num_cols + cat_cols], target)
    probs = model.predict_proba(df[num_cols + cat_cols])[:, 1]

    rows = []
    for idx, row in df.iterrows():
        p = float(probs[idx])
        rows.append({
            "ResultType": "Prediction",
            "EntityId": row["ResidentId"],
            "EntityType": "Resident",
            "Score": p,
            "Label": "AtRisk" if p >= 0.5 else "OnTrack",
            "DetailsJson": {"predicted_at_risk": int(p >= 0.5)},
        })
    return write_results(conn, "EducationProgress", rows)


# ---------------------------------------------------------------------------
# Pipeline 6: Social Media Donation Driver
# ---------------------------------------------------------------------------
def refresh_social_media_drivers(conn):
    posts = pd.read_sql("SELECT * FROM SocialMediaPosts", conn)

    max_val = posts["EstimatedDonationValuePhp"].max()
    posts["score"] = posts["EstimatedDonationValuePhp"] / max_val if max_val > 0 else 0

    rows = []
    for _, row in posts.iterrows():
        s = float(row["score"])
        rows.append({
            "ResultType": "Prediction",
            "EntityId": row["PostId"],
            "EntityType": "SocialMediaPost",
            "Score": s,
            "Label": "HighDriver" if s >= 0.5 else "LowDriver",
            "DetailsJson": {
                "platform": str(row.get("Platform", "")),
                "content_topic": str(row.get("ContentTopic", "")),
                "post_type": str(row.get("PostType", "")),
            },
        })
    return write_results(conn, "SocialMediaDriver", rows)


# ---------------------------------------------------------------------------
# Pipeline 7: Visitation Outcome Predictor
# ---------------------------------------------------------------------------
def refresh_visitation_outcomes(conn):
    visits = pd.read_sql("SELECT * FROM HomeVisitations", conn)
    residents = pd.read_sql("SELECT * FROM Residents", conn)

    coop_map = {"Uncooperative": 1, "Reluctant": 2, "Neutral": 3, "Cooperative": 4, "Very Cooperative": 5}
    visits["coop_score"] = visits["CooperationLevel"].map(coop_map).fillna(3)
    visits["safety_flag"] = visits["SafetyConcerns"].apply(lambda x: 0 if pd.isna(x) or str(x).strip().lower() in ("none", "nan", "") else 1)
    visits["followup_flag"] = visits["FollowUpRequired"].astype(int) if "FollowUpRequired" in visits.columns else 0

    df = visits.merge(
        residents[["ResidentId", "InitialRiskScore", "CurrentRiskScore", "CaseCategory", "AbuseTypeCount", "HasSpecialNeeds"]],
        on="ResidentId", how="left"
    )

    # Rolling features per resident (prior visits)
    df = df.sort_values(["ResidentId", "VisitDate"])
    df["prior_visit_count"] = df.groupby("ResidentId").cumcount()
    target = (df["VisitOutcome"] == "Favorable").astype(int)

    num_cols = ["coop_score", "safety_flag", "followup_flag", "FamilyMemberCount",
                "prior_visit_count", "InitialRiskScore", "CurrentRiskScore"]
    cat_cols = ["VisitType", "CaseCategory"]
    for c in num_cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)
    for c in cat_cols:
        if c in df.columns:
            df[c] = df[c].astype(str).fillna("Unknown")

    available_num = [c for c in num_cols if c in df.columns]
    available_cat = [c for c in cat_cols if c in df.columns]

    preprocessor = ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), available_num),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), available_cat),
    ])

    model = Pipeline([("pre", preprocessor), ("clf", GradientBoostingClassifier(n_estimators=100, max_depth=3, random_state=42))])
    model.fit(df[available_num + available_cat], target)
    probs = model.predict_proba(df[available_num + available_cat])[:, 1]

    rows = []
    for idx, row in df.iterrows():
        p = float(probs[idx])
        rows.append({
            "ResultType": "Prediction",
            "EntityId": row["VisitationId"],
            "EntityType": "HomeVisitation",
            "Score": p,
            "Label": "Favorable" if p >= 0.5 else "Unfavorable",
            "DetailsJson": None,
        })
    return write_results(conn, "VisitationOutcome", rows)


# ---------------------------------------------------------------------------
# Export seed CSV
# ---------------------------------------------------------------------------
def export_seed_csv(conn):
    df = pd.read_sql("SELECT * FROM PipelineResults ORDER BY PipelineResultId", conn)
    seed_path = os.path.join(os.path.dirname(__file__), "..", "..", "Backend", "Data", "SeedData", "pipeline_results.csv")
    seed_path = os.path.normpath(seed_path)
    os.makedirs(os.path.dirname(seed_path), exist_ok=True)
    df.to_csv(seed_path, index=False)
    print(f"  Exported {len(df)} rows to {seed_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("ML Pipeline Refresh — Lunas Safe Haven")
    print("=" * 60)

    conn = get_connection()
    pipelines = [
        ("Donor Churn", refresh_donor_churn),
        ("Resident Risk", refresh_resident_risk),
        ("Campaign ROI", refresh_campaign_roi),
        ("Safehouse Performance", refresh_safehouse_performance),
        ("Education Progress", refresh_education_progress),
        ("Social Media Drivers", refresh_social_media_drivers),
        ("Visitation Outcomes", refresh_visitation_outcomes),
    ]

    for name, func in pipelines:
        try:
            count = func(conn)
            print(f"  ✓ {name}: {count} rows updated")
        except Exception as e:
            print(f"  ✗ {name}: FAILED — {e}")

    print()
    print("Exporting seed CSV...")
    try:
        export_seed_csv(conn)
    except Exception as e:
        print(f"  ✗ Seed export failed: {e}")

    conn.close()
    print()
    print("Done.")


if __name__ == "__main__":
    main()
