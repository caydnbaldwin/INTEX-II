using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/home-visitations")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
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
    public async Task<IActionResult> Create([FromBody] HomeVisitation visitation)
    {
        if (visitation.VisitationId == 0)
            visitation.VisitationId = await db.HomeVisitations.AnyAsync() ? await db.HomeVisitations.MaxAsync(v => v.VisitationId) + 1 : 1;
        db.HomeVisitations.Add(visitation);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = visitation.VisitationId }, visitation);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] HomeVisitation visitation)
    {
        var existing = await db.HomeVisitations.FindAsync(id);
        if (existing is null) return NotFound();
        db.Entry(existing).CurrentValues.SetValues(visitation);
        existing.VisitationId = id; // Preserve ID
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
