using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DbCheckController : ControllerBase
{
    private readonly AppDbContext _db;

    public DbCheckController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        // Attempt to fetch 1 row from each of the 17 tables.
        // Each entry is either the row data or an error message.
        var results = new Dictionary<string, object?>();

        results["safehouses"] = await TryFirst(_db.Safehouses);
        results["residents"] = await TryFirst(_db.Residents);
        results["donations"] = await TryFirst(_db.Donations);
        results["donation_allocations"] = await TryFirst(_db.DonationAllocations);
        results["education_records"] = await TryFirst(_db.EducationRecords);
        results["health_wellbeing_records"] = await TryFirst(_db.HealthWellbeingRecords);
        results["home_visitations"] = await TryFirst(_db.HomeVisitations);
        results["in_kind_donation_items"] = await TryFirst(_db.InKindDonationItems);
        results["incident_reports"] = await TryFirst(_db.IncidentReports);
        results["intervention_plans"] = await TryFirst(_db.InterventionPlans);
        results["partners"] = await TryFirst(_db.Partners);
        results["partner_assignments"] = await TryFirst(_db.PartnerAssignments);
        results["process_recordings"] = await TryFirst(_db.ProcessRecordings);
        results["public_impact_snapshots"] = await TryFirst(_db.PublicImpactSnapshots);
        results["safehouse_monthly_metrics"] = await TryFirst(_db.SafehouseMonthlyMetrics);
        results["social_media_posts"] = await TryFirst(_db.SocialMediaPosts);
        results["supporters"] = await TryFirst(_db.Supporters);

        return Ok(results);
    }

    private static async Task<object?> TryFirst<T>(IQueryable<T> set) where T : class
    {
        try
        {
            var row = await set.FirstOrDefaultAsync();
            return row as object ?? "empty table";
        }
        catch (Exception ex)
        {
            return $"error: {ex.Message}";
        }
    }
}
