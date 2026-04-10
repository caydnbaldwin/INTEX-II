using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Unit;

public class ChatQueryServiceBatchTests
{
    [Fact]
    public async Task RunQueryAsync_ResidentList_RespectsSafehouseAndStatus()
    {
        await using var db = CreateDb(nameof(RunQueryAsync_ResidentList_RespectsSafehouseAndStatus));
        db.Residents.AddRange(
            new Resident { ResidentId = 1, SafehouseId = 100, CaseStatus = "Active", InternalCode = "A-1", CurrentRiskLevel = "High" },
            new Resident { ResidentId = 2, SafehouseId = 100, CaseStatus = "Closed", InternalCode = "A-2", CurrentRiskLevel = "Low" },
            new Resident { ResidentId = 3, SafehouseId = 200, CaseStatus = "Active", InternalCode = "B-1", CurrentRiskLevel = "Medium" }
        );
        await db.SaveChangesAsync();

        var service = new ChatQueryService(db);
        var intent = new IntentResult("resident_list", 100, "active", 10, null);

        var (summary, refs) = await service.RunQueryAsync(intent);

        Assert.Single(refs);
        Assert.Contains("[[resident:1]]", summary);
        Assert.DoesNotContain("[[resident:2]]", summary);
        Assert.DoesNotContain("[[resident:3]]", summary);
    }

    [Fact]
    public async Task RunQueryAsync_DonorChurn_JoinsSupporters()
    {
        await using var db = CreateDb(nameof(RunQueryAsync_DonorChurn_JoinsSupporters));
        db.Supporters.Add(new Supporter { SupporterId = 10, DisplayName = "Donor Ten", SupporterType = "Monetary", Status = "Active" });
        db.PipelineResults.Add(new PipelineResult
        {
            PipelineResultId = 1,
            PipelineName = "DonorChurn",
            ResultType = "Prediction",
            EntityId = 10,
            Score = 0.91m,
            Label = "High"
        });
        await db.SaveChangesAsync();

        var service = new ChatQueryService(db);
        var (summary, refs) = await service.RunQueryAsync(new IntentResult("donor_churn", null, null, 5, "score_desc"));

        Assert.Single(refs);
        Assert.Contains("[[supporter:10]]", summary);
        Assert.Contains("ChurnScore", summary);
    }

    [Fact]
    public async Task RunQueryAsync_IncidentSummary_DefaultsToUnresolved()
    {
        await using var db = CreateDb(nameof(RunQueryAsync_IncidentSummary_DefaultsToUnresolved));
        db.IncidentReports.AddRange(
            new IncidentReport { IncidentId = 1, SafehouseId = 100, IncidentType = "Safety", Resolved = false, IncidentDate = DateOnly.FromDateTime(DateTime.UtcNow) },
            new IncidentReport { IncidentId = 2, SafehouseId = 100, IncidentType = "Medical", Resolved = true, IncidentDate = DateOnly.FromDateTime(DateTime.UtcNow) }
        );
        await db.SaveChangesAsync();

        var service = new ChatQueryService(db);
        var (summary, refs) = await service.RunQueryAsync(new IntentResult("incident_summary", 100, null, 10, "date_desc"));

        Assert.Single(refs);
        Assert.Contains("[[incident:1]]", summary);
        Assert.DoesNotContain("[[incident:2]]", summary);
    }

    [Fact]
    public async Task RunQueryAsync_SafehouseCapacity_NearCapacityFilter()
    {
        await using var db = CreateDb(nameof(RunQueryAsync_SafehouseCapacity_NearCapacityFilter));
        db.Safehouses.AddRange(
            new Safehouse { SafehouseId = 1, Name = "Near", CapacityGirls = 10, CurrentOccupancy = 9 },
            new Safehouse { SafehouseId = 2, Name = "Low", CapacityGirls = 10, CurrentOccupancy = 4 }
        );
        await db.SaveChangesAsync();

        var service = new ChatQueryService(db);
        var (summary, refs) = await service.RunQueryAsync(new IntentResult("safehouse_capacity", null, "near capacity", 10, null));

        Assert.Single(refs);
        Assert.Contains("[[safehouse:1]]", summary);
        Assert.DoesNotContain("[[safehouse:2]]", summary);
    }

    [Fact]
    public async Task QueryResidentDetailAsync_IncludesCaseAndMlAndRecentSignals()
    {
        await using var db = CreateDb(nameof(QueryResidentDetailAsync_IncludesCaseAndMlAndRecentSignals));

        db.Residents.Add(new Resident
        {
            ResidentId = 55,
            InternalCode = "RS-55",
            CaseCategory = "Neglected",
            CaseStatus = "Active",
            CurrentRiskLevel = "High",
            AssignedSocialWorker = "Worker One",
            ReintegrationType = "Family",
            ReintegrationStatus = "In Progress",
            SubCatTrafficked = true,
            HasSpecialNeeds = true,
            SpecialNeedsDiagnosis = "PTSD"
        });
        db.PipelineResults.Add(new PipelineResult
        {
            PipelineResultId = 1,
            PipelineName = "ResidentRisk",
            ResultType = "Prediction",
            EntityId = 55,
            Score = 0.88m,
            Label = "High",
            GeneratedAt = DateTime.UtcNow
        });
        db.InterventionPlans.Add(new InterventionPlan
        {
            PlanId = 1,
            ResidentId = 55,
            PlanCategory = "Counseling",
            ServicesProvided = "Therapy",
            Status = "Open",
            CaseConferenceDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
            CreatedAt = DateTime.UtcNow
        });
        db.ProcessRecordings.Add(new ProcessRecording
        {
            RecordingId = 1,
            ResidentId = 55,
            SessionDate = DateOnly.FromDateTime(DateTime.UtcNow),
            EmotionalStateObserved = "Anxious",
            EmotionalStateEnd = "Calm",
            ConcernsFlagged = true,
            FollowUpActions = "Weekly check-in"
        });
        db.HomeVisitations.Add(new HomeVisitation
        {
            VisitationId = 1,
            ResidentId = 55,
            VisitDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)),
            VisitOutcome = "Favorable",
            SafetyConcernsNoted = false,
            FollowUpNeeded = true
        });
        await db.SaveChangesAsync();

        var service = new ChatQueryService(db);
        var (summary, refs) = await service.QueryResidentDetailAsync(55);

        Assert.Single(refs);
        Assert.Contains("[[resident:55]]", summary);
        Assert.Contains("ML Risk Score", summary);
        Assert.Contains("Intervention Plan", summary);
        Assert.Contains("Last Home Visit", summary);
    }

    [Fact]
    public async Task QueryResidentDetailAsync_NotFound_ReturnsExpectedMessage()
    {
        await using var db = CreateDb(nameof(QueryResidentDetailAsync_NotFound_ReturnsExpectedMessage));
        var service = new ChatQueryService(db);

        var (summary, refs) = await service.QueryResidentDetailAsync(99999);

        Assert.Equal("Resident not found.", summary);
        Assert.Empty(refs);
    }

    private static AppDbContext CreateDb(string name)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"{name}_{Guid.NewGuid():N}")
            .Options;

        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }
}
