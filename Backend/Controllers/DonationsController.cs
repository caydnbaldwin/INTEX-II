using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/donations")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class DonationsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? campaignName,
        [FromQuery] string? donationType,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to)
    {
        var query = db.Donations.AsQueryable();
        if (!string.IsNullOrEmpty(campaignName)) query = query.Where(d => d.CampaignName == campaignName);
        if (!string.IsNullOrEmpty(donationType)) query = query.Where(d => d.DonationType == donationType);
        if (from.HasValue) query = query.Where(d => d.DonationDate >= from);
        if (to.HasValue) query = query.Where(d => d.DonationDate <= to);
        return Ok(await query.OrderBy(d => d.DonationId).ToListAsync());
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var donations = await db.Donations.ToListAsync();
        var summary = new
        {
            totalCount = donations.Count,
            totalAmount = donations.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value),
            recurringCount = donations.Count(d => d.IsRecurring == true),
            campaigns = donations
                .GroupBy(d => d.CampaignName)
                .Select(g => new
                {
                    campaignName = g.Key,
                    count = g.Count(),
                    totalAmount = g.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value)
                })
                .ToList()
        };
        return Ok(summary);
    }

    [HttpGet("trends")]
    public async Task<IActionResult> GetTrends()
    {
        var donations = await db.Donations.Where(d => d.DonationDate.HasValue).ToListAsync();
        var trends = donations
            .GroupBy(d => new { d.DonationDate!.Value.Month, d.DonationDate!.Value.Year })
            .Select(g => new
            {
                month = g.Key.Month,
                year = g.Key.Year,
                totalAmount = g.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value),
                count = g.Count(),
                recurringCount = g.Count(d => d.IsRecurring == true)
            })
            .OrderBy(t => t.year).ThenBy(t => t.month)
            .ToList();
        return Ok(trends);
    }

    [HttpGet("channels")]
    public async Task<IActionResult> GetChannels()
    {
        var donations = await db.Donations.ToListAsync();
        var channels = donations
            .GroupBy(d => d.ChannelSource)
            .Select(g => new
            {
                channel = g.Key,
                count = g.Count(),
                totalAmount = g.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value)
            })
            .ToList();
        return Ok(channels);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var donation = await db.Donations.FindAsync(id);
        return donation is null ? NotFound() : Ok(donation);
    }

    [HttpPost]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> Create([FromBody] Donation donation)
    {
        if (donation.DonationId == 0)
            donation.DonationId = await db.Donations.AnyAsync() ? await db.Donations.MaxAsync(d => d.DonationId) + 1 : 1;
        db.Donations.Add(donation);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = donation.DonationId }, donation);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] Donation donation)
    {
        var existing = await db.Donations.FindAsync(id);
        if (existing is null) return NotFound();
        db.Entry(existing).CurrentValues.SetValues(donation);
        existing.DonationId = id; // Preserve ID
        await db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var donation = await db.Donations.FindAsync(id);
        if (donation is null) return NotFound();
        db.Donations.Remove(donation);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/allocations")]
    public async Task<IActionResult> GetAllocations(int id)
    {
        var allocations = await db.DonationAllocations
            .Where(a => a.DonationId == id)
            .ToListAsync();
        return Ok(allocations);
    }

    [HttpGet("{id}/in-kind-items")]
    public async Task<IActionResult> GetInKindItems(int id)
    {
        var items = await db.InKindDonationItems
            .Where(i => i.DonationId == id)
            .ToListAsync();
        return Ok(items);
    }
}
