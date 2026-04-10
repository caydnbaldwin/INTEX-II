using System.Net;
using System.Text;
using System.Text.Json;

namespace Backend.Tests.Security;

/// <summary>
/// IS 414 Security Rubric — Role-Based Access Control (RBAC) — 1.5 pts
///
/// Three principals are exercised against every protected surface:
///   Visitor  — unauthenticated (no session cookie)
///   Donor    — authenticated, Donor role only
///   Admin    — authenticated, Admin role
///   Staff    — authenticated, Staff role (read-only operational access)
///
/// Rules enforced:
///   - Only Admin can Create, Update, Delete data.
///   - Only Donor role can access the donor portal (/api/donor/*).
///   - Visitors receive 401 Unauthorized on all protected resources.
///   - Non-admin authenticated users receive 403 Forbidden on admin-only routes.
/// </summary>
public class Rubric5_Rbac_AuthorizationTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    // ── Role assignment: Admin ────────────────────────────────────────────────

    [Fact]
    public async Task Admin_AuthMe_Shows_Admin_Role()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var roles = await GetRolesAsync(client);
        Assert.Contains("Admin", roles);
    }

    [Fact]
    public async Task Admin_AuthMe_Does_Not_Show_Donor_Role()
    {
        // Admin and Donor are separate roles — no cross-contamination.
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var roles = await GetRolesAsync(client);
        Assert.DoesNotContain("Donor", roles);
    }

    // ── Role assignment: Donor ────────────────────────────────────────────────

    [Fact]
    public async Task Donor_AuthMe_Shows_Donor_Role()
    {
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var roles = await GetRolesAsync(client);
        Assert.Contains("Donor", roles);
    }

    [Fact]
    public async Task Donor_AuthMe_Does_Not_Show_Admin_Role()
    {
        // Privilege escalation must be impossible — Donor must never gain Admin.
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var roles = await GetRolesAsync(client);
        Assert.DoesNotContain("Admin", roles);
    }

    // ── Visitor: public endpoints only ────────────────────────────────────────

    [Fact]
    public async Task Visitor_Can_Access_Health()
    {
        var response = await factory.CreateClient().GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Visitor_Can_Access_AuthMe()
    {
        var response = await factory.CreateClient().GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Visitor_AuthMe_IsAuthenticated_Is_False()
    {
        var doc = await GetJsonAsync(factory.CreateClient(), "/api/auth/me");
        Assert.False(doc.RootElement.GetProperty("isAuthenticated").GetBoolean());
    }

    [Fact]
    public async Task Visitor_Cannot_Create_Resident()
    {
        var response = await factory.CreateClient().PostAsync("/api/residents",
            Json(new { caseStatus = "Active", caseControlNo = "VIS-001" }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Visitor_Cannot_Create_Donation()
    {
        var response = await factory.CreateClient().PostAsync("/api/donations",
            Json(new { donationType = "Monetary", amount = 100 }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Visitor_Cannot_Access_Donor_Portal()
    {
        var response = await factory.CreateClient().GetAsync("/api/donor/my-donations");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Donor: donor portal access, no admin CRUD ─────────────────────────────

    [Fact]
    public async Task Donor_Can_Access_Own_Donations()
    {
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await client.GetAsync("/api/donor/my-donations");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Donor_Cannot_Create_Resident()
    {
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await client.PostAsync("/api/residents",
            Json(new
            {
                caseControlNo = "DONOR-001",
                caseStatus = "Active",
                currentRiskLevel = "Medium",
                caseCategory = "Neglected",
                assignedSocialWorker = "Test Worker"
            }));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Donor_Cannot_Update_Resident()
    {
        // Create a resident as admin, then attempt update as donor.
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);
        var create = await admin.PostAsync("/api/residents",
            Json(new
            {
                caseControlNo = "DONOR-UPD-001",
                caseStatus = "Active",
                currentRiskLevel = "Low",
                caseCategory = "Neglected",
                assignedSocialWorker = "Worker"
            }));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var id = ParseId(await create.Content.ReadAsStringAsync(), "residentId");

        var donor = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await donor.PutAsync($"/api/residents/{id}",
            Json(new { caseStatus = "Closed" }));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Donor_Cannot_Delete_Resident()
    {
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);
        var create = await admin.PostAsync("/api/residents",
            Json(new
            {
                caseControlNo = "DONOR-DEL-001",
                caseStatus = "Active",
                currentRiskLevel = "Low",
                caseCategory = "Neglected",
                assignedSocialWorker = "Worker"
            }));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var id = ParseId(await create.Content.ReadAsStringAsync(), "residentId");

        var donor = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await donor.DeleteAsync($"/api/residents/{id}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Donor_Cannot_Create_Donation_As_Admin_Action()
    {
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await client.PostAsync("/api/donations",
            Json(new
            {
                donationType = "Monetary",
                donationDate = "2026-04-10",
                channelSource = "Direct",
                currencyCode = "PHP",
                amount = 500,
                impactUnit = "pesos",
                isRecurring = false
            }));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Donor_Cannot_Create_ProcessRecording()
    {
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await client.PostAsync("/api/process-recordings",
            Json(new
            {
                residentId = 1,
                sessionDate = "2026-04-10",
                socialWorker = "Worker",
                sessionType = "Individual",
                sessionNarrative = "RBAC test"
            }));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Donor_Cannot_Create_HomeVisitation()
    {
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);
        var response = await client.PostAsync("/api/home-visitations",
            Json(new
            {
                residentId = 1,
                visitDate = "2026-04-10",
                socialWorker = "Worker",
                visitType = "Routine Follow-Up"
            }));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── Admin: full Create, Update, Delete access ─────────────────────────────

    [Fact]
    public async Task Admin_Can_Create_Resident()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var response = await client.PostAsync("/api/residents",
            Json(new
            {
                caseControlNo = "ADMIN-CRE-001",
                caseStatus = "Active",
                currentRiskLevel = "Medium",
                caseCategory = "Neglected",
                assignedSocialWorker = "Test Worker"
            }));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Update_Resident()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var create = await client.PostAsync("/api/residents",
            Json(new
            {
                caseControlNo = "ADMIN-UPD-001",
                caseStatus = "Active",
                currentRiskLevel = "Medium",
                caseCategory = "Neglected",
                assignedSocialWorker = "Worker"
            }));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var id = ParseId(await create.Content.ReadAsStringAsync(), "residentId");

        var update = await client.PutAsync($"/api/residents/{id}",
            Json(new { caseStatus = "Closed" }));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Delete_Resident()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var create = await client.PostAsync("/api/residents",
            Json(new
            {
                caseControlNo = "ADMIN-DEL-001",
                caseStatus = "Active",
                currentRiskLevel = "Low",
                caseCategory = "Neglected",
                assignedSocialWorker = "Worker"
            }));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var id = ParseId(await create.Content.ReadAsStringAsync(), "residentId");

        var delete = await client.DeleteAsync($"/api/residents/{id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Create_Donation()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var response = await client.PostAsync("/api/donations",
            Json(new
            {
                donationType = "Monetary",
                donationDate = "2026-04-10",
                channelSource = "Direct",
                currencyCode = "PHP",
                amount = 1000,
                estimatedValue = 1000,
                impactUnit = "pesos",
                isRecurring = false,
                campaignName = "RBAC Test"
            }));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Create_ProcessRecording()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var response = await client.PostAsync("/api/process-recordings",
            Json(new
            {
                residentId = 1,
                sessionDate = "2026-04-10",
                socialWorker = "Test Worker",
                sessionType = "Individual",
                emotionalStateObserved = "Calm",
                sessionNarrative = "RBAC test",
                interventionsApplied = "Supportive counseling",
                followUpActions = "Continue monitoring"
            }));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Create_HomeVisitation()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var response = await client.PostAsync("/api/home-visitations",
            Json(new
            {
                residentId = 1,
                visitDate = "2026-04-10",
                socialWorker = "Test Worker",
                visitType = "RoutineFollowUp",
                observations = "RBAC test",
                familyCooperationLevel = "Cooperative",
                followUpNeeded = false,
                visitOutcome = "Favorable"
            }));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // ── Staff: read-only operational access, no writes ────────────────────────

    [Fact]
    public async Task Staff_Can_Read_Residents()
    {
        var client = await TestAuthHelper.CreateStaffClientAsync(factory);
        var response = await client.GetAsync("/api/residents");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Staff_Cannot_Create_Resident()
    {
        var client = await TestAuthHelper.CreateStaffClientAsync(factory);
        var response = await client.PostAsync("/api/residents",
            Json(new { caseStatus = "Active", caseControlNo = "STAFF-001" }));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Staff_Cannot_Create_Supporter()
    {
        // Staff can read supporters (StaffOrAdmin policy) but cannot create them
        // (AdminOnly policy on the POST endpoint).
        var client = await TestAuthHelper.CreateStaffClientAsync(factory);
        var response = await client.PostAsync("/api/supporters",
            Json(new
            {
                displayName = "Staff Test Supporter",
                email = "staff-test@test.local",
                supporterType = "MonetaryDonor"
            }));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Staff_Cannot_Access_Admin_Only_Donations_Endpoint()
    {
        var client = await TestAuthHelper.CreateStaffClientAsync(factory);
        var response = await client.GetAsync("/api/donations");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static StringContent Json(object body) =>
        new(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

    private static async Task<List<string?>> GetRolesAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/auth/me");
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("roles")
            .EnumerateArray().Select(r => r.GetString()).ToList();
    }

    private static async Task<JsonDocument> GetJsonAsync(HttpClient client, string url)
    {
        var response = await client.GetAsync(url);
        return JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    }

    private static int ParseId(string json, string property) =>
        JsonDocument.Parse(json).RootElement.GetProperty(property).GetInt32();
}
