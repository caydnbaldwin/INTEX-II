using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/supporters")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class SupportersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? type,
        [FromQuery] string? status,
        [FromQuery] string? search)
    {
        var query = db.Supporters.AsQueryable();
        if (!string.IsNullOrEmpty(type)) query = query.Where(s => s.SupporterType == type);
        if (!string.IsNullOrEmpty(status)) query = query.Where(s => s.Status == status);
        if (!string.IsNullOrEmpty(search)) query = query.Where(s =>
            (s.DisplayName != null && s.DisplayName.Contains(search)) ||
            (s.FirstName != null && s.FirstName.Contains(search)) ||
            (s.LastName != null && s.LastName.Contains(search)) ||
            (s.Email != null && s.Email.Contains(search)));
        return Ok(await query.OrderBy(s => s.SupporterId).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var supporter = await db.Supporters.FindAsync(id);
        return supporter is null ? NotFound() : Ok(supporter);
    }

    [HttpPost]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> Create([FromBody] Supporter supporter)
    {
        if (supporter.SupporterId == 0)
            supporter.SupporterId = await db.Supporters.AnyAsync() ? await db.Supporters.MaxAsync(s => s.SupporterId) + 1 : 1;
        supporter.CreatedAt = DateTime.UtcNow;
        db.Supporters.Add(supporter);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = supporter.SupporterId }, supporter);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] Supporter supporter)
    {
        var existing = await db.Supporters.FindAsync(id);
        if (existing is null) return NotFound();
        db.Entry(existing).CurrentValues.SetValues(supporter);
        existing.SupporterId = id; // Preserve ID
        await db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var supporter = await db.Supporters.FindAsync(id);
        if (supporter is null) return NotFound();
        db.Supporters.Remove(supporter);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/donations")]
    public async Task<IActionResult> GetDonations(int id)
    {
        var donations = await db.Donations
            .Where(d => d.SupporterId == id)
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();
        return Ok(donations);
    }
}
