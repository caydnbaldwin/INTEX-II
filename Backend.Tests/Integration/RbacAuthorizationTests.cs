using System.Net;
using System.Text.Json;

namespace Backend.Tests.Integration;

/// <summary>
/// Role-Based Access Control tests per IS 414 RBAC requirement and REQUIREMENTS.md:
///
///   "Only admin role can Create, Update, Delete data (including API endpoints).
///    Donor role can only view own donation history and impact.
///    Visitors see only public pages.
///    Done when: A donor user cannot access admin endpoints;
///    an unauthenticated user cannot access donor endpoints."
///
/// Three principals are exercised against every protected surface:
///   1. Visitor  — unauthenticated (no session)
///   2. Donor    — authenticated, Donor role
///   3. Admin    — authenticated, Admin role
///
/// PENDING ROUTES: Admin CRUD endpoints for residents, donations, process recordings,
/// home visitations, etc. are not yet built. Placeholder comments mark exactly where
/// those tests belong. Each placeholder includes the expected status code so the
/// contract is captured before implementation begins.
/// </summary>
public class RbacAuthorizationTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    // ── Visitor — public endpoints accessible ────────────────────────────────

    [Fact]
    public async Task Visitor_Can_Access_Health()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Visitor_Can_Access_AuthMe()
    {
        // /api/auth/me is explicitly public — React calls it on every page load.
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Visitor_AuthMe_Shows_IsAuthenticated_False()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.False(doc.RootElement.GetProperty("isAuthenticated").GetBoolean());
    }

    [Fact]
    public async Task Visitor_AuthMe_Shows_Empty_Roles()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.Empty(doc.RootElement.GetProperty("roles").EnumerateArray());
    }

    // ── Visitor — auth-required endpoints blocked ────────────────────────────

    [Fact]
    public async Task Visitor_Cannot_Access_Preferences_Get()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/preferences/theme");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Visitor_Cannot_Access_Preferences_Post()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsync("/api/preferences/theme",
            new StringContent("""{"theme":"dark"}""", System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Visitor_Cannot_Access_MfaStatus()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/mfa/status");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Visitor_Cannot_Access_MfaSetup()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/mfa/setup");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Admin — session verified, role confirmed ─────────────────────────────

    [Fact]
    public async Task Admin_AuthMe_IsAuthenticated_True()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.True(doc.RootElement.GetProperty("isAuthenticated").GetBoolean());
    }

    [Fact]
    public async Task Admin_AuthMe_Has_Admin_Role()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        var roles = doc.RootElement.GetProperty("roles")
            .EnumerateArray()
            .Select(r => r.GetString())
            .ToList();

        Assert.Contains("Admin", roles);
    }

    [Fact]
    public async Task Admin_AuthMe_Does_Not_Have_Donor_Role()
    {
        // Admin and Donor are separate roles. An admin seeded user should not
        // accidentally accumulate the Donor role.
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        var roles = doc.RootElement.GetProperty("roles")
            .EnumerateArray()
            .Select(r => r.GetString())
            .ToList();

        Assert.DoesNotContain("Donor", roles);
    }

    [Fact]
    public async Task Admin_Can_Access_Preferences()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var response = await client.GetAsync("/api/preferences/theme");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Access_MfaStatus()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var response = await client.GetAsync("/api/mfa/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Donor — session verified, role confirmed ─────────────────────────────

    [Fact]
    public async Task Donor_AuthMe_IsAuthenticated_True()
    {
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.True(doc.RootElement.GetProperty("isAuthenticated").GetBoolean());
    }

    [Fact]
    public async Task Donor_AuthMe_Has_Donor_Role()
    {
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        var roles = doc.RootElement.GetProperty("roles")
            .EnumerateArray()
            .Select(r => r.GetString())
            .ToList();

        Assert.Contains("Donor", roles);
    }

    [Fact]
    public async Task Donor_AuthMe_Does_Not_Have_Admin_Role()
    {
        // IS 414 RBAC: Donor must not have elevated privileges.
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        var roles = doc.RootElement.GetProperty("roles")
            .EnumerateArray()
            .Select(r => r.GetString())
            .ToList();

        Assert.DoesNotContain("Admin", roles);
    }

    [Fact]
    public async Task Donor_Can_Access_Preferences()
    {
        // Preferences is open to any authenticated user regardless of role.
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await client.GetAsync("/api/preferences/theme");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Donor_Can_Access_MfaStatus()
    {
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await client.GetAsync("/api/mfa/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── PENDING: Admin-only CRUD routes ──────────────────────────────────────
    // These tests document the IS 414 requirement before the routes are built.
    // Activate each block by removing the /* */ comment wrappers once the
    // corresponding controller + [Authorize(Policy = AuthPolicies.AdminOnly)]
    // decoration exist.
    //
    // Per REQUIREMENTS.md (IS 414 RBAC):
    //   "Only admin role can Create, Update, Delete data (including API endpoints)."
    //   "Done when: A donor user cannot access admin endpoints."
    //
    // ── Residents (Caseload Inventory) ────────────────────────────────────────
    //
    // [Fact]
    // public async Task Donor_Cannot_Create_Resident()
    // {
    //     var client = await TestAuthHelper.CreateDonorClientAsync(factory);
    //     var response = await client.PostAsync("/api/residents", /* resident payload */);
    //     Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    // }
    //
    // [Fact]
    // public async Task Donor_Cannot_Update_Resident()
    // {
    //     var client = await TestAuthHelper.CreateDonorClientAsync(factory);
    //     var response = await client.PutAsync("/api/residents/1", /* payload */);
    //     Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    // }
    //
    // [Fact]
    // public async Task Donor_Cannot_Delete_Resident()
    // {
    //     var client = await TestAuthHelper.CreateDonorClientAsync(factory);
    //     var response = await client.DeleteAsync("/api/residents/1");
    //     Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    // }
    //
    // [Fact]
    // public async Task Admin_Can_Create_Resident()
    // {
    //     var client = await TestAuthHelper.CreateAdminClientAsync(factory);
    //     var response = await client.PostAsync("/api/residents", /* resident payload */);
    //     Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    // }
    //
    // ── Donations / Supporters ────────────────────────────────────────────────
    //
    // [Fact]
    // public async Task Donor_Cannot_Create_Donation()
    // {
    //     var client = await TestAuthHelper.CreateDonorClientAsync(factory);
    //     var response = await client.PostAsync("/api/donations", /* payload */);
    //     Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    // }
    //
    // [Fact]
    // public async Task Admin_Can_Create_Donation()
    // {
    //     var client = await TestAuthHelper.CreateAdminClientAsync(factory);
    //     var response = await client.PostAsync("/api/donations", /* payload */);
    //     Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    // }
    //
    // ── Process Recordings ────────────────────────────────────────────────────
    //
    // [Fact]
    // public async Task Donor_Cannot_Create_ProcessRecording()
    // {
    //     var client = await TestAuthHelper.CreateDonorClientAsync(factory);
    //     var response = await client.PostAsync("/api/process-recordings", /* payload */);
    //     Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    // }
    //
    // ── Home Visitations ──────────────────────────────────────────────────────
    //
    // [Fact]
    // public async Task Donor_Cannot_Create_HomeVisitation()
    // {
    //     var client = await TestAuthHelper.CreateDonorClientAsync(factory);
    //     var response = await client.PostAsync("/api/home-visitations", /* payload */);
    //     Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    // }
    //
    // ── Visitor blocked from ALL auth-required routes ─────────────────────────
    //
    // [Fact]
    // public async Task Visitor_Cannot_Create_Resident()
    // {
    //     var client = factory.CreateClient();
    //     var response = await client.PostAsync("/api/residents", /* payload */);
    //     Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    // }
}
