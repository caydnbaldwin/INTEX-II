using System.Net;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Integration;

public class BoardingEndpointTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Visitor_Cannot_Access_Boarding_Placements()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/boarding/placements");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Donor_Cannot_Access_Boarding_Placements()
    {
        var client = await TestAuthHelper.CreateDonorClientAsync(factory);

        var response = await client.GetAsync("/api/boarding/placements");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Create_And_List_Boarding_Placement()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await client.PostAsync("/api/boarding/placements", JsonContent(new
        {
            residentId = 7,
            safehouseId = 2,
            placementStatus = "Incoming",
            confidentialResidentName = "Maria Santos",
            bedLabel = "Room 2 / Bed B",
            expectedCheckIn = "2026-04-10",
            expectedCheckOut = "2026-06-12",
            sensitivities = "Loud hallway noise",
            specialConsiderations = "Needs school pickup coordination",
            relationshipSummary = "Sibling placement under review",
            childrenSummary = "No dependent children",
            placementNotes = "Intake packet pending signature"
        }));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var placementsResponse = await client.GetAsync("/api/boarding/placements");
        Assert.Equal(HttpStatusCode.OK, placementsResponse.StatusCode);

        var body = await placementsResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var placements = doc.RootElement.EnumerateArray().ToList();

        Assert.Contains(placements, placement =>
            placement.GetProperty("bedLabel").GetString() == "Room 2 / Bed B" &&
            placement.GetProperty("placementStatus").GetString() == "Incoming");
    }

    [Fact]
    public async Task Admin_Can_Create_Standing_Order_For_Placement()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var createPlacement = await client.PostAsync("/api/boarding/placements", JsonContent(new
        {
            residentId = 9,
            safehouseId = 3,
            placementStatus = "Current",
            confidentialResidentName = "Ana Reyes",
            bedLabel = "Room 1 / Bed A"
        }));

        Assert.Equal(HttpStatusCode.Created, createPlacement.StatusCode);

        var placementDoc = JsonDocument.Parse(await createPlacement.Content.ReadAsStringAsync()).RootElement;
        var placementId = placementDoc.GetProperty("boardingPlacementId").GetInt32();

        var createOrder = await client.PostAsync("/api/boarding/orders", JsonContent(new
        {
            boardingPlacementId = placementId,
            category = "Medical",
            title = "Waiting on lab results",
            details = "Follow up with clinic on Friday",
            dueDate = "2026-04-12",
            status = "Open"
        }));

        Assert.Equal(HttpStatusCode.Created, createOrder.StatusCode);

        var ordersResponse = await client.GetAsync($"/api/boarding/placements/{placementId}/orders");
        Assert.Equal(HttpStatusCode.OK, ordersResponse.StatusCode);

        var body = await ordersResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var orders = doc.RootElement.EnumerateArray().ToList();

        Assert.Contains(orders, order => order.GetProperty("title").GetString() == "Waiting on lab results");
    }

    [Fact]
    public async Task Boarding_Placements_Include_Incident_Details_For_Action_Items()
    {
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.BoardingPlacements.Add(new BoardingPlacement
            {
                BoardingPlacementId = 101,
                ResidentId = 25,
                SafehouseId = 4,
                PlacementStatus = "Current",
                BedLabel = "Bed 1"
            });
            db.IncidentReports.Add(new IncidentReport
            {
                IncidentId = 201,
                ResidentId = 25,
                SafehouseId = 4,
                IncidentDate = new DateOnly(2026, 4, 7),
                IncidentType = "SelfHarm",
                Severity = "High",
                Description = "Resident disclosed self-harm ideation.",
                Resolved = false,
                ReportedBy = "SW-11",
                FollowUpRequired = true,
                AssignedStaffUserId = "staff-user-11",
                AssignedStaffDisplayName = "Avery Cruz"
            });
            await db.SaveChangesAsync();
        }

        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var response = await client.GetAsync("/api/boarding/placements");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var placements = doc.RootElement.EnumerateArray().ToList();
        var placement = Assert.Single(placements,
            p => p.GetProperty("boardingPlacementId").GetInt32() == 101);

        Assert.True(placement.GetProperty("incidentActionRequired").GetBoolean());
        Assert.Equal(1, placement.GetProperty("incidentAlertCount").GetInt32());

        var incidents = placement.GetProperty("incidents").EnumerateArray().ToList();
        var incident = Assert.Single(incidents);

        Assert.Equal("SelfHarm", incident.GetProperty("incidentType").GetString());
        Assert.Equal("Avery Cruz", incident.GetProperty("assignedStaffDisplayName").GetString());
    }

    [Fact]
    public async Task Boarding_Placements_Do_Not_Treat_Resolved_Incidents_As_Action_Required()
    {
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.BoardingPlacements.Add(new BoardingPlacement
            {
                BoardingPlacementId = 102,
                ResidentId = 26,
                SafehouseId = 4,
                PlacementStatus = "Current",
                BedLabel = "Bed 2"
            });
            db.IncidentReports.Add(new IncidentReport
            {
                IncidentId = 202,
                ResidentId = 26,
                SafehouseId = 4,
                IncidentDate = new DateOnly(2025, 11, 7),
                IncidentType = "RunawayAttempt",
                Severity = "High",
                Description = "Resident briefly left the grounds without approval.",
                Resolved = true,
                ResolutionDate = new DateOnly(2025, 11, 15),
                ReportedBy = "SW-08",
                FollowUpRequired = true
            });
            await db.SaveChangesAsync();
        }

        var client = await TestAuthHelper.CreateAdminClientAsync(factory);

        var response = await client.GetAsync("/api/boarding/placements");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var placements = doc.RootElement.EnumerateArray().ToList();
        var placement = Assert.Single(placements,
            p => p.GetProperty("boardingPlacementId").GetInt32() == 102);

        Assert.False(placement.GetProperty("incidentActionRequired").GetBoolean());
        Assert.Equal(0, placement.GetProperty("incidentAlertCount").GetInt32());
        Assert.False(placement.GetProperty("incidentFollowUpRequired").GetBoolean());

        var incidents = placement.GetProperty("incidents").EnumerateArray().ToList();
        var incident = Assert.Single(incidents);

        Assert.True(incident.GetProperty("resolved").GetBoolean());
        Assert.False(incident.GetProperty("followUpRequired").GetBoolean());
        Assert.Equal("2025-11-15", incident.GetProperty("resolutionDate").GetString());
    }

    private static StringContent JsonContent(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
}
