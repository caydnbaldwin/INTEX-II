using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace Backend.Tests.Unit;

/// <summary>
/// Covers:
///   • DataSeeder — file-not-found and already-seeded short-circuit paths
///   • DonorScoringService — supporter missing from dictionary (continue branch)
///   • ExpansionRecommendationService — full pipeline with and without residents,
///     cached result re-use, and the RefreshRecommendationAsync path
/// </summary>
public class DataAndServiceBatch2Tests
{
    // ── DataSeeder ────────────────────────────────────────────────────────────

    [Fact]
    public async Task DataSeeder_FileNotFound_SkipsTableGracefully()
    {
        // Provide a seed path that has no CSV files → every SeedTable call hits
        // the "file not found" branch (lines 50-53 of DataSeeder.cs).
        await using var db = CreateDb(nameof(DataSeeder_FileNotFound_SkipsTableGracefully));

        var emptySeedPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(emptySeedPath);

        try
        {
            // Should complete without throwing
            await DataSeeder.SeedAsync(db, emptySeedPath);

            // Tables are still empty — nothing was seeded
            Assert.False(await db.Safehouses.AnyAsync());
            Assert.False(await db.Supporters.AnyAsync());
        }
        finally
        {
            Directory.Delete(emptySeedPath, recursive: false);
        }
    }

    [Fact]
    public async Task DataSeeder_AlreadySeeded_SkipsTable()
    {
        // Seed one row into Safehouses manually, then run DataSeeder — it should
        // short-circuit on the AnyAsync() check and not attempt CSV parsing.
        await using var db = CreateDb(nameof(DataSeeder_AlreadySeeded_SkipsTable));

        db.Safehouses.Add(new Safehouse { SafehouseId = 1, Name = "PreSeeded", Region = "R1" });
        await db.SaveChangesAsync();

        var emptySeedPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(emptySeedPath);

        try
        {
            await DataSeeder.SeedAsync(db, emptySeedPath);

            // Safehouse count should still be 1 (not overwritten)
            Assert.Equal(1, await db.Safehouses.CountAsync());
        }
        finally
        {
            Directory.Delete(emptySeedPath, recursive: false);
        }
    }

    // ── DonorScoringService — supporter not in lookup dictionary ─────────────

    [Fact]
    public async Task DonorScoringService_MissingSupporter_SkipsEntry()
    {
        // Donation exists for SupporterId=99 but no Supporter row with that ID.
        // The service fetches donation stats then looks up supporters; the entry
        // for SupporterId=99 fails TryGetValue and hits the `continue` on line 45.
        await using var db = CreateDb(nameof(DonorScoringService_MissingSupporter_SkipsEntry));

        // SupporterId=1 has a real Supporter record
        db.Supporters.Add(new Supporter
        {
            SupporterId  = 1,
            DisplayName  = "Real Donor",
            Email        = "real@test.local",
            SupporterType = "Monetary"
        });

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // SupporterId=1: two donations — will appear in results
        db.Donations.Add(new Donation
        {
            DonationId   = 1,
            SupporterId  = 1,
            DonationType = "Monetary",
            Amount       = 100,
            DonationDate = today.AddDays(-5)
        });
        db.Donations.Add(new Donation
        {
            DonationId   = 2,
            SupporterId  = 1,
            DonationType = "Monetary",
            Amount       = 120,
            DonationDate = today.AddDays(-2)
        });

        // SupporterId=99: donation exists but NO matching Supporter → hits continue
        db.Donations.Add(new Donation
        {
            DonationId   = 3,
            SupporterId  = 99,
            DonationType = "Monetary",
            Amount       = 200,
            DonationDate = today.AddDays(-1)
        });
        db.Donations.Add(new Donation
        {
            DonationId   = 4,
            SupporterId  = 99,
            DonationType = "Monetary",
            Amount       = 200,
            DonationDate = today.AddDays(-3)
        });

        await db.SaveChangesAsync();

        var service = new DonorScoringService(db);
        var results = await service.GetUpgradeCandidatesAsync();

        // Only SupporterId=1 should appear — SupporterId=99 was skipped
        Assert.All(results, r => Assert.Equal(1, r.SupporterId));
        Assert.Single(results);
    }

    // ── ExpansionRecommendationService ────────────────────────────────────────

    [Fact]
    public async Task ExpansionService_EmptyDb_RunsPipelineWithNeutralScores()
    {
        await using var db = CreateDb(nameof(ExpansionService_EmptyDb_RunsPipelineWithNeutralScores));

        var service = BuildExpansionService(db);
        var result  = await service.GetRecommendationAsync();

        Assert.NotNull(result);
        Assert.Equal(0, result.SuccessProfile.TotalResidentsAnalyzed);
        Assert.Equal(9, result.RankedRegions.Count);
        // Without high-signal segments all successMatch scores degrade to 50.0
        Assert.All(result.RankedRegions, r => Assert.Equal(50.0, r.SuccessMatchScore));
        Assert.Null(result.OverallInsight); // no Gemini key → no AI enrichment
    }

    [Fact]
    public async Task ExpansionService_SecondCall_ReturnsCachedResult()
    {
        await using var db = CreateDb(nameof(ExpansionService_SecondCall_ReturnsCachedResult));

        var service = BuildExpansionService(db);

        var first  = await service.GetRecommendationAsync(); // runs pipeline, persists to PipelineResults
        var second = await service.GetRecommendationAsync(); // should deserialise from cache

        Assert.Equal(
            first.RankedRegions[0].RegionCode,
            second.RankedRegions[0].RegionCode);
        // Cache round-trip: GeneratedAt is preserved
        Assert.Equal(first.GeneratedAt, second.GeneratedAt);
    }

    [Fact]
    public async Task ExpansionService_Refresh_BypassesCache()
    {
        await using var db = CreateDb(nameof(ExpansionService_Refresh_BypassesCache));

        var service = BuildExpansionService(db);

        // Populate cache
        await service.GetRecommendationAsync();

        // RefreshRecommendationAsync always re-runs, producing a fresh GeneratedAt
        var refreshed = await service.RefreshRecommendationAsync();
        Assert.NotNull(refreshed);
        Assert.Equal(9, refreshed.RankedRegions.Count);
    }

    [Fact]
    public async Task ExpansionService_WithResidents_ComputesSegmentsAndRanking()
    {
        await using var db = CreateDb(nameof(ExpansionService_WithResidents_ComputesSegmentsAndRanking));

        // Add enough closed residents across different subcategories to generate
        // high-signal segments (count >= 5, lift > 0.10) so ScoreRegions uses real scores.
        var residents = new List<Resident>();
        for (int i = 1; i <= 30; i++)
        {
            residents.Add(new Resident
            {
                ResidentId         = i,
                CaseStatus         = i <= 20 ? "Closed" : "Active",
                ReintegrationStatus = i <= 15 ? "Completed" : null,
                SubCatTrafficked   = i % 3 == 0,
                SubCatOsaec        = i % 5 == 0,
                SubCatSexualAbuse  = i % 4 == 0,
                SubCatPhysicalAbuse = i % 6 == 0,
                SubCatChildLabor   = i % 7 == 0,
                SubCatAtRisk       = i % 8 == 0,
                SubCatOrphaned     = i % 9 == 0,
                InitialRiskLevel   = i % 2 == 0 ? "High" : "Medium",
                AgeUponAdmission   = i % 3 == 0 ? "14 Years 3 months"
                                   : i % 3 == 1 ? "16 Years"
                                   : "11 Years",
                FamilyIs4ps        = i % 4 == 0,
                FamilySoloParent   = i % 5 == 0,
                FamilyIndigenous   = i % 6 == 0,
                FamilyInformalSettler = i % 7 == 0,
                FamilyParentPwd    = i % 10 == 0,
                ReferralSource     = i % 6 == 0 ? "Government Agency"
                                   : i % 6 == 1 ? "NGO"
                                   : i % 6 == 2 ? "Police"
                                   : i % 6 == 3 ? "Court Order"
                                   : i % 6 == 4 ? "Community"
                                   : "Self-Referral",
            });
        }
        db.Residents.AddRange(residents);
        await db.SaveChangesAsync();

        var service = BuildExpansionService(db);
        var result  = await service.GetRecommendationAsync();

        Assert.NotNull(result);
        Assert.True(result.SuccessProfile.TotalResidentsAnalyzed > 0);
        Assert.Equal(9, result.RankedRegions.Count);
        // Ranks are 1-9
        Assert.Equal(1, result.RankedRegions.Min(r => r.Rank));
        Assert.Equal(9, result.RankedRegions.Max(r => r.Rank));
    }

    [Fact]
    public async Task ExpansionService_AgeUponAdmission_EdgeCases()
    {
        await using var db = CreateDb(nameof(ExpansionService_AgeUponAdmission_EdgeCases));

        // Include residents with unusual age strings to exercise ParseAge branches
        db.Residents.AddRange(
            new Resident { ResidentId = 1, CaseStatus = "Closed", AgeUponAdmission = null },
            new Resident { ResidentId = 2, CaseStatus = "Closed", AgeUponAdmission = "" },
            new Resident { ResidentId = 3, CaseStatus = "Closed", AgeUponAdmission = "not-a-number Years" },
            new Resident { ResidentId = 4, CaseStatus = "Closed", AgeUponAdmission = "9 Years" },   // < 10
            new Resident { ResidentId = 5, CaseStatus = "Closed", AgeUponAdmission = "20 Years" },  // > 18
            new Resident { ResidentId = 6, CaseStatus = "Closed", AgeUponAdmission = "10 Years" },  // 10-12
            new Resident { ResidentId = 7, CaseStatus = "Closed", AgeUponAdmission = "13 Years" },  // 13-15
            new Resident { ResidentId = 8, CaseStatus = "Closed", AgeUponAdmission = "16 Years" }   // 16-18
        );
        await db.SaveChangesAsync();

        var service = BuildExpansionService(db);
        var result  = await service.GetRecommendationAsync();

        Assert.NotNull(result);
        Assert.Equal(8, result.SuccessProfile.TotalResidentsAnalyzed);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static AppDbContext CreateDb(string name)
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"{name}_{Guid.NewGuid():N}")
            .Options;
        var db = new AppDbContext(opts);
        db.Database.EnsureCreated();
        return db;
    }

    private static ExpansionRecommendationService BuildExpansionService(AppDbContext db)
    {
        // No Gemini:ApiKey → AI enrichment is skipped, keeping tests fast & offline.
        var config          = new ConfigurationBuilder().Build();
        var logger          = NullLogger<ExpansionRecommendationService>.Instance;
        var httpFactory     = new NullHttpClientFactory();
        return new ExpansionRecommendationService(db, httpFactory, config, logger);
    }

    private sealed class NullHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new();
    }
}
