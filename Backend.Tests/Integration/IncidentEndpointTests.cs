using System.Net;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Integration;

public class IncidentEndpointTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Staff_Can_Update_Incident_Assignment_And_Resolution()
    {
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.IncidentReports.Add(new IncidentReport
            {
                IncidentId = 1,
                ResidentId = 11,
                SafehouseId = 3,
                IncidentDate = new DateOnly(2026, 4, 8),
                IncidentType = "Security",
                Severity = "High",
                Description = "Resident reported an unsafe contact attempt.",
                ResponseTaken = null,
                Resolved = false,
                ReportedBy = "SW-04",
                FollowUpRequired = true
            });
            await db.SaveChangesAsync();
        }

        var client = await TestAuthHelper.CreateStaffClientAsync(factory);

        var response = await client.PutAsync("/api/incidents/1", JsonContent(new
        {
            incidentId = 1,
            residentId = 11,
            safehouseId = 3,
            incidentDate = "2026-04-08",
            incidentType = "Security",
            severity = "High",
            description = "Resident reported an unsafe contact attempt.",
            responseTaken = "Safety plan activated",
            resolved = true,
            resolutionDate = "2026-04-09",
            reportedBy = "SW-04",
            followUpRequired = false,
            assignedStaffUserId = "staff-user-1",
            assignedStaffDisplayName = "Jordan Lee"
        }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var verificationScope = factory.Services.CreateScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var incident = await verificationDb.IncidentReports.FindAsync(1);

        Assert.NotNull(incident);
        Assert.True(incident!.Resolved);
        Assert.Equal("Safety plan activated", incident.ResponseTaken);
        Assert.Equal("staff-user-1", incident.AssignedStaffUserId);
        Assert.Equal("Jordan Lee", incident.AssignedStaffDisplayName);
        Assert.False(incident.FollowUpRequired);
        Assert.Equal(new DateOnly(2026, 4, 9), incident.ResolutionDate);
    }

    private static StringContent JsonContent(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
}
