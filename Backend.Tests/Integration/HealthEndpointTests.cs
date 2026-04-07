using System.Net;
using System.Text.Json;

namespace Backend.Tests.Integration;

public class HealthEndpointTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Health_Returns_200()
    {
        var response = await _client.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Health_Returns_Message_Field()
    {
        var response = await _client.GetAsync("/api/health");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.True(doc.RootElement.TryGetProperty("message", out _),
            "Response body should contain a 'message' field.");
    }
}
