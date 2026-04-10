using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace Backend.Tests.Unit;

public class DonorAndEmailServiceBatchTests
{
    [Fact]
    public async Task DonorScoringService_ReturnsEmpty_WhenNoMonetaryDonations()
    {
        await using var db = CreateDb(nameof(DonorScoringService_ReturnsEmpty_WhenNoMonetaryDonations));
        var service = new DonorScoringService(db);

        var result = await service.GetUpgradeCandidatesAsync();

        Assert.Empty(result);
    }

    [Fact]
    public async Task DonorScoringService_ComputesScores_AndMasksEmails()
    {
        await using var db = CreateDb(nameof(DonorScoringService_ComputesScores_AndMasksEmails));

        db.Supporters.AddRange(
            new Supporter { SupporterId = 1, DisplayName = "High Donor", Email = "highdonor@example.com", SupporterType = "Monetary" },
            new Supporter { SupporterId = 2, DisplayName = "Medium Donor", Email = "medium@example.com", SupporterType = "Monetary" },
            new Supporter { SupporterId = 3, DisplayName = "Low Donor", Email = "low@example.com", SupporterType = "Monetary" },
            new Supporter { SupporterId = 4, DisplayName = "Unknown Donor", Email = "", SupporterType = "Monetary" }
        );

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        // Supporter 1: high frequency candidate
        for (var i = 0; i < 6; i++)
        {
            db.Donations.Add(new Donation
            {
                DonationId = 100 + i,
                SupporterId = 1,
                DonationType = "Monetary",
                Amount = 100,
                DonationDate = today.AddDays(-i)
            });
        }

        // Supporter 2: medium frequency candidate
        db.Donations.Add(new Donation { DonationId = 201, SupporterId = 2, DonationType = "Monetary", Amount = 80, DonationDate = today.AddDays(-7) });
        db.Donations.Add(new Donation { DonationId = 202, SupporterId = 2, DonationType = "Monetary", Amount = 90, DonationDate = today.AddDays(-2) });

        // Supporter 3: old recency -> low
        db.Donations.Add(new Donation { DonationId = 301, SupporterId = 3, DonationType = "Monetary", Amount = 50, DonationDate = today.AddDays(-400) });
        db.Donations.Add(new Donation { DonationId = 302, SupporterId = 3, DonationType = "Monetary", Amount = 60, DonationDate = today.AddDays(-390) });

        // Supporter 4: invalid email format should pass through mask helper branch
        db.Donations.Add(new Donation { DonationId = 401, SupporterId = 4, DonationType = "Monetary", Amount = 70, DonationDate = today.AddDays(-10) });
        db.Donations.Add(new Donation { DonationId = 402, SupporterId = 4, DonationType = "Monetary", Amount = 70, DonationDate = today.AddDays(-3) });

        await db.SaveChangesAsync();

        var service = new DonorScoringService(db);
        var result = await service.GetUpgradeCandidatesAsync();

        Assert.Equal(4, result.Count);
        Assert.Contains(result, r => r.SupporterId == 2 && r.UpgradeScore == "Medium");
        Assert.Contains(result, r => r.SupporterId == 1 && r.UpgradeScore == "Low");
        Assert.Contains(result, r => r.SupporterId == 3 && r.UpgradeScore == "Low");
        Assert.Contains(result, r => r.SupporterId == 1 && r.EmailMasked.StartsWith("hi", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ResendEmailService_ReturnsErrors_ForMissingSupporterOrEmail()
    {
        await using var db = CreateDb(nameof(ResendEmailService_ReturnsErrors_ForMissingSupporterOrEmail));
        db.Supporters.Add(new Supporter { SupporterId = 10, DisplayName = "No Email", Email = null });
        await db.SaveChangesAsync();

        var service = CreateEmailService(db, includeApiKey: false);

        var missing = await service.SendEmailAsync(9999);
        var noEmail = await service.SendEmailAsync(10);

        Assert.False(missing.Success);
        Assert.Contains("Supporter not found", missing.Error ?? string.Empty);
        Assert.False(noEmail.Success);
        Assert.Contains("No email on file", noEmail.Error ?? string.Empty);
    }

    [Fact]
    public async Task ResendEmailService_LogsWithoutSending_WhenApiKeyMissing()
    {
        await using var db = CreateDb(nameof(ResendEmailService_LogsWithoutSending_WhenApiKeyMissing));

        db.Supporters.Add(new Supporter
        {
            SupporterId = 20,
            DisplayName = "Email Target",
            FirstName = "Email",
            Email = "email.target@test.local"
        });
        db.Donations.Add(new Donation
        {
            DonationId = 2101,
            SupporterId = 20,
            DonationType = "Monetary",
            Amount = 100,
            DonationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-15))
        });
        await db.SaveChangesAsync();

        var service = CreateEmailService(db, includeApiKey: false);
        var result = await service.SendEmailAsync(20, "first_time");

        Assert.True(result.Success);
        Assert.Equal("no-api-key-configured", result.MessageId);

        var log = await db.OutreachEmailLogs.OrderByDescending(l => l.OutreachEmailLogId).FirstOrDefaultAsync();
        Assert.NotNull(log);
        Assert.Equal("logged", log!.Status);
        Assert.Equal(20, log.SupporterId);
    }

    [Fact]
    public async Task ResendEmailService_RenderPreview_CoversTemplateBranches()
    {
        await using var db = CreateDb(nameof(ResendEmailService_RenderPreview_CoversTemplateBranches));
        var service = CreateEmailService(db, includeApiKey: false);

        var missingTemplate = await service.RenderPreviewAsync("not-found");
        Assert.Equal("Template not found", missingTemplate.Subject);

        db.EmailTemplates.Add(new EmailTemplate
        {
            TemplateId = "custom_preview",
            Name = "Loyal",
            Description = "desc",
            Trigger = "freq>=3",
            Subject = "Hello {{first_name}}",
            Body = "Body {{program_area}} {{donate_button}}"
        });
        await db.SaveChangesAsync();

        var samplePreview = await service.RenderPreviewAsync("custom_preview");
        Assert.Contains("Maria", samplePreview.Subject);

        db.Supporters.Add(new Supporter { SupporterId = 30, DisplayName = "Real Donor", FirstName = "Real", Email = "real@test.local" });
        db.Donations.Add(new Donation { DonationId = 3001, SupporterId = 30, DonationType = "Monetary", Amount = 500, DonationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-3)) });
        await db.SaveChangesAsync();

        var realPreview = await service.RenderPreviewAsync("custom_preview", 30);
        Assert.Contains("Real", realPreview.Subject);
    }

    [Fact]
    public void ChatValidationService_StripsUnknownTags_AndKeepsKnownTags()
    {
        var service = new ChatValidationService();
        var refs = new List<RecordReference>
        {
            new("resident", 1, "Resident 1", "/admin/caseload?resident=1"),
            new("supporter", 2, "Supporter 2", "/admin/donors?donor=2")
        };

        var answer = "Check [[resident:1]], then [[supporter:2]], ignore [[resident:999]].";
        var validated = service.ValidateAndStrip(answer, refs);

        Assert.Contains("[[resident:1]]", validated);
        Assert.Contains("[[supporter:2]]", validated);
        Assert.DoesNotContain("[[resident:999]]", validated);
    }

    private static AppDbContext CreateDb(string name)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"{name}_{Guid.NewGuid():N}")
            .Options;

        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    private static ResendEmailService CreateEmailService(AppDbContext db, bool includeApiKey)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Email:DevMode"] = "false",
            ["Email:FromName"] = "Lunas",
            ["Email:FromAddress"] = "noreply@test.local",
            ["Resend:ApiKey"] = includeApiKey ? "test-key" : null
        };

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        var httpClient = new HttpClient();
        return new ResendEmailService(db, httpClient, config, NullLogger<ResendEmailService>.Instance);
    }
}
