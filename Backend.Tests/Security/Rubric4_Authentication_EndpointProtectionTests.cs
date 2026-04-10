using System.Net;
using System.Text;

namespace Backend.Tests.Security;

/// <summary>
/// IS 414 Security Rubric — API Endpoint Authentication Enforcement — 1 pt
///
/// Rules:
///   - /login, /register, and /auth/me must NOT require auth (they would be useless).
///   - Preferences, MFA, and all CRUD endpoints must require authentication.
///   - Unauthenticated requests to protected endpoints return 401 Unauthorized.
///   - The rule applies to ALL verbs (GET, POST, PUT, DELETE).
/// </summary>
public class Rubric4_Authentication_EndpointProtectionTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _visitor = factory.CreateClient();

    // ── Public endpoints: must be accessible without credentials ─────────────

    [Fact]
    public async Task HealthCheck_Is_Public()
    {
        var response = await _visitor.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AuthMe_Is_Public()
    {
        // React calls /api/auth/me on every page load to check session state.
        var response = await _visitor.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Login_Endpoint_Is_Public()
    {
        // The login endpoint must not require auth — it IS the auth mechanism.
        // Wrong credentials → 401, but the endpoint itself must be reachable.
        var response = await _visitor.PostAsync(
            "/api/auth/login?useCookies=true",
            Json(new { email = "nobody@test.local", password = "BadPassword" }));

        // 401 = credentials wrong (correct) — 403 would mean the endpoint itself
        // requires a role, which would make it completely inaccessible.
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Protected: preferences (any authenticated user) ───────────────────────

    [Fact]
    public async Task GetTheme_Without_Auth_Returns_401()
    {
        var response = await _visitor.GetAsync("/api/preferences/theme");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SetTheme_Without_Auth_Returns_401()
    {
        var response = await _visitor.PostAsync("/api/preferences/theme",
            Json(new { theme = "dark" }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Protected: MFA management ─────────────────────────────────────────────

    [Fact]
    public async Task MfaStatus_Without_Auth_Returns_401()
    {
        var response = await _visitor.GetAsync("/api/mfa/status");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MfaSetup_Without_Auth_Returns_401()
    {
        var response = await _visitor.GetAsync("/api/mfa/setup");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MfaEnable_Without_Auth_Returns_401()
    {
        var response = await _visitor.PostAsync("/api/mfa/enable",
            Json(new { code = "123456" }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MfaDisable_Without_Auth_Returns_401()
    {
        var response = await _visitor.PostAsync("/api/mfa/disable",
            Json(new { }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Protected: resident CRUD ──────────────────────────────────────────────

    [Fact]
    public async Task CreateResident_Without_Auth_Returns_401()
    {
        var response = await _visitor.PostAsync("/api/residents",
            Json(new { caseStatus = "Active" }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateResident_Without_Auth_Returns_401()
    {
        var response = await _visitor.PutAsync("/api/residents/1",
            Json(new { caseStatus = "Closed" }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeleteResident_Without_Auth_Returns_401()
    {
        var response = await _visitor.DeleteAsync("/api/residents/1");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Protected: donation CRUD ──────────────────────────────────────────────

    [Fact]
    public async Task CreateDonation_Without_Auth_Returns_401()
    {
        var response = await _visitor.PostAsync("/api/donations",
            Json(new { donationType = "Monetary", amount = 100 }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDonation_Without_Auth_Returns_401()
    {
        var response = await _visitor.PutAsync("/api/donations/1",
            Json(new { amount = 200 }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Protected: donor-specific data ───────────────────────────────────────

    [Fact]
    public async Task DonorMyDonations_Without_Auth_Returns_401()
    {
        var response = await _visitor.GetAsync("/api/donor/my-donations");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Protected: process recordings ────────────────────────────────────────

    [Fact]
    public async Task CreateProcessRecording_Without_Auth_Returns_401()
    {
        var response = await _visitor.PostAsync("/api/process-recordings",
            Json(new { residentId = 1, sessionType = "Individual" }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Protected: home visitations ──────────────────────────────────────────

    [Fact]
    public async Task CreateHomeVisitation_Without_Auth_Returns_401()
    {
        var response = await _visitor.PostAsync("/api/home-visitations",
            Json(new { residentId = 1, visitType = "Routine Follow-Up" }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static StringContent Json(object body) =>
        new(System.Text.Json.JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
}
