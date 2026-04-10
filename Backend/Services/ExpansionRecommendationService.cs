using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

// ─── Static regional demographic data ────────────────────────────────────────
// Source: PSA 2021 CBMS, DSWD Annual Report, IACAT trafficking statistics.
// Covers the 9 Philippine administrative regions not yet served by a Lunas safehouse.

internal record RegionDemographic(
    string RegionCode,
    string RegionName,
    string IslandGroup,
    // Case prevalence (% of regional DSWD-documented cases by subcategory)
    double TraffickingCasePct,
    double OsaecCasePct,
    double SexualAbuseCasePct,
    double PhysicalAbuseCasePct,
    double ChildLaborCasePct,
    // Poverty / family demographics (PSA)
    double FourPsEnrollmentPct,
    double SoloParentHouseholdPct,
    double IndigenousPct,
    double InformalSettlerPct,
    // Age distribution (% of female population)
    double GirlsPct10to12,
    double GirlsPct13to15,
    double GirlsPct16to18,
    // Need score from expansion page (used in FinalScore weighting)
    int NeedScore
);

// ─── Service implementation ───────────────────────────────────────────────────

public class ExpansionRecommendationService(
    AppDbContext db,
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    ILogger<ExpansionRecommendationService> logger
) : IExpansionRecommendationService
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    // ── Static table: 9 uncovered regions (PSA/DSWD/IACAT derived values) ────
    private static readonly RegionDemographic[] UncoveredRegions =
    [
        new("Region I",   "Ilocos Region",       "Luzon",    12,  8, 35, 28, 10, 38, 14,  6,  8,  3.1, 3.0, 2.9, 43),
        new("Region II",  "Cagayan Valley",       "Luzon",    18,  6, 30, 25, 14, 42, 12, 18,  6,  3.2, 3.1, 3.0, 54),
        new("Region III", "Central Luzon",        "Luzon",    20, 22, 28, 22, 12, 32, 15,  4, 14,  3.3, 3.2, 3.1, 68),
        new("Region IV-A","CALABARZON",           "Luzon",    18, 32, 25, 20, 10, 28, 16,  3, 18,  3.4, 3.3, 3.2, 71),
        new("Region IV-B","MIMAROPA",             "Luzon",    14, 10, 32, 22, 16, 48, 13, 22, 12,  3.0, 2.9, 2.8, 55),
        new("Region V",   "Bicol Region",         "Luzon",    16, 14, 38, 30, 12, 52, 18, 10, 16,  3.2, 3.1, 3.0, 76),
        new("Region IX",  "Zamboanga Peninsula",  "Mindanao", 24, 12, 32, 28, 18, 58, 20, 28, 14,  3.1, 3.0, 2.9, 81),
        new("Region XIII","CARAGA",               "Mindanao", 14,  8, 36, 30, 22, 62, 16, 32, 20,  3.2, 3.1, 3.0, 72),
        new("BARMM",      "Bangsamoro",           "Mindanao", 20,  8, 28, 24, 20, 72, 22, 62, 28,  3.3, 3.2, 3.1, 88),
    ];

    // ── Public API ─────────────────────────────────────────────────────────────

    public async Task<ExpansionRecommendationDto> GetRecommendationAsync()
    {
        var cached = await GetCachedAsync();
        return cached ?? await RunPipelineAsync();
    }

    public Task<ExpansionRecommendationDto> RefreshRecommendationAsync()
        => RunPipelineAsync();

    // ── Pipeline orchestration ─────────────────────────────────────────────────

    private async Task<ExpansionRecommendationDto> RunPipelineAsync()
    {
        var profile = await BuildSuccessProfileAsync();          // Stage 1
        var regions = ScoreRegions(profile);                     // Stage 2
        var overallInsight = await EnrichWithAiAsync(regions, profile); // Stage 3

        var result = new ExpansionRecommendationDto(
            GeneratedAt: DateTime.UtcNow,
            SuccessProfile: profile,
            RankedRegions: regions,
            OverallInsight: overallInsight
        );

        await PersistAsync(result);
        return result;
    }

    // ── Stage 1: Success profile from resident outcomes ───────────────────────

    private async Task<SuccessProfile> BuildSuccessProfileAsync()
    {
        // Exclude active residents — outcome not yet known
        var residents = await db.Residents
            .Where(r => r.CaseStatus != "Active")
            .ToListAsync();

        // Success = case closed OR reintegration completed
        static bool IsSuccess(Resident r) =>
            r.CaseStatus == "Closed" || r.ReintegrationStatus == "Completed";

        int total = residents.Count;
        int totalSuccess = residents.Count(IsSuccess);
        double overallRate = total == 0 ? 0.0 : (double)totalSuccess / total;

        // Helper: compute segment lift metrics
        SegmentRate Segment(string label, IEnumerable<Resident> subset)
        {
            var list = subset.ToList();
            int count = list.Count;
            int success = list.Count(IsSuccess);
            double rate = count == 0 ? 0.0 : (double)success / count;
            double lift = overallRate == 0 ? 0.0 : rate / overallRate - 1.0;
            return new SegmentRate(label, count, success, Math.Round(rate, 4), Math.Round(lift, 4));
        }

        // ── By case subcategory ──────────────────────────────────────────────
        var byCaseSubcat = new List<SegmentRate>
        {
            Segment("Trafficked",     residents.Where(r => r.SubCatTrafficked    == true)),
            Segment("OSEC",           residents.Where(r => r.SubCatOsaec         == true)),
            Segment("Sexual Abuse",   residents.Where(r => r.SubCatSexualAbuse   == true)),
            Segment("Physical Abuse", residents.Where(r => r.SubCatPhysicalAbuse == true)),
            Segment("Child Labor",    residents.Where(r => r.SubCatChildLabor    == true)),
            Segment("At Risk",        residents.Where(r => r.SubCatAtRisk        == true)),
            Segment("Orphaned",       residents.Where(r => r.SubCatOrphaned      == true)),
        };

        // ── By age group at admission ────────────────────────────────────────
        // AgeUponAdmission format: "15 Years 9 months" — extract leading integer
        static int? ParseAge(string? s)
        {
            if (string.IsNullOrWhiteSpace(s)) return null;
            var first = s.Split(' ', StringSplitOptions.RemoveEmptyEntries)[0];
            return int.TryParse(first, out int n) ? n : null;
        }

        var byAge = new List<SegmentRate>
        {
            Segment("Age 10-12", residents.Where(r => ParseAge(r.AgeUponAdmission) is >= 10 and <= 12)),
            Segment("Age 13-15", residents.Where(r => ParseAge(r.AgeUponAdmission) is >= 13 and <= 15)),
            Segment("Age 16-18", residents.Where(r => ParseAge(r.AgeUponAdmission) is >= 16 and <= 18)),
            Segment("Age Other", residents.Where(r => ParseAge(r.AgeUponAdmission) is null or < 10 or > 18)),
        };

        // ── By family profile ────────────────────────────────────────────────
        var byFamily = new List<SegmentRate>
        {
            Segment("4Ps Household",    residents.Where(r => r.FamilyIs4ps          == true)),
            Segment("Solo Parent",      residents.Where(r => r.FamilySoloParent     == true)),
            Segment("Indigenous",       residents.Where(r => r.FamilyIndigenous     == true)),
            Segment("Informal Settler", residents.Where(r => r.FamilyInformalSettler== true)),
            Segment("Parent with PWD",  residents.Where(r => r.FamilyParentPwd      == true)),
        };

        // ── By initial risk level ────────────────────────────────────────────
        // Data values: Low, Medium, High, Critical
        var byRisk = new List<SegmentRate>
        {
            Segment("Low Risk",      residents.Where(r => r.InitialRiskLevel == "Low")),
            Segment("Medium Risk",   residents.Where(r => r.InitialRiskLevel == "Medium")),
            Segment("High Risk",     residents.Where(r => r.InitialRiskLevel == "High")),
            Segment("Critical Risk", residents.Where(r => r.InitialRiskLevel == "Critical")),
        };

        // ── By referral source ───────────────────────────────────────────────
        // Data values: Community, Court Order, Government Agency, NGO, Police, Self-Referral
        var byReferral = new List<SegmentRate>
        {
            Segment("Government Agency", residents.Where(r => r.ReferralSource == "Government Agency")),
            Segment("NGO",               residents.Where(r => r.ReferralSource == "NGO")),
            Segment("Police",            residents.Where(r => r.ReferralSource == "Police")),
            Segment("Court Order",       residents.Where(r => r.ReferralSource == "Court Order")),
            Segment("Community",         residents.Where(r => r.ReferralSource == "Community")),
            Segment("Self-Referral",     residents.Where(r => r.ReferralSource == "Self-Referral")),
        };

        return new SuccessProfile(total, totalSuccess, Math.Round(overallRate, 4),
            byCaseSubcat, byAge, byFamily, byRisk, byReferral);
    }

    // ── Stage 2: Regional match scoring ───────────────────────────────────────

    private static List<RegionRecommendation> ScoreRegions(SuccessProfile profile)
    {
        // High-signal segments: sufficient sample AND meaningful positive lift above baseline
        // Thresholds from textbook: minimum sample for statistical validity + practical significance
        var highSignal = profile.ByCaseSubcategory
            .Concat(profile.ByAgeGroup)
            .Concat(profile.ByFamilyProfile)
            .Concat(profile.ByInitialRisk)
            .Concat(profile.ByReferralSource)
            .Where(s => s.Count >= 5 && s.LiftOverBaseline > 0.10)
            .OrderByDescending(s => s.LiftOverBaseline)
            .ToList();

        bool hasSignal = highSignal.Any();

        // Compute raw match contribution for each region
        var rawScores = new Dictionary<string, double>();
        var topSegMap = new Dictionary<string, List<string>>();

        foreach (var region in UncoveredRegions)
        {
            double raw = 0;
            var contributions = new List<(string segment, double value)>();

            foreach (var seg in highSignal)
            {
                double weight = Math.Min(seg.LiftOverBaseline, 1.0);
                double demoPct = GetDemographicPct(region, seg.Segment);
                double contrib = demoPct * weight;
                raw += contrib;
                if (contrib > 0)
                    contributions.Add((seg.Segment, contrib));
            }

            rawScores[region.RegionCode] = raw;
            topSegMap[region.RegionCode] = contributions
                .OrderByDescending(c => c.value)
                .Take(3)
                .Select(c => c.segment)
                .ToList();
        }

        // Normalize raw scores across all regions to 0-100 scale
        double maxRaw = rawScores.Values.DefaultIfEmpty(0).Max();
        double minRaw = rawScores.Values.DefaultIfEmpty(0).Min();
        double range = maxRaw - minRaw;

        var ranked = UncoveredRegions.Select(region =>
        {
            // Graceful degradation: when dataset is too small for high-signal segments,
            // use 50 (neutral) so FinalScore degrades to weighted NeedScore
            double successMatch = hasSignal && range > 0
                ? (rawScores[region.RegionCode] - minRaw) / range * 100.0
                : 50.0;

            double finalScore = 0.5 * region.NeedScore + 0.5 * successMatch;

            return new RegionRecommendation(
                RegionCode: region.RegionCode,
                RegionName: region.RegionName,
                IslandGroup: region.IslandGroup,
                NeedScore: region.NeedScore,
                SuccessMatchScore: Math.Round(successMatch, 1),
                FinalScore: Math.Round(finalScore, 1),
                Rank: 0, // assigned below
                SafetyFlag: region.RegionCode == "BARMM",
                TopMatchingSegments: topSegMap.TryGetValue(region.RegionCode, out var segs) ? segs : [],
                AiRationale: null
            );
        })
        .OrderByDescending(r => r.FinalScore)
        .ToList();

        // Assign ordinal rank
        return ranked.Select((r, i) => r with { Rank = i + 1 }).ToList();
    }

    /// <summary>Maps a segment label to the corresponding regional demographic percentage.</summary>
    private static double GetDemographicPct(RegionDemographic r, string segment) => segment switch
    {
        "Trafficked"      => r.TraffickingCasePct,
        "OSEC"            => r.OsaecCasePct,
        "Sexual Abuse"    => r.SexualAbuseCasePct,
        "Physical Abuse"  => r.PhysicalAbuseCasePct,
        "Child Labor"     => r.ChildLaborCasePct,
        "4Ps Household"   => r.FourPsEnrollmentPct,
        "Solo Parent"     => r.SoloParentHouseholdPct,
        "Indigenous"      => r.IndigenousPct,
        "Informal Settler"=> r.InformalSettlerPct,
        "Age 10-12"       => r.GirlsPct10to12,
        "Age 13-15"       => r.GirlsPct13to15,
        "Age 16-18"       => r.GirlsPct16to18,
        _                 => 0.0
    };

    // ── Stage 3: Gemini API synthesis ────────────────────────────────────────
    // Uses the same Gemini:ApiKey already configured for AudioAutofillService.
    // Model: gemini-2.5-flash (fast, cheap, JSON-constrained output via responseSchema).

    private const string GeminiModel = "gemini-2.5-flash";

    /// <summary>
    /// Enriches top-3 regions with AI-generated rationale in-place.
    /// Returns the overall insight string (or null on failure).
    /// Failures are swallowed — the pipeline degrades gracefully without AI text.
    /// </summary>
    private async Task<string?> EnrichWithAiAsync(List<RegionRecommendation> regions, SuccessProfile profile)
    {
        var apiKey = config["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogWarning("Gemini:ApiKey not configured — skipping AI enrichment.");
            return null;
        }

        var topSegments = profile.ByCaseSubcategory
            .Concat(profile.ByAgeGroup)
            .Concat(profile.ByFamilyProfile)
            .Where(s => s.Count >= 3)
            .OrderByDescending(s => s.LiftOverBaseline)
            .Take(3)
            .Select(s => new { s.Segment, SuccessRate = s.SuccessRate, Lift = s.LiftOverBaseline })
            .ToList();

        var regionSummary = regions.Select(r => new
        {
            r.RegionCode, r.RegionName, r.NeedScore,
            r.SuccessMatchScore, r.FinalScore,
            r.Rank, r.TopMatchingSegments, r.SafetyFlag
        });

        var prompt = $$"""
            You are an expansion planning analyst for Lunas, a Christian nonprofit that operates safehouses for girl survivors of sexual abuse and trafficking in the Philippines. Analyze the resident outcome data and regional demographics below to write expansion rationale. Be specific, evidence-based, and compassionate. Acknowledge small sample sizes honestly.

            Success Profile:
            - Residents analyzed: {{profile.TotalResidentsAnalyzed}}
            - Overall success rate: {{profile.OverallSuccessRate:P0}}
            - Top performing segments: {{JsonSerializer.Serialize(topSegments, JsonOpts)}}

            All {{regions.Count}} ranked regions by FinalScore:
            {{JsonSerializer.Serialize(regionSummary, JsonOpts)}}

            For each region write a 2-3 sentence rationale explaining why it is recommended or deprioritized, focusing on the match between Lunas's demonstrated strengths and the regional need profile. Also write one overall insight sentence summarizing what this analysis reveals about Lunas's expansion strategy.
            """;

        // Use Gemini's responseSchema to enforce exact JSON structure — no markdown parsing needed
        var requestBody = new
        {
            systemInstruction = new
            {
                parts = new[] { new { text = "You are an expansion planning analyst for Lunas, a Christian nonprofit that operates safehouses for girl survivors of abuse and trafficking in the Philippines. Output only valid JSON matching the provided schema." } }
            },
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = new
            {
                temperature = 0,
                responseMimeType = "application/json",
                responseSchema = new
                {
                    type = "OBJECT",
                    properties = new
                    {
                        recommendations = new
                        {
                            type = "ARRAY",
                            items = new
                            {
                                type = "OBJECT",
                                properties = new
                                {
                                    regionCode = new { type = "STRING" },
                                    rationale  = new { type = "STRING" }
                                },
                                required = new[] { "regionCode", "rationale" }
                            }
                        },
                        overallInsight = new { type = "STRING" }
                    },
                    required = new[] { "recommendations", "overallInsight" }
                }
            }
        };

        try
        {
            var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{GeminiModel}:generateContent?key={apiKey}";
            var payload = new StringContent(JsonSerializer.Serialize(requestBody, JsonOpts), Encoding.UTF8, "application/json");
            var response = await client.PostAsync(url, payload);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                logger.LogWarning("Gemini API returned {Status}: {Body}", response.StatusCode, err[..Math.Min(err.Length, 200)]);
                return null;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var apiDoc = JsonDocument.Parse(responseJson);

            // Gemini response: candidates[0].content.parts[0].text — already valid JSON due to responseSchema
            var text = apiDoc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "";

            using var geminiDoc = JsonDocument.Parse(text);
            var root = geminiDoc.RootElement;

            if (root.TryGetProperty("recommendations", out var recs))
            {
                foreach (var rec in recs.EnumerateArray())
                {
                    var code      = rec.TryGetProperty("regionCode", out var c) ? c.GetString() : null;
                    var rationale = rec.TryGetProperty("rationale",  out var r) ? r.GetString() : null;
                    if (code == null || rationale == null) continue;
                    var idx = regions.FindIndex(x => x.RegionCode == code);
                    if (idx >= 0)
                        regions[idx] = regions[idx] with { AiRationale = rationale };
                }
            }

            return root.TryGetProperty("overallInsight", out var insight)
                ? insight.GetString()
                : null;
        }
        catch (TaskCanceledException ex)
        {
            logger.LogWarning(ex, "Gemini API call timed out.");
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "Gemini API network error.");
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "Failed to parse Gemini API response JSON.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unexpected error during AI enrichment.");
        }

        return null;
    }

    // ── Caching helpers ────────────────────────────────────────────────────────

    private async Task<ExpansionRecommendationDto?> GetCachedAsync()
    {
        var cutoff = DateTime.UtcNow.AddHours(-24);

        var cached = await db.PipelineResults
            .Where(p => p.PipelineName == "ExpansionRecommendation"
                     && p.EntityType == "Philippines"
                     && p.GeneratedAt > cutoff)
            .OrderByDescending(p => p.GeneratedAt)
            .FirstOrDefaultAsync();

        if (cached?.DetailsJson == null) return null;

        try
        {
            return JsonSerializer.Deserialize<ExpansionRecommendationDto>(cached.DetailsJson, JsonOpts);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to deserialize cached ExpansionRecommendation result.");
            return null;
        }
    }

    private async Task PersistAsync(ExpansionRecommendationDto result)
    {
        try
        {
            // PipelineResult.PipelineResultId has ValueGeneratedNever() in AppDbContext —
            // assign MAX+1 to satisfy the PK constraint without a schema migration.
            var maxId = await db.PipelineResults.AnyAsync()
                ? await db.PipelineResults.MaxAsync(p => p.PipelineResultId)
                : 0;

            var record = new PipelineResult
            {
                PipelineResultId = maxId + 1,
                PipelineName     = "ExpansionRecommendation",
                ResultType       = "Analysis",
                EntityType       = "Philippines",
                EntityId         = null,
                Score            = null,
                Label            = $"Top: {result.RankedRegions.FirstOrDefault()?.RegionName ?? "N/A"}",
                DetailsJson      = JsonSerializer.Serialize(result, JsonOpts),
                GeneratedAt      = result.GeneratedAt,
            };

            db.PipelineResults.Add(record);
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Cache write failure must not break the API response
            logger.LogWarning(ex, "Failed to persist ExpansionRecommendation to cache.");
        }
    }
}
