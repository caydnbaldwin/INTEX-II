using System.Net;
using System.Text;

namespace Backend.Tests.Integration;

/// <summary>
/// Verifies that all MFA endpoints enforce authentication.
///
/// IS 414 grading anchor: "All CUD endpoints and sensitive read endpoints require auth.
/// Hitting a protected API endpoint without a token returns 401/403."
/// </summary>
public class MfaEndpointTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetStatus_Without_Auth_Returns_401()
    {
        var response = await _client.GetAsync("/api/mfa/status");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetSetup_Without_Auth_Returns_401()
    {
        var response = await _client.GetAsync("/api/mfa/setup");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Enable_Without_Auth_Returns_401()
    {
        var payload = new StringContent(
            """{"code":"123456"}""", Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/mfa/enable", payload);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Disable_Without_Auth_Returns_401()
    {
        var response = await _client.PostAsync("/api/mfa/disable",
            new StringContent("{}", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
