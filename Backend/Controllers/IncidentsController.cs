using Backend.Data;
using Backend.Contracts;
using Backend.Infrastructure;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Backend.Controllers;

[ApiController]
[Route("api/incidents")]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
public class IncidentsController(AppDbContext db) : ControllerBase
{
    [HttpPut("{id}")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        if (!JsonRequestPatch<IncidentWriteRequest>.TryParse(body, out var patch, out var parseProblem))
            return BadRequest(parseProblem);
        if (!RequestValidation.TryValidate(patch!.Model, out var validationProblem, "Unable to update incident."))
            return BadRequest(validationProblem);

        var existing = await db.IncidentReports.FindAsync(id);
        if (existing is null)
            return NotFound();

        CrudWriteMapper.ApplyIncident(existing, patch.Model, patch);
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
