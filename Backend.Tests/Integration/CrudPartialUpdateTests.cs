using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Integration;

public class CrudPartialUpdateTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Resident_Update_Preserves_Unspecified_Fields()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await client.PostAsync("/api/residents", JsonContent(new
        {
            internalCode = "RES-PARTIAL-001",
            caseControlNo = "CASE-PARTIAL-001",
            caseStatus = "Active",
            currentRiskLevel = "High",
            assignedSocialWorker = "Original Worker",
            religion = "Islam"
        }));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = JsonDocument.Parse(await create.Content.ReadAsStringAsync()).RootElement;
        var residentId = created.GetProperty("residentId").GetInt32();

        var update = await client.PutAsync($"/api/residents/{residentId}", JsonContent(new
        {
            caseStatus = "Closed"
        }));

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var updated = JsonDocument.Parse(await update.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Closed", updated.GetProperty("caseStatus").GetString());
        Assert.Equal("Original Worker", updated.GetProperty("assignedSocialWorker").GetString());
        Assert.Equal("Islam", updated.GetProperty("religion").GetString());
        Assert.Equal("RES-PARTIAL-001", updated.GetProperty("internalCode").GetString());
    }

    [Fact]
    public async Task Supporter_Update_Preserves_Status_And_Channel_When_Omitted()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await client.PostAsync("/api/supporters", JsonContent(new
        {
            displayName = "Pat Rivera",
            email = "pat.rivera@test.local",
            supporterType = "MonetaryDonor",
            acquisitionChannel = "Event",
            status = "Inactive"
        }));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = JsonDocument.Parse(await create.Content.ReadAsStringAsync()).RootElement;
        var supporterId = created.GetProperty("supporterId").GetInt32();

        var update = await client.PutAsync($"/api/supporters/{supporterId}", JsonContent(new
        {
            displayName = "Pat Rivera Updated"
        }));

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var updated = JsonDocument.Parse(await update.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Pat Rivera Updated", updated.GetProperty("displayName").GetString());
        Assert.Equal("Inactive", updated.GetProperty("status").GetString());
        Assert.Equal("Event", updated.GetProperty("acquisitionChannel").GetString());
    }

    [Fact]
    public async Task Donation_Update_Preserves_Metadata_When_Omitted()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await client.PostAsync("/api/donations", JsonContent(new
        {
            supporterId = 42,
            donationType = "Monetary",
            donationDate = "2026-04-08",
            campaignName = "Spring Drive",
            channelSource = "Direct",
            currencyCode = "PHP",
            amount = 500,
            impactUnit = "pesos",
            notes = "Original note"
        }));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = JsonDocument.Parse(await create.Content.ReadAsStringAsync()).RootElement;
        var donationId = created.GetProperty("donationId").GetInt32();

        var update = await client.PutAsync($"/api/donations/{donationId}", JsonContent(new
        {
            amount = 750
        }));

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var updated = JsonDocument.Parse(await update.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(750m, updated.GetProperty("amount").GetDecimal());
        Assert.Equal("Spring Drive", updated.GetProperty("campaignName").GetString());
        Assert.Equal("Direct", updated.GetProperty("channelSource").GetString());
        Assert.Equal("PHP", updated.GetProperty("currencyCode").GetString());
        Assert.Equal("Original note", updated.GetProperty("notes").GetString());
    }

    [Fact]
    public async Task HomeVisitation_Update_Preserves_Unedited_Fields()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await client.PostAsync("/api/home-visitations", JsonContent(new
        {
            residentId = 1,
            visitDate = "2026-04-08",
            socialWorker = "Jordan Lee",
            visitType = "Routine Follow-Up",
            locationVisited = "Family Home",
            familyMembersPresent = "Mother",
            purpose = "Regular check-in",
            followUpNotes = "Call next week",
            visitOutcome = "Stable"
        }));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = JsonDocument.Parse(await create.Content.ReadAsStringAsync()).RootElement;
        var visitationId = created.GetProperty("visitationId").GetInt32();

        var update = await client.PutAsync($"/api/home-visitations/{visitationId}", JsonContent(new
        {
            observations = "Observed improvement",
            followUpNeeded = true
        }));

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var updated = JsonDocument.Parse(await update.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Observed improvement", updated.GetProperty("observations").GetString());
        Assert.True(updated.GetProperty("followUpNeeded").GetBoolean());
        Assert.Equal("Family Home", updated.GetProperty("locationVisited").GetString());
        Assert.Equal("Mother", updated.GetProperty("familyMembersPresent").GetString());
        Assert.Equal("Regular check-in", updated.GetProperty("purpose").GetString());
        Assert.Equal("Call next week", updated.GetProperty("followUpNotes").GetString());
    }

    [Fact]
    public async Task ProcessRecording_Update_Preserves_Restricted_Notes_When_Omitted()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await client.PostAsync("/api/process-recordings", JsonContent(new
        {
            residentId = 1,
            sessionDate = "2026-04-08",
            socialWorker = "Mika Tan",
            sessionType = "Individual",
            emotionalStateObserved = "Calm",
            sessionNarrative = "Initial session",
            interventionsApplied = "Supportive counseling",
            followUpActions = "Continue monitoring",
            notesRestricted = "Confidential note"
        }));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = JsonDocument.Parse(await create.Content.ReadAsStringAsync()).RootElement;
        var recordingId = created.GetProperty("recordingId").GetInt32();

        var update = await client.PutAsync($"/api/process-recordings/{recordingId}", JsonContent(new
        {
            followUpActions = "Escalate to supervisor"
        }));

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var updated = JsonDocument.Parse(await update.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Escalate to supervisor", updated.GetProperty("followUpActions").GetString());
        Assert.Equal("Confidential note", updated.GetProperty("notesRestricted").GetString());
        Assert.Equal("Initial session", updated.GetProperty("sessionNarrative").GetString());
    }

    [Fact]
    public async Task BoardingPlacement_Update_Preserves_NonEdited_Details()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await client.PostAsync("/api/boarding/placements", JsonContent(new
        {
            residentId = 8,
            safehouseId = 2,
            placementStatus = "Incoming",
            bedLabel = "Bed A",
            sensitivities = "Noise sensitivity",
            placementNotes = "Original note"
        }));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = JsonDocument.Parse(await create.Content.ReadAsStringAsync()).RootElement;
        var placementId = created.GetProperty("boardingPlacementId").GetInt32();

        var update = await client.PutAsync($"/api/boarding/placements/{placementId}", JsonContent(new
        {
            placementStatus = "Current",
            actualCheckIn = "2026-04-08"
        }));

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var updated = JsonDocument.Parse(await update.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Current", updated.GetProperty("placementStatus").GetString());
        Assert.Equal("2026-04-08", updated.GetProperty("actualCheckIn").GetString());
        Assert.Equal("Bed A", updated.GetProperty("bedLabel").GetString());
        Assert.Equal("Noise sensitivity", updated.GetProperty("sensitivities").GetString());
        Assert.Equal("Original note", updated.GetProperty("placementNotes").GetString());
    }

    [Fact]
    public async Task Incident_Update_Preserves_Assignment_When_Other_Fields_Change()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var createPlacement = await client.PostAsync("/api/boarding/placements", JsonContent(new
        {
            residentId = 17,
            safehouseId = 4,
            placementStatus = "Current",
            bedLabel = "Bed 5"
        }));

        Assert.Equal(HttpStatusCode.Created, createPlacement.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<Backend.Data.AppDbContext>();
            db.IncidentReports.Add(new Backend.Models.IncidentReport
            {
                IncidentId = 9001,
                ResidentId = 17,
                SafehouseId = 4,
                IncidentDate = new DateOnly(2026, 4, 8),
                IncidentType = "Behavioral",
                Severity = "Medium",
                Description = "Original incident",
                AssignedStaffUserId = "staff-17",
                AssignedStaffDisplayName = "Jordan Miles"
            });
            await db.SaveChangesAsync();
        }

        var update = await client.PutAsync("/api/incidents/9001", JsonContent(new
        {
            responseTaken = "Safety plan activated"
        }));

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var updated = JsonDocument.Parse(await update.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Safety plan activated", updated.GetProperty("responseTaken").GetString());
        Assert.Equal("Jordan Miles", updated.GetProperty("assignedStaffDisplayName").GetString());
        Assert.Equal("staff-17", updated.GetProperty("assignedStaffUserId").GetString());
        Assert.Equal("Original incident", updated.GetProperty("description").GetString());
    }

    private static StringContent JsonContent(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
}
