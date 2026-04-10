using Backend.Data;
using Backend.Contracts;
using Backend.Infrastructure;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Backend.Controllers;

[ApiController]
[Route("api/home-visitations")]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
public class HomeVisitationsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? residentId,
        [FromQuery] string? visitType,
        [FromQuery] bool? followUpNeeded)
    {
        var query = db.HomeVisitations.AsQueryable();
        if (residentId.HasValue) query = query.Where(v => v.ResidentId == residentId);
        if (!string.IsNullOrEmpty(visitType)) query = query.Where(v => v.VisitType == visitType);
        if (followUpNeeded.HasValue) query = query.Where(v => v.FollowUpNeeded == followUpNeeded);
        return Ok(await query.OrderBy(v => v.VisitationId).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var visitation = await db.HomeVisitations.FindAsync(id);
        return visitation is null ? NotFound() : Ok(visitation);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HomeVisitationWriteRequest request)
    {
        if (!RequestValidation.TryValidate(request, out var validationProblem, "Unable to save visit."))
            return BadRequest(validationProblem);

        var visitation = new HomeVisitation();
        CrudWriteMapper.ApplyHomeVisitation(visitation, request);
        visitation.VisitationId = await db.HomeVisitations.AnyAsync() ? await db.HomeVisitations.MaxAsync(v => v.VisitationId) + 1 : 1;
        db.HomeVisitations.Add(visitation);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = visitation.VisitationId }, visitation);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        if (!JsonRequestPatch<HomeVisitationWriteRequest>.TryParse(body, out var patch, out var parseProblem))
            return BadRequest(parseProblem);
        if (!RequestValidation.TryValidate(patch!.Model, out var validationProblem, "Unable to update visit."))
            return BadRequest(validationProblem);

        var existing = await db.HomeVisitations.FindAsync(id);
        if (existing is null) return NotFound();

        CrudWriteMapper.ApplyHomeVisitation(existing, patch.Model, patch);
        existing.VisitationId = id;
        await db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var visitation = await db.HomeVisitations.FindAsync(id);
        if (visitation is null) return NotFound();
        db.HomeVisitations.Remove(visitation);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
