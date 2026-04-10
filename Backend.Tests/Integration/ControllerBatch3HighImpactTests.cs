using System.Net;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Integration;

public class ControllerBatch3HighImpactTests
{
    [Fact]
    public async Task Boarding_PlacementsAndOrders_CoverCoreFlows()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Safehouses.Add(new Safehouse { SafehouseId = 1111, Name = "Alpha", Region = "R1", Status = "Active" });
            db.Residents.Add(new Resident { ResidentId = 2111, SafehouseId = 1111, CaseStatus = "Active", InternalCode = "R-2111" });
            await db.SaveChangesAsync();
        }

        var createPlacement = await admin.PostAsync("/api/boarding/placements", Json(new
        {
            residentId = 2111,
            safehouseId = 1111,
            placementStatus = "Incoming",
            bedLabel = "Bed 1"
        }));
        Assert.Equal(HttpStatusCode.Created, createPlacement.StatusCode);
        var placementId = await ReadIdAsync(createPlacement, "boardingPlacementId");

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/boarding/placements?status=Incoming&safehouseId=1111&residentId=2111")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync($"/api/boarding/placements/{placementId}")).StatusCode);

        var updatePlacement = await admin.PutAsync($"/api/boarding/placements/{placementId}", Json(new
        {
            placementStatus = "CheckedOut"
        }));
        Assert.Equal(HttpStatusCode.OK, updatePlacement.StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/boarding/placements?status=Historical")).StatusCode);

        var invalidOrder = await admin.PostAsync("/api/boarding/orders", Json(new
        {
            boardingPlacementId = 99999,
            title = "Bad",
            status = "Open"
        }));
        Assert.Equal(HttpStatusCode.BadRequest, invalidOrder.StatusCode);

        var createOrder = await admin.PostAsync("/api/boarding/orders", Json(new
        {
            boardingPlacementId = placementId,
            category = "Safety",
            title = "Check-in",
            status = "Open"
        }));
        Assert.Equal(HttpStatusCode.Created, createOrder.StatusCode);
        var orderId = await ReadIdAsync(createOrder, "boardingStandingOrderId");

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync($"/api/boarding/placements/{placementId}/orders")).StatusCode);

        var updateOrder = await admin.PutAsync($"/api/boarding/orders/{orderId}", Json(new
        {
            status = "Completed"
        }));
        Assert.Equal(HttpStatusCode.OK, updateOrder.StatusCode);

        var deleteOrder = await admin.DeleteAsync($"/api/boarding/orders/{orderId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteOrder.StatusCode);

        var deletePlacement = await admin.DeleteAsync($"/api/boarding/placements/{placementId}");
        Assert.Equal(HttpStatusCode.NoContent, deletePlacement.StatusCode);
    }

    [Fact]
    public async Task Incidents_Update_CoversResolvedAndUnresolvedBranches()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.IncidentReports.Add(new IncidentReport
            {
                IncidentId = 3101,
                IncidentType = "Security",
                Resolved = false,
                FollowUpRequired = true
            });
            await db.SaveChangesAsync();
        }

        var resolved = await admin.PutAsync("/api/incidents/3101", Json(new
        {
            resolved = true,
            followUpRequired = true
        }));
        Assert.Equal(HttpStatusCode.OK, resolved.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var entity = await db.IncidentReports.FindAsync(3101);
            Assert.NotNull(entity);
            Assert.True(entity!.Resolved);
            Assert.False(entity.FollowUpRequired);
            Assert.NotNull(entity.ResolutionDate);
        }

        var unresolved = await admin.PutAsync("/api/incidents/3101", Json(new
        {
            resolved = false
        }));
        Assert.Equal(HttpStatusCode.OK, unresolved.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var entity = await db.IncidentReports.FindAsync(3101);
            Assert.NotNull(entity);
            Assert.False(entity!.Resolved);
            Assert.Null(entity.ResolutionDate);
        }

        var notFound = await admin.PutAsync("/api/incidents/999999", Json(new { resolved = true }));
        Assert.Equal(HttpStatusCode.NotFound, notFound.StatusCode);

        var invalidBody = new StringContent("[]", Encoding.UTF8, "application/json");
        var badRequest = await admin.PutAsync("/api/incidents/3101", invalidBody);
        Assert.Equal(HttpStatusCode.BadRequest, badRequest.StatusCode);
    }

    [Fact]
    public async Task PipelineResults_Endpoints_ReturnExpectedPayloads()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            db.Supporters.Add(new Supporter { SupporterId = 4101, DisplayName = "Donor One", Email = "d1@test.local" });
            db.Residents.Add(new Resident { ResidentId = 4201, InternalCode = "RES-4201", CaseControlNo = "CC-4201", SafehouseId = 4301 });
            db.Safehouses.Add(new Safehouse { SafehouseId = 4301, Name = "Safehouse A", Region = "R1", CapacityGirls = 20, CurrentOccupancy = 10 });

            db.PipelineResults.AddRange(
                new PipelineResult { PipelineResultId = 1, PipelineName = "DonorChurn", ResultType = "Prediction", EntityType = "Supporter", EntityId = 4101, Score = 0.8m, Label = "High", GeneratedAt = DateTime.UtcNow },
                new PipelineResult { PipelineResultId = 2, PipelineName = "ResidentRisk", ResultType = "Prediction", EntityType = "Resident", EntityId = 4201, Score = 0.9m, Label = "High", GeneratedAt = DateTime.UtcNow },
                new PipelineResult { PipelineResultId = 3, PipelineName = "CampaignROI", ResultType = "Score", EntityType = "Campaign", EntityId = 1, Score = 0.7m, GeneratedAt = DateTime.UtcNow },
                new PipelineResult { PipelineResultId = 4, PipelineName = "SocialMediaDriver", ResultType = "Score", EntityType = "Post", EntityId = 2, Score = 0.6m, GeneratedAt = DateTime.UtcNow },
                new PipelineResult { PipelineResultId = 5, PipelineName = "EducationProgress", ResultType = "Prediction", EntityType = "Resident", EntityId = 4201, Score = 0.65m, GeneratedAt = DateTime.UtcNow },
                new PipelineResult { PipelineResultId = 6, PipelineName = "VisitationOutcome", ResultType = "Prediction", EntityType = "Resident", EntityId = 4201, Score = 0.5m, GeneratedAt = DateTime.UtcNow },
                new PipelineResult { PipelineResultId = 7, PipelineName = "SafehousePerformance", ResultType = "Score", EntityType = "Safehouse", EntityId = 4301, Score = 0.88m, GeneratedAt = DateTime.UtcNow }
            );

            await db.SaveChangesAsync();
        }

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results?pipeline=DonorChurn")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results/entity/Resident/4201")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results/donor-churn")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results/resident-risk")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results/campaign-roi")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results/social-media-drivers")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results/education-progress")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results/visitation-outcome")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results/safehouse-performance")).StatusCode);

        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync("/api/pipeline-results/social-media-recommendation")).StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.PipelineResults.Add(new PipelineResult
            {
                PipelineResultId = 8,
                PipelineName = "SocialMediaRecommendation",
                ResultType = "FullRecommendation",
                DetailsJson = "{\"recommendation\":\"post at 8pm\"}",
                GeneratedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/pipeline-results/social-media-recommendation")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.PostAsync("/api/pipeline-results/social-media-recommendation/log-result", Json(new { posted = true }))).StatusCode);
    }

    [Fact]
    public async Task EmailAutomation_StateToggleTemplatesPreviewAndSend_Work()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Supporters.Add(new Supporter
            {
                SupporterId = 5101,
                DisplayName = "Email Donor",
                FirstName = "Email",
                Email = "email-donor@test.local"
            });
            db.Donations.Add(new Donation
            {
                DonationId = 5201,
                SupporterId = 5101,
                DonationType = "Monetary",
                Amount = 200,
                DonationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10))
            });
            db.Donations.Add(new Donation
            {
                DonationId = 5202,
                SupporterId = 5101,
                DonationType = "Monetary",
                Amount = 300,
                DonationDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5))
            });
            await db.SaveChangesAsync();
        }

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/email-automation/state")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.PostAsync("/api/email-automation/toggle", Json(new { enabled = true }))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/email-automation/donors")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/email-automation/email-log")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/email-automation/templates")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/email-automation/templates/first_time/preview")).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.PutAsync("/api/email-automation/templates/first_time", Json(new
        {
            subject = "Updated Subject",
            body = "Updated body",
            editedBy = "test"
        }))).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.PostAsync("/api/email-automation/send", Json(new
        {
            supporterId = 5101,
            templateId = "first_time"
        }))).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.PostAsync("/api/email-automation/run-now", Json(new { }))).StatusCode);
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
