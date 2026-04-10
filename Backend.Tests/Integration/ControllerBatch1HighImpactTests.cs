using System.Net;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Integration;

public class ControllerBatch1HighImpactTests
{
    [Fact]
    public async Task Donations_AdminCrud_AndAggregates_Work()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var createOne = await admin.PostAsync("/api/donations", Json(new
        {
            supporterId = 1,
            donationType = "Monetary",
            donationDate = "2026-04-01",
            campaignName = "Spring",
            channelSource = "Website",
            amount = 200,
            impactUnit = "PHP"
        }));
        Assert.Equal(HttpStatusCode.Created, createOne.StatusCode);
        var donationId = await ReadIdAsync(createOne, "donationId");

        var createTwo = await admin.PostAsync("/api/donations", Json(new
        {
            supporterId = 2,
            donationType = "Monetary",
            donationDate = "2026-04-15",
            campaignName = "Spring",
            channelSource = "Website",
            amount = 300,
            isRecurring = true,
            impactUnit = "PHP"
        }));
        Assert.Equal(HttpStatusCode.Created, createTwo.StatusCode);

        var filtered = await admin.GetAsync("/api/donations?campaignName=Spring&donationType=Monetary");
        Assert.Equal(HttpStatusCode.OK, filtered.StatusCode);
        var filteredJson = await ReadJsonAsync(filtered);
        Assert.True(filteredJson.ValueKind == JsonValueKind.Array);
        Assert.True(filteredJson.GetArrayLength() >= 2);

        var byId = await admin.GetAsync($"/api/donations/{donationId}");
        Assert.Equal(HttpStatusCode.OK, byId.StatusCode);

        var update = await admin.PutAsync($"/api/donations/{donationId}", Json(new
        {
            amount = 999,
            campaignName = "Updated Campaign"
        }));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var summary = await admin.GetAsync("/api/donations/summary");
        Assert.Equal(HttpStatusCode.OK, summary.StatusCode);

        var trends = await admin.GetAsync("/api/donations/trends");
        Assert.Equal(HttpStatusCode.OK, trends.StatusCode);

        var channels = await admin.GetAsync("/api/donations/channels");
        Assert.Equal(HttpStatusCode.OK, channels.StatusCode);

        var delete = await admin.DeleteAsync($"/api/donations/{donationId}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var deletedFetch = await admin.GetAsync($"/api/donations/{donationId}");
        Assert.Equal(HttpStatusCode.NotFound, deletedFetch.StatusCode);
    }

    [Fact]
    public async Task Donations_NestedCollections_ReturnSeededRecords()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await admin.PostAsync("/api/donations", Json(new
        {
            supporterId = 1,
            donationType = "InKind",
            donationDate = "2026-04-10",
            campaignName = "Emergency",
            channelSource = "Partner",
            amount = 120,
            impactUnit = "PHP"
        }));
        var donationId = await ReadIdAsync(create, "donationId");

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.DonationAllocations.Add(new DonationAllocation
            {
                AllocationId = 1001,
                DonationId = donationId,
                ProgramArea = "Shelter",
                AmountAllocated = 90
            });
            db.InKindDonationItems.Add(new InKindDonationItem
            {
                ItemId = 2001,
                DonationId = donationId,
                ItemName = "Hygiene Kit",
                Quantity = 5
            });
            await db.SaveChangesAsync();
        }

        var allocations = await admin.GetAsync($"/api/donations/{donationId}/allocations");
        Assert.Equal(HttpStatusCode.OK, allocations.StatusCode);
        var allocationsJson = await ReadJsonAsync(allocations);
        Assert.True(allocationsJson.GetArrayLength() == 1);

        var items = await admin.GetAsync($"/api/donations/{donationId}/in-kind-items");
        Assert.Equal(HttpStatusCode.OK, items.StatusCode);
        var itemsJson = await ReadJsonAsync(items);
        Assert.True(itemsJson.GetArrayLength() == 1);
    }

    [Fact]
    public async Task HomeVisitations_AdminCrudAndFilters_Work()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await admin.PostAsync("/api/home-visitations", Json(new
        {
            residentId = 1,
            visitDate = "2026-04-10",
            socialWorker = "Worker",
            visitType = "Routine",
            followUpNeeded = true
        }));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var id = await ReadIdAsync(create, "visitationId");

        var all = await admin.GetAsync("/api/home-visitations?residentId=1&visitType=Routine&followUpNeeded=true");
        Assert.Equal(HttpStatusCode.OK, all.StatusCode);

        var update = await admin.PutAsync($"/api/home-visitations/{id}", Json(new
        {
            visitType = "Emergency",
            followUpNeeded = false
        }));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var byId = await admin.GetAsync($"/api/home-visitations/{id}");
        Assert.Equal(HttpStatusCode.OK, byId.StatusCode);

        var delete = await admin.DeleteAsync($"/api/home-visitations/{id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task ProcessRecordings_AdminCrudAndAudioValidation_Work()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var create = await admin.PostAsync("/api/process-recordings", Json(new
        {
            residentId = 1,
            sessionDate = "2026-04-10",
            socialWorker = "Worker",
            sessionType = "Individual",
            sessionNarrative = "Session details"
        }));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var id = await ReadIdAsync(create, "recordingId");

        var update = await admin.PutAsync($"/api/process-recordings/{id}", Json(new
        {
            sessionType = "Family",
            sessionNarrative = "Updated details"
        }));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var byId = await admin.GetAsync($"/api/process-recordings/{id}");
        Assert.Equal(HttpStatusCode.OK, byId.StatusCode);

        var all = await admin.GetAsync("/api/process-recordings?residentId=1");
        Assert.Equal(HttpStatusCode.OK, all.StatusCode);

        var noAudio = await admin.PostAsync("/api/process-recordings/autofill-from-audio", new MultipartFormDataContent());
        Assert.Equal(HttpStatusCode.BadRequest, noAudio.StatusCode);

        var badTypeForm = new MultipartFormDataContent();
        var badAudio = new ByteArrayContent(Encoding.UTF8.GetBytes("not audio"));
        badAudio.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/plain");
        badTypeForm.Add(badAudio, "audio", "bad.txt");
        var badType = await admin.PostAsync("/api/process-recordings/autofill-from-audio", badTypeForm);
        Assert.Equal(HttpStatusCode.BadRequest, badType.StatusCode);

        var delete = await admin.DeleteAsync($"/api/process-recordings/{id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task PublicAndReportsEndpoints_ReturnExpectedData()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);
        var anon = factory.CreateClient();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Safehouses.Add(new Safehouse
            {
                SafehouseId = 7001,
                Name = "North House",
                Region = "Region I",
                Status = "Active",
                CapacityGirls = 20,
                CurrentOccupancy = 12
            });
            db.Residents.Add(new Resident
            {
                ResidentId = 8001,
                SafehouseId = 7001,
                CaseStatus = "Active",
                ReintegrationType = "Family",
                ReintegrationStatus = "Completed",
                CurrentRiskLevel = "High"
            });
            db.ProcessRecordings.Add(new ProcessRecording
            {
                RecordingId = 8101,
                ResidentId = 8001,
                SessionType = "Individual",
                SessionNarrative = "Narrative"
            });
            db.HomeVisitations.Add(new HomeVisitation
            {
                VisitationId = 8201,
                ResidentId = 8001,
                VisitType = "Routine"
            });
            db.Donations.Add(new Donation
            {
                DonationId = 8301,
                SupporterId = 77,
                DonationType = "Monetary",
                Amount = 1000,
                DonationDate = DateOnly.FromDateTime(DateTime.UtcNow),
                ChannelSource = "Website",
                CampaignName = "Spring"
            });
            db.PublicImpactSnapshots.Add(new PublicImpactSnapshot
            {
                SnapshotId = 8401,
                Headline = "Impact",
                IsPublished = true,
                SnapshotDate = DateOnly.FromDateTime(DateTime.UtcNow)
            });
            db.SocialMediaPosts.Add(new SocialMediaPost
            {
                PostId = 8501,
                Platform = "Facebook",
                DonationReferrals = 5,
                EstimatedDonationValuePhp = 3000,
                EngagementRate = 0.12m
            });
            db.IncidentReports.Add(new IncidentReport
            {
                IncidentId = 8601,
                ResidentId = 8001,
                SafehouseId = 7001,
                IncidentType = "Security",
                Resolved = false,
                IncidentDate = DateOnly.FromDateTime(DateTime.UtcNow)
            });
            await db.SaveChangesAsync();
        }

        Assert.Equal(HttpStatusCode.OK, (await anon.GetAsync("/api/public/safehouses")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await anon.GetAsync("/api/public/safehouses/occupancy")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await anon.GetAsync("/api/public/impact-snapshots")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await anon.GetAsync("/api/public/impact-stats")).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/reports/social-media/effectiveness")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/reports/outcomes/reintegration")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/reports/risk-distribution")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/reports/incident-summary")).StatusCode);
    }

    private static StringContent Json(object payload)
        => new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    private static async Task<int> ReadIdAsync(HttpResponseMessage response, string propertyName)
    {
        var json = await ReadJsonAsync(response);
        return json.GetProperty(propertyName).GetInt32();
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.Clone();
    }
}
