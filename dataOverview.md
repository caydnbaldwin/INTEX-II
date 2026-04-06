### STORY 1: Counseling Works — Emotional States Improve Within Sessions

The `process_recordings` table (2,819 sessions) tracks emotional state at the **start** and **end** of every counseling session. The data shows clear within-session improvement:

**Top emotional transitions (start → end):**
| Transition | Count | Interpretation |
|---|---|---|
| Sad → Hopeful | 266 | Most common positive shift |
| Anxious → Hopeful | 245 | Counseling relieves anxiety |
| Sad → Calm | 233 | Stabilization |
| Anxious → Calm | 217 | Stabilization |
| Hopeful → Happy | 198 | Building on positive momentum |
| Hopeful → Hopeful | 193 | Maintaining good state |
| Calm → Happy | 164 | Uplift from stable baseline |
| Angry → Calm | 139 | De-escalation working |
| Withdrawn → Calm/Hopeful | 220 | Drawing out disengaged girls |

**Negative transitions are rare.** `Distressed → Withdrawn` (19) and `Distressed → Anxious` (22) are the most concerning patterns — these suggest some sessions with the most distressed girls don't fully land.

**Key metric:** 31% of sessions note explicit progress. 38.7% flag concerns. These aren't mutually exclusive — a session can show progress and still flag a concern.

**ML opportunity:** Predict which residents will have concerns flagged in their next session based on emotional state trends, incident history, and intervention plan status.

---

### STORY 2: Risk Levels Improve Over Time — The Program is Working

Of 60 residents, **28 improved** their risk level from intake to current assessment:

| Change | Count |
|---|---|
| Medium → Low | 11 |
| High → Low | 7 |
| High → Medium | 6 |
| Critical → Low | 2 |
| Critical → Medium | 1 |
| Critical → High | 1 |

**Zero residents got worse.** Every risk level change in the data is a reduction. This is the strongest evidence that the holistic care model works. The 1 Critical case and 5 High cases remaining are the ones the system needs to surface for staff attention.

**ML opportunity:** Predict which residents are on track for risk level reduction vs. which are stalling — features would include session frequency, emotional state trends, education progress, health scores, and incident history.

---

### STORY 3: Social Media ROI Varies Wildly by Platform — But Not How You'd Expect

The data reveals a fascinating split between **engagement** and **donation value**:

**By engagement (likes + comments + shares) per post:**
| Platform | Avg Engagement | Posts |
|---|---|---|
| YouTube | 2,347 | 71 |
| TikTok | 1,451 | 89 |
| Instagram | 877 | 164 |
| Facebook | 596 | 199 |
| WhatsApp | 445 | 93 |
| LinkedIn | 219 | 79 |
| Twitter | 168 | 117 |

**By total estimated donation value generated:**
| Platform | Total Donation Value (PHP) | Avg per Post |
|---|---|---|
| WhatsApp | 1,142,837 | 12,289 |
| LinkedIn | 736,551 | 12,276 |
| Instagram | 722,036 | 4,814 |
| Twitter | 295,317 | 2,813 |
| Facebook | 450,876 | 2,411 |
| YouTube | 144,007 | 2,028 |
| TikTok | 131,435 | 1,494 |

**The key insight:** YouTube and TikTok generate the most *engagement* but the **least donation value per post**. WhatsApp and LinkedIn generate the least engagement but the **highest donation value per post** — by a factor of 6-8x over TikTok. This is the classic vanity metrics trap. The organization would be misled if they optimized for likes.

**Why this makes sense:** WhatsApp forwards are personal referrals to people who already trust the sender. LinkedIn reaches professionals with disposable income. TikTok and YouTube reach mass audiences who engage but don't convert.

**ML opportunity:** This is the core of the Social Media Donation Driver pipeline — predict `estimated_donation_value_php` from post attributes, not `engagement_rate`.

---

### STORY 4: Content Type Matters — FundraisingAppeals and ImpactStories Drive Donations

**Average donation referrals by post type:**
| Post Type | Avg Referrals | Posts |
|---|---|---|
| FundraisingAppeal | 1,438 | 90 |
| ImpactStory | 1,055 | 203 |
| Campaign | 674 | 156 |
| EventPromotion | 353 | 131 |
| EducationalContent | 287 | 114 |
| ThankYou | 239 | 118 |

**FundraisingAppeals** directly asking for money work 6x better than ThankYou posts at driving referrals. **ImpactStories** (featuring anonymized resident journeys) are the second-best — and the organization has 203 of them, their most-posted type.

**Actionable insight for the client:** Post more FundraisingAppeals and ImpactStories on WhatsApp and LinkedIn. Reduce effort on ThankYou and EducationalContent posts on TikTok and YouTube (high effort, low donation conversion).

---

### STORY 5: Donor Base is Small and Split — Retention is Critical

**60 supporters** with 45 Active and 15 Inactive (25% churn rate).

**Supporter types:**
| Type | Count | What They Give |
|---|---|---|
| MonetaryDonor | 17 | Cash (234 monetary donations total) |
| InKindDonor | 15 | Goods (98 in-kind donations, 129 line items) |
| SocialMediaAdvocate | 10 | Advocacy posts |
| Volunteer | 8 | Time (46 time donations) |
| SkillsContributor | 6 | Professional skills |
| PartnerOrganization | 4 | Organizational support |

**Donation patterns:**
- 211 recurring vs. 209 one-time donations — almost exactly 50/50
- Recurring total: 114,832 PHP vs. One-time: 125,892 PHP
- **77 donations** are directly linked to a social media post via `referral_post_id`

**Acquisition channels:** WordOfMouth (14), SocialMedia (13), Website (13), Event (8), Church (6), PartnerReferral (6)

**The danger:** With only 17 monetary donors, losing even 2-3 is devastating. The 15 already-Inactive supporters represent a 25% loss. The ML churn predictor is critical here.

---

### STORY 6: Home Visitations Reveal Family Readiness Patterns

**1,337 home visitations** across 5 types:

| Visit Type | Count | Safety Concerns Rate |
|---|---|---|
| Routine Follow-Up | 542 | 27% |
| Reintegration Assessment | 316 | 30% |
| Initial Assessment | 233 | 22% |
| Post-Placement Monitoring | 182 | 26% |
| Emergency | 64 | 36% |

**Family cooperation levels:**
- Cooperative (599) + Highly Cooperative (378) = **73% positive**
- Neutral (220) = 16%
- Uncooperative (140) = **10%**

**Reintegration Assessment visits have a 30% safety concern rate.** These are the visits that determine whether a girl can go home. Nearly 1 in 3 reveals safety issues — this is why the system needs to track cooperation trends over time, not just individual visit snapshots.

**ML opportunity:** Predict visit outcome (Favorable/Unfavorable) based on past cooperation trajectory, visit frequency, and resident case factors. Flag families trending toward Uncooperative before a reintegration decision is made.

---

### STORY 7: Donation Funding Goes Primarily to Education and Operations

**Donation allocations by program area:**
| Program Area | Total Allocated (PHP) | Allocations |
|---|---|---|
| Education | 67,306 | 111 |
| Operations | 66,853 | 126 |
| Wellbeing | 52,949 | 107 |
| Transport | 39,053 | 75 |
| Maintenance | 29,894 | 51 |
| Outreach | 26,381 | 51 |

Education and Operations together consume **47%** of all allocated funds. This is important for the donor-facing Impact Dashboard — donors want to see their money going to direct care (Education, Wellbeing) more than overhead (Operations, Maintenance). The public dashboard should emphasize the Education and Wellbeing impact.

---

### STORY 8: Incidents Are Concentrated — A Few Residents Need the Most Help

**100 total incidents** across the dataset, but they're not evenly distributed:

- Residents 41 and 17: **5 incidents each**
- Residents 58, 14, 12, 1: **4 incidents each**
- Many residents: 0 incidents

**Incident types:**
| Type | Count | Severity Concern |
|---|---|---|
| RunawayAttempt | 29 | Highest volume — a leading indicator of crisis |
| Behavioral | 20 | General behavioral issues |
| SelfHarm | 14 | Most clinically concerning |
| Security | 16 | External threats |
| ConflictWithPeer | 11 | Interpersonal issues |
| Medical | 6 | Health emergencies |
| PropertyDamage | 4 | Lowest priority |

**29 incidents are currently unresolved.** RunawayAttempts alone account for 29% of all incidents. These two numbers — unresolved count and RunawayAttempt frequency — are probably the most important safety metrics for the Admin Dashboard.

---

### STORY 9: Education Programs Show Consistent Progress

**534 education records** across 4 levels:

| Education Level | Avg Progress | Records |
|---|---|---|
| CollegePrep | 80.8% | 59 |
| Secondary | 78.7% | 207 |
| Vocational | 78.4% | 111 |
| Primary | 77.6% | 157 |

Progress is remarkably consistent across levels (77-81%). Education completion status: 424 InProgress, 50 Completed, 60 NotStarted. The high InProgress count makes sense — most residents are actively in programs.

This is good news for the Impact Dashboard: education progress is a clean, positive metric to show donors.

---

### STORY 10: The Safehouse Capacity Problem

| Safehouse | Region | Capacity | Residents | Utilization |
|---|---|---|---|---|
| SH01 (Quezon City) | Luzon | 8 | 10 | **125% — over capacity** |
| SH04 (Iloilo City) | Visayas | 12 | 8 | 67% |
| SH02 (Cebu City) | Visayas | 10 | 8 | 80% |
| SH07 (Bacolod) | Visayas | 12 | 8 | 67% |
| SH03 (Davao City) | Mindanao | 9 | 7 | 78% |
| SH05 (Baguio City) | Luzon | 11 | 6 | 55% |
| SH08 (Tacloban) | Visayas | 9 | 6 | 67% |
| SH06 (Cagayan de Oro) | Mindanao | 8 | 5 | 63% |
| SH09 (General Santos) | Mindanao | 6 | 2 | 33% |

**SH01 in Quezon City is over capacity** (10 girls in 8 spots). SH09 in General Santos is only at 33%. The Admin Dashboard should flag capacity issues — both overcrowding and underutilization — to inform transfer decisions and resource allocation.

---

## Data Quality Notes

1. **`intervention_plans.services_provided`** — Contains quoted comma-separated values (e.g., `"Healing, Legal Services, Teaching"`). CsvHelper handles this correctly with quoted field parsing. Not a data issue.

2. **`residents.age_upon_admission`, `present_age`, `length_of_stay`** — Stored as strings like `"15 Years 9 months"`. These should be computed from `date_of_birth` and `date_of_admission` rather than trusted as-is (the case doc notes they "may not be calculated accurately").

3. **`residents` column alignment** — The `referral_source` field index appeared shifted in our earlier analysis because `length_of_stay` (field before it) contains spaces. Use a proper CSV parser (CsvHelper), not positional splitting.

4. **`public_impact_snapshots.metric_payload_json`** — Contains a JSON string blob. Will need to be parsed client-side or by the API before rendering on the Impact Dashboard.

5. **Boolean fields in CSVs** — Stored as `True`/`False` strings. CsvHelper maps these to C# `bool` automatically.
