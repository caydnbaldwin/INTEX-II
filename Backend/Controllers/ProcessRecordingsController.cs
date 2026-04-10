using Backend.Data;
using Backend.Contracts;
using Backend.Infrastructure;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.Json;

namespace Backend.Controllers;

[ApiController]
[Route("api/process-recordings")]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
public class ProcessRecordingsController(
    AppDbContext db,
    IAudioAutofillService audioAutofillService,
    ILogger<ProcessRecordingsController> logger) : ControllerBase
{
    private const long MaxAudioSizeBytes = 25 * 1024 * 1024; // 25 MB

    private static readonly HashSet<string> AllowedAudioContentTypes =
    [
        "audio/mpeg", "audio/mp3", "audio/mp4", "audio/wav",
        "audio/x-wav", "audio/webm", "audio/ogg", "audio/x-m4a"
    ];

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
    [Authorize(Policy = AuthPolicies.StaffOrAdmin)]
    public async Task<IActionResult> Create([FromBody] ProcessRecordingWriteRequest request)
    {
        if (!RequestValidation.TryValidate(request, out var validationProblem, "Unable to save session."))
            return BadRequest(validationProblem);

        var recording = new ProcessRecording();
        CrudWriteMapper.ApplyProcessRecording(recording, request);
        recording.RecordingId = await db.ProcessRecordings.AnyAsync()
            ? await db.ProcessRecordings.MaxAsync(r => r.RecordingId) + 1
            : 1;
        db.ProcessRecordings.Add(recording);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = recording.RecordingId }, recording);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.StaffOrAdmin)]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        if (!JsonRequestPatch<ProcessRecordingWriteRequest>.TryParse(body, out var patch, out var parseProblem))
            return BadRequest(parseProblem);
        if (!RequestValidation.TryValidate(patch!.Model, out var validationProblem, "Unable to update session."))
            return BadRequest(validationProblem);

        var existing = await db.ProcessRecordings.FindAsync(id);
        if (existing is null) return NotFound();

        CrudWriteMapper.ApplyProcessRecording(existing, patch.Model, patch);
        existing.RecordingId = id;
        await db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var recording = await db.ProcessRecordings.FindAsync(id);
        if (recording is null) return NotFound();
        db.ProcessRecordings.Remove(recording);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("autofill-from-audio")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<IActionResult> AutofillFromAudio(
        [FromForm] IFormFile? audio,
        CancellationToken cancellationToken)
    {
        if (audio is null || audio.Length == 0)
            return BadRequest("Audio file is required.");

        if (audio.Length > MaxAudioSizeBytes)
            return BadRequest("Audio file exceeds 25MB limit.");

        if (!AllowedAudioContentTypes.Contains(audio.ContentType ?? string.Empty))
            return BadRequest("Unsupported audio format.");

        var startedAt = DateTime.UtcNow;
        try
        {
            await using var ms = new MemoryStream();
            await audio.CopyToAsync(ms, cancellationToken);

            var result = await audioAutofillService.GenerateProcessRecordingAutofillAsync(
                ms.ToArray(),
                audio.FileName,
                cancellationToken);

            logger.LogInformation(
                "Audio autofill completed in {Ms}ms (confidence: {Confidence:P0})",
                (DateTime.UtcNow - startedAt).TotalMilliseconds,
                result.Confidence ?? 0);

            return Ok(result);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(408);
        }
        catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.TooManyRequests)
        {
            logger.LogWarning(
                ex,
                "Gemini quota exceeded during audio autofill after {Ms}ms",
                (DateTime.UtcNow - startedAt).TotalMilliseconds);
            return StatusCode(429, "AI quota exceeded. Please try again later.");
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Audio autofill failed after {Ms}ms",
                (DateTime.UtcNow - startedAt).TotalMilliseconds);
            return StatusCode(502, "Unable to auto-fill from audio.");
        }
    }
}
