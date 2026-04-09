using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class DonorScoringService(AppDbContext db) : IDonorScoringService
{
    public async Task<List<ScoredDonorDto>> GetUpgradeCandidatesAsync()
    {
        var now = DateTime.UtcNow;

        // Get all monetary donations grouped by supporter
        var donationStats = await db.Donations
            .Where(d => d.SupporterId != null && d.DonationType == "Monetary" && d.Amount > 0)
            .GroupBy(d => d.SupporterId!.Value)
            .Select(g => new
            {
                SupporterId = g.Key,
                Frequency = g.Count(),
                MonetaryAvg = g.Average(d => d.Amount ?? 0),
                MonetaryTotal = g.Sum(d => d.Amount ?? 0),
                LatestDonation = g.Max(d => d.DonationDate),
            })
            .ToListAsync();

        if (donationStats.Count == 0)
            return [];

        // Compute p75 threshold
        var allAvgs = donationStats.Select(d => d.MonetaryAvg).OrderBy(x => x).ToList();
        var p75Index = (int)(allAvgs.Count * 0.75);
        var p75 = allAvgs[Math.Min(p75Index, allAvgs.Count - 1)];

        // Get supporter details
        var supporterIds = donationStats.Select(d => d.SupporterId).ToHashSet();
        var supporters = await db.Supporters
            .Where(s => supporterIds.Contains(s.SupporterId))
            .ToDictionaryAsync(s => s.SupporterId);

        var results = new List<ScoredDonorDto>();

        foreach (var stat in donationStats)
        {
            if (!supporters.TryGetValue(stat.SupporterId, out var supporter))
                continue;

            var recency = stat.LatestDonation.HasValue
                ? DateOnly.FromDateTime(now).DayNumber - stat.LatestDonation.Value.DayNumber
                : 999;

            // Upgrade candidate rules: Freq >= 2, MonetaryAvg < p75, Recency <= 180
            var isCandidate = stat.Frequency >= 2
                && stat.MonetaryAvg < p75
                && recency <= 180;

            string score;
            if (!isCandidate) score = "Low";
            else if (stat.Frequency >= 6) score = "High";
            else score = "Medium";

            var email = supporter.Email ?? "";
            var masked = MaskEmail(email);

            results.Add(new ScoredDonorDto(
                SupporterId: stat.SupporterId,
                DisplayName: supporter.DisplayName ?? "Unknown",
                FirstName: (supporter.FirstName ?? supporter.DisplayName ?? "Friend").Split(' ')[0],
                Email: email,
                EmailMasked: masked,
                UpgradeScore: score,
                MonetaryAvg: (decimal)stat.MonetaryAvg,
                Frequency: stat.Frequency,
                Recency: recency
            ));
        }

        return results
            .OrderByDescending(d => d.UpgradeScore == "High" ? 3 : d.UpgradeScore == "Medium" ? 2 : 1)
            .ThenByDescending(d => d.Frequency)
            .ToList();
    }

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return email;
        var parts = email.Split('@');
        var local = parts[0];
        var masked = local.Length <= 2
            ? local + "***"
            : local[..2] + new string('*', Math.Min(local.Length - 2, 4));
        return $"{masked}@{parts[1]}";
    }
}
