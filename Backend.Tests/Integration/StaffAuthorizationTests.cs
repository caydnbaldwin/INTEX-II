using System.Net;

namespace Backend.Tests.Integration;

public class StaffAuthorizationTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Staff_Can_Read_Operational_Endpoints()
    {
        var client = await TestAuthHelper.CreateStaffClientAsync(factory);

        var residents = await client.GetAsync("/api/residents");
        var visitations = await client.GetAsync("/api/home-visitations");
        var recordings = await client.GetAsync("/api/process-recordings");
        var boarding = await client.GetAsync("/api/boarding/placements");

        Assert.Equal(HttpStatusCode.OK, residents.StatusCode);
        Assert.Equal(HttpStatusCode.OK, visitations.StatusCode);
        Assert.Equal(HttpStatusCode.OK, recordings.StatusCode);
        Assert.Equal(HttpStatusCode.OK, boarding.StatusCode);
    }

    [Fact]
    public async Task Staff_Cannot_Write_Operational_Endpoints()
    {
        var client = await TestAuthHelper.CreateStaffClientAsync(factory);

        var residentCreate = await client.PostAsync("/api/residents", JsonContent(new
        {
            internalCode = "STAFF-RES-001",
            caseStatus = "Active"
        }));

        var visitationCreate = await client.PostAsync("/api/home-visitations", JsonContent(new
        {
            residentId = 1,
            visitDate = "2026-04-08",
            visitType = "Routine Follow-Up"
        }));

        var recordingCreate = await client.PostAsync("/api/process-recordings", JsonContent(new
        {
            residentId = 1,
            sessionDate = "2026-04-08",
            sessionType = "Individual",
            sessionNarrative = "Staff should not be able to write."
        }));

        var placementCreate = await client.PostAsync("/api/boarding/placements", JsonContent(new
        {
            safehouseId = 2,
            placementStatus = "Incoming"
        }));

        Assert.Equal(HttpStatusCode.Forbidden, residentCreate.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, visitationCreate.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, recordingCreate.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, placementCreate.StatusCode);
    }

    [Fact]
    public async Task Staff_Cannot_Access_Admin_Only_Funding_Endpoints()
    {
        var client = await TestAuthHelper.CreateStaffClientAsync(factory);

        var supporters = await client.GetAsync("/api/supporters");
        var donations = await client.GetAsync("/api/donations");
        var reports = await client.GetAsync("/api/reports/risk-distribution");

        Assert.Equal(HttpStatusCode.Forbidden, supporters.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, donations.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, reports.StatusCode);
    }

    private static StringContent JsonContent(object payload) =>
        new(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
}
