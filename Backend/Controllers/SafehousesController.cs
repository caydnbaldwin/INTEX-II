using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/safehouses")]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
public class SafehousesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await db.Safehouses.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var safehouse = await db.Safehouses.FindAsync(id);
        return safehouse is null ? NotFound() : Ok(safehouse);
    }

    [HttpGet("{id}/metrics")]
    public async Task<IActionResult> GetMetrics(int id)
    {
        var metrics = await db.SafehouseMonthlyMetrics
            .Where(m => m.SafehouseId == id)
            .OrderBy(m => m.MonthStart)
            .ToListAsync();
        return Ok(metrics);
    }

    [HttpGet("{id}/residents")]
    public async Task<IActionResult> GetResidents(int id)
    {
        var residents = await db.Residents
            .Where(r => r.SafehouseId == id)
            .ToListAsync();
        return Ok(residents);
    }

    [HttpGet("{id}/incidents")]
    public async Task<IActionResult> GetIncidents(int id)
    {
        var incidents = await db.IncidentReports
            .Where(i => i.SafehouseId == id)
            .OrderByDescending(i => i.IncidentDate)
            .ToListAsync();
        return Ok(incidents);
    }

    [HttpGet("occupancy")]
    public async Task<IActionResult> GetOccupancy()
    {
        var data = await db.Safehouses
            .Select(s => new
            {
                safehouseId = s.SafehouseId,
                name = s.Name,
                region = s.Region,
                capacityGirls = s.CapacityGirls,
                currentOccupancy = s.CurrentOccupancy
            })
            .ToListAsync();
        return Ok(data);
    }
}
