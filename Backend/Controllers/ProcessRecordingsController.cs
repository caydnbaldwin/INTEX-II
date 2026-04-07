using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/process-recordings")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class ProcessRecordingsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId)
    {
        var query = db.ProcessRecordings.AsQueryable();
        if (residentId.HasValue) query = query.Where(r => r.ResidentId == residentId);
        return Ok(await query.OrderByDescending(r => r.SessionDate).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var recording = await db.ProcessRecordings.FindAsync(id);
        return recording is null ? NotFound() : Ok(recording);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProcessRecording recording)
    {
        recording.RecordingId = await db.ProcessRecordings.AnyAsync()
            ? await db.ProcessRecordings.MaxAsync(r => r.RecordingId) + 1
            : 1;
        db.ProcessRecordings.Add(recording);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = recording.RecordingId }, recording);
    }
}
