# IS 413 Requirements Video — Recording Script

Target length: **7–10 minutes**. Cut from the bonus showcase, not the rubric walkthrough.

Record at 1080p+. Keep the URL bar visible at all times so the grader sees you're on the deployed site.

Say the rubric item number out loud every time you switch sections. It makes checking off the rubric trivial for the grader.

---

## Prep checklist (before hitting record)

- Logged out of the site in the recording browser
- Grader donor account credentials ready (linked to historical donations)
- Grader admin account credentials ready
- Stripe test card handy: `4242 4242 4242 4242` / any future date / any CVC / any ZIP
- Azure portal open in a second tab (for rubric #15)
- Script open on a second monitor or phone
- Notifications silenced
- Screen recording set to capture the full browser window

---

## Intro — 15 seconds

**SAY:** "This is the IS 413 requirements video for group [X], the Lunas Project — a platform for Safe Haven Philippines. I'll walk through each rubric item in order. Frontend is React, TypeScript, and Vite. Backend is .NET 10 and C#. Database is Azure SQL, deployed separately from the app."

**SHOW:** The live deployed landing page in the browser. The URL bar is visible.

*This one sentence covers the tech stack, rubric #1 (compiles and runs), and frames the video.*

---

## Rubric #2 + #3 — Professional UI + Landing page with CTAs (2 pts)

**SAY:** "Rubric items two and three. Here's the public landing page — modern professional UI, consistent branding, and clear calls to action."

**SHOW:** Hover over the Donate and Impact CTA buttons without clicking. Five seconds is enough.

---

## Rubric #4 — Login page with validation (1 pt)

**SAY:** "Rubric item four. Login page with client validation and server error handling."

**SHOW:**

1. Click Login
2. Type `notanemail` in the email field
3. Type a too-short password
4. Click Submit — let the client validation fire
5. Clear the fields
6. Type a real email with a wrong password
7. Click Submit — let the server error fire
8. Clear the error

**Do NOT log in yet.**

---

## Rubric #5 — Privacy policy + cookie consent (1 pt)

**SAY:** "Rubric item five. GDPR cookie consent — fully functional, not cosmetic — and a customized privacy policy."

**SHOW:**

1. Point at the cookie consent banner at the bottom of the landing page
2. Click Accept
3. Scroll to the footer
4. Click the Privacy Policy link
5. Scroll the privacy page briefly so "Lunas" and the custom content are visible
6. Navigate back to home

---

## Rubric #6 — Public impact dashboard (2 pts)

**SAY:** "Rubric item six, worth two points. Public impact dashboard with fully anonymized aggregated data — no individual residents named."

**SHOW:**

1. Navigate to `/impact`
2. Scroll through the aggregate counts and charts
3. If the safehouse map is here, briefly point at it ("we'll come back to the map in the bonus section")

*Do NOT deep-dive extras yet.*

---

## Rubric #7 — Donor dashboard (view history + submit fake donation) (1 pt)

**THIS IS THE MOST IMPORTANT ITEM TO DEMO CLEANLY.** A strict grader will poke at this specifically.

**SAY:** "Rubric item seven. Authenticated donors can view their donation history and submit a new donation. The full Stripe webhook path is wired through a claim endpoint that links the donation to the donor's supporter record."

**SHOW:**

1. Click Login
2. Sign in as the grader **donor** account
3. Land on `/donor`
4. Point at the existing donation history list
5. Click Donate
6. Pick an amount
7. Enter Stripe test card: `4242 4242 4242 4242`, future date, any CVC
8. Complete the payment
9. Navigate back to the donor portal
10. **Hard-reload if needed** — make sure the new row is visibly in the history
11. Point at the new row
12. Log out

---

## Rubric #8 — Admin dashboard / command center (2 pts)

**SAY:** "Rubric item eight, worth two points. Admin command center with operational summary."

**SHOW:**

1. Click Login
2. Sign in as the grader **admin** account
3. Land on `/admin`
4. Point at each section by name as you say them:
  - "Active residents summary"
  - "Recent donations"
  - "Upcoming case conferences"
  - "ML-powered action items"

*Don't click into them yet — just name them.*

---

## Rubric #9 — Donors & Contributions (2 pts)

**SAY:** "Rubric item nine, worth two points. View, create, and manage supporters and their contributions."

**SHOW:**

1. Navigate to Admin → Donors
2. Show the list with pagination controls
3. Click Add New Supporter
4. Fill in the required fields
5. Save
6. Open an existing supporter
7. Show their donation history panel
8. Edit a field and save
9. Click delete on a throwaway supporter
10. Show the confirmation dialog — cancel (or confirm if it's truly a throwaway)

**SAY during step 9:** "Delete requires explicit confirmation."

---

## Rubric #10 — Caseload Inventory (1 pt)

**SAY:** "Rubric item ten. Caseload inventory — full CRUD on residents with search and filtering."

**SHOW:**

1. Navigate to Admin → Caseload
2. Type a name fragment in the search box — results filter
3. Clear search
4. Apply a filter (risk level, safehouse, or case status)
5. Click Add New Resident, show the form briefly, cancel
6. Click an existing resident to open the edit view
7. Close the edit view

---

## Rubric #11 — Process Recording (1 pt)

**SAY:** "Rubric item eleven. Dated session notes displayed chronologically."

**SHOW:**

1. Navigate to Admin → Process Recording
2. Pick a resident
3. Show their session history sorted chronologically
4. Click Add Session
5. Fill in: session date, social worker, session type, narrative, interventions
6. Save
7. Point at the new entry appearing at the top of the list

---

## Rubric #12 — Home Visitation & Case Conferences (1 pt)

**SAY:** "Rubric item twelve. Log home visits and track case conferences with upcoming and history views."

**SHOW:**

1. Navigate to Admin → Home Visitation
2. Click the Upcoming Conferences tab
3. Click the Conference History tab
4. Click Add Visit
5. Fill in: visit type, observations, family cooperation level, safety concerns, follow-up
6. Save

---

## Rubric #13 — Reports & Analytics (1 pt)

**SAY:** "Rubric item thirteen. Meaningful charts and summaries covering donations, outcomes, and safehouse performance."

**SHOW:**

1. Navigate to Admin → Reports
2. Scroll through the charts:
  - Donation trends line chart
  - Campaign ROI bar chart
  - Pie charts
  - Any other analytics

*Ten seconds total. Move on.*

---

## Rubric #14 — Additional feature (2 pts) ⭐

**PICK ONE FEATURE** — don't demo all of them here. Save the rest for the bonus showcase.

**Best candidates (pick the strongest one):**

- AI chat assistant with natural-language SQL generation
- Expansion recommendation tool (Gemini-powered)
- AI email template generator

**SAY:** "Rubric item fourteen, worth two points, is the additional feature. I'm submitting [FEATURE NAME] for this item."

**SHOW (full end-to-end demo):**

1. Navigate to the feature
2. Use it with real input
3. Show a real output that clearly provides value

*This is worth TWO points. Don't cheap out. Give it 30–45 seconds.*

---

## Rubric #15 — Database deployed separately (1 pt)

**SAY:** "Rubric item fifteen. The database is deployed as a separate Azure resource, not co-located with the app."

**SHOW (pick ONE):**

**Option A — Azure portal:**

1. Switch to the Azure portal tab
2. Show the SQL Server / SQL Database resource
3. Show the App Service resource
4. Point out they're separate resources

**Option B — Connection string:**

1. In the Azure portal, open App Service → Configuration → Connection Strings
2. Point at the connection string showing `*.database.windows.net` (clearly a different host from the app)

*Five seconds. Move on.*

---

## Rubric #16 — Validation and error handling (baseline)

**SAY:** "You've already seen input validation and error handling throughout the donor, admin, and CRUD flows — rubric item sixteen is covered by what we've demonstrated."

**No separate segment needed.** This is just a verbal acknowledgment.

---

## Bonus showcase — extra credit (+1 pt possible) ⭐

Rapid-fire. **10–15 seconds each.** Don't deep-dive — just name, show on screen, move on.

**SAY:** "Here are the features we built beyond the minimum rubric requirements."

**SHOW — each for a beat, then advance:**

- **Safehouse map** on the impact dashboard — "interactive map of safehouse locations"
- **AI chat assistant** — "natural language queries against operational data with SQL generation" *(skip if you used this for #14)*
- **Expansion recommendation tool** — "Gemini-powered analysis of where to expand next" *(skip if you used this for #14)*
- **AI email templates** — "generated donor outreach emails with personalization" *(skip if you used this for #14)*
- **ML model outputs surfaced in admin UI** — "donor churn, visitation outcome, education risk, and resident risk predictions visible on the relevant admin pages"
- **Social media recommender**
- **Audio autofill for process recording** — "voice-to-form autofill via Gemini"
- **Dark/light theme** toggle
- **Boarding management** page
- **User management** page for admins
- Anything else you want to highlight

*Total bonus section: 90 seconds max. Cut ruthlessly if over.*

---

## Outro — 10 seconds

**SAY:** "That covers all IS 413 rubric items plus the bonus features we built. Thanks for watching."

**Stop recording.**

---

## Do NOT put in this video

These belong in the **IS 414 security video** — keep them out of the 413 video to stay under length:

- HTTPS / TLS certificate
- HTTP → HTTPS redirect
- Password policy configuration
- RBAC / authorization policies
- HSTS header
- CSP header
- MFA / 2FA flow
- Google OAuth
- Data sanitization
- Cookie consent cosmetic-vs-functional explanation
- Credential storage / secrets management

If you accidentally demo these here, you're eating into your 413 runtime and giving the 414 grader nothing new to watch.

---

## Quick rubric scorecard (for your own pre-submission sanity check)


| #         | Item                            | Points       | Script section |
| --------- | ------------------------------- | ------------ | -------------- |
| 1         | Compiles and runs               | 1            | Intro          |
| 2         | Professional UI                 | 1            | #2+#3          |
| 3         | Landing + CTAs                  | 1            | #2+#3          |
| 4         | Login + validation              | 1            | #4             |
| 5         | Privacy + cookie consent        | 1            | #5             |
| 6         | Public impact dashboard         | 2            | #6             |
| 7         | Donor dashboard + fake donation | 1            | #7             |
| 8         | Admin dashboard                 | 2            | #8             |
| 9         | Donors & Contributions          | 2            | #9             |
| 10        | Caseload inventory              | 1            | #10            |
| 11        | Process recording               | 1            | #11            |
| 12        | Home visitation + conferences   | 1            | #12            |
| 13        | Reports & analytics             | 1            | #13            |
| 14        | Additional feature              | 2            | #14            |
| 15        | DB deployed separately          | 1            | #15            |
| 16        | Validation + error handling     | 0 (baseline) | #16            |
| Bonus     | Advanced React/.NET             | +1           | Bonus showcase |
| **Total** |                                 | **20 (+1)**  |                |


