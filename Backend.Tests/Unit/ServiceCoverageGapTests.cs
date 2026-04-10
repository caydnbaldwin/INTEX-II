using System.Net;
using System.Reflection;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace Backend.Tests.Unit;

public class ServiceCoverageGapTests
{
    [Fact]
    public async Task ChatQueryService_MissingEntityBranches_ReturnExpectedFallbacks()
    {
        await using var db = ControllerCoverageTestSupport.CreateDbContext(nameof(ChatQueryService_MissingEntityBranches_ReturnExpectedFallbacks));
        var service = new ChatQueryService(db);

        var unknown = await service.RunQueryAsync(new IntentResult("something_else", null, null, 5, null));
        var blankResident = await service.RunQueryAsync(new IntentResult("resident_detail", null, null, 5, null, " "));
        var missingResident = await service.RunQueryAsync(new IntentResult("resident_detail", null, null, 5, null, "missing"));
        var blankSupporter = await service.RunQueryAsync(new IntentResult("supporter_detail", null, null, 5, null, " "));
        var missingSupporter = await service.RunQueryAsync(new IntentResult("supporter_detail", null, null, 5, null, "missing"));
        var missingSupporterDetail = await InvokePrivateAsync<(string Summary, List<RecordReference> Refs)>(
            service,
            "QuerySupporterDetailAsync",
            999,
            CancellationToken.None);

        Assert.Equal(string.Empty, unknown.Summary);
        Assert.Empty(unknown.Refs);
        Assert.Equal(string.Empty, blankResident.Summary);
        Assert.Empty(blankResident.Refs);
        Assert.Equal(string.Empty, missingResident.Summary);
        Assert.Empty(missingResident.Refs);
        Assert.Equal(string.Empty, blankSupporter.Summary);
        Assert.Empty(blankSupporter.Refs);
        Assert.Equal(string.Empty, missingSupporter.Summary);
        Assert.Empty(missingSupporter.Refs);
        Assert.Equal("Supporter not found.", missingSupporterDetail.Summary);
        Assert.Empty(missingSupporterDetail.Refs);
    }

    [Fact]
    public async Task ChatQueryService_SupporterChurn_And_ResidentRiskSafehouseFilter_CoverRemainingBranches()
    {
        await using var db = ControllerCoverageTestSupport.CreateDbContext(nameof(ChatQueryService_SupporterChurn_And_ResidentRiskSafehouseFilter_CoverRemainingBranches));

        db.Supporters.Add(new Supporter
        {
            SupporterId = 10,
            FirstName = "Lea",
            LastName = "Jain",
            DisplayName = "Lea Jain",
            Email = "lea@test.local",
            SupporterType = "Monetary",
            Status = "Active"
        });

        db.Residents.AddRange(
            new Resident { ResidentId = 1, InternalCode = "RS-001", SafehouseId = 1 },
            new Resident { ResidentId = 2, InternalCode = "RS-002", SafehouseId = 2 });

        db.PipelineResults.AddRange(
            new PipelineResult
            {
                PipelineResultId = 1,
                PipelineName = "DonorChurn",
                ResultType = "Prediction",
                EntityId = 10,
                Score = 0.81m,
                Label = "High",
                GeneratedAt = DateTime.UtcNow
            },
            new PipelineResult
            {
                PipelineResultId = 2,
                PipelineName = "ResidentRisk",
                ResultType = "Prediction",
                EntityId = 1,
                Score = 0.92m,
                Label = "Critical"
            },
            new PipelineResult
            {
                PipelineResultId = 3,
                PipelineName = "ResidentRisk",
                ResultType = "Prediction",
                EntityId = 2,
                Score = 0.88m,
                Label = "High"
            });

        await db.SaveChangesAsync();

        var service = new ChatQueryService(db);

        var supporter = await service.RunQueryAsync(new IntentResult("supporter_detail", null, null, 5, null, "Lea Jain"));
        var risk = await service.RunQueryAsync(new IntentResult("resident_risk", 1, null, 10, "score_desc"));

        Assert.Single(supporter.Refs);
        Assert.Contains("Churn Score: 0.81 (High)", supporter.Summary);
        Assert.Single(risk.Refs);
        Assert.Contains("[[resident:1]]", risk.Summary);
        Assert.DoesNotContain("[[resident:2]]", risk.Summary);
    }

    [Fact]
    public async Task GeminiChatService_ClassifyIntent_FallsBack_ForEmptyAndInvalidJson()
    {
        using var emptyClient = new HttpClient(new DelegateHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(BuildGeminiEnvelope(string.Empty), Encoding.UTF8, "application/json")
            })));

        using var invalidClient = new HttpClient(new DelegateHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(BuildGeminiEnvelope("{"), Encoding.UTF8, "application/json")
            })));

        var emptyService = CreateGeminiService(emptyClient);
        var invalidService = CreateGeminiService(invalidClient);

        var empty = await emptyService.ClassifyIntentAsync("who is at risk?");
        var invalid = await invalidService.ClassifyIntentAsync("who is at risk?");

        Assert.Equal("unknown", empty.Category);
        Assert.Equal(5, empty.Limit);
        Assert.Equal("unknown", invalid.Category);
        Assert.Equal(5, invalid.Limit);
    }

    [Fact]
    public async Task GeminiChatService_GenerateResidentAdvice_FallsBack_ForEmptyAndInvalidJson()
    {
        using var emptyClient = new HttpClient(new DelegateHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(BuildGeminiEnvelope(string.Empty), Encoding.UTF8, "application/json")
            })));

        using var invalidClient = new HttpClient(new DelegateHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(BuildGeminiEnvelope("{"), Encoding.UTF8, "application/json")
            })));

        var emptyService = CreateGeminiService(emptyClient);
        var invalidService = CreateGeminiService(invalidClient);

        var empty = await emptyService.GenerateResidentAdviceAsync("case summary");
        var invalid = await invalidService.GenerateResidentAdviceAsync("case summary");

        Assert.Equal("Unable to generate advice for this resident. Please try again.", empty);
        Assert.Equal("Unable to generate advice for this resident. Please try again.", invalid);
    }

    [Fact]
    public async Task GeminiChatService_GenerateDonorAdvice_FallsBack_ForEmptyAndInvalidJson()
    {
        using var emptyClient = new HttpClient(new DelegateHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(BuildGeminiEnvelope(string.Empty), Encoding.UTF8, "application/json")
            })));

        using var invalidClient = new HttpClient(new DelegateHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(BuildGeminiEnvelope("{"), Encoding.UTF8, "application/json")
            })));

        var emptyService = CreateGeminiService(emptyClient);
        var invalidService = CreateGeminiService(invalidClient);

        var empty = await emptyService.GenerateDonorAdviceAsync("donor summary");
        var invalid = await invalidService.GenerateDonorAdviceAsync("donor summary");

        Assert.Equal("Unable to generate advice for this donor. Please try again.", empty);
        Assert.Equal("Unable to generate advice for this donor. Please try again.", invalid);
    }

    [Fact]
    public async Task GeminiChatService_GenerateAnswer_ReturnsFallback_ForInvalidResponseJson()
    {
        using var client = new HttpClient(new DelegateHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{", Encoding.UTF8, "application/json")
            })));

        var service = CreateGeminiService(client);

        var answer = await service.GenerateAnswerAsync(
            "Summarize this",
            "summary",
            new IntentResult("resident_detail", null, null, 1, null, "Maria"));

        Assert.Equal("I wasn't able to generate a response. Please try again.", answer);
    }

    [Fact]
    public async Task ResendEmailService_SendEmailAsync_SendsAndLogsSuccess_WhenApiKeyIsConfigured()
    {
        await using var db = ControllerCoverageTestSupport.CreateDbContext(nameof(ResendEmailService_SendEmailAsync_SendsAndLogsSuccess_WhenApiKeyIsConfigured));
        db.Supporters.Add(new Supporter
        {
            SupporterId = 20,
            DisplayName = "Email Target",
            FirstName = "Email",
            Email = "email.target@test.local"
        });
        db.Donations.Add(new Donation
        {
            DonationId = 2001,
            SupporterId = 20,
            DonationType = "Monetary",
            Amount = 750,
            DonationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5))
        });
        await db.SaveChangesAsync();

        HttpRequestMessage? capturedRequest = null;
        string? capturedBody = null;

        using var client = new HttpClient(new DelegateHandler(async (request, _) =>
        {
            capturedRequest = request;
            capturedBody = request.Content is null ? null : await request.Content.ReadAsStringAsync();
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"id\":\"msg_123\"}", Encoding.UTF8, "application/json")
            };
        }));

        var service = CreateResendEmailService(db, client);
        var result = await service.SendEmailAsync(20);

        Assert.True(result.Success);
        Assert.Equal("msg_123", result.MessageId);
        Assert.NotNull(capturedRequest);
        Assert.Equal("Bearer", capturedRequest!.Headers.Authorization?.Scheme);
        Assert.NotNull(capturedBody);
        Assert.Contains("email.target@test.local", capturedBody);

        var log = await db.OutreachEmailLogs.OrderByDescending(entry => entry.OutreachEmailLogId).FirstAsync();
        Assert.Equal("sent", log.Status);
    }

    [Fact]
    public async Task ResendEmailService_SendEmailAsync_ReturnsFailure_OnNonSuccessResponse()
    {
        await using var db = ControllerCoverageTestSupport.CreateDbContext(nameof(ResendEmailService_SendEmailAsync_ReturnsFailure_OnNonSuccessResponse));
        db.Supporters.Add(new Supporter
        {
            SupporterId = 21,
            DisplayName = "Failure Case",
            FirstName = "Failure",
            Email = "failure@test.local"
        });
        db.Donations.Add(new Donation
        {
            DonationId = 2101,
            SupporterId = 21,
            DonationType = "Monetary",
            Amount = 100,
            DonationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10))
        });
        await db.SaveChangesAsync();

        using var client = new HttpClient(new DelegateHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent("bad request", Encoding.UTF8, "text/plain")
            })));

        var service = CreateResendEmailService(db, client);
        var result = await service.SendEmailAsync(21);

        Assert.False(result.Success);
        Assert.Contains("BadRequest", result.Error ?? string.Empty);

        var log = await db.OutreachEmailLogs.OrderByDescending(entry => entry.OutreachEmailLogId).FirstAsync();
        Assert.Equal("failed", log.Status);
    }

    [Fact]
    public async Task ResendEmailService_SendEmailAsync_ReturnsFailure_WhenHttpClientThrows()
    {
        await using var db = ControllerCoverageTestSupport.CreateDbContext(nameof(ResendEmailService_SendEmailAsync_ReturnsFailure_WhenHttpClientThrows));
        db.Supporters.Add(new Supporter
        {
            SupporterId = 22,
            DisplayName = "Thrown Exception",
            FirstName = "Thrown",
            Email = "thrown@test.local"
        });
        db.Donations.Add(new Donation
        {
            DonationId = 2201,
            SupporterId = 22,
            DonationType = "Monetary",
            Amount = 200,
            DonationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-20))
        });
        await db.SaveChangesAsync();

        using var client = new HttpClient(new DelegateHandler((_, _) =>
            throw new InvalidOperationException("boom")));

        var service = CreateResendEmailService(db, client);
        var result = await service.SendEmailAsync(22);

        Assert.False(result.Success);
        Assert.Equal("boom", result.Error);

        var log = await db.OutreachEmailLogs.OrderByDescending(entry => entry.OutreachEmailLogId).FirstAsync();
        Assert.Equal("failed", log.Status);
    }

    [Fact]
    public void ExpansionRecommendationService_ScoreRegions_CoversMappedSegments_AndRanking()
    {
        var ranked = InvokePrivateStatic<List<RegionRecommendation>>(
            typeof(ExpansionRecommendationService),
            "ScoreRegions",
            CreateHighSignalProfile());

        Assert.Equal(9, ranked.Count);
        Assert.Equal(1, ranked.Min(region => region.Rank));
        Assert.Equal(9, ranked.Max(region => region.Rank));
        Assert.Contains(ranked, region => region.SafetyFlag);
        Assert.Contains(ranked, region => region.TopMatchingSegments.Count > 0);
    }

    [Fact]
    public async Task ExpansionRecommendationService_EnrichWithAiAsync_UpdatesMatchingRegions_OnSuccess()
    {
        await using var db = ControllerCoverageTestSupport.CreateDbContext(nameof(ExpansionRecommendationService_EnrichWithAiAsync_UpdatesMatchingRegions_OnSuccess));
        using var client = new HttpClient(new DelegateHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    BuildGeminiEnvelope(
                        "{\"recommendations\":[{\"regionCode\":\"Region I\",\"rationale\":\"Strong fit.\"},{\"regionCode\":\"Unknown\",\"rationale\":\"Ignore.\"}],\"overallInsight\":\"Invest where need and fit overlap.\"}"),
                    Encoding.UTF8,
                    "application/json")
            })));

        var service = CreateExpansionService(db, client, includeApiKey: true);
        var regions = new List<RegionRecommendation>
        {
            new("Region I", "Ilocos Region", "Luzon", 43, 80, 61.5, 1, false, new List<string> { "Trafficked" }, null),
            new("Region II", "Cagayan Valley", "Luzon", 54, 70, 62, 2, false, new List<string> { "OSEC" }, null)
        };

        var insight = await InvokePrivateAsync<string?>(
            service,
            "EnrichWithAiAsync",
            regions,
            CreateHighSignalProfile());

        Assert.Equal("Invest where need and fit overlap.", insight);
        Assert.Equal("Strong fit.", regions[0].AiRationale);
        Assert.Null(regions[1].AiRationale);
    }

    [Fact]
    public async Task ExpansionRecommendationService_EnrichWithAiAsync_ReturnsNull_ForFailureScenarios()
    {
        var scenarios = new Func<HttpMessageHandler>[]
        {
            () => new DelegateHandler((_, _) =>
                Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadGateway)
                {
                    Content = new StringContent("upstream error", Encoding.UTF8, "text/plain")
                })),
            () => new DelegateHandler((_, _) =>
                Task.FromException<HttpResponseMessage>(new TaskCanceledException("timeout"))),
            () => new DelegateHandler((_, _) =>
                Task.FromException<HttpResponseMessage>(new HttpRequestException("network"))),
            () => new DelegateHandler((_, _) =>
                Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{", Encoding.UTF8, "application/json")
                })),
            () => new DelegateHandler((_, _) =>
                throw new InvalidOperationException("unexpected"))
        };

        foreach (var createHandler in scenarios)
        {
            await using var db = ControllerCoverageTestSupport.CreateDbContext(Guid.NewGuid().ToString("N"));
            using var client = new HttpClient(createHandler());
            var service = CreateExpansionService(db, client, includeApiKey: true);
            var regions = new List<RegionRecommendation>
            {
                new("Region I", "Ilocos Region", "Luzon", 43, 80, 61.5, 1, false, new List<string> { "Trafficked" }, null)
            };

            var insight = await InvokePrivateAsync<string?>(
                service,
                "EnrichWithAiAsync",
                regions,
                CreateHighSignalProfile());

            Assert.Null(insight);
        }
    }

    [Fact]
    public async Task ExpansionRecommendationService_GetRecommendationAsync_FallsBack_WhenCachedJsonIsInvalid()
    {
        await using var db = ControllerCoverageTestSupport.CreateDbContext(nameof(ExpansionRecommendationService_GetRecommendationAsync_FallsBack_WhenCachedJsonIsInvalid));
        db.PipelineResults.Add(new PipelineResult
        {
            PipelineResultId = 1,
            PipelineName = "ExpansionRecommendation",
            EntityType = "Philippines",
            ResultType = "Analysis",
            DetailsJson = "{",
            GeneratedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        using var client = new HttpClient(new DelegateHandler((_, _) =>
            throw new InvalidOperationException("should not call Gemini")));

        var service = CreateExpansionService(db, client, includeApiKey: false);
        var result = await service.GetRecommendationAsync();

        Assert.Equal(9, result.RankedRegions.Count);
        Assert.Equal(2, await db.PipelineResults.CountAsync());
    }

    [Fact]
    public async Task ExpansionRecommendationService_RefreshRecommendationAsync_SwallowsPersistFailures()
    {
        await using var db = CreateThrowingDbContext(nameof(ExpansionRecommendationService_RefreshRecommendationAsync_SwallowsPersistFailures));
        db.ThrowOnSaveChanges = true;

        using var client = new HttpClient(new DelegateHandler((_, _) =>
            throw new InvalidOperationException("should not call Gemini")));

        var service = CreateExpansionService(db, client, includeApiKey: false);
        var result = await service.RefreshRecommendationAsync();

        Assert.Equal(9, result.RankedRegions.Count);
    }

    [Fact]
    public async Task WeeklyEmailHostedService_RunAutomationCycleAsync_Returns_WhenStateIsDisabled()
    {
        var dbName = Guid.NewGuid().ToString("N");
        var emailService = new StubEmailService(_ => Task.FromResult(new EmailSendResult(true)));
        var scoringService = new StubDonorScoringService([]);
        using var provider = CreateWeeklyServiceProvider(dbName, emailService, scoringService);

        using (var scope = provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
        }

        var service = new TestableWeeklyEmailHostedService(provider, NullLogger<WeeklyEmailHostedService>.Instance);
        await service.RunCycleAsync();

        Assert.Empty(emailService.SentSupporterIds);
    }

    [Fact]
    public async Task WeeklyEmailHostedService_RunAutomationCycleAsync_Returns_WhenLastRunIsRecent()
    {
        var dbName = Guid.NewGuid().ToString("N");
        var emailService = new StubEmailService(_ => Task.FromResult(new EmailSendResult(true)));
        var scoringService = new StubDonorScoringService([
            CreateScoredDonor(1, "High")
        ]);
        using var provider = CreateWeeklyServiceProvider(dbName, emailService, scoringService);

        using (var scope = provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
            var state = await db.AutomationStates.FindAsync(1);
            Assert.NotNull(state);
            state!.Enabled = true;
            state.LastRun = DateTime.UtcNow.AddDays(-1);
            await db.SaveChangesAsync();
        }

        var service = new TestableWeeklyEmailHostedService(provider, NullLogger<WeeklyEmailHostedService>.Instance);
        await service.RunCycleAsync();

        Assert.Empty(emailService.SentSupporterIds);
    }

    [Fact]
    public async Task WeeklyEmailHostedService_RunAutomationCycleAsync_ProcessesEligibleCandidates_AndUpdatesState()
    {
        var dbName = Guid.NewGuid().ToString("N");
        var emailService = new StubEmailService(supporterId => Task.FromResult(
            supporterId == 4
                ? new EmailSendResult(false, Error: "failed")
                : new EmailSendResult(true, MessageId: $"msg_{supporterId}")));
        var scoringService = new StubDonorScoringService([
            CreateScoredDonor(1, "High"),
            CreateScoredDonor(2, "High"),
            CreateScoredDonor(3, "Low"),
            CreateScoredDonor(4, "Medium")
        ]);
        using var provider = CreateWeeklyServiceProvider(dbName, emailService, scoringService);

        using (var scope = provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();

            var state = await db.AutomationStates.FindAsync(1);
            Assert.NotNull(state);
            state!.Enabled = true;
            state.LastRun = DateTime.UtcNow.AddDays(-8);

            db.OutreachEmailLogs.Add(new OutreachEmailLog
            {
                SupporterId = 2,
                DonorName = "Recent",
                Email = "recent@test.local",
                TemplateId = "loyal",
                Subject = "Recent",
                Body = "Recent",
                Status = "sent",
                SentAt = DateTime.UtcNow.AddDays(-5)
            });

            await db.SaveChangesAsync();
        }

        var service = new TestableWeeklyEmailHostedService(provider, NullLogger<WeeklyEmailHostedService>.Instance);
        await service.RunCycleAsync();

        Assert.Equal(new[] { 1, 4 }, emailService.SentSupporterIds);

        using var verifyScope = provider.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var verifyState = await verifyDb.AutomationStates.FindAsync(1);
        Assert.NotNull(verifyState);
        Assert.NotNull(verifyState!.LastRun);
        Assert.Equal(1, verifyState.EmailsThisWeek);
    }

    [Fact]
    public async Task WeeklyEmailHostedService_RunAutomationCycleAsync_SwallowsExceptions()
    {
        var dbName = Guid.NewGuid().ToString("N");
        var emailService = new StubEmailService(_ => Task.FromResult(new EmailSendResult(true)));
        var scoringService = new StubDonorScoringService(new InvalidOperationException("boom"));
        using var provider = CreateWeeklyServiceProvider(dbName, emailService, scoringService);

        using (var scope = provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
            var state = await db.AutomationStates.FindAsync(1);
            Assert.NotNull(state);
            state!.Enabled = true;
            state.LastRun = DateTime.UtcNow.AddDays(-8);
            await db.SaveChangesAsync();
        }

        var service = new TestableWeeklyEmailHostedService(provider, NullLogger<WeeklyEmailHostedService>.Instance);
        await service.RunCycleAsync();

        Assert.Empty(emailService.SentSupporterIds);
    }

    [Fact]
    public async Task WeeklyEmailHostedService_ExecuteAsync_CoversLoopShell()
    {
        using var provider = new ServiceCollection().BuildServiceProvider();
        using var cancellationSource = new CancellationTokenSource();

        var service = new ExecuteOnceWeeklyEmailHostedService(
            provider,
            NullLogger<WeeklyEmailHostedService>.Instance,
            cancellationSource);

        await service.RunExecuteAsync(cancellationSource.Token);

        Assert.True(cancellationSource.IsCancellationRequested);
    }

    private static GeminiChatService CreateGeminiService(HttpClient client)
        => new(
            client,
            ControllerCoverageTestSupport.BuildConfiguration(new Dictionary<string, string?> { ["Gemini:ApiKey"] = "test-key" }),
            NullLogger<GeminiChatService>.Instance);

    private static ResendEmailService CreateResendEmailService(
        AppDbContext db,
        HttpClient client,
        Dictionary<string, string?>? overrides = null)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Email:DevMode"] = "false",
            ["Email:FromName"] = "Lunas",
            ["Email:FromAddress"] = "noreply@test.local",
            ["Resend:ApiKey"] = "test-key"
        };

        if (overrides is not null)
        {
            foreach (var pair in overrides)
                settings[pair.Key] = pair.Value;
        }

        return new ResendEmailService(
            db,
            client,
            ControllerCoverageTestSupport.BuildConfiguration(settings),
            NullLogger<ResendEmailService>.Instance);
    }

    private static ExpansionRecommendationService CreateExpansionService(
        AppDbContext db,
        HttpClient client,
        bool includeApiKey)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Gemini:ApiKey"] = includeApiKey ? "test-key" : null
        };

        return new ExpansionRecommendationService(
            db,
            new StubHttpClientFactory(client),
            ControllerCoverageTestSupport.BuildConfiguration(settings),
            NullLogger<ExpansionRecommendationService>.Instance);
    }

    private static ThrowingSaveChangesAppDbContext CreateThrowingDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"{name}_{Guid.NewGuid():N}")
            .Options;

        var db = new ThrowingSaveChangesAppDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    private static SuccessProfile CreateHighSignalProfile()
        => new(
            40,
            30,
            0.75,
            new List<SegmentRate>
            {
                new("Trafficked", 6, 5, 0.8333, 0.50),
                new("OSEC", 6, 5, 0.8333, 0.45),
                new("Sexual Abuse", 6, 5, 0.8333, 0.40),
                new("Physical Abuse", 6, 5, 0.8333, 0.35),
                new("Child Labor", 6, 5, 0.8333, 0.30)
            },
            new List<SegmentRate>
            {
                new("Age 10-12", 6, 5, 0.8333, 0.25),
                new("Age 13-15", 6, 5, 0.8333, 0.24),
                new("Age 16-18", 6, 5, 0.8333, 0.23)
            },
            new List<SegmentRate>
            {
                new("4Ps Household", 6, 5, 0.8333, 0.22),
                new("Solo Parent", 6, 5, 0.8333, 0.21),
                new("Indigenous", 6, 5, 0.8333, 0.20),
                new("Informal Settler", 6, 5, 0.8333, 0.19)
            },
            new List<SegmentRate>
            {
                new("Low Risk", 6, 5, 0.8333, 0.18)
            },
            new List<SegmentRate>());

    private static string BuildGeminiEnvelope(string text)
        => JsonSerializer.Serialize(new
        {
            candidates = new[]
            {
                new
                {
                    content = new
                    {
                        parts = new[]
                        {
                            new { text }
                        }
                    }
                }
            }
        });

    private static ScoredDonorDto CreateScoredDonor(int supporterId, string upgradeScore)
        => new(
            supporterId,
            $"Donor {supporterId}",
            $"Donor{supporterId}",
            $"donor{supporterId}@test.local",
            $"do***{supporterId}@test.local",
            upgradeScore,
            100,
            3,
            10);

    private static ServiceProvider CreateWeeklyServiceProvider(
        string dbName,
        IEmailService emailService,
        IDonorScoringService scoringService)
    {
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(dbName));
        services.AddScoped(_ => emailService);
        services.AddScoped(_ => scoringService);
        services.AddLogging();
        return services.BuildServiceProvider();
    }

    private static T InvokePrivateStatic<T>(Type type, string methodName, params object[] args)
    {
        var method = type.GetMethod(methodName, BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);
        return (T)method!.Invoke(null, args)!;
    }

    private static async Task<T> InvokePrivateAsync<T>(object instance, string methodName, params object[] args)
    {
        var method = instance.GetType().GetMethod(methodName, BindingFlags.NonPublic | BindingFlags.Instance);
        Assert.NotNull(method);

        var taskObject = method!.Invoke(instance, args);
        Assert.NotNull(taskObject);

        var task = (Task)taskObject!;
        await task;

        var resultProperty = taskObject.GetType().GetProperty("Result");
        if (resultProperty is null)
            return default!;

        var result = resultProperty.GetValue(taskObject);
        return result is null ? default! : (T)result;
    }

    private sealed class DelegateHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => handler(request, cancellationToken);
    }

    private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class ThrowingSaveChangesAppDbContext(DbContextOptions<AppDbContext> options)
        : AppDbContext(options)
    {
        internal bool ThrowOnSaveChanges { get; set; }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            => ThrowOnSaveChanges
                ? throw new InvalidOperationException("save failed")
                : base.SaveChangesAsync(cancellationToken);
    }

    private sealed class TestableWeeklyEmailHostedService(
        IServiceProvider serviceProvider,
        ILogger<WeeklyEmailHostedService> logger)
        : WeeklyEmailHostedService(serviceProvider, logger)
    {
        public Task RunCycleAsync(CancellationToken cancellationToken = default)
            => RunAutomationCycleAsync(cancellationToken);
    }

    private sealed class StubEmailService(Func<int, Task<EmailSendResult>> handler) : IEmailService
    {
        internal List<int> SentSupporterIds { get; } = [];

        public async Task<EmailSendResult> SendEmailAsync(int supporterId, string? templateOverride = null)
        {
            SentSupporterIds.Add(supporterId);
            return await handler(supporterId);
        }

        public Task<EmailPreview> RenderPreviewAsync(string templateId, int? supporterId = null)
            => Task.FromResult(new EmailPreview(string.Empty, string.Empty, string.Empty));
    }

    private sealed class StubDonorScoringService : IDonorScoringService
    {
        private readonly List<ScoredDonorDto> donors;
        private readonly Exception? exception;

        internal StubDonorScoringService(List<ScoredDonorDto> donors)
        {
            this.donors = donors;
        }

        internal StubDonorScoringService(Exception exception)
        {
            donors = [];
            this.exception = exception;
        }

        public Task<List<ScoredDonorDto>> GetUpgradeCandidatesAsync()
            => exception is null
                ? Task.FromResult(donors)
                : Task.FromException<List<ScoredDonorDto>>(exception);
    }

    private sealed class ExecuteOnceWeeklyEmailHostedService(
        IServiceProvider serviceProvider,
        ILogger<WeeklyEmailHostedService> logger,
        CancellationTokenSource cancellationSource)
        : WeeklyEmailHostedService(serviceProvider, logger)
    {
        public Task RunExecuteAsync(CancellationToken cancellationToken)
            => ExecuteAsync(cancellationToken);

        protected override Task DelayUntilNextRunAsync(CancellationToken stoppingToken)
            => Task.CompletedTask;

        protected override Task RunAutomationCycleAsync(CancellationToken stoppingToken)
        {
            cancellationSource.Cancel();
            return Task.CompletedTask;
        }
    }
}
