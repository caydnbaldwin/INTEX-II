# Data Overview — Statistically Validated Stories

All claims below are backed by formal hypothesis tests. Tests used: Wilcoxon signed-rank (paired non-parametric), Mann-Whitney U (two-group non-parametric), Kruskal-Wallis (multi-group non-parametric), binomial test, chi-square test of independence, Spearman rank correlation, one-way ANOVA, and Cramér's V for effect size.

---

### STORY 1: Counseling Works — Emotional States Improve Within Sessions

The `process_recordings` table (2,819 sessions) tracks emotional state at the **start** and **end** of every counseling session. Using an ordinal scale (Distressed=1, Angry=2, Withdrawn=3, Sad=4, Anxious=5, Calm=6, Hopeful=7, Happy=8):

**Wilcoxon signed-rank test (paired, non-parametric):**
| Metric | Value |
|---|---|
| Mean start score | 4.627 |
| Mean end score | 6.548 |
| Mean change | +1.921 |
| Test statistic | 30,145.5 |
| **p-value** | **< 1e-300** |
| Effect size (rank-biserial r) | **0.985** (very large) |

**Session outcomes:**
- 82.2% of sessions showed emotional improvement (2,318 sessions)
- 15.0% remained unchanged (424 sessions)
- Only 2.7% worsened (77 sessions)

**Top emotional transitions (start → end):**
| Transition | Count |
|---|---|
| Sad → Hopeful | 266 |
| Anxious → Hopeful | 245 |
| Sad → Calm | 233 |
| Anxious → Calm | 217 |
| Hopeful → Happy | 198 |

**Conclusion:** The emotional improvement within sessions is statistically significant with an extremely large effect size (r = 0.985). Counseling sessions demonstrably improve emotional state in over 82% of cases.

**Additional metrics:** 31% of sessions note explicit progress. 38.7% flag concerns. These aren't mutually exclusive.

---

### STORY 2: Risk Levels Improve Over Time — The Program is Working

Of 60 residents, **28 improved** their risk level from intake to current assessment. **Zero worsened.** 32 remained unchanged.

| Change | Count |
|---|---|
| Medium → Low | 11 |
| High → Low | 7 |
| High → Medium | 6 |
| Critical → Low | 2 |
| Critical → Medium | 1 |
| Critical → High | 1 |

**Binomial test** (H0: among residents whose risk changed, improvements and worsenings are equally likely):
| Metric | Value |
|---|---|
| Improved | 28 |
| Worsened | 0 |
| **p-value** | **7.45e-09** |

**Wilcoxon signed-rank test** (paired, initial vs. current risk scores):
| Metric | Value |
|---|---|
| Mean initial risk | 2.217 |
| Mean current risk | 1.550 |
| Test statistic | 0.0 |
| **p-value** | **1.68e-06** |

**Conclusion:** The improvement in risk levels is statistically significant by both tests. The probability of observing 28 improvements and 0 worsenings by chance is less than 1 in 100 million. The 1 Critical case and 5 High cases remaining are the ones the system needs to surface.

---

### STORY 3: Social Media Donation Value Varies by Platform

**Kruskal-Wallis test** (donation value per post across 7 platforms):
| Metric | Value |
|---|---|
| H statistic | 31.96 |
| **p-value** | **1.66e-05** |

Platform donation value differs significantly. Per-post donation value statistics:

| Platform | Mean (PHP) | Median (PHP) | Std Dev | n |
|---|---|---|---|---|
| WhatsApp | 78,438 | 8,737 | 257,825 | 93 |
| YouTube | 59,061 | 9,181 | 120,674 | 71 |
| TikTok | 57,425 | 12,476 | 139,687 | 89 |
| LinkedIn | 34,921 | 0 | 105,591 | 79 |
| Facebook | 31,086 | 3,201 | 84,661 | 199 |
| Instagram | 30,989 | 4,323 | 75,727 | 164 |
| Twitter | 14,264 | 3,274 | 31,052 | 117 |

**Significant pairwise Mann-Whitney U tests (p < 0.05):**
- WhatsApp > LinkedIn (p = 0.002), WhatsApp > Twitter (p = 0.005)
- YouTube > LinkedIn (p = 0.0005), YouTube > Twitter (p = 0.001)
- TikTok > LinkedIn (p = 0.0003), TikTok > Twitter (p = 0.0003)

**Spearman correlation: engagement vs. donation value:**
| Metric | Value |
|---|---|
| rho | 0.683 |
| **p-value** | **< 0.0001** |

**Corrected insight:** Unlike the initial descriptive analysis, the statistical tests show that **WhatsApp, YouTube, and TikTok** are the top platforms by per-post donation value (not WhatsApp and LinkedIn). LinkedIn has a median donation value of 0 PHP despite a high mean — its distribution is extremely right-skewed (a few high-value posts inflate the average). Engagement and donation value are positively correlated (rho = 0.68), meaning high-engagement platforms *do* tend to generate more donations — but the relationship is not perfect, and **Twitter and LinkedIn significantly underperform** the top 3 platforms.

---

### STORY 4: Content Type Matters — ImpactStories and FundraisingAppeals Drive Donation Referrals

**Kruskal-Wallis test** (donation referrals across 6 post types):
| Metric | Value |
|---|---|
| H statistic | 396.44 |
| **p-value** | **1.74e-83** |

| Post Type | Mean Referrals | Median Referrals | n |
|---|---|---|---|
| ImpactStory | 36.4 | 18.0 | 203 |
| FundraisingAppeal | 14.1 | 6.0 | 90 |
| Campaign | 9.0 | 4.0 | 156 |
| EventPromotion | 1.0 | 0.0 | 131 |
| EducationalContent | 0.8 | 0.0 | 114 |
| ThankYou | 0.8 | 0.0 | 118 |

**Mann-Whitney U: FundraisingAppeal > ThankYou:**
| Metric | Value |
|---|---|
| U statistic | 8,846 |
| **p-value** | **4.31e-18** |

**Conclusion:** The difference in donation referrals across post types is highly significant. **ImpactStories** are the strongest driver (median 18 referrals), followed by **FundraisingAppeals** (median 6). EventPromotion, EducationalContent, and ThankYou posts have a median of 0 referrals — they rarely drive donations. The FundraisingAppeal vs. ThankYou difference alone is significant at p < 1e-17.

---

### STORY 5: Donor Base is Small — Acquisition Channel Doesn't Predict Churn

**60 supporters** — 45 Active, 15 Inactive (25% churn rate).

**Chi-square test of independence** (acquisition channel vs. Active/Inactive status):
| Metric | Value |
|---|---|
| chi2 | 1.873 |
| **p-value** | **0.866** |
| dof | 5 |

**Not significant.** Acquisition channel does not significantly predict whether a donor churns. The churn rates by channel vary (Event 38%, Church 33%, Website 15%) but the sample is too small (n=60) for these differences to be statistically meaningful.

**Descriptive stats (still useful for context):**
| Type | Count |
|---|---|
| MonetaryDonor | 17 |
| InKindDonor | 15 |
| SocialMediaAdvocate | 10 |
| Volunteer | 8 |
| SkillsContributor | 6 |
| PartnerOrganization | 4 |

**Recurring vs. one-time monetary donations (Mann-Whitney U):**
| Group | n | Mean (PHP) | Median (PHP) |
|---|---|---|---|
| Recurring | 125 | 918.66 | 774.61 |
| One-time | 109 | 1,154.98 | 914.95 |
| **p-value** | **0.062** (not significant at α=0.05) |

**Conclusion:** The donor dataset is small. Channel-based churn differences and recurring vs. one-time amount differences are suggestive but not statistically significant. The ML churn predictor will need to use donation behavior features (frequency, recency, amount trends) rather than acquisition channel alone.

---

### STORY 6: Home Visitation Cooperation Does Not Significantly Predict Outcomes

**1,337 home visitations** across 5 types.

**Chi-square test: cooperation level vs. visit outcome:**
| Metric | Value |
|---|---|
| chi2 | 13.43 |
| **p-value** | **0.144** (not significant) |
| dof | 9 |
| Cramér's V | 0.058 (negligible effect) |

**Chi-square test: cooperation level vs. safety concerns:**
| Metric | Value |
|---|---|
| chi2 | 1.75 |
| **p-value** | **0.626** (not significant) |

**Safety concern rates by cooperation level:**
| Cooperation Level | Safety Concern Rate |
|---|---|
| Uncooperative | 30.0% |
| Cooperative | 28.0% |
| Highly Cooperative | 26.2% |
| Neutral | 24.5% |

**Corrected insight:** Unlike the initial analysis suggested, **family cooperation level does NOT significantly predict visit outcome or safety concerns.** The safety concern rates are remarkably similar across all cooperation levels (24-30%). This means the system shouldn't rely on cooperation level alone as a risk indicator — other features (visit type, resident history, incident reports) may be more predictive.

**Descriptive stats (still useful for context):**
- Cooperative (599) + Highly Cooperative (378) = 73% positive cooperation
- Uncooperative: 140 visits (10%)
- Visit types: Routine Follow-Up (542), Reintegration Assessment (316), Initial Assessment (233), Post-Placement Monitoring (182), Emergency (64)

---

### STORY 7: Donation Allocations Are Evenly Distributed Across Program Areas

**Kruskal-Wallis test** (allocation amount across 6 program areas):
| Metric | Value |
|---|---|
| H statistic | 1.57 |
| **p-value** | **0.905** (not significant) |

| Program Area | Total (PHP) | Mean per Allocation | n |
|---|---|---|---|
| Education | 67,306 | 606 | 111 |
| Operations | 66,853 | 531 | 126 |
| Wellbeing | 52,949 | 495 | 107 |
| Transport | 39,053 | 521 | 75 |
| Maintenance | 29,894 | 586 | 51 |
| Outreach | 26,381 | 517 | 51 |

**Corrected insight:** The per-allocation amounts are **not significantly different** across program areas. Education and Operations receive more total funding simply because they get more allocations (111 and 126 respectively), not because individual allocations are larger. The average allocation is ~$520 PHP regardless of program area.

---

### STORY 8: Incidents Show Mild Clustering But Follow Near-Poisson Distribution

**100 total incidents** across 60 residents.

| Metric | Value |
|---|---|
| Mean incidents per resident | 1.667 |
| Variance | 1.921 |
| Variance/Mean ratio | 1.153 |

| Incidents | Observed Residents | Expected (Poisson) |
|---|---|---|
| 0 | 16 | 11.3 |
| 1 | 12 | 18.9 |
| 2 | 16 | 15.7 |
| 3 | 10 | 8.7 |
| 4 | 4 | 3.6 |
| 5 | 2 | 1.2 |

**Insight:** The variance/mean ratio of 1.15 indicates **mild overdispersion** — incidents are slightly more clustered than a random Poisson process would predict. There are more residents with 0 incidents (16 vs. 11 expected) and fewer with exactly 1 (12 vs. 19 expected), suggesting a subpopulation of residents who are incident-free and another that has repeated incidents. However, the clustering is modest, not extreme.

**Incident types (descriptive):**
| Type | Count |
|---|---|
| RunawayAttempt | 29 |
| Behavioral | 20 |
| Security | 16 |
| SelfHarm | 14 |
| ConflictWithPeer | 11 |
| Medical | 6 |
| PropertyDamage | 4 |

**29 incidents are currently unresolved.**

---

### STORY 9: Education Progress Is Uniform Across All Levels

**Kruskal-Wallis test** (progress % across education levels):
| Metric | Value |
|---|---|
| H statistic | 1.22 |
| **p-value** | **0.748** (not significant) |

**One-way ANOVA** (parametric confirmation):
| Metric | Value |
|---|---|
| F statistic | 0.27 |
| **p-value** | **0.846** (not significant) |

| Education Level | Mean Progress | Std Dev | n |
|---|---|---|---|
| CollegePrep | 80.8% | 24.4 | 59 |
| Secondary | 78.7% | 23.5 | 207 |
| Vocational | 78.4% | 24.8 | 111 |
| Primary | 77.6% | 23.0 | 157 |

**Conclusion:** There is **no significant difference** in education progress across levels. All levels average 77-81% with similar standard deviations (~23-25%). This is good news for the Impact Dashboard — education progress is a consistent, positive metric regardless of program level. Completion status: 424 InProgress, 50 Completed, 60 NotStarted.

---

### STORY 10: Higher Safehouse Utilization Correlates With More Incidents

**Spearman rank correlations (n = 9 safehouses):**

| Correlation | rho | p-value | Significant? |
|---|---|---|---|
| Utilization rate vs. avg monthly incidents | **0.718** | **0.029** | Yes |
| Utilization rate vs. avg education progress | **-0.694** | **0.038** | Yes |

| Safehouse | City | Utilization | Avg Incidents/Month |
|---|---|---|---|
| SH01 | Quezon City | 100% | 0.40 |
| SH03 | Davao City | 100% | 0.24 |
| SH04 | Iloilo City | 100% | 0.34 |
| SH07 | Bacolod | 100% | 0.22 |
| SH09 | General Santos | 100% | 0.16 |
| SH05 | Baguio City | 82% | 0.22 |
| SH02 | Cebu City | 80% | 0.16 |
| SH08 | Tacloban | 78% | 0.10 |
| SH06 | Cagayan de Oro | 75% | 0.16 |

**Conclusion:** Higher utilization significantly correlates with more incidents (rho = 0.718, p = 0.029) and lower education progress (rho = -0.694, p = 0.038). Overcrowded safehouses produce worse outcomes. This supports the need for the Admin Dashboard to flag capacity issues. Note: with only 9 data points, these correlations should be interpreted cautiously, but the direction is consistent and significant.

---

## Summary of Statistical Findings

| Story | Test | p-value | Significant? | Original Claim Confirmed? |
|---|---|---|---|---|
| 1. Counseling improves emotions | Wilcoxon signed-rank | < 1e-300 | **Yes** | **Yes** — very large effect |
| 2. Risk levels improve | Binomial + Wilcoxon | 7.45e-09 | **Yes** | **Yes** — 28/28 improved |
| 3. Platform donation value differs | Kruskal-Wallis | 1.66e-05 | **Yes** | **Partially** — WhatsApp top, but TikTok/YouTube also strong (not weak as originally claimed) |
| 4. Post type drives referrals | Kruskal-Wallis | 1.74e-83 | **Yes** | **Yes** — ImpactStory and FundraisingAppeal dominate |
| 5. Acquisition channel predicts churn | Chi-square | 0.866 | **No** | **Corrected** — channel does not predict churn |
| 6. Cooperation predicts outcomes | Chi-square | 0.144 | **No** | **Corrected** — cooperation level is not predictive |
| 7. Program areas get different amounts | Kruskal-Wallis | 0.905 | **No** | **Corrected** — per-allocation amounts are uniform |
| 8. Incidents are concentrated | Variance/Mean ratio | 1.15 | Mild | **Partially** — mild clustering, not extreme |
| 9. Education varies by level | ANOVA + Kruskal-Wallis | 0.748 / 0.846 | **No** | **Confirmed** — uniformly consistent (as stated) |
| 10. Utilization affects outcomes | Spearman correlation | 0.029 | **Yes** | **Yes** — more crowding = more incidents |

---

## Data Quality Notes

1. **`intervention_plans.services_provided`** — Contains quoted comma-separated values (e.g., `"Healing, Legal Services, Teaching"`). CsvHelper handles this correctly with quoted field parsing. Not a data issue.

2. **`residents.age_upon_admission`, `present_age`, `length_of_stay`** — Stored as strings like `"15 Years 9 months"`. These should be computed from `date_of_birth` and `date_of_admission` rather than trusted as-is (the case doc notes they "may not be calculated accurately").

3. **`residents` column alignment** — The `referral_source` field index appeared shifted in our earlier analysis because `length_of_stay` (field before it) contains spaces. Use a proper CSV parser (CsvHelper), not positional splitting.

4. **`public_impact_snapshots.metric_payload_json`** — Contains a JSON string blob. Will need to be parsed client-side or by the API before rendering on the Impact Dashboard.

5. **Boolean fields in CSVs** — Stored as `True`/`False` strings. CsvHelper maps these to C# `bool` automatically.
