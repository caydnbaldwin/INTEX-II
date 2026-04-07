using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/residents")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class ResidentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] int? safehouseId,
        [FromQuery] string? riskLevel,
        [FromQuery] string? search)
    {
        var query = db.Residents.AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(r => r.CaseStatus == status);
        if (safehouseId.HasValue) query = query.Where(r => r.SafehouseId == safehouseId);
        if (!string.IsNullOrEmpty(riskLevel)) query = query.Where(r => r.CurrentRiskLevel == riskLevel);
        if (!string.IsNullOrEmpty(search)) query = query.Where(r =>
            (r.CaseControlNo != null && r.CaseControlNo.Contains(search)) ||
            (r.InternalCode != null && r.InternalCode.Contains(search)) ||
            (r.AssignedSocialWorker != null && r.AssignedSocialWorker.Contains(search)));
        return Ok(await query.OrderBy(r => r.ResidentId).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var resident = await db.Residents.FindAsync(id);
        return resident is null ? NotFound() : Ok(resident);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Resident resident)
    {
        // Auto-assign ID if not provided
        if (resident.ResidentId == 0)
            resident.ResidentId = await db.Residents.AnyAsync() ? await db.Residents.MaxAsync(r => r.ResidentId) + 1 : 1;
        resident.CreatedAt = DateTime.UtcNow;
        db.Residents.Add(resident);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = resident.ResidentId }, resident);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Resident resident)
    {
        var existing = await db.Residents.FindAsync(id);
        if (existing is null) return NotFound();
        db.Entry(existing).CurrentValues.SetValues(resident);
        existing.ResidentId = id; // Preserve ID
        await db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var resident = await db.Residents.FindAsync(id);
        if (resident is null) return NotFound();
        db.Residents.Remove(resident);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/education-records")]
    public async Task<IActionResult> GetEducationRecords(int id)
    {
        var records = await db.EducationRecords
            .Where(e => e.ResidentId == id)
            .OrderByDescending(e => e.RecordDate)
            .ToListAsync();
        return Ok(records);
    }

    [HttpGet("{id}/health-records")]
    public async Task<IActionResult> GetHealthRecords(int id)
    {
        var records = await db.HealthWellbeingRecords
            .Where(h => h.ResidentId == id)
            .OrderByDescending(h => h.RecordDate)
            .ToListAsync();
        return Ok(records);
    }

    [HttpGet("{id}/incident-reports")]
    public async Task<IActionResult> GetIncidentReports(int id)
    {
        var reports = await db.IncidentReports
            .Where(i => i.ResidentId == id)
            .OrderByDescending(i => i.IncidentDate)
            .ToListAsync();
        return Ok(reports);
    }

    [HttpGet("{id}/intervention-plans")]
    public async Task<IActionResult> GetInterventionPlans(int id)
    {
        var plans = await db.InterventionPlans
            .Where(p => p.ResidentId == id)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(plans);
    }
}
