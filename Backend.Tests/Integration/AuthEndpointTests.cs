using System.Net;
using System.Text;
using System.Text.Json;

namespace Backend.Tests.Integration;

/// <summary>
/// Tests for /api/auth/* endpoints.
///
/// IS 414 grading anchors:
///   - /api/auth/me is public (no auth needed)
///   - Protected routes return 401/403 without credentials
///   - External login rejects unknown/unconfigured providers
/// </summary>
public class AuthEndpointTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    // ── GET /api/auth/me ──────────────────────────────────────────────────────

    [Fact]
    public async Task Me_Unauthenticated_Returns_200()
    {
        // /api/auth/me is explicitly public — React calls it on every page load.
        var response = await _client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Me_Unauthenticated_Returns_IsAuthenticated_False()
    {
        var response = await _client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.False(doc.RootElement.GetProperty("isAuthenticated").GetBoolean());
    }

    [Fact]
    public async Task Me_Unauthenticated_Returns_Empty_Roles()
    {
        var response = await _client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        var roles = doc.RootElement.GetProperty("roles").EnumerateArray().ToList();
        Assert.Empty(roles);
    }

    [Fact]
    public async Task Me_Unauthenticated_Returns_Null_Email_And_Username()
    {
        var response = await _client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.Equal(JsonValueKind.Null, doc.RootElement.GetProperty("email").ValueKind);
        Assert.Equal(JsonValueKind.Null, doc.RootElement.GetProperty("userName").ValueKind);
    }

    // ── GET /api/auth/providers ───────────────────────────────────────────────

    [Fact]
    public async Task Providers_Returns_200()
    {
        var response = await _client.GetAsync("/api/auth/providers");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Providers_Returns_Empty_Array_When_Google_Not_Configured()
    {
        // The test factory does not configure Google credentials,
        // so the providers list should be empty.
        var response = await _client.GetAsync("/api/auth/providers");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    // ── GET /api/auth/external-login ─────────────────────────────────────────

    [Fact]
    public async Task ExternalLogin_Unknown_Provider_Returns_BadRequest()
    {
        var response = await _client.GetAsync("/api/auth/external-login?provider=Unknown");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ExternalLogin_Google_When_Not_Configured_Returns_BadRequest()
    {
        // Google is valid by name but not configured in the test environment.
        var response = await _client.GetAsync("/api/auth/external-login?provider=Google");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────────────

    [Fact]
    public async Task Logout_Returns_200_Even_When_Not_Authenticated()
    {
        // SignOutAsync is idempotent — logging out without a session is safe.
        var response = await _client.PostAsync("/api/auth/logout",
            new StringContent("{}", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
