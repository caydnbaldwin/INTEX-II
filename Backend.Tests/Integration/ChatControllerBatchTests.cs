using System.Net;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging.Abstractions;

namespace Backend.Tests.Integration;

public class ChatControllerBatchTests
{
    [Fact]
    public async Task Chat_UnknownIntent_ReturnsGuidanceMessage()
    {
        using var factory = new ChatTestFactory(mode: "unknown");
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var response = await admin.PostAsync("/api/chat", Json(new { question = "Tell me a joke" }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("I can help with resident risk levels", body);
    }

    [Fact]
    public async Task Chat_ResidentRisk_UsesValidationToStripUnknownTags()
    {
        using var factory = new ChatTestFactory(mode: "resident-risk");
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Residents.Add(new Resident { ResidentId = 1, InternalCode = "R1", SafehouseId = 100, CaseStatus = "Active", CurrentRiskLevel = "High" });
            db.PipelineResults.Add(new PipelineResult
            {
                PipelineResultId = 1,
                PipelineName = "ResidentRisk",
                ResultType = "Prediction",
                EntityId = 1,
                Score = 0.95m,
                Label = "High"
            });
            await db.SaveChangesAsync();
        }

        var response = await admin.PostAsync("/api/chat", Json(new { question = "Which residents are most at risk?" }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("[[resident:1]]", body);
        Assert.DoesNotContain("[[resident:999]]", body);
    }

    [Fact]
    public async Task ChatResident_NotFound_And_OkBranches()
    {
        using var factory = new ChatTestFactory(mode: "resident-advice");
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var notFound = await admin.PostAsync("/api/chat/resident/404", Json(new { }));
        Assert.Equal(HttpStatusCode.NotFound, notFound.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Residents.Add(new Resident { ResidentId = 2, InternalCode = "R2", CaseStatus = "Active", CurrentRiskLevel = "High" });
            await db.SaveChangesAsync();
        }

        var ok = await admin.PostAsync("/api/chat/resident/2", Json(new { }));
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        var body = await ok.Content.ReadAsStringAsync();
        Assert.Contains("[[resident:2]]", body);
    }

    private static StringContent Json(object payload)
        => new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    private sealed class ChatTestFactory(string mode) : CustomWebApplicationFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);

            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Gemini:ApiKey"] = "test-key"
                });
            });

            builder.ConfigureServices(services =>
            {
                services.RemoveAll<GeminiChatService>();

                var cfg = new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?> { ["Gemini:ApiKey"] = "test-key" })
                    .Build();

                var http = new HttpClient(new GeminiStubHandler(mode));
                services.AddScoped(_ => new GeminiChatService(http, cfg, NullLogger<GeminiChatService>.Instance));
            });
        }
    }

    private sealed class GeminiStubHandler(string mode) : HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);

            string text;
            if (body.Contains("intent classifier", StringComparison.OrdinalIgnoreCase))
            {
                text = mode == "unknown"
                    ? "{\"category\":\"unknown\",\"limit\":5}"
                    : "{\"category\":\"resident_risk\",\"safehouseId\":null,\"metric\":null,\"limit\":5,\"sort\":\"score_desc\"}";
            }
            else if (body.Contains("trauma-informed case assistant", StringComparison.OrdinalIgnoreCase))
            {
                text = "{\"residentTag\":\"[[resident:2]]\",\"riskLevel\":\"High\",\"concern\":\"urgent safety\",\"action\":\"schedule follow-up\"}";
            }
            else
            {
                text = "1. [[resident:1]] high risk. 2. [[resident:999]] unknown.";
            }

            var payload = JsonSerializer.Serialize(new
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

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/json")
            };
        }
    }
}
