using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/incidents")]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
public class IncidentsController(AppDbContext db) : ControllerBase
{
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] IncidentReport incident)
    {
        var existing = await db.IncidentReports.FindAsync(id);
        if (existing is null)
            return NotFound();

        db.Entry(existing).CurrentValues.SetValues(incident);
        existing.IncidentId = id;

        if (existing.Resolved == true)
        {
            existing.FollowUpRequired = false;
            existing.ResolutionDate ??= DateOnly.FromDateTime(DateTime.UtcNow);
        }
        else
        {
            existing.ResolutionDate = null;
        }

        await db.SaveChangesAsync();
        return Ok(existing);
    }
}
