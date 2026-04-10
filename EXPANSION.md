# Expansion Recommendation Pipeline — Implementation Plan

## Overview

Build a data-driven ML pipeline that analyzes Lunas's internal resident outcome data to identify which demographic and case profiles the organization serves most successfully, then cross-references those profiles against regional data to recommend which uncovered Philippine regions to expand into next. A Claude API call synthesizes the analysis into a plain-language ranked recommendation displayed on the Expansion Planning page.

### Core Insight

The current expansion page ranks regions by **need** (poverty, trafficking volume, NGO gap). This pipeline adds a second dimension: **expected impact** — regions where the profiles of vulnerable girls match the profiles Lunas has historically served to successful outcomes. The final recommendation score is:

```
ExpectedImpact = NeedScore × SuccessMatchScore
```

This surfaces regions where Lunas is likely to be most effective, not just most needed.

---

## Architecture

```
Frontend (expansion.tsx)
  └─ GET /api/expansion/recommendation
        └─ ExpansionRecommendationService
              ├─ Stage 1: Query DB → SuccessProfile (resident outcomes by segment)
              ├─ Stage 2: Static regional data → RegionalMatchScore per uncovered region
              ├─ Stage 3: Claude API → AI narrative recommendation
              └─ Cache result in PipelineResult table (24h TTL)
```

No new database tables are required. The result is cached in the existing `PipelineResult` table.

---

## Codebase Patterns to Follow

- **Service pattern**: Follow `DonorScoringService.cs` — interface + implementation, registered as `AddScoped` in `Program.cs`
- **Controller pattern**: Follow `PipelineResultsController.cs` — `[ApiController]`, `[Authorize(Policy = AuthPolicies.AdminOnly)]`, EF queries, returns `Ok(...)`
- **HTTP client**: Follow `AudioAutofillService.cs` / `ResendEmailService.cs` — injected `HttpClient`, secrets from `IConfiguration`
- **Pipeline caching**: Use `PipelineResult` table with `PipelineName = "ExpansionRecommendation"`, `EntityType = "Philippines"`, `EntityId = null`, `DetailsJson` holds full payload
- **Frontend API calls**: Follow `dashboard.tsx` `api.get<T>(...)` pattern

---

## Stage 1 — Success Profile Analysis

### What "Success" Means

A resident is considered a **successful outcome** if ANY of the following are true:

1. `CaseStatus` is `"Reintegrated"` or `"Closed"` (case lifecycle complete)
2. `ReintegrationStatus` is `"Completed"`
3. Latest `EducationRecord.CompletionStatus` is `"Completed"` AND latest `EducationRecord.ProgressPercent >= 80`

Residents with `CaseStatus = "Active"` are **excluded** from the success rate calculation (outcome not yet known). Residents with no education record and no reintegration record are treated as **inconclusive** and also excluded.

### Segments to Analyze

For each segment below, compute: `{ Count, SuccessCount, SuccessRate }`.

**By case subcategory** (the `SubCat*` boolean flags on `Resident`):
- `SubCatTrafficked`
- `SubCatOsaec` (Online Sexual Abuse and Exploitation of Children)
- `SubCatSexualAbuse`
- `SubCatPhysicalAbuse`
- `SubCatChildLabor`
- `SubCatAtRisk`
- `SubCatOrphaned`

**By age group at admission** (parse `AgeUponAdmission` string field):
- `"10-12"`
- `"13-15"`
- `"16-18"`
- `"Other"` (under 10, over 18, or unparseable)

**By family demographic flags**:
- `FamilyIs4ps` — enrolled in government Pantawid Pamilya (4Ps) poverty program
- `FamilySoloParent`
- `FamilyIndigenous`
- `FamilyInformalSettler`
- `FamilyParentPwd`

**By initial risk level** (`InitialRiskLevel` field):
- `"Low"`, `"Moderate"`, `"High"`, `"Critical"`

**By referral source** (group `ReferralSource` values):
- `"DSWD"`, `"Police/NBI"`, `"NGO"`, `"Self/Family"`, `"Other"`

### Output Shape

```csharp
public record SuccessProfile(
    int TotalResidentsAnalyzed,
    int TotalSuccessful,
    double OverallSuccessRate,
    List<SegmentRate> ByCaseSubcategory,
    List<SegmentRate> ByAgeGroup,
    List<SegmentRate> ByFamilyProfile,
    List<SegmentRate> ByInitialRisk,
    List<SegmentRate> ByReferralSource
);

public record SegmentRate(
    string Segment,
    int Count,
    int SuccessCount,
    double SuccessRate,
    double LiftOverBaseline  // SuccessRate / OverallSuccessRate - 1
);
```

**High-signal segments** (used in Stage 2 matching) are those where:
- `Count >= 5` (minimum sample for statistical validity)
- `LiftOverBaseline > 0.10` (at least 10% above average success rate)

---

## Stage 2 — Regional Match Scoring

### Regional Demographic Data (Static)

Since PSA OpenSTAT API calls introduce external dependencies and latency, embed regional demographic data as a static dictionary in the service. This data is sourced from PSA 2021 CBMS, DSWD Annual Report, and IACAT trafficking statistics.

For each of the **9 uncovered Philippine administrative regions** (Region I, II, III, IV-A, IV-B, V, IX, XIII, BARMM), store:

```csharp
public record RegionDemographic(
    string RegionCode,
    string RegionName,
    // Case prevalence (share of DSWD-documented cases in region that fall in each subcategory)
    double TraffickingCasePct,    // % of regional DSWD cases flagged as trafficking
    double OsaecCasePct,          // % flagged as OSEC
    double SexualAbuseCasePct,
    double PhysicalAbuseCasePct,
    double ChildLaborCasePct,
    // Poverty/family demographics (PSA)
    double FourPsEnrollmentPct,   // % of households enrolled in Pantawid Pamilya
    double SoloParentHouseholdPct,
    double IndigenousPct,         // % of population identifying as indigenous
    double InformalSettlerPct,
    // Age distribution
    double GirlsPct10to12,        // % of female population aged 10–12
    double GirlsPct13to15,
    double GirlsPct16to18,
    // Existing need score from expansion page (used as a weight multiplier)
    int ExistingNeedScore
);
```

Use the following approximate values derived from publicly available PSA/DSWD data:

| Code | Trafficking% | OSEC% | SexAbuse% | PhysAbuse% | ChildLabor% | 4Ps% | SoloParent% | Indigenous% | InfSettler% | Girls10-12% | Girls13-15% | Girls16-18% | NeedScore |
|------|------------|-------|-----------|-----------|------------|------|------------|------------|------------|------------|------------|------------|-----------|
| Region I | 12 | 8 | 35 | 28 | 10 | 38 | 14 | 6 | 8 | 3.1 | 3.0 | 2.9 | 43 |
| Region II | 18 | 6 | 30 | 25 | 14 | 42 | 12 | 18 | 6 | 3.2 | 3.1 | 3.0 | 54 |
| Region III | 20 | 22 | 28 | 22 | 12 | 32 | 15 | 4 | 14 | 3.3 | 3.2 | 3.1 | 68 |
| Region IV-A | 18 | 32 | 25 | 20 | 10 | 28 | 16 | 3 | 18 | 3.4 | 3.3 | 3.2 | 71 |
| Region IV-B | 14 | 10 | 32 | 22 | 16 | 48 | 13 | 22 | 12 | 3.0 | 2.9 | 2.8 | 55 |
| Region V | 16 | 14 | 38 | 30 | 12 | 52 | 18 | 10 | 16 | 3.2 | 3.1 | 3.0 | 76 |
| Region IX | 24 | 12 | 32 | 28 | 18 | 58 | 20 | 28 | 14 | 3.1 | 3.0 | 2.9 | 81 |
| Region XIII | 14 | 8 | 36 | 30 | 22 | 62 | 16 | 32 | 20 | 3.2 | 3.1 | 3.0 | 72 |
| BARMM | 20 | 8 | 28 | 24 | 20 | 72 | 22 | 62 | 28 | 3.3 | 3.2 | 3.1 | 88 |

### Match Score Algorithm

For each uncovered region, compute a `SuccessMatchScore` (0–100):

```
1. For each HIGH-SIGNAL segment from Stage 1:
   - Find the corresponding regional demographic percentage
   - Weight = SegmentRate.LiftOverBaseline (capped at 1.0)
   - Contribution = RegionDemographicPct × Weight

2. Sum all contributions → raw match value

3. Normalize across all regions to 0–100 scale

4. FinalScore = (0.5 × NeedScore) + (0.5 × SuccessMatchScore)
   // Equal weight between raw need and expected success fit
```

**Special handling for BARMM**: Always append a `SafetyFlag = true` field regardless of score. Surface this prominently in the UI with a staff-safety warning. Do not suppress it from results.

### Output Shape

```csharp
public record RegionRecommendation(
    string RegionCode,
    string RegionName,
    string IslandGroup,
    int NeedScore,
    double SuccessMatchScore,
    double FinalScore,
    int Rank,
    bool SafetyFlag,
    List<string> TopMatchingSegments,   // e.g. ["OSEC cases (high density)", "4Ps households (strong match)"]
    string AiRationale                  // Filled in Stage 3
);
```

---

## Stage 3 — Claude API Synthesis

### Setup

1. Add the Anthropic NuGet package or use raw `HttpClient` (raw `HttpClient` preferred to avoid package version conflicts):
   - Base URL: `https://api.anthropic.com/v1/messages`
   - API key from `IConfiguration["Anthropic:ApiKey"]`
   - Register a named `HttpClient` in `Program.cs`: `builder.Services.AddHttpClient("Anthropic")`

2. Store the API key as:
   - **Local dev**: `appsettings.Development.json` → `"Anthropic": { "ApiKey": "sk-ant-..." }`
   - **Production**: Azure App Service → Application Settings → `Anthropic__ApiKey`

### Prompt Construction

Build a system prompt and user message programmatically. Pass the Stage 1 success profile and Stage 2 ranked regions as structured JSON in the user message.

**System prompt:**
```
You are an expansion planning analyst for Lunas, a Christian nonprofit organization that operates safehouses for girl survivors of sexual abuse and trafficking in the Philippines. Your role is to analyze resident outcome data and regional demographics to recommend where Lunas should expand next. Your recommendations must be specific, evidence-based, and compassionate in tone. Always acknowledge data limitations honestly. Output only valid JSON.
```

**User message template:**
```
Based on the following analysis, write a concise rationale (2–3 sentences each) for why each of the top 3 ranked regions is recommended for expansion. Focus on the alignment between Lunas's demonstrated strengths and the regional need profile. Acknowledge the small sample size where relevant.

Success Profile Summary:
- Total residents analyzed: {TotalResidentsAnalyzed}
- Overall success rate: {OverallSuccessRate:P0}
- Top performing segments: {top 3 segments by LiftOverBaseline as JSON}

Top 3 Ranked Regions (by FinalScore):
{regions[0..2] as JSON without AiRationale}

Respond with JSON in this exact shape:
{
  "recommendations": [
    { "regionCode": "...", "rationale": "..." },
    { "regionCode": "...", "rationale": "..." },
    { "regionCode": "...", "rationale": "..." }
  ],
  "overallInsight": "One sentence summarizing what this analysis reveals about Lunas's expansion strategy."
}
```

**Model settings:**
- Model: `claude-sonnet-4-6`
- `max_tokens`: 1000
- `temperature`: 0 (deterministic for consistent caching)

### Error Handling

If the Claude API call fails (timeout, rate limit, API key missing):
- Return the ranked regions with `AiRationale = null`
- Frontend must handle `null` rationale gracefully (show "Analysis unavailable" placeholder)
- Do NOT block the entire recommendation from returning

---

## Caching Strategy

Use the existing `PipelineResult` table. On every GET request:

1. Query for most recent record: `PipelineName = "ExpansionRecommendation"`, `EntityType = "Philippines"`, `GeneratedAt > DateTime.UtcNow.AddHours(-24)`
2. If found → deserialize `DetailsJson` and return immediately
3. If not found → run all 3 stages, serialize full result to `DetailsJson`, insert new `PipelineResult`, return result

**Important**: The `PipelineResult` table has `ValueGeneratedNever()` set on its PK. Assign `PipelineResultId` as `db.PipelineResults.Max(p => p.PipelineResultId) + 1` (or use a sequence/Guid-based approach). Alternatively, change the PK strategy in `AppDbContext` for `PipelineResult` to `ValueGeneratedOnAdd()` in a new migration.

The cleanest solution is to add a migration that removes `ValueGeneratedNever()` from `PipelineResult.PipelineResultId`, making it a standard auto-increment identity column.

---

## Backend Implementation Files

### 1. `Backend/Services/IExpansionRecommendationService.cs`

```csharp
namespace Backend.Services;

public interface IExpansionRecommendationService
{
    Task<ExpansionRecommendationDto> GetRecommendationAsync();
    Task<ExpansionRecommendationDto> RefreshRecommendationAsync();
}
```

### 2. `Backend/Services/ExpansionRecommendationService.cs`

Implement `IExpansionRecommendationService`. Constructor receives `AppDbContext db`, `HttpClient httpClient` (named "Anthropic"), and `IConfiguration config`.

Key methods:
- `private async Task<SuccessProfile> BuildSuccessProfileAsync()` — Stage 1
- `private List<RegionRecommendation> ScoreRegions(SuccessProfile profile)` — Stage 2
- `private async Task EnrichWithAiAsync(List<RegionRecommendation> regions, SuccessProfile profile)` — Stage 3
- `private async Task<ExpansionRecommendationDto?> GetCachedAsync()` — cache read
- `private async Task PersistAsync(ExpansionRecommendationDto result)` — cache write

The `SuccessProfile`, `SegmentRate`, `RegionRecommendation`, and `ExpansionRecommendationDto` record types can be defined in this file or a companion DTOs file.

### 3. `Backend/Controllers/ExpansionController.cs`

```csharp
[ApiController]
[Route("api/expansion")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class ExpansionController(IExpansionRecommendationService service) : ControllerBase
{
    [HttpGet("recommendation")]
    public async Task<IActionResult> GetRecommendation()
        => Ok(await service.GetRecommendationAsync());

    [HttpPost("recommendation/refresh")]
    public async Task<IActionResult> RefreshRecommendation()
        => Ok(await service.RefreshRecommendationAsync());
}
```

### 4. `Backend/Program.cs` additions

```csharp
builder.Services.AddHttpClient("Anthropic", client =>
{
    client.BaseAddress = new Uri("https://api.anthropic.com/");
    client.DefaultRequestHeaders.Add("x-api-key", builder.Configuration["Anthropic:ApiKey"] ?? "");
    client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
    client.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddScoped<IExpansionRecommendationService, ExpansionRecommendationService>();
```

---

## Response DTO Shape

```csharp
public record ExpansionRecommendationDto(
    DateTime GeneratedAt,
    SuccessProfile SuccessProfile,
    List<RegionRecommendation> RankedRegions,   // All 9 uncovered, sorted by FinalScore desc
    string? OverallInsight                       // From Claude, may be null if API failed
);
```

---

## Frontend Implementation

### API Call

In [expansion.tsx](Frontend/src/pages/admin/expansion.tsx), add a `useEffect` to the `ExpansionPlanning` component that fetches `/api/expansion/recommendation` on mount. Store result in state:

```typescript
interface SegmentRate {
  segment: string
  count: number
  successCount: number
  successRate: number
  liftOverBaseline: number
}

interface SuccessProfile {
  totalResidentsAnalyzed: number
  totalSuccessful: number
  overallSuccessRate: number
  byCaseSubcategory: SegmentRate[]
  byAgeGroup: SegmentRate[]
  byFamilyProfile: SegmentRate[]
  byInitialRisk: SegmentRate[]
}

interface RegionRecommendation {
  regionCode: string
  regionName: string
  islandGroup: string
  needScore: number
  successMatchScore: number
  finalScore: number
  rank: number
  safetyFlag: boolean
  topMatchingSegments: string[]
  aiRationale: string | null
}

interface ExpansionRecommendation {
  generatedAt: string
  successProfile: SuccessProfile
  rankedRegions: RegionRecommendation[]
  overallInsight: string | null
}
```

### UI — New "AI Recommendation" Section in Short-term Tab

Add this section **below** the existing "All Regions" + "Recommendations" two-column grid, as a full-width panel. It should render in three states:

**Loading state**: Skeleton cards with a pulsing animation and label "Analyzing resident outcomes…"

**Error state**: A muted banner "Recommendation analysis unavailable. Scores are based on static regional data." with a retry button that calls `POST /api/expansion/recommendation/refresh`.

**Loaded state**: Three sections side by side or stacked:

#### Section A — Success Profile Summary
A compact card showing:
- Overall success rate as a large number with a progress ring
- Top 3 segments with highest lift (from `byCaseSubcategory`, `byAgeGroup`, `byFamilyProfile` combined, sorted by `liftOverBaseline` desc)
- Each segment shown as a horizontal bar: segment name, success rate, lift badge (e.g. "+23% above avg")
- Small footnote: `Based on {totalResidentsAnalyzed} resolved cases`

#### Section B — Data-Driven Region Rankings
A ranked list of the top 5 regions by `finalScore`. For each:
- Rank medal (same gold/silver/bronze styling as existing `RecommendationCard`)
- Region name and code
- Two score bars: "Need Score" (from `needScore`, colored rose/orange per existing tier) and "Success Match" (from `successMatchScore`, colored violet)
- "Final Score" shown prominently as a combined number
- Safety flag: if `safetyFlag = true`, show an amber `AlertTriangle` badge "Staff safety assessment required"
- List of `topMatchingSegments` as small badges

#### Section C — AI Rationale
For each of the top 3 ranked regions:
- Region name as heading
- `aiRationale` text in muted italics
- If `aiRationale` is null, show "Analysis unavailable for this region"

`overallInsight` (if not null) displayed as a full-width callout banner above the three ranked regions, styled like the existing context banners but in violet.

#### Refresh Control
Below the section, a small "Last analyzed: {generatedAt formatted as relative time}" + a "Re-run Analysis" button that calls `POST /api/expansion/recommendation/refresh` and refetches.

---

## Migration

If `PipelineResult.PipelineResultId` currently uses `ValueGeneratedNever()` (it does — see `AppDbContext.cs` line 39), add a migration to change it to `ValueGeneratedOnAdd()` (auto-increment identity). This is required so new pipeline results can be inserted without manual ID management.

**Migration steps:**
1. In `AppDbContext.OnModelCreating`, remove the line: `modelBuilder.Entity<PipelineResult>().Property(e => e.PipelineResultId).ValueGeneratedNever();`
2. Run `dotnet ef migrations add MakePipelineResultIdAutoIncrement`
3. Manually review the generated migration — EF may need help recognizing this as an identity column change on SQL Server. The migration should use `migrationBuilder.AlterColumn` with `oldClrType: typeof(int)` and add `identity: true`.

Alternatively, skip the migration and handle ID assignment manually in the service by querying `MAX(PipelineResultId) + 1`. This is safe since the expansion recommendation runs infrequently and the table is admin-only.

---

## Data Limitations to Surface in UI

Display a small info banner alongside the AI recommendation panel (use the sky/info styling):

> "This analysis is based on {n} resolved resident cases from Lunas's 9 active safehouses. With a dataset of this size, individual segment success rates carry statistical uncertainty. Results should be treated as directional guidance, not definitive proof. As the organization grows and more cases are resolved, this analysis will become increasingly reliable."

---

## File Checklist

### New backend files
- [ ] `Backend/Services/IExpansionRecommendationService.cs`
- [ ] `Backend/Services/ExpansionRecommendationService.cs`
- [ ] `Backend/Controllers/ExpansionController.cs`

### Modified backend files
- [ ] `Backend/Program.cs` — register named HttpClient + scoped service
- [ ] `Backend/Data/AppDbContext.cs` — remove `ValueGeneratedNever` for `PipelineResult` PK (if using auto-increment approach)

### New migration (if altering PipelineResult PK)
- [ ] `Backend/Migrations/[timestamp]_MakePipelineResultIdAutoIncrement.cs`

### Modified frontend files
- [ ] `Frontend/src/pages/admin/expansion.tsx` — add TypeScript interfaces, `useEffect` fetch, AI recommendation panel in short-term tab

---

## Implementation Order

1. **Migration** (if needed) — do this first to unblock DB writes
2. **`ExpansionRecommendationService`** — implement Stage 1 only first, test the success profile query against the seed data
3. **Stage 2 scoring** — add the regional match logic, verify ranked output makes sense
4. **`ExpansionController`** — wire up the endpoint, test with curl/Postman
5. **Stage 3 Claude API** — add last; the pipeline should work without it (degraded mode with null rationale)
6. **Frontend UI** — build loading/error/loaded states, verify against the live endpoint
7. **Caching** — add PipelineResult persistence once the full pipeline is verified correct

---

## Testing Notes

- The seed data has ~150 residents. Run the success profile query manually against the seeded DB to verify counts are non-zero before wiring up the full pipeline.
- `CaseStatus` values in the CSV are not documented here — inspect `residents.csv` directly to confirm what values appear (e.g. "Active", "Reintegrated", "Closed") before writing the success predicate.
- If `AgeUponAdmission` is stored as a string like `"14"` or `"14 years"`, parse accordingly. Defensively handle nulls and non-numeric values.
- The Claude API call should be wrapped in a try/catch that catches `HttpRequestException`, `TaskCanceledException` (timeout), and JSON deserialization failures independently — each should log a warning but not throw to the caller.
