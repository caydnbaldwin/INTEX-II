# Extra Credit Features — Unified Priority List

Fibonacci scoring: 1, 2, 3, 5, 8, 13, 21
Higher = more impact. Only features that go **above and beyond** requirements. Requirements (pagination, Lighthouse, OKR, ML integration on dashboard) are excluded — those are baseline, not extra credit.

---

## 21 — AI Session Summary Generation
**Problem solved:** #1 "Girls fall through the cracks." Social workers use paper files and memory. This is their highest-friction daily task.
**What it does:** Social worker types or pastes raw session notes → AI extracts and pre-fills: emotional state, interventions applied, follow-up actions, concerns flagged. One click to populate the ProcessRecording form.
**Why judges care:** Live demo of AI filling a real form is a presentation showstopper. Shows AI applied to the actual operational bottleneck, not a gimmick. Goes well beyond "we built a CRUD app."
**Effort:** 2-3 hrs (API call to Claude/GPT + form pre-fill logic)
**Classes hit:** IS 413 (advanced feature), IS 455 (AI beyond pipelines), Presentation (wow)

---

## 21 — ML-Powered Email: Donor Churn Prevention
**Problem solved:** #2 "Donors lapse without warning." Pipeline 1 found 90-day inactivity = churn signal.
**What it does:** System flags donors at 60/75/90 days since last donation. Admin sees "At Risk Donors" alert on dashboard. One-click sends re-engagement email with personalized impact stats ("Your ₱5,000 funded 3 counseling sessions").
**Why judges care:** Complete ML→action loop: data → model → insight → automated intervention. This is exactly what IS 455 "deployment" means — not just showing a chart, but the model driving a business action.
**Effort:** 2-3 hrs (SendGrid/Resend integration + trigger logic + email template)
**Classes hit:** IS 455 (ML deployment gold), IS 413 (feature depth), Presentation (demo moment)

---

## 13 — ML-Powered Campaign Recommendations
**Problem solved:** #2 and #3. Pipeline 3 proved named campaigns = 2.28x more donations. Pipeline 2 proved boosted resident stories = 9x donation value.
**What it does:** "Campaign Advisor" panel on admin reports page. Shows: best-performing campaign types ranked by ROI, recommended content strategy (boost resident stories, add CTAs), warns against low-performers (Summer of Safety = -18%). Admin creating a new campaign gets data-backed suggestions.
**Why judges care:** Turns ML notebooks into a decision-support tool. Judges see the pipeline findings *inside the app*, not just in a Jupyter notebook.
**Effort:** 1-2 hrs (static recommendations derived from pipeline results, displayed as insight cards)
**Classes hit:** IS 455 (ML deployment), IS 413 (reports depth), Presentation (data-driven decisions)

---

## 13 — ML-Powered Email: Increase Donation Amount
**Problem solved:** #2. Pipeline 3 showed Year-End Hope = +28% vs baseline, GivingTuesday = 2nd best.
**What it does:** Admin selects donor segment → system recommends optimal campaign framing based on Pipeline 3 ROI data → sends personalized "increase your impact" email timed to high-performing windows. Shows projected revenue lift.
**Why judges care:** Another ML→action loop. Different from churn prevention (that's retention, this is growth). Together they show a complete donor lifecycle strategy.
**Effort:** 1-2 hrs (builds on churn email infrastructure + campaign data)
**Classes hit:** IS 455 (ML insight deployed), IS 413 (feature depth)

---

## 13 — Interactive Map with Safehouse Drill-Down
**Problem solved:** Tells the geographic scale story instantly. 9 safehouses across 3 regions is the physical proof of impact.
**What it does:** Philippines map with safehouse pins. Click a pin → see occupancy, health scores, education progress, incident count. Color-coded by capacity status (green/yellow/red). Shows on both public impact page and admin dashboard.
**Why judges care:** Presentation slam dunk. In a 20-minute demo, a map communicates more in 5 seconds than a table does in 60. Judges immediately grasp national reach.
**Effort:** 2 hrs (Leaflet.js + GeoJSON Philippines regions + safehouse coordinates from mock data)
**Classes hit:** IS 413 (UI quality), Presentation (visual wow), IS 401 (impact storytelling)

---

## 8 — ML-Powered Email: Donor Acquisition
**Problem solved:** #2 (growth side). Pipeline 2 showed resident stories with CTAs = 4.3x donation value.
**What it does:** "Share Our Impact" email campaign. Existing donors receive a beautifully formatted impact summary with a shareable link. Track referral conversions. Content uses the post types Pipeline 2 identified as highest-converting.
**Why judges care:** Third email in the donor lifecycle trilogy (acquire → grow → retain). Shows systematic thinking about the full funnel.
**Effort:** 1-2 hrs (builds on existing email infrastructure + shareable impact page)
**Classes hit:** IS 455 (ML insight applied), IS 413 (feature)

---

## 8 — Document/Image → Data Automation (OCR)
**Problem solved:** #1. Case study says staff use "spreadsheets, paper files, WhatsApp, and memory."
**What it does:** Upload photo of paper intake form or handwritten notes → OCR extracts text → AI parses into structured fields → pre-fills resident intake or session form. Works with phone camera photos.
**Why judges care:** Shows you understood the *real* workflow, not just the database schema. "We didn't just build a digital form — we built a bridge from their paper-based reality." Powerful presentation narrative.
**Effort:** 2-3 hrs (Tesseract.js or cloud vision API + AI parsing + form pre-fill)
**Classes hit:** IS 413 (advanced feature), Presentation (demo moment — photo → data)

---

## 8 — Stripe Payments
**Problem solved:** Enables the "Donate" CTA that appears on every page. Currently it's a dead link.
**What it does:** Stripe Checkout for one-time and recurring donations. Webhook records donation in database. Donor sees receipt on their portal. Admin sees it in real-time on dashboard.
**Why judges care:** Rubric lists payment processing under "Won't Have" — so having it means you exceeded expectations. A live donation during the demo is memorable. Also shows security competence (PCI compliance via Stripe).
**Effort:** 2 hrs (Stripe Checkout session + webhook endpoint + frontend integration)
**Classes hit:** IS 413 (exceeding requirements), Presentation (live demo), IS 414 (payment security)

---

## 8 — Light/Dark Mode with Browser Cookie
**Problem solved:** None directly, but IS 414 explicitly lists this as extra credit.
**What it does:** Theme toggle in header. Stores preference in a non-httponly browser-accessible cookie (per IS 414 spec). Already have CSS dark mode variables and theme-provider stub.
**Why judges care:** IS 414 rubric says "Browser-accessible cookie (NOT httponly) saving user setting" = counts toward 2 pts Additional Security Features. Easiest security extra credit available.
**Effort:** 1 hr (theme toggle + cookie storage + already have dark mode CSS)
**Classes hit:** IS 414 (2 pts Additional Security Features), IS 413 (polish)

---

## 8 — MFA/TOTP on One Account
**Problem solved:** None directly, but IS 414 explicitly lists this as extra credit.
**What it does:** Enable TOTP-based MFA on one test account. Graders see the MFA prompt (they won't log in, just verify it exists). Backend already has the infrastructure from hardening.
**Why judges care:** IS 414 rubric says MFA = counts toward 2 pts Additional Security Features. You need 3 test accounts anyway (admin no MFA, donor no MFA, one with MFA).
**Effort:** 1 hr (enable on one account + QR code setup flow + demo in video)
**Classes hit:** IS 414 (2 pts Additional Security Features)

---

## 5 — Regional Resource Allocation Recommendations
**Problem solved:** Strategic planning — where to open safehouse #10, where to shift resources.
**What it does:** "Resource Allocation" panel on admin reports. Ranks regions by: occupancy pressure, health score gaps, outcome rates, donor concentration. Recommends where investment has highest impact.
**Why judges care:** Shows data-driven strategic thinking beyond daily operations. Connects ML pipeline findings to long-term organizational planning.
**Effort:** 1-2 hrs (aggregate existing mock data by region + recommendation logic)
**Classes hit:** IS 455 (ML deployment), IS 413 (reports depth)

---

## 5 — AI Influencer / Content Generator
**Problem solved:** #3 "Social media effort is wasted." Pipeline 2 showed resident stories = 8x donation value.
**What it does:** AI generates social media post drafts using anonymized resident journey data. Follows Pipeline 2's winning formula: resident story + CTA + boost recommendation. Admin reviews and approves before posting. Template system for Facebook, Instagram, WhatsApp.
**Why judges care:** Creative and memorable. Directly applies Pipeline 2 + 5 findings. But complex to demo cleanly in 20 minutes.
**Effort:** 2-3 hrs (AI prompt engineering + template system + preview UI)
**Classes hit:** Presentation (creative), IS 455 (AI integration)

---

## 5 — Name Generator for Anonymization
**Problem solved:** Data privacy for public-facing displays and exports.
**What it does:** Generates consistent pseudonyms from resident IDs (e.g., "Sampaguita-17", "Dahlia-24" — Philippine flowers). Used on any public, exported, or donor-facing data. Same resident always gets the same pseudonym.
**Why judges care:** Shows ethical thinking about data for vulnerable minors. Judges in an IS program will appreciate privacy-by-design.
**Effort:** 30 min (hash function → name lookup table)
**Classes hit:** IS 414 (privacy awareness), Presentation (ethical signal)

---

## 5 — Consent Tracking System
**Problem solved:** GDPR/Philippine DPA compliance for minors' data.
**What it does:** Per-resident consent records: who consented (guardian), when, what data use was approved, expiration date. Dashboard flag for residents without current consent. Blocks data sharing for non-consented residents.
**Why judges care:** Strong ethical signal for working with minors. But hard to demo compellingly in limited time.
**Effort:** 1-2 hrs (consent model + admin UI + validation)
**Classes hit:** IS 414 (privacy/GDPR), Presentation (ethical awareness)

---

## 3 — Currency Converter on Donation Pages
**Problem solved:** International donor accessibility (lightweight version of i18n).
**What it does:** Toggle on impact/donation pages to show PHP amounts in USD, EUR, or GBP. Uses static exchange rates. 80% of the "international donor" value for 5% of the effort of full i18n.
**Effort:** 30 min
**Classes hit:** IS 413 (polish)

---

## 3 — Blocking Faces in Images
**Problem solved:** Privacy for photos of minors.
**What it does:** Auto-detect and blur faces in uploaded images before display. Client-side with face-api.js.
**Why judges care:** Only matters if photo uploads are a feature. Strong privacy signal if implemented, but requires building photo upload first.
**Effort:** 2 hrs (including photo upload feature)
**Classes hit:** IS 414 (privacy)

---

## 3 — Monthly Impact Digest Email to Donors
**Problem solved:** Donor engagement and transparency.
**What it does:** Automated monthly email with aggregated stats: residents served, sessions completed, reintegration milestones. Opt-in during registration. No PII.
**Why judges care:** Less impactful than the churn/growth/upsell emails above, but adds completeness to the email strategy.
**Effort:** 1 hr (builds on email infrastructure)
**Classes hit:** IS 413 (feature)

---

## 2 — AI Chatbot
**What it does:** Floating chat widget answering FAQs about the mission, donation process, volunteer opportunities.
**Why low:** Doesn't solve any of the 3 core business problems. Looks modern but judges will ask "what problem does this solve?" and the answer is weak.
**Effort:** 2 hrs
**Classes hit:** Presentation (looks modern), but low substance

---

## Skip These
- **Live demo on phones** — Site is already responsive + deployed. QR code in presentation = free.
- **Full language accessibility / i18n** — Rubric says "Won't Have." Currency converter above captures the value.
- **Generic "automations"** — Too vague. The specific items above (AI summaries, OCR, emails) ARE the automations.

---

## Implementation Priority (Top 11)

Do these in order. Each builds on the previous where possible.

| # | Feature | Score | Effort | Cumulative Hrs |
|---|---------|-------|--------|----------------|
| 1 | Light/dark mode + cookie | 8 | 1 hr | 1 |
| 2 | MFA on one account | 8 | 1 hr | 2 |
| 3 | AI session summaries | 21 | 2-3 hrs | 5 |
| 4 | Donor churn prevention emails | 21 | 2-3 hrs | 8 |
| 5 | Campaign recommendations panel | 13 | 1-2 hrs | 10 |
| 6 | Interactive map | 13 | 2 hrs | 12 |
| 7 | Increase donation amount emails | 13 | 1-2 hrs | 13 |
| 8 | Stripe payments | 8 | 2 hrs | 15 |
| 9 | Name generator anonymization | 5 | 30 min | 15.5 |
| 10 | Donor acquisition emails | 8 | 1-2 hrs | 17 |
| 11 | OCR document → data | 8 | 2-3 hrs | 20 |

**Quick wins first** (items 1-2: 2 hrs for 4 guaranteed IS 414 extra credit points), then **high-impact features** (items 3-7: the demo showpieces), then **nice-to-haves** (items 8-11: if time permits).
