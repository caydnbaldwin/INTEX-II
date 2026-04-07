using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class ReportsController(AppDbContext db) : ControllerBase
{
    [HttpGet("social-media/effectiveness")]
    public async Task<IActionResult> GetSocialMediaEffectiveness()
    {
        var data = await db.SocialMediaPosts
            .GroupBy(p => p.Platform)
            .Select(g => new
            {
                platform = g.Key,
                postCount = g.Count(),
                totalReferrals = g.Sum(p => p.DonationReferrals),
                totalEstimatedValue = g.Sum(p => p.EstimatedDonationValuePhp),
                avgEngagementRate = g.Average(p => p.EngagementRate)
            })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("outcomes/reintegration")]
    public async Task<IActionResult> GetReintegrationOutcomes()
    {
        var data = await db.Residents
            .Where(r => r.ReintegrationType != null)
            .GroupBy(r => r.ReintegrationType)
            .Select(g => new
            {
                reintegrationType = g.Key,
                count = g.Count()
            })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("risk-distribution")]
    public async Task<IActionResult> GetRiskDistribution()
    {
        var data = await db.Residents
            .Where(r => r.CaseStatus == "Active")
            .GroupBy(r => r.CurrentRiskLevel)
            .Select(g => new
            {
                riskLevel = g.Key,
                count = g.Count()
            })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("incident-summary")]
    public async Task<IActionResult> GetIncidentSummary()
    {
        var unresolvedCount = await db.IncidentReports
            .CountAsync(i => i.Resolved != true);

        var recentIncidents = await db.IncidentReports
            .OrderByDescending(i => i.IncidentDate)
            .Take(5)
            .Select(i => new
            {
                incidentId = i.IncidentId,
                residentId = i.ResidentId,
                safehouseId = i.SafehouseId,
                incidentDate = i.IncidentDate,
                incidentType = i.IncidentType,
                severity = i.Severity,
                resolved = i.Resolved
            })
            .ToListAsync();

        return Ok(new { unresolvedCount, recentIncidents });
    }
}
