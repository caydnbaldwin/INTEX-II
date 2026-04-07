# Lunas — Website Analytics & Impact Strategy

What to show, why it matters, and where the data comes from.

---

## The Core Story (What Visitors Need to Feel)

Lunas operates 9 safehouses across 3 regions of the Philippines for girls (ages 12–18) who are survivors of sexual abuse, trafficking, and exploitation. The organization is entirely donor-funded. Every page on the site should reinforce one message:

> **"Your support directly creates measurable healing."**

---

## 1. Public Landing Page — Hero Stats

These appear in the hero or just below it. They're the "at a glance" numbers that establish credibility and scale.

| Stat | Value | Why It Matters |
|------|-------|----------------|
| Girls Served | 60+ | Scale of impact — real lives touched |
| Active Safehouses | 9 | Physical infrastructure = trust |
| Regions Covered | 3 (Luzon, Visayas, Mindanao) | National reach, not just one city |
| Years Operating | 5 | Longevity = stability |

**Source:** Static/config values (these change slowly).

---

## 2. Public Impact Dashboard — The Story in Data

This is the `/impact` page. It should walk a visitor through the full journey: **rescue → shelter → healing → reintegration**. Each section proves a different part of the mission works.

### 2a. Shelter & Safety (Proving: "We provide safe homes")

| Metric | Current Value | Visualization |
|--------|---------------|---------------|
| Safehouse occupancy by region | 70/85 capacity (82%) | Stacked bar chart by region |
| Average health score trend | 78 → 86 over 12 months | Line chart (upward trend) |
| Residents served over time | 42 → 60 over 12 months | Area chart showing growth |

**Story:** Occupancy is high — the need is real and growing. Health scores trend up — the shelters work.

### 2b. Healing & Counseling (Proving: "We invest in recovery")

| Metric | Current Value | Visualization |
|--------|---------------|---------------|
| Total counseling sessions | 2,819 | Large number with context |
| Sessions per month trend | 186 → 298 | Line chart (growing investment) |
| Home visitations completed | 1,337 | Large number |
| Favorable visit outcomes | ~80% (from ML Pipeline 8) | Donut chart |

**Story:** This is the most resource-intensive part. The volume of sessions shows serious commitment. The 80% favorable visit outcome rate (our strongest ML model, AUC = 0.84) proves the process works.

**ML Connection:** Pipeline 8 (Visitation Outcome Predictor) is the strongest model. Show "80% of home visitations result in favorable outcomes" as a headline stat. This is a real, defensible number.

### 2c. Education & Development (Proving: "We build futures")

| Metric | Current Value | Visualization |
|--------|---------------|---------------|
| Education programs | 4 active programs | Icon cards |
| Total enrolled | 60 | Number |
| Completion rate | 65% average | Progress bars per program |
| Program breakdown | Secondary (63%), Bridge (67%), Vocational (67%), Literacy (67%) | Horizontal bar chart |

**Story:** Education is the bridge from survival to independence. 65% completion rate for traumatized youth is strong.

### 2d. Reintegration (Proving: "There's a path forward")

| Metric | Current Value | Visualization |
|--------|---------------|---------------|
| Reintegration rate | 63% | Large donut/ring chart |
| Pathways | Family (63%), Foster (21%), Independent (11%), Adoption (5%) | Pie chart |
| Case status | 30 Active, 19 Closed, 11 Transferred | Status badges |

**Story:** 63% reintegration is the ultimate proof of impact — girls leaving the system into stable situations. Family reunification being the majority pathway is powerful (healing families, not just individuals).

### 2e. Donor Impact (Proving: "Your money does something")

| Metric | Current Value | Visualization |
|--------|---------------|---------------|
| Total raised | ₱2,850,000 | Large number |
| Active donors | 211 recurring | Number with "recurring" emphasis |
| Top campaign performance | Year-End Hope: ₱680,000 | Campaign comparison bar chart |
| Cost per girl per month | Calculated from total/residents/12 | Single number (makes donations tangible) |

**Story:** Recurring donors are the backbone. Named campaigns dramatically outperform general asks (Pipeline 3 finding: 2.28x multiplier). Year-End Hope is the best performer.

**ML Connection:** Pipeline 3 (Campaign ROI) showed named campaigns increase donation value by 2.28x. This validates showing campaign-specific impact.

---

## 3. Admin Dashboard — Operational Intelligence

These are for staff, not the public. They answer: "What needs my attention today?"

### 3a. Top Row — At-a-Glance Cards

| Card | Value | Alert Condition |
|------|-------|-----------------|
| Active Residents | 30 | — |
| High/Critical Risk | 6 | Red if > 8 |
| Visits This Month | ~72 | Yellow if below 60 |
| Unresolved Incidents | count | Red if > 0 |

### 3b. Risk & Safety (Most Important Section)

| Widget | Visualization | ML Connection |
|--------|---------------|---------------|
| Risk level distribution | Horizontal bar (Low 34, Med 20, High 5, Critical 1) | Pipeline 4: initial risk score is strongest predictor |
| Residents with safety concerns flagged | Alert list | Pipeline 8: safety_flag is strongest negative predictor for visit outcomes |
| Upcoming visits predicted unfavorable | Table with risk score | Pipeline 8: AUC 0.84, can predict which visits need senior social worker |

**Key Insight from ML:** Residents with repeated safety concerns during visitations are the ones NOT improving (Pipeline 4 + 8). The dashboard should surface these residents prominently.

### 3c. Safehouse Operations

| Widget | Visualization |
|--------|---------------|
| Occupancy by safehouse | Bar chart (capacity vs. current) |
| Monthly incidents by safehouse | Small multiples or heatmap |
| Health score by safehouse | Ranked list |

### 3d. Counseling & Intervention Tracking

| Widget | Visualization | ML Connection |
|--------|---------------|---------------|
| Sessions this month vs. last | Comparison number | Pipeline 7: session count matters (don't reduce) |
| Active intervention plans | Count by category | Pipeline 7: healing services trend positive |
| Residents without recent session | Alert list | — |

### 3e. Donor & Fundraising

| Widget | Visualization | ML Connection |
|--------|---------------|---------------|
| Donations this month | Number + trend line | — |
| Donors at risk of lapsing (90+ days) | Alert count | Pipeline 1: 90-day rule |
| Campaign performance comparison | Bar chart | Pipeline 3: Year-End Hope >> Summer of Safety |
| Social media → donation conversion | Funnel or Sankey | Pipeline 2: boosted resident stories = 9x donation value |

---

## 4. Social Media Insights (Admin Reports Tab)

The ML pipelines had the clearest findings here. Show these as strategic guidance.

### What Actually Drives Donations (Pipeline 2 + 5)

| Content Strategy | Donation Impact | Engagement Impact |
|------------------|-----------------|-------------------|
| Boosted posts | **9x** donation value | High |
| Resident story posts | **8x** donation value | High |
| Posts with CTA | **4.3x** donation value | High |
| ThankYou posts | **Negative** impact | Medium |
| Event promotion | **Negative** impact | Low |
| Educational content | **Negative** impact | Low |

**Key Dashboard Insight:** Show a "Content ROI" chart that plots post types by engagement vs. donation value. The gap between "looks popular" and "actually raises money" is the story.

### Platform Effectiveness (Pipeline 5)

| Platform | Engagement | Donation Correlation |
|----------|------------|---------------------|
| YouTube | Highest reach | Moderate |
| Instagram | High engagement | Moderate |
| Facebook | Medium | High |
| WhatsApp | **Lowest engagement** | **Highest (ρ = 0.85)** |

**Key Insight:** WhatsApp has the worst vanity metrics but the best fundraising correlation. This is a counterintuitive finding worth highlighting.

---

## 5. Recommended Page Structure

### Landing Page (`/`)
- Hero: "Your Healing, Our Mission" + 4 hero stats (girls served, safehouses, regions, years)
- Features: Safe Shelter, Holistic Care, Education, Reintegration (4 cards)
- Impact numbers: 63% reintegration, 2,819 sessions, 3 regions (3 big numbers)
- Process: Intake → Shelter → Healing → Reintegration (4 steps)
- CTA: Donate / Partner

### Impact Dashboard (`/impact`)
- Tab 1: **Overview** — residents over time, reintegration outcomes, regional map
- Tab 2: **Healing** — counseling sessions trend, 80% favorable visits, health score improvement
- Tab 3: **Education** — program enrollment/completion, completion rates
- Tab 4: **Safehouses** — capacity/occupancy per house, health scores, regional breakdown
- Bottom CTA: donation amount + recurring donor count

### Admin Dashboard (`/admin`)
- Row 1: 4 alert cards (active residents, risk alerts, visits this month, unresolved incidents)
- Row 2: Risk distribution chart + safety concern alerts
- Row 3: Safehouse occupancy + monthly trends
- Row 4: Recent activity feed

### Admin Reports (`/admin/reports`)
- Tab 1: **Donations** — monthly trend, campaign comparison, donor churn alerts
- Tab 2: **Outcomes** — reintegration rates, intervention effectiveness, risk improvement
- Tab 3: **Social Media** — content ROI chart, platform comparison, engagement vs. donations

---

## 6. Numbers That Tell the Story (Summary)

If you could only show 10 numbers on the entire site, these are the ones:

| # | Metric | Value | Where | Why |
|---|--------|-------|-------|-----|
| 1 | Girls served | 60+ | Landing hero | Scale |
| 2 | Active safehouses | 9 | Landing hero | Infrastructure = trust |
| 3 | Reintegration rate | 63% | Landing + Impact | Ultimate proof of impact |
| 4 | Counseling sessions | 2,819 | Impact | Volume of care investment |
| 5 | Favorable visit outcomes | 80% | Impact | ML-backed effectiveness metric |
| 6 | Health score improvement | +10% YoY | Impact | Measurable healing |
| 7 | Education completion | 65% | Impact | Building futures |
| 8 | Total raised | ₱2.85M | Impact + Admin | Donor confidence |
| 9 | Recurring donors | 211 | Impact | Community strength |
| 10 | Cost per girl/month | ~₱3,958 | Impact CTA | Makes donation tangible |

---

## 7. What NOT to Show Publicly

- Individual resident data (ever)
- Risk levels with any identifying info
- Specific incident details
- Donor names without consent
- ML model accuracy numbers (say "data-driven" not "68% accurate")
- Raw pipeline outputs — translate to business language
