using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public partial class ResendEmailService(
    AppDbContext db,
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<ResendEmailService> logger) : IEmailService
{
    private const string ResendApiUrl = "https://api.resend.com/emails";

    public async Task<EmailSendResult> SendEmailAsync(int supporterId, string? templateOverride = null)
    {
        var supporter = await db.Supporters.FindAsync(supporterId);
        if (supporter is null)
            return new EmailSendResult(false, Error: "Supporter not found");
        if (string.IsNullOrWhiteSpace(supporter.Email))
            return new EmailSendResult(false, Error: "No email on file");

        // Compute RFM
        var donations = await db.Donations
            .Where(d => d.SupporterId == supporterId && d.DonationType == "Monetary")
            .ToListAsync();

        var frequency = donations.Count;
        var recencyDays = donations.Count > 0
            ? (int)(DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - donations.Max(d => d.DonationDate ?? DateOnly.FromDateTime(DateTime.UtcNow)).DayNumber)
            : 999;

        // Select template
        var templateId = templateOverride
            ?? (recencyDays > 90 ? "win_back"
                : frequency >= 3 ? "loyal"
                : "first_time");

        var template = await db.EmailTemplates.FindAsync(templateId);
        if (template is null)
            return new EmailSendResult(false, Error: $"Template '{templateId}' not found");

        // Build context
        var context = await BuildContextAsync(supporter, donations, frequency, recencyDays);

        // Render
        var subject = RenderTemplate(template.Subject, context);
        var bodyText = RenderTemplate(template.Body, context);
        var bodyHtml = TextToHtml(bodyText);

        // Determine recipient
        var devMode = configuration.GetValue<bool>("Email:DevMode");
        var recipient = devMode
            ? configuration["Email:DevRecipient"] ?? "testadmin@lunas-project.site"
            : supporter.Email;

        // Send via Resend
        var apiKey = configuration["Resend:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            // No API key — log the email but don't actually send
            logger.LogWarning("Resend API key not configured; logging email without sending");
            await LogEmail(supporterId, supporter.DisplayName ?? "Unknown", supporter.Email, templateId, subject, bodyText, "logged");
            return new EmailSendResult(true, MessageId: "no-api-key-configured");
        }

        try
        {
            var fromName = configuration["Email:FromName"] ?? "Luna's Project";
            var fromAddress = configuration["Email:FromAddress"] ?? "noreply@lunas-project.site";

            var payload = new
            {
                from = $"{fromName} <{fromAddress}>",
                to = new[] { recipient },
                subject,
                html = bodyHtml,
                text = bodyText.Replace("{{donate_button}}", "Donate here: https://lunas-project.site/donate"),
            };

            var request = new HttpRequestMessage(HttpMethod.Post, ResendApiUrl);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Resend API error {Status}: {Body}", response.StatusCode, responseBody);
                await LogEmail(supporterId, supporter.DisplayName ?? "Unknown", supporter.Email, templateId, subject, bodyText, "failed");
                return new EmailSendResult(false, Error: $"Resend API error: {response.StatusCode}");
            }

            var messageId = JsonDocument.Parse(responseBody).RootElement.TryGetProperty("id", out var idProp)
                ? idProp.GetString() : null;

            await LogEmail(supporterId, supporter.DisplayName ?? "Unknown", supporter.Email, templateId, subject, bodyText, "sent");
            logger.LogInformation("Email sent to {Email} (template: {Template}, messageId: {MessageId})", recipient, templateId, messageId);

            return new EmailSendResult(true, MessageId: messageId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email}", recipient);
            await LogEmail(supporterId, supporter.DisplayName ?? "Unknown", supporter.Email, templateId, subject, bodyText, "failed");
            return new EmailSendResult(false, Error: ex.Message);
        }
    }

    public async Task<EmailPreview> RenderPreviewAsync(string templateId, int? supporterId = null)
    {
        var template = await db.EmailTemplates.FindAsync(templateId);
        if (template is null)
            return new EmailPreview("Template not found", "", "");

        // Use a real donor if provided, otherwise pick the first with donations
        var sid = supporterId
            ?? await db.Donations
                .Where(d => d.DonationType == "Monetary" && d.SupporterId != null)
                .Select(d => d.SupporterId!.Value)
                .FirstOrDefaultAsync();

        var supporter = sid > 0 ? await db.Supporters.FindAsync(sid) : null;
        if (supporter is null)
            return new EmailPreview(
                RenderTemplate(template.Subject, SampleContext()),
                RenderTemplate(template.Body, SampleContext()),
                "Sample Donor"
            );

        var donations = await db.Donations
            .Where(d => d.SupporterId == sid && d.DonationType == "Monetary")
            .ToListAsync();
        var frequency = donations.Count;
        var recencyDays = donations.Count > 0
            ? (int)(DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - donations.Max(d => d.DonationDate ?? DateOnly.FromDateTime(DateTime.UtcNow)).DayNumber)
            : 999;
        var context = await BuildContextAsync(supporter, donations, frequency, recencyDays);

        return new EmailPreview(
            RenderTemplate(template.Subject, context),
            RenderTemplate(template.Body, context),
            supporter.DisplayName ?? "Unknown"
        );
    }

    private async Task<Dictionary<string, string>> BuildContextAsync(
        Supporter supporter, List<Donation> donations, int frequency, int recencyDays)
    {
        var firstName = (supporter.FirstName ?? supporter.DisplayName ?? "Friend").Split(' ')[0];
        var monetaryTotal = donations.Sum(d => d.Amount ?? 0);
        var tenureDays = donations.Count > 0
            ? (double)(DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - donations.Min(d => d.DonationDate ?? DateOnly.FromDateTime(DateTime.UtcNow)).DayNumber)
            : 0;

        // Resolve program area from allocations
        var donationIds = donations.Select(d => (int?)d.DonationId).ToList();
        var programArea = await db.DonationAllocations
            .Where(a => donationIds.Contains(a.DonationId))
            .GroupBy(a => a.ProgramArea)
            .OrderByDescending(g => g.Sum(a => a.AmountAllocated ?? 0))
            .Select(g => g.Key)
            .FirstOrDefaultAsync() ?? "general operations";

        // Suggested amount
        var amounts = donations.Select(d => d.Amount ?? 0).Where(a => a > 0).OrderBy(a => a).ToList();
        decimal suggestedRaw;
        if (amounts.Count == 0) suggestedRaw = 500;
        else if (amounts.Count == 1) suggestedRaw = amounts[0] + 500;
        else
        {
            var idx = (int)(amounts.Count * 0.75);
            suggestedRaw = amounts[Math.Min(idx, amounts.Count - 1)];
        }
        var suggested = Math.Max(500, Math.Round(suggestedRaw / 500) * 500);

        return new Dictionary<string, string>
        {
            ["first_name"] = firstName,
            ["frequency"] = frequency.ToString(),
            ["program_area"] = programArea,
            ["recency_days"] = recencyDays.ToString(),
            ["tenure_years"] = (tenureDays / 365.0).ToString("F1"),
            ["monetary_total"] = $"PHP {monetaryTotal:N0}",
            ["suggested_amount"] = $"PHP {suggested:N0}",
            ["donate_button"] = "__DONATE_BUTTON__",
        };
    }

    private static Dictionary<string, string> SampleContext() => new()
    {
        ["first_name"] = "Maria",
        ["frequency"] = "5",
        ["program_area"] = "Education",
        ["recency_days"] = "30",
        ["tenure_years"] = "2.0",
        ["monetary_total"] = "PHP 15,000",
        ["suggested_amount"] = "PHP 2,500",
        ["donate_button"] = "__DONATE_BUTTON__",
    };

    private static string RenderTemplate(string template, Dictionary<string, string> context)
    {
        return PlaceholderRegex().Replace(template, match =>
        {
            var key = match.Groups[1].Value;
            return context.TryGetValue(key, out var val) ? val : match.Value;
        });
    }

    private static string TextToHtml(string text)
    {
        var parts = text.Split("__DONATE_BUTTON__");
        var sb = new StringBuilder();
        sb.Append("<div style=\"font-family: Georgia, serif; max-width: 640px; margin: 0 auto; line-height: 1.7; color: #1a1a2e;\">");
        for (var i = 0; i < parts.Length; i++)
        {
            sb.Append(System.Net.WebUtility.HtmlEncode(parts[i]).Replace("\n", "<br/>"));
            if (i < parts.Length - 1)
            {
                sb.Append("<br/><a href=\"https://lunas-project.site/donate\" style=\"background-color: #7C3AED; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;\">Donate Now</a><br/>");
            }
        }
        sb.Append("</div>");
        return sb.ToString();
    }

    private async Task LogEmail(int supporterId, string donorName, string email, string templateId, string subject, string body, string status)
    {
        db.OutreachEmailLogs.Add(new OutreachEmailLog
        {
            SupporterId = supporterId,
            DonorName = donorName,
            Email = email,
            TemplateId = templateId,
            Subject = subject,
            Body = body,
            Status = status,
            SentAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }

    [GeneratedRegex(@"\{\{(\w+)\}\}")]
    private static partial Regex PlaceholderRegex();
}
