using System.Net;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Integration;

public class ControllerBatch2HighImpactTests
{
    [Fact]
    public async Task Residents_AdminCrudAndRelatedEndpoints_Work()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await admin.PostAsync("/api/residents", Json(new
        {
            caseControlNo = "CASE-100",
            internalCode = "INT-100",
            safehouseId = 1,
            caseStatus = "Active",
            currentRiskLevel = "High",
            assignedSocialWorker = "Worker A"
        }));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var residentId = await ReadIdAsync(create, "residentId");

        var list = await admin.GetAsync("/api/residents?status=Active&riskLevel=High&search=CASE");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);

        var update = await admin.PutAsync($"/api/residents/{residentId}", Json(new
        {
            caseStatus = "Closed",
            currentRiskLevel = "Low"
        }));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.EducationRecords.Add(new EducationRecord
            {
                EducationRecordId = 9101,
                ResidentId = residentId,
                EducationLevel = "Grade 6"
            });
            db.HealthWellbeingRecords.Add(new HealthWellbeingRecord
            {
                HealthRecordId = 9201,
                ResidentId = residentId,
                GeneralHealthScore = 90
            });
            db.IncidentReports.Add(new IncidentReport
            {
                IncidentId = 9301,
                ResidentId = residentId,
                IncidentType = "Safety"
            });
            db.InterventionPlans.Add(new InterventionPlan
            {
                PlanId = 9401,
                ResidentId = residentId,
                Status = "Open",
                CaseConferenceDate = DateOnly.FromDateTime(DateTime.UtcNow),
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync($"/api/residents/{residentId}/education-records")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync($"/api/residents/{residentId}/health-records")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync($"/api/residents/{residentId}/incident-reports")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync($"/api/residents/{residentId}/intervention-plans")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/residents/case-conferences")).StatusCode);

        var delete = await admin.DeleteAsync($"/api/residents/{residentId}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task Supporters_AdminCrudAndDonationsEndpoint_Work()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await admin.PostAsync("/api/supporters", Json(new
        {
            supporterType = "MonetaryDonor",
            displayName = "Jane Donor",
            firstName = "Jane",
            lastName = "Donor",
            email = "jane@example.com"
        }));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var supporterId = await ReadIdAsync(create, "supporterId");

        var list = await admin.GetAsync("/api/supporters?type=MonetaryDonor&status=Active&search=Jane");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Donations.Add(new Donation
            {
                DonationId = 9501,
                SupporterId = supporterId,
                DonationType = "Monetary",
                Amount = 150,
                DonationDate = DateOnly.FromDateTime(DateTime.UtcNow)
            });
            await db.SaveChangesAsync();
        }

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync($"/api/supporters/{supporterId}/donations")).StatusCode);

        var update = await admin.PutAsync($"/api/supporters/{supporterId}", Json(new
        {
            displayName = "Jane Updated"
        }));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var delete = await admin.DeleteAsync($"/api/supporters/{supporterId}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task Safehouses_ReadEndpoints_WorkWithSeededData()
    {
        using var factory = new CustomWebApplicationFactory();
        var staff = await TestAuthHelper.CreateStaffClientAsync(factory);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Safehouses.Add(new Safehouse
            {
                SafehouseId = 9601,
                Name = "East House",
                Region = "Region II",
                Status = "Active",
                CapacityGirls = 30,
                CurrentOccupancy = 18
            });
            db.SafehouseMonthlyMetrics.Add(new SafehouseMonthlyMetric
            {
                MetricId = 9701,
                SafehouseId = 9601,
                ActiveResidents = 18,
                MonthStart = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30))
            });
            db.Residents.Add(new Resident
            {
                ResidentId = 9801,
                SafehouseId = 9601,
                CaseStatus = "Active"
            });
            db.IncidentReports.Add(new IncidentReport
            {
                IncidentId = 9901,
                SafehouseId = 9601,
                IncidentType = "Medical",
                IncidentDate = DateOnly.FromDateTime(DateTime.UtcNow)
            });
            await db.SaveChangesAsync();
        }

        Assert.Equal(HttpStatusCode.OK, (await staff.GetAsync("/api/safehouses")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await staff.GetAsync("/api/safehouses/9601")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await staff.GetAsync("/api/safehouses/9601/metrics")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await staff.GetAsync("/api/safehouses/9601/residents")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await staff.GetAsync("/api/safehouses/9601/incidents")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await staff.GetAsync("/api/safehouses/occupancy")).StatusCode);
    }

    private static StringContent Json(object payload)
        => new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    private static async Task<int> ReadIdAsync(HttpResponseMessage response, string propertyName)
    {
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.GetProperty(propertyName).GetInt32();
    }
}
