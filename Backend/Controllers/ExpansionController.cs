using Backend.Data;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/expansion")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class ExpansionController(IExpansionRecommendationService service) : ControllerBase
{
    /// <summary>
    /// Returns the expansion recommendation. Serves the 24-hour cached result if available;
    /// otherwise runs the full 3-stage pipeline (Stage 1: success profile, Stage 2: regional
    /// scoring, Stage 3: Claude API narrative synthesis).
    /// </summary>
    [HttpGet("recommendation")]
    public async Task<IActionResult> GetRecommendation()
        => Ok(await service.GetRecommendationAsync());

    /// <summary>
    /// Forces a fresh pipeline run regardless of cache age. Use when new resident data
    /// has been entered or when the admin wants an up-to-date analysis.
    /// </summary>
    [HttpPost("recommendation/refresh")]
    public async Task<IActionResult> RefreshRecommendation()
        => Ok(await service.RefreshRecommendationAsync());
}
