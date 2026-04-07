# ML Pipeline Results Summary

Results from running all 8 notebooks on the Lighthouse Philippines dataset (April 2026).

---

## 1. Donor Churn Classifier

**Model performance:** RandomForest, 67% accuracy (but 0% recall on inactive donors — the model struggles with only 60 supporters and severe class imbalance).

**Key finding:** `days_since_last_donation` and `days_since_first_donation` are the top permutation-importance features.

**Business meaning:** The model is too data-starved (60 supporters, ~15 inactive) to reliably predict churn. However, the signal is clear: **time since last donation is the strongest warning sign.** Supporters who go quiet are the ones most likely to lapse.

**Action:** Set up a simple rule-based alert — if a supporter hasn't donated in 90+ days, trigger a personalized outreach email or call. Don't rely on the ML model itself for decisions until there are 200+ supporters.

---

## 2. Social Media Donation Driver

**Model performance:** GradientBoosting, MAE = 42,797 PHP, R² = 0.24 (weak but informative).

**Key findings (OLS, statistically significant):**
- **Boosted posts** increase donation value by ~9x (coef = 2.22 in log-scale)
- **Resident story posts** increase donation value by ~8x
- **Posts with a call-to-action** increase value by ~4.3x
- **ThankYou, EventPromotion, and EducationalContent** posts *significantly decrease* donation value

**Business meaning:** Not all posts are equal for fundraising. The posts that make people *feel good* (ThankYou) are not the ones that make people *give money*.

**Actions:**
1. When the goal is **donations**, post ImpactStories featuring real resident outcomes with a clear CTA and boost the post
2. Stop spending ad budget boosting ThankYou or EventPromotion posts — they don't convert
3. Track donation referrals per post, not just likes/shares

---

## 3. Campaign ROI Analyzer

**Model performance:** LinearRegression was "best" but all models had **negative R²** on test data — none predict well.

**Key findings (OLS):**
- `has_campaign` is the only strongly significant predictor (coef = 2.28, p < 0.001)
- **Year-End Hope** is the highest-ROI campaign (mean 1,285 PHP, +28% vs no campaign)
- **Summer of Safety** is the weakest (mean 825 PHP, -18% vs no campaign)
- Recurring vs one-time difference is not statistically significant (p = 0.34)

**Business meaning:** Simply having a named campaign attached to a donation increases its value substantially. Among campaigns, **Year-End Hope** and **GivingTuesday** outperform. The predictive model fails because donation amounts are inherently noisy — but the OLS coefficients still tell a useful story.

**Actions:**
1. Always attach a campaign name to fundraising asks — "NoCampaign" donations average significantly less
2. Double down on **Year-End Hope** timing and messaging
3. Reconsider or redesign **Summer of Safety** — it underperforms even uncampaigned donations

---

## 4. Resident Risk Predictor

**Model performance:** RandomForest, 68% accuracy via 5-fold CV. Recall for improved residents = 71%.

**Key findings:**
- `initial_risk_score` is the only statistically significant predictor (OR = 130, p = 0.02) — residents who start at higher risk show the most improvement
- `pct_concerns` (percentage of visits with concerns flagged) is marginally significant and *negatively* associated with improvement
- The model misses 8 residents who didn't improve (false negatives = "girls falling through the cracks")

**Business meaning:** Residents who enter at High/Critical risk levels tend to show the most measurable improvement — likely because they have the most room to improve. Residents with persistent safety concerns during visitations are the ones *not* improving.

**Actions:**
1. **Flag residents with high safety-concern rates** for extra social worker attention — they're the ones stalling
2. Don't assume low-risk residents are fine — the model is weakest at detecting subtle regression
3. With only 60 residents, treat this as a screening tool, not a decision-maker

---

## 5. Post Engagement Predictor

**Model performance:** GradientBoosting, R² = 0.42, MAE = 291 engagements.

**Key findings:**
- **Call-to-action, boosting, and resident stories** drive both engagement AND donations
- **Informative tone** kills engagement (coef = -0.99)
- **WhatsApp** has lowest engagement but highest engagement-to-donation correlation (rho = 0.85)
- **YouTube and Instagram** drive the most engagement

**Business meaning — the "vanity metrics" insight:** High engagement ≠ high donations. ThankYou posts generate emotional responses (likes/shares) but don't convert to money. The overlap between engagement and donation drivers is **partial**, not complete.

**Actions:**
1. Separate your content calendar: **awareness posts** (optimize for engagement on Instagram/YouTube) vs. **fundraising posts** (optimize for donations on Facebook/WhatsApp)
2. Stop reporting engagement metrics to leadership as a proxy for fundraising success
3. WhatsApp has low engagement but the strongest engagement-to-donation link — it may be your most valuable fundraising channel

---

## 6. Reintegration Readiness

**Model performance:** All models scored poorly (best SKF accuracy = 65%, LOO F1 = 0.18). The Decision Tree at depth 1 was "best" — essentially a single split.

**Key correlations with readiness:**
- `visit_count` (+0.32) and `length_of_stay` (+0.29) are the strongest positive correlations
- `pct_plans_achieved` (-0.25) and `has_completed_program` (-0.28) are **negatively** correlated — counterintuitive

**Business meaning:** The model cannot reliably predict readiness with 60 residents (only 19 "ready"). The negative correlation with `pct_plans_achieved` likely reflects that residents who achieve all their plans quickly may be lower-need cases who are easy to close, while the harder cases that truly need reintegration support take longer.

**Actions:**
1. **Don't use this model for discharge decisions** — it's not accurate enough
2. The strongest signal is simply **time**: more visits and longer stays correlate with readiness
3. Revisit this model when Lighthouse has 150+ residents with known outcomes

---

## 7. Intervention Effectiveness

**Model performance:** OLS R² = 0.55 (decent for 60 rows). Predictive models all had negative test R² — can't predict out-of-sample.

**Key findings (OLS):**
- `initial_risk_score` is the dominant predictor (coef = 0.75, p < 0.001) — same as risk predictor
- `session_count` is marginally significant and negative (p = 0.058) — more sessions associated with *less* improvement
- `has_healing` services trend positive (coef = 0.66, p = 0.15) but not significant
- `legal_services_count` shows up in permutation importance

**Business meaning:** The OLS explains 55% of variance in risk improvement, but almost all of it comes from where the resident started. The negative session_count effect likely reflects **reverse causality** — residents who aren't improving get *more* sessions, not that sessions cause harm.

**Actions:**
1. Don't reduce sessions based on this finding — it's selection bias, not causation
2. **Healing services** (counseling/therapy) show the most promise — consider expanding capacity
3. **Legal services** appear in feature importance — ensuring girls have legal support may contribute to improvement
4. The only reliable conclusion: initial risk level determines most of the measured improvement

---

## 8. Visitation Outcome Predictor

**Model performance:** LogisticRegression, CV AUC = 0.88, test AUC = 0.84, 80% accuracy. **This is the strongest model across all 8 notebooks.**

**Key findings:**
- `safety_flag` is the strongest negative predictor (coef = -1.06, p < 0.001) — if safety concerns are noted, the visit is much less likely to be favorable
- `days_since_last` is marginally significant (p = 0.086) — longer gaps between visits correlate with slightly better outcomes
- `case_category_Neglected` has higher odds of favorable outcomes (OR = 1.71, p = 0.06)
- `Initial Assessment` visits have the highest favorable odds (OR = 1.98)

**Business meaning:** This is the most actionable model. With 1,337 visits, there's enough data for reliable predictions. Safety concerns are the biggest red flag for unfavorable outcomes.

**Actions:**
1. **Pre-visit risk screening**: Before a visit, if a resident has had recent safety concerns flagged, send a senior social worker or prepare additional support resources
2. **Visit scheduling**: The model can predict which upcoming visits are likely to be unfavorable — use this to prioritize preparation time
3. **Neglected-category residents** tend to have better visit outcomes — these families may be more receptive to support
4. This is the model most ready for real deployment in the web app

---

## Bottom Line for Lighthouse Leadership

| Priority | Action | Based On |
|----------|--------|----------|
| **Highest** | Use visitation outcome predictions to prep social workers before visits | Pipeline 8 (AUC = 0.84) |
| **High** | Shift social media strategy: ImpactStories + CTAs + boost for donations | Pipelines 2 & 5 |
| **High** | Always attach campaign names to donation asks; invest in Year-End Hope | Pipeline 3 |
| **Medium** | Flag residents with high safety-concern rates for extra attention | Pipeline 4 |
| **Medium** | Separate engagement metrics from donation metrics in reporting | Pipeline 5 |
| **Low priority now** | Churn prediction, reintegration readiness, intervention effectiveness need more data (60 rows too small) | Pipelines 1, 6, 7 |
