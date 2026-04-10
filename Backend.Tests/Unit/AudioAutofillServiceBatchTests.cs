using System.Net;
using System.Text;
using System.Text.Json;
using Backend.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace Backend.Tests.Unit;

public class AudioAutofillServiceBatchTests
{
    [Fact]
    public async Task GenerateProcessRecordingAutofillAsync_Throws_WhenApiKeyMissing()
    {
        using var client = new HttpClient(new DelegateHandler(_ =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))));

        var service = CreateService(client, includeApiKey: false);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.GenerateProcessRecordingAutofillAsync([1, 2, 3], "clip.mp3"));
    }

    [Fact]
    public async Task GenerateProcessRecordingAutofillAsync_UsesMimeMap_AndParsesSuccessPayload()
    {
        HttpRequestMessage? capturedRequest = null;
        string? capturedBody = null;
        var handler = new DelegateHandler(async request =>
        {
            capturedRequest = request;
            capturedBody = request.Content is null
                ? null
                : await request.Content.ReadAsStringAsync();

            var payload = BuildGeminiEnvelope(new
            {
                sessionDate = "2026-01-01",
                sessionType = "Group",
                emotionalStateObserved = "Calm",
                emotionalStateEnd = "Hopeful",
                sessionNarrative = "Narrative",
                interventionsApplied = "CBT",
                followUpActions = "Follow up",
                confidence = 0.93,
                missingFields = Array.Empty<string>()
            });

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/json")
            };
        });

        using var client = new HttpClient(handler);
        var service = CreateService(client, includeApiKey: true);

        var result = await service.GenerateProcessRecordingAutofillAsync([1, 2, 3], "session.wav");

        Assert.NotNull(capturedRequest);
        Assert.Contains("key=test-key", capturedRequest!.RequestUri!.ToString());
        Assert.NotNull(capturedBody);
        Assert.Contains("\"mimeType\":\"audio/wav\"", capturedBody);
        Assert.Equal("Group", result.SessionType);
        Assert.Equal("Calm", result.EmotionalStateObserved);
        Assert.Equal(0.93, result.Confidence);
    }

    [Fact]
    public async Task GenerateProcessRecordingAutofillAsync_UnknownExtension_FallsBackToAudioMpeg()
    {
        HttpRequestMessage? capturedRequest = null;
        string? capturedBody = null;
        var handler = new DelegateHandler(async request =>
        {
            capturedRequest = request;
            capturedBody = request.Content is null
                ? null
                : await request.Content.ReadAsStringAsync();
            var payload = BuildGeminiEnvelope(new
            {
                sessionDate = (string?)null,
                sessionType = "Individual",
                emotionalStateObserved = "Neutral",
                emotionalStateEnd = "Neutral",
                sessionNarrative = "Narrative",
                interventionsApplied = (string?)null,
                followUpActions = (string?)null,
                confidence = 0.5,
                missingFields = new[] { "sessionDate" }
            });

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/json")
            };
        });

        using var client = new HttpClient(handler);
        var service = CreateService(client, includeApiKey: true);

        _ = await service.GenerateProcessRecordingAutofillAsync([4, 5, 6], "recording.unknownext");

        Assert.NotNull(capturedRequest);
        Assert.NotNull(capturedBody);
        Assert.Contains("\"mimeType\":\"audio/mpeg\"", capturedBody);
    }

    [Fact]
    public async Task GenerateProcessRecordingAutofillAsync_InvalidEnumValues_AreNormalizedToNull()
    {
        var payload = BuildGeminiEnvelope(new
        {
            sessionDate = "2026-01-01",
            sessionType = "Couples",
            emotionalStateObserved = "Excited",
            emotionalStateEnd = "Frustrated",
            sessionNarrative = "Narrative",
            interventionsApplied = "CBT",
            followUpActions = "Follow up",
            confidence = 0.7,
            missingFields = Array.Empty<string>()
        });

        using var client = new HttpClient(new DelegateHandler(_ => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        })));
        var service = CreateService(client, includeApiKey: true);

        var result = await service.GenerateProcessRecordingAutofillAsync([7, 8, 9], "clip.mp3");

        Assert.Null(result.SessionType);
        Assert.Null(result.EmotionalStateObserved);
        Assert.Null(result.EmotionalStateEnd);
    }

    [Fact]
    public async Task GenerateProcessRecordingAutofillAsync_EmptyGeminiText_ReturnsConfidenceZero()
    {
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
                            new { text = "" }
                        }
                    }
                }
            }
        });

        using var client = new HttpClient(new DelegateHandler(_ => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        })));
        var service = CreateService(client, includeApiKey: true);

        var result = await service.GenerateProcessRecordingAutofillAsync([1], "clip.mp3");

        Assert.Equal(0, result.Confidence);
    }

    [Fact]
    public async Task GenerateProcessRecordingAutofillAsync_NonSuccessStatus_ThrowsExpectedHttpRequestException()
    {
        using var tooManyRequestsClient = new HttpClient(new DelegateHandler(_ => Task.FromResult(new HttpResponseMessage(HttpStatusCode.TooManyRequests)
        {
            Content = new StringContent("quota")
        })));
        var service429 = CreateService(tooManyRequestsClient, includeApiKey: true);
        var ex429 = await Assert.ThrowsAsync<HttpRequestException>(() =>
            service429.GenerateProcessRecordingAutofillAsync([1], "clip.mp3"));
        Assert.Equal(HttpStatusCode.TooManyRequests, ex429.StatusCode);
        Assert.Contains("quota exceeded", ex429.Message, StringComparison.OrdinalIgnoreCase);

        using var badGatewayClient = new HttpClient(new DelegateHandler(_ => Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadGateway)
        {
            Content = new StringContent("upstream")
        })));
        var service502 = CreateService(badGatewayClient, includeApiKey: true);
        var ex502 = await Assert.ThrowsAsync<HttpRequestException>(() =>
            service502.GenerateProcessRecordingAutofillAsync([1], "clip.mp3"));
        Assert.Equal(HttpStatusCode.BadGateway, ex502.StatusCode);
        Assert.Contains("Gemini API returned", ex502.Message);
    }

    [Fact]
    public async Task GenerateProcessRecordingAutofillAsync_InvalidGeminiJson_ReturnsConfidenceZero()
    {
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
                            new { text = "{\"sessionDate\":" }
                        }
                    }
                }
            }
        });

        using var client = new HttpClient(new DelegateHandler(_ => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        })));
        var service = CreateService(client, includeApiKey: true);

        var result = await service.GenerateProcessRecordingAutofillAsync([1], "clip.mp3");

        Assert.Equal(0, result.Confidence);
    }

    private static AudioAutofillService CreateService(HttpClient httpClient, bool includeApiKey)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Gemini:ApiKey"] = includeApiKey ? "test-key" : null
            })
            .Build();

        return new AudioAutofillService(httpClient, config, NullLogger<AudioAutofillService>.Instance);
    }

    private static string BuildGeminiEnvelope(object model)
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
                            new { text = JsonSerializer.Serialize(model) }
                        }
                    }
                }
            }
        });

    private sealed class DelegateHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> handler)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => handler(request);
    }
}