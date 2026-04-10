using System.Net;
using Backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Integration;

public class ExpansionControllerBatchTests
{
    [Fact]
    public async Task ExpansionController_UsesInjectedService_ForGetAndRefresh()
    {
        using var factory = new ExpansionTestFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var get = await admin.GetAsync("/api/expansion/recommendation");
        var refresh = await admin.PostAsync("/api/expansion/recommendation/refresh", new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        Assert.Equal(HttpStatusCode.OK, refresh.StatusCode);

        var getBody = await get.Content.ReadAsStringAsync();
        var refreshBody = await refresh.Content.ReadAsStringAsync();
        Assert.Contains("Top Region", getBody);
        Assert.Contains("Top Region", refreshBody);
    }

    private sealed class ExpansionTestFactory : CustomWebApplicationFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.ConfigureServices(services =>
            {
                services.AddSingleton<IExpansionRecommendationService>(new StubExpansionService());
            });
        }
    }

    private sealed class StubExpansionService : IExpansionRecommendationService
    {
        public Task<ExpansionRecommendationDto> GetRecommendationAsync()
            => Task.FromResult(Build());

        public Task<ExpansionRecommendationDto> RefreshRecommendationAsync()
            => Task.FromResult(Build());

        private static ExpansionRecommendationDto Build()
            => new(
                GeneratedAt: DateTime.UtcNow,
                SuccessProfile: new SuccessProfile(
                    TotalResidentsAnalyzed: 10,
                    TotalSuccessful: 7,
                    OverallSuccessRate: 0.7,
                    ByCaseSubcategory: [],
                    ByAgeGroup: [],
                    ByFamilyProfile: [],
                    ByInitialRisk: [],
                    ByReferralSource: []),
                RankedRegions:
                [
                    new RegionRecommendation(
                        RegionCode: "Region X",
                        RegionName: "Top Region",
                        IslandGroup: "Mindanao",
                        NeedScore: 85,
                        SuccessMatchScore: 90,
                        FinalScore: 87.5,
                        Rank: 1,
                        SafetyFlag: false,
                        TopMatchingSegments: ["Trafficked"],
                        AiRationale: "High match")
                ],
                OverallInsight: "Expansion insight");
    }
}
