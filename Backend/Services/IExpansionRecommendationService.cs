namespace Backend.Services;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/// <summary>
/// Success/lift metrics for a single resident segment (e.g. "Trafficked", "Age 13-15").
/// LiftOverBaseline = SuccessRate / OverallSuccessRate - 1; positive means above average.
/// </summary>
public record SegmentRate(
    string Segment,
    int Count,
    int SuccessCount,
    double SuccessRate,
    double LiftOverBaseline
);

/// <summary>
/// Aggregate profile of which resident profiles Lunas has historically served to
/// successful outcomes, broken down by five analytical dimensions.
/// </summary>
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

/// <summary>
/// A ranked expansion recommendation for one uncovered Philippine administrative region.
/// AiRationale is null when the Claude API call fails or is unconfigured.
/// </summary>
public record RegionRecommendation(
    string RegionCode,
    string RegionName,
    string IslandGroup,
    int NeedScore,
    double SuccessMatchScore,
    double FinalScore,
    int Rank,
    bool SafetyFlag,
    List<string> TopMatchingSegments,
    string? AiRationale
);

/// <summary>
/// Full pipeline output. Cached in PipelineResult table for 24 hours.
/// </summary>
public record ExpansionRecommendationDto(
    DateTime GeneratedAt,
    SuccessProfile SuccessProfile,
    List<RegionRecommendation> RankedRegions,
    string? OverallInsight
);

// ─── Interface ────────────────────────────────────────────────────────────────

public interface IExpansionRecommendationService
{
    /// <summary>Returns cached result if fresh (< 24 h), otherwise runs the full pipeline.</summary>
    Task<ExpansionRecommendationDto> GetRecommendationAsync();

    /// <summary>Always re-runs the pipeline regardless of cache age.</summary>
    Task<ExpansionRecommendationDto> RefreshRecommendationAsync();
}
