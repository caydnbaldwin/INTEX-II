using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class WeeklyEmailHostedService(
    IServiceProvider serviceProvider,
    ILogger<WeeklyEmailHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Weekly email automation service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);

            try
            {
                using var scope = serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                var scoringService = scope.ServiceProvider.GetRequiredService<IDonorScoringService>();

                var state = await db.AutomationStates.FindAsync(new object[] { 1 }, stoppingToken);
                if (state is null || !state.Enabled) continue;

                // Only run once per week
                if (state.LastRun.HasValue && (DateTime.UtcNow - state.LastRun.Value).TotalDays < 7)
                    continue;

                logger.LogInformation("Running weekly donor email automation");

                var candidates = await scoringService.GetUpgradeCandidatesAsync();
                var emailsSent = 0;

                foreach (var donor in candidates.Where(d => d.UpgradeScore != "Low"))
                {
                    // Skip if emailed in last 30 days
                    var recentlyEmailed = await db.OutreachEmailLogs
                        .AnyAsync(e => e.SupporterId == donor.SupporterId
                            && e.SentAt > DateTime.UtcNow.AddDays(-30), stoppingToken);
                    if (recentlyEmailed) continue;

                    var result = await emailService.SendEmailAsync(donor.SupporterId);
                    if (result.Success) emailsSent++;
                }

                state.LastRun = DateTime.UtcNow;
                state.EmailsThisWeek = emailsSent;
                await db.SaveChangesAsync(stoppingToken);

                logger.LogInformation("Weekly automation complete: {EmailsSent} emails sent to {Candidates} candidates",
                    emailsSent, candidates.Count);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Error in weekly email automation");
            }
        }
    }
}
