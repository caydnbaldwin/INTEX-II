# Luna's Project — Board KPI Projections
**Lighthouse Sanctuary | Prepared April 2026**
**All figures are projected estimates based on actual platform data and ML pipeline outputs.**
*Currency: PHP (Philippine Peso). USD equivalents use approximate rate of ₱56 = $1 USD.*

---

## Data Sources Used

| Source | Records |
|--------|---------|
| `supporters.csv` | 60 supporters (17 monetary donors) |
| `donations.csv` | 420 donations, 57 unique donors, ₱240,725 total raised |
| `residents.csv` | 60 residents across 9 safehouses |
| `social_media_posts.csv` | 812 posts across 7 platforms |
| `donor_automation/state.json` | 4 pipeline runs, 81.2% model accuracy |
| `ml-pipelines/pipeline-results-summary.md` | 8 ML model outputs (April 2026) |

---

## KPI 1 — DONORS: Projected Monthly Donation Increase

### Baseline
- **Average monthly donations:** ₱6,172 ($110)
- **Average donation per transaction:** ₱1,029 ($18)
- **Active donors (donated within 90 days):** 7 of 57 (12.3%)
- **At-risk donors (silent 90+ days):** 50 of 57 (87.7%)
- **At-risk donors (silent 180+ days):** 35 of 57 (61.4%)

### Component A — Churn Prevention via Early Identification

**Methodology:** The donor churn classifier (pipeline #1) uses `days_since_last_donation` as the strongest predictor (confirmed by permutation importance). The pipeline runs automatically and flags donors approaching a lapse threshold. The ML model itself has limited accuracy at this data scale (81.2% overall but noted 0% recall on inactive class until 200+ donors), so the platform uses a rule-based trigger: donors silent 90+ days receive a personalized outreach email.

Industry benchmark for personalized lapsed-donor re-engagement via email: **15–25% reactivation rate** (source: Bloomerang 2024 Nonprofit Donor Retention Report).

| Scenario | At-Risk Donors Contacted | Reactivation Rate | Donors Recovered | Avg Gift | Monthly Lift |
|----------|--------------------------|-------------------|------------------|----------|--------------|
| Low | 50 | 15% | 7–8 | ₱1,029 | **+₱7,203 ($129)** |
| Mid | 50 | 20% | 10 | ₱1,029 | **+₱10,290 ($184)** |
| High | 50 | 25% | 12–13 | ₱1,029 | **+₱13,377 ($239)** |

### Component B — Response Rate Lift from Personalized Outreach

**Methodology:** The platform generates personalized emails for each donor based on their acquisition channel, giving frequency, recency, and a computed upgrade probability score (pipeline accuracy: 81.2%). The donor automation pipeline has identified 9 donors with high upgrade probability (top quartile, threshold ₱1,294). The email templates reference each donor by name, reference their history, and include a suggested giving amount specific to their tier.

Nonprofit benchmark: Personalized appeals outperform generic appeals by **26–34% in response rate** (M+R Benchmarks 2024).

Applied to the active and recoverable donor pool (57 donors):

| Scenario | Lift Applied To | Response Rate Lift | Additional Gifts/Month | Monthly Lift |
|----------|-----------------|-------------------|------------------------|--------------|
| Low | 57 donors | +20% response rate | ~2 additional gifts | **+₱2,058 ($37)** |
| Mid | 57 donors | +27% response rate | ~3 additional gifts | **+₱3,087 ($55)** |
| High | 57 donors | +34% response rate | ~4 additional gifts | **+₱4,116 ($74)** |

### Total Projected Monthly Donation Increase (KPI 1)

| Scenario | Combined Lift | % Increase Over Baseline |
|----------|---------------|--------------------------|
| **Low** | **+₱9,261 (~$165)** | +150% |
| **Mid** | **+₱13,377 (~$239)** | +217% |
| **High** | **+₱17,493 (~$312)** | +283% |

> **Note:** These projections assume consistent outreach cadence and that at least one full outreach cycle (30 days) completes. The platform currently has 34 email log entries in simulation mode. Live results should be tracked after production deployment to refine these estimates.

---

## KPI 2 — RESIDENTS: Risk Reduction & Early Intervention Impact

### Baseline

| Risk Level | Residents at Intake | Residents Current | Change |
|------------|--------------------|--------------------|--------|
| Critical | 5 | 1 | −4 |
| High | 17 | 5 | −12 |
| Medium | 24 | 20 | −4 |
| Low | 14 | 34 | +20 |

- **57% of residents** (34 of 60) have moved to Low risk — this is the platform's strongest resident outcome signal.
- **19 reintegrations completed**, 21 in progress.
- **8 residents** were missed by the risk model (false negatives = girls who didn't improve but weren't flagged early).

### Model Performance

| Model | Accuracy | Key Signal |
|-------|----------|------------|
| Resident Risk Predictor | 68% (5-fold CV) | `initial_risk_score` (OR=130, p=0.02) |
| Visitation Outcome Predictor | 80% (AUC=0.84) | `safety_flag` (coef=−1.06, p<0.001) |
| Intervention Effectiveness | R²=0.55 (OLS) | Initial risk dominates; healing services trend positive |

### Projected Impact

**Methodology:** The visitation outcome model (AUC=0.84, the strongest in the system) pre-screens visits for likely unfavorable outcomes based on recent safety flags, days since last visit, and case category. Early flagging allows social workers to prepare additional resources or send a senior worker in advance.

The key finding from pipeline #4: residents with high `pct_concerns` (persistent safety flags) are the ones *not* improving. The platform now surfaces this metric so caseworkers can intervene before regression becomes entrenched.

**Current baseline:** 8 residents fell through the cracks (model false negatives). With proactive early-warning alerts:

| Scenario | Girls Who Avoid Regression Failure | Basis |
|----------|-----------------------------------|-------|
| Low | **1–2 additional girls** | Catch ~15% of the 8 currently missed |
| Mid | **2–3 additional girls** | Catch ~25–35% of missed cases |
| High | **4–5 additional girls** | Catch ~50%+ with consistent early intervention |

**What this means in practice:** Each girl who avoids regression failure and completes reintegration avoids re-entry into the trafficking cycle. The platform does not reduce this to a dollar figure — it is presented as lives protected.

> **Data gap:** To produce a % improvement metric (rather than a count), Lighthouse would need pre/post outcome data tagged to whether the platform's early alert was used. Currently the data does not distinguish platform-assisted vs. unassisted interventions. Recommendation: add a `platform_alert_triggered` field to the intervention records.

---

## KPI 3 — OUTREACH: Follower Growth & Donation Lift

### Social Media Performance Baseline (812 posts, 7 platforms)

| Post Type | Avg Estimated Donation Value | Count |
|-----------|------------------------------|-------|
| ImpactStory | ₱116,161 | 203 |
| FundraisingAppeal | ₱36,156 | 90 |
| Campaign | ₱28,141 | 156 |
| EducationalContent | ₱3,183 | 114 |
| ThankYou | ₱2,928 | 118 |
| EventPromotion | ₱2,763 | 131 |

**ImpactStory posts outperform ThankYou posts by 40x in estimated donation value.**

| Tactic | Avg Donation Value |
|--------|--------------------|
| Unboosted posts | ₱34,057 |
| Boosted posts | ₱70,595 (+2.1x) |
| Resident story posts | ₱132,948 (+3.9x) |
| Total boost spend in data | ₱308,628 |
| Total donations attributed to boosted posts | ₱8,965,583 |
| **Implied boost ROI** | **29x** |

**Platform Follower Counts (most recent):**
Facebook: ~2,489 | Instagram: ~1,833 | Twitter: ~1,209 | WhatsApp: ~1,527 | TikTok: ~887 | LinkedIn: ~468 | YouTube: ~594

### Component A — Estimated Follower Growth

**Methodology:** The platform includes a campaign analytics dashboard and social media strategy recommendation engine (pipeline #5, R²=0.42). Key finding: YouTube and Instagram drive the most engagement; WhatsApp has the highest engagement-to-donation correlation (rho=0.85). The platform enables data-informed content calendar decisions.

Industry benchmark for nonprofits that implement a structured content strategy: **15–40% follower growth over 6 months** (Nonprofit Marketing Guide 2024).

| Scenario | Projected 6-Month Follower Growth (across platforms) | Basis |
|----------|------------------------------------------------------|-------|
| Low | **+15% (~+1,050 net followers across all platforms)** | Consistent strategy, no paid growth |
| Mid | **+25% (~+1,750 net followers)** | Strategy + occasional boosting |
| High | **+40% (~+2,800 net followers)** | Strategy + regular boosting of ImpactStory posts |

### Component B — Estimated Donation Increase from Optimized Outreach

**Methodology:** The platform identifies that switching even 20% of "low-performing" post budget (ThankYou, EventPromotion) toward ImpactStory + CTA + boosted posts would shift the content mix. Using the post-type performance gap (₱116K ImpactStory vs. ₱2.9K ThankYou):

Currently 249 posts (31%) are in low-donation types. If 20–40% of those are reallocated:

| Scenario | Posts Shifted to ImpactStory/CTA | Incremental Donation Value | Monthly Lift |
|----------|----------------------------------|---------------------------|--------------|
| Low | 50 posts/year (4/month) | ₱113,233 incremental avg × 4 | **+₱5,300/mo ($95)** |
| Mid | 75 posts/year (6/month) | ₱113,233 × 6 | **+₱7,950/mo ($142)** |
| High | 100 posts/year (8/month) | ₱113,233 × 8 | **+₱10,600/mo ($189)** |

> **Caveat:** Estimated donation values in the social media dataset are modeled estimates, not confirmed conversion data. These figures should be validated once the platform's donation referral tracking is linked to actual donation records.

---

## KPI 4 — COST: Monthly Platform Operating Estimate

### Infrastructure Services Identified in Codebase

| Service | Usage | Estimated Monthly Cost |
|---------|-------|----------------------|
| **Azure App Service** (B1 Basic) | ASP.NET Core backend hosting (`lunas-shelter`) | $13–18 |
| **Azure SQL Database** (Basic/S0) | Relational DB for residents, donors, auth | $5–15 |
| **Resend** (Email API) | Automated donor outreach emails (~60 donors, low volume) | $0–20 (Free tier covers 3,000 emails/mo; Pro = $20/mo) |
| **Google OAuth** | Social login for admin users | $0 (free) |
| **GitHub Actions** | CI/CD pipeline (push-to-deploy) | $0–4 (free for public repo) |
| **Python ML Service** | Donor automation Flask app (donor_automation/) — if hosted separately | $13–18 (Azure B1) or $0 if bundled |
| **Domain** (lunas-project.site) | Annual domain registration | ~$1/mo amortized |

### Estimated Monthly Infrastructure Cost

| Scenario | Monthly Cost | Notes |
|----------|-------------|-------|
| **Low (shared/bundled)** | **$20–30/mo (₱1,120–1,680)** | ML service bundled into same App Service, free email tier |
| **Mid (standard)** | **$50–65/mo (₱2,800–3,640)** | Separate services, Resend Pro |
| **High (with growth)** | **$80–100/mo (₱4,480–5,600)** | Scaled up App Service tier, increased email volume, monitoring tools |

### Manpower Estimate

The platform is a student-built production system requiring periodic maintenance:

| Role | Time/Month | Est. Cost |
|------|------------|-----------|
| Part-time developer (bug fixes, data updates, model retraining) | 5–10 hrs/mo | $50–150 (student rate) or $0 if volunteer |
| Lighthouse staff time (reviewing dashboard, acting on alerts) | 2–4 hrs/mo | Internal cost only |

### Total Monthly Cost to Keep Site Online

| Scenario | Infrastructure | Manpower | **Total** |
|----------|---------------|----------|-----------|
| **Low** | $20–30 | $0 (volunteer) | **$20–30/mo** |
| **Mid** | $50–65 | $75 (part-time) | **$125–140/mo** |
| **High** | $80–100 | $150 (paid contractor) | **$230–250/mo** |

> **For a nonprofit of this scale (60 residents, ~60 donors, 9 safehouses), the realistic operating cost is $20–140/mo depending on whether developer time is donated or compensated.** This is exceptionally low for a full-stack platform with ML, automated outreach, and multi-safehouse case management.

---

## Summary Table for Board Presentation

| KPI | Metric | Low | Mid | High |
|-----|--------|-----|-----|------|
| **Donors** | Projected monthly donation increase | +₱9,261 (+$165) | +₱13,377 (+$239) | +₱17,493 (+$312) |
| **Residents** | Additional girls who avoid regression failure | 1–2 girls | 2–3 girls | 4–5 girls |
| **Outreach** | 6-month follower growth (all platforms) | +1,050 followers | +1,750 followers | +2,800 followers |
| **Outreach** | Monthly donation lift from content optimization | +₱5,300 (+$95) | +₱7,950 (+$142) | +₱10,600 (+$189) |
| **Cost** | Monthly platform operating cost | $20–30 | $125–140 | $230–250 |

---

## Methodology Notes & Caveats

1. **Small dataset:** All ML models were trained on 57–60 records. Projections are directionally valid but carry higher uncertainty than typical forecasts. Confidence increases as the platform collects more data.
2. **Donation values in social media data** are modeled estimates from the pipeline, not confirmed bank transfers. Treat outreach donation figures as order-of-magnitude guides.
3. **Resident outcomes** cannot yet be attributed directly to platform alerts due to missing `platform_alert_triggered` tracking. This is a recommended data collection improvement.
4. **Donor reactivation rates** are drawn from nonprofit sector benchmarks (Bloomerang, M+R). Actual results will vary based on relationship quality and message timing.
5. **All dollar figures are projected** and should be labeled as such in board materials.
6. **Exchange rate used:** ₱56 = $1 USD (approximate April 2026).

---

*Generated from live pipeline and seed data — IntexIIWednesday / MachineLearning*
*Luna's Project | Lighthouse Sanctuary, Philippines | April 2026*
