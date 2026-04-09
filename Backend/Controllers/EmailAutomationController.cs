using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/email-automation")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class EmailAutomationController(
    AppDbContext db,
    IEmailService emailService,
    IDonorScoringService scoringService) : ControllerBase
{
    // GET /api/email-automation/state
    [HttpGet("state")]
    public async Task<IActionResult> GetState()
    {
        var state = await db.AutomationStates.FindAsync(1);
        if (state is null)
            return Ok(new { enabled = false, lastRun = (DateTime?)null, emailsThisWeek = 0 });

        return Ok(new
        {
            state.Enabled,
            state.LastRun,
            NextRun = state.Enabled && state.LastRun.HasValue
                ? state.LastRun.Value.AddDays(7)
                : (DateTime?)null,
            state.EmailsThisWeek,
        });
    }

    // POST /api/email-automation/toggle
    [HttpPost("toggle")]
    public async Task<IActionResult> Toggle([FromBody] ToggleRequest request)
    {
        var state = await db.AutomationStates.FindAsync(1);
        if (state is null)
        {
            state = new AutomationState { Id = 1, Enabled = request.Enabled };
            db.AutomationStates.Add(state);
        }
        else
        {
            state.Enabled = request.Enabled;
        }
        await db.SaveChangesAsync();
        return Ok(new { state.Enabled });
    }

    // POST /api/email-automation/run-now
    [HttpPost("run-now")]
    public async Task<IActionResult> RunNow()
    {
        var candidates = await scoringService.GetUpgradeCandidatesAsync();
        var emailsSent = 0;

        foreach (var donor in candidates.Where(d => d.UpgradeScore != "Low"))
        {
            var recentlyEmailed = await db.OutreachEmailLogs
                .AnyAsync(e => e.SupporterId == donor.SupporterId
                    && e.SentAt > DateTime.UtcNow.AddDays(-30));
            if (recentlyEmailed) continue;

            var result = await emailService.SendEmailAsync(donor.SupporterId);
            if (result.Success) emailsSent++;
        }

        // Update state
        var state = await db.AutomationStates.FindAsync(1);
        if (state is not null)
        {
            state.LastRun = DateTime.UtcNow;
            state.EmailsThisWeek = emailsSent;
            await db.SaveChangesAsync();
        }

        return Ok(new { status = "completed", emailsSent, candidatesFound = candidates.Count });
    }

    // GET /api/email-automation/donors
    [HttpGet("donors")]
    public async Task<IActionResult> GetDonors()
    {
        var donors = await scoringService.GetUpgradeCandidatesAsync();
        return Ok(new { donors, total = donors.Count });
    }

    // GET /api/email-automation/email-log
    [HttpGet("email-log")]
    public async Task<IActionResult> GetEmailLog()
    {
        var logs = await db.OutreachEmailLogs
            .OrderByDescending(e => e.SentAt)
            .Take(50)
            .ToListAsync();
        return Ok(logs);
    }

    // POST /api/email-automation/send
    [HttpPost("send")]
    public async Task<IActionResult> SendEmail([FromBody] SendEmailRequest request)
    {
        var result = await emailService.SendEmailAsync(request.SupporterId, request.TemplateId);
        if (!result.Success)
            return BadRequest(new { result.Error });

        return Ok(new { success = true, result.MessageId });
    }

    // GET /api/email-automation/templates
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await db.EmailTemplates.OrderBy(t => t.TemplateId).ToListAsync();
        return Ok(templates);
    }

    // PUT /api/email-automation/templates/{id}
    [HttpPut("templates/{id}")]
    public async Task<IActionResult> UpdateTemplate(string id, [FromBody] UpdateTemplateRequest request)
    {
        var template = await db.EmailTemplates.FindAsync(id);
        if (template is null)
            return NotFound();

        template.Subject = request.Subject;
        template.Body = request.Body;
        template.LastEdited = DateTime.UtcNow;
        template.LastEditedBy = request.EditedBy ?? "admin";
        await db.SaveChangesAsync();

        return Ok(template);
    }

    // GET /api/email-automation/templates/{id}/preview
    [HttpGet("templates/{id}/preview")]
    public async Task<IActionResult> PreviewTemplate(string id)
    {
        var preview = await emailService.RenderPreviewAsync(id);
        return Ok(new
        {
            SubjectRendered = preview.Subject,
            BodyRendered = preview.Body,
            DonorUsed = new { DisplayName = preview.DonorName },
        });
    }
}

public record ToggleRequest(bool Enabled);
public record SendEmailRequest(int SupporterId, string? TemplateId = null);
public record UpdateTemplateRequest(string Subject, string Body, string? EditedBy = null);
