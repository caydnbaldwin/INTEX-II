using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/pipeline-results")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class PipelineResultsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? pipeline)
    {
        var query = db.PipelineResults.AsQueryable();
        if (!string.IsNullOrEmpty(pipeline))
            query = query.Where(p => p.PipelineName == pipeline);
        return Ok(await query.OrderBy(p => p.PipelineResultId).ToListAsync());
    }

    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<IActionResult> GetByEntity(string entityType, int entityId)
    {
        var results = await db.PipelineResults
            .Where(p => p.EntityType == entityType && p.EntityId == entityId)
            .ToListAsync();
        return Ok(results);
    }

    [HttpGet("donor-churn")]
    public async Task<IActionResult> GetDonorChurn()
    {
        var results = await db.PipelineResults
            .Where(p => p.PipelineName == "DonorChurn" && p.ResultType == "Prediction")
            .ToListAsync();

        var supporterIds = results
            .Where(r => r.EntityId.HasValue)
            .Select(r => r.EntityId!.Value)
            .ToList();

        var supporters = await db.Supporters
            .Where(s => supporterIds.Contains(s.SupporterId))
            .ToDictionaryAsync(s => s.SupporterId);

        var joined = results.Select(r => new
        {
            r.PipelineResultId,
            r.EntityId,
            r.Score,
            r.Label,
            r.DetailsJson,
            Supporter = r.EntityId.HasValue && supporters.ContainsKey(r.EntityId.Value)
                ? new
                {
                    supporters[r.EntityId.Value].DisplayName,
                    supporters[r.EntityId.Value].Email,
                    supporters[r.EntityId.Value].SupporterType,
                    supporters[r.EntityId.Value].Status,
                    supporters[r.EntityId.Value].FirstDonationDate
                }
                : null
        });

        return Ok(joined.OrderByDescending(r => r.Score));
    }

    [HttpGet("resident-risk")]
    public async Task<IActionResult> GetResidentRisk()
    {
        var results = await db.PipelineResults
            .Where(p => p.PipelineName == "ResidentRisk" && p.ResultType == "Prediction")
            .ToListAsync();

        var residentIds = results
            .Where(r => r.EntityId.HasValue)
            .Select(r => r.EntityId!.Value)
            .ToList();

        var residents = await db.Residents
            .Where(r => residentIds.Contains(r.ResidentId))
            .ToDictionaryAsync(r => r.ResidentId);

        var joined = results.Select(r => new
        {
            r.PipelineResultId,
            r.EntityId,
            r.Score,
            r.Label,
            r.DetailsJson,
            Resident = r.EntityId.HasValue && residents.ContainsKey(r.EntityId.Value)
                ? new
                {
                    residents[r.EntityId.Value].CaseControlNo,
                    residents[r.EntityId.Value].InternalCode,
                    residents[r.EntityId.Value].SafehouseId,
                    residents[r.EntityId.Value].CaseStatus,
                    residents[r.EntityId.Value].CurrentRiskLevel,
                    residents[r.EntityId.Value].InitialRiskLevel
                }
                : null
        });

        return Ok(joined.OrderByDescending(r => r.Score));
    }

    [HttpGet("campaign-roi")]
    public async Task<IActionResult> GetCampaignRoi()
    {
        var results = await db.PipelineResults
            .Where(p => p.PipelineName == "CampaignROI")
            .OrderByDescending(p => p.Score)
            .ToListAsync();
        return Ok(results);
    }

    [HttpGet("social-media-drivers")]
    public async Task<IActionResult> GetSocialMediaDrivers()
    {
        var results = await db.PipelineResults
            .Where(p => p.PipelineName == "SocialMediaDriver")
            .OrderByDescending(p => p.Score)
            .ToListAsync();
        return Ok(results);
    }

    [HttpGet("education-progress")]
    public async Task<IActionResult> GetEducationProgress()
    {
        var results = await db.PipelineResults
            .Where(p => p.PipelineName == "EducationProgress" && p.ResultType == "Prediction")
            .ToListAsync();

        var residentIds = results
            .Where(r => r.EntityId.HasValue)
            .Select(r => r.EntityId!.Value)
            .ToList();

        var residents = await db.Residents
            .Where(r => residentIds.Contains(r.ResidentId))
            .ToDictionaryAsync(r => r.ResidentId);

        var joined = results.Select(r => new
        {
            r.PipelineResultId,
            r.EntityId,
            r.Score,
            r.Label,
            r.DetailsJson,
            Resident = r.EntityId.HasValue && residents.ContainsKey(r.EntityId.Value)
                ? new
                {
                    residents[r.EntityId.Value].CaseControlNo,
                    residents[r.EntityId.Value].InternalCode,
                    residents[r.EntityId.Value].SafehouseId
                }
                : null
        });

        return Ok(joined.OrderByDescending(r => r.Score));
    }

    [HttpGet("visitation-outcome")]
    public async Task<IActionResult> GetVisitationOutcome()
    {
        var results = await db.PipelineResults
            .Where(p => p.PipelineName == "VisitationOutcome" && p.ResultType == "Prediction")
            .ToListAsync();

        var residentIds = results
            .Where(r => r.EntityId.HasValue)
            .Select(r => r.EntityId!.Value)
            .ToList();

        var residents = await db.Residents
            .Where(r => residentIds.Contains(r.ResidentId))
            .ToDictionaryAsync(r => r.ResidentId);

        var joined = results.Select(r => new
        {
            r.PipelineResultId,
            r.EntityId,
            r.Score,
            r.Label,
            r.DetailsJson,
            Resident = r.EntityId.HasValue && residents.ContainsKey(r.EntityId.Value)
                ? new
                {
                    residents[r.EntityId.Value].CaseControlNo,
                    residents[r.EntityId.Value].InternalCode,
                    residents[r.EntityId.Value].SafehouseId
                }
                : null
        });

        return Ok(joined.OrderByDescending(r => r.Score));
    }

    [HttpGet("safehouse-performance")]
    public async Task<IActionResult> GetSafehousePerformance()
    {
        var results = await db.PipelineResults
            .Where(p => p.PipelineName == "SafehousePerformance")
            .ToListAsync();

        var safehouseIds = results
            .Where(r => r.EntityId.HasValue)
            .Select(r => r.EntityId!.Value)
            .ToList();

        var safehouses = await db.Safehouses
            .Where(s => safehouseIds.Contains(s.SafehouseId))
            .ToDictionaryAsync(s => s.SafehouseId);

        var joined = results.Select(r => new
        {
            r.PipelineResultId,
            r.EntityId,
            r.Score,
            r.Label,
            r.DetailsJson,
            Safehouse = r.EntityId.HasValue && safehouses.ContainsKey(r.EntityId.Value)
                ? new
                {
                    safehouses[r.EntityId.Value].Name,
                    safehouses[r.EntityId.Value].Region,
                    safehouses[r.EntityId.Value].CapacityGirls,
                    safehouses[r.EntityId.Value].CurrentOccupancy
                }
                : null
        });

        return Ok(joined.OrderByDescending(r => r.Score));
    }
}
