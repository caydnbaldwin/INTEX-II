namespace Backend.Services;

public record EmailSendResult(bool Success, string? MessageId = null, string? Error = null);

public record EmailPreview(string Subject, string Body, string DonorName);

public interface IEmailService
{
    Task<EmailSendResult> SendEmailAsync(int supporterId, string? templateOverride = null);
    Task<EmailPreview> RenderPreviewAsync(string templateId, int? supporterId = null);
}
