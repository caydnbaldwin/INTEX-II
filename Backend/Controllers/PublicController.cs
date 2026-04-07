using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController(AppDbContext db) : ControllerBase
{
    [HttpGet("impact-snapshots")]
    [AllowAnonymous]
    public async Task<IActionResult> GetImpactSnapshots()
    {
        var snapshots = await db.PublicImpactSnapshots
            .Where(s => s.IsPublished == true)
            .OrderByDescending(s => s.SnapshotDate)
            .ToListAsync();
        return Ok(snapshots);
    }

    [HttpGet("impact-stats")]
    [AllowAnonymous]
    public async Task<IActionResult> GetImpactStats()
    {
        var totalResidents = await db.Residents.CountAsync();

        var reintegrationRate = totalResidents > 0
            ? (double)await db.Residents.CountAsync(r =>
                r.ReintegrationType != null && r.ReintegrationStatus == "Completed")
              / totalResidents * 100
            : 0;

        return Ok(new
        {
            girlsServed = totalResidents,
            activeResidents = await db.Residents.CountAsync(r => r.CaseStatus == "Active"),
            safehousesOperating = await db.Safehouses.CountAsync(s => s.Status == "Active"),
            regionsServed = await db.Safehouses.Select(s => s.Region).Distinct().CountAsync(),
            totalCounselingSessions = await db.ProcessRecordings.CountAsync(),
            totalHomeVisitations = await db.HomeVisitations.CountAsync(),
            reintegrationRate = Math.Round(reintegrationRate, 2),
            totalDonationAmount = await db.Donations.Where(d => d.Amount != null).SumAsync(d => d.Amount),
            totalDonors = await db.Donations.Select(d => d.SupporterId).Distinct().CountAsync()
        });
    }
}
