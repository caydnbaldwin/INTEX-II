namespace Backend.Models;

public class OutreachEmailLog
{
    public int OutreachEmailLogId { get; set; }
    public int SupporterId { get; set; }
    public string DonorName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TemplateId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Status { get; set; } = "sent";
    public DateTime SentAt { get; set; }
}
