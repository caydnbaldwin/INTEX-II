using System.Text.Json;
using Backend.Controllers;
using Backend.Contracts;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using static Backend.Tests.Unit.ControllerCoverageTestSupport;

namespace Backend.Tests.Unit;

public class ControllerCoverageDataTests
{
    [Fact]
    public async Task ProcessRecordings_CreateUpdateAndAutofill_CoverRemainingBranches()
    {
        using var db = CreateDbContext();
        var controller = new ProcessRecordingsController(
            db,
            new DelegateAudioAutofillService((_, _, _) => Task.FromResult(new ProcessRecordingAutofillResult { SessionType = "Individual", Confidence = 0.9 })),
            NullLogger<ProcessRecordingsController>.Instance);

        Assert.IsType<BadRequestObjectResult>(await controller.Create(new ProcessRecordingWriteRequest
        {
            ResidentId = 1,
            SessionType = "",
            SessionNarrative = "Still valid narrative."
        }));

        var create = await controller.Create(new ProcessRecordingWriteRequest
        {
            ResidentId = 1,
            SessionType = "Individual",
            SessionNarrative = "Met with resident."
        });
        var created = Assert.IsType<CreatedAtActionResult>(create);
        var recording = Assert.IsType<ProcessRecording>(created.Value);

        var update = await controller.Update(recording.RecordingId, JsonSerializer.SerializeToElement(new
        {
            sessionType = "Family",
            sessionNarrative = "Updated notes."
        }));
        Assert.Equal("Family", Assert.IsType<ProcessRecording>(Assert.IsType<OkObjectResult>(update).Value).SessionType);

        Assert.IsType<BadRequestObjectResult>(await controller.AutofillFromAudio(null, CancellationToken.None));
        Assert.IsType<BadRequestObjectResult>(await controller.AutofillFromAudio(CreateFormFile([1, 2, 3], "notes.txt", "text/plain"), CancellationToken.None));
        Assert.IsType<OkObjectResult>(await controller.AutofillFromAudio(CreateFormFile([1, 2, 3], "session.mp3", "audio/mpeg"), CancellationToken.None));

        var cancelledController = new ProcessRecordingsController(
            db,
            new DelegateAudioAutofillService((_, _, _) => throw new OperationCanceledException()),
            NullLogger<ProcessRecordingsController>.Instance);
        Assert.Equal(StatusCodes.Status408RequestTimeout, Assert.IsType<StatusCodeResult>(await cancelledController.AutofillFromAudio(CreateFormFile([1, 2, 3], "session.mp3", "audio/mpeg"), CancellationToken.None)).StatusCode);

        var throttledController = new ProcessRecordingsController(
            db,
            new DelegateAudioAutofillService((_, _, _) => throw new HttpRequestException("Too many requests", null, System.Net.HttpStatusCode.TooManyRequests)),
            NullLogger<ProcessRecordingsController>.Instance);
        Assert.Equal(StatusCodes.Status429TooManyRequests, Assert.IsType<ObjectResult>(await throttledController.AutofillFromAudio(CreateFormFile([1, 2, 3], "session.mp3", "audio/mpeg"), CancellationToken.None)).StatusCode);

        var failedController = new ProcessRecordingsController(
            db,
            new DelegateAudioAutofillService((_, _, _) => throw new InvalidOperationException("boom")),
            NullLogger<ProcessRecordingsController>.Instance);
        Assert.Equal(StatusCodes.Status502BadGateway, Assert.IsType<ObjectResult>(await failedController.AutofillFromAudio(CreateFormFile([1, 2, 3], "session.mp3", "audio/mpeg"), CancellationToken.None)).StatusCode);
    }

    [Fact]
    public async Task DbCheck_Get_WithDisposedContext_ReturnsErrorEntries()
    {
        var db = CreateDbContext();
        var controller = new DbCheckController(db);
        await db.DisposeAsync();

        var result = await controller.Get();

        Assert.Contains("error:", JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(result).Value), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Chat_CoversNoResultsAndDetailBranches()
    {
        using var noResultsDb = CreateDbContext();
        var noResultsController = new ChatController(
            new GeminiChatService(new HttpClient(new GeminiStubHandler("no-results")), BuildConfiguration(new Dictionary<string, string?> { ["Gemini:ApiKey"] = "test-key" }), NullLogger<GeminiChatService>.Instance),
            new ChatQueryService(noResultsDb),
            new ChatValidationService());
        var noResults = await noResultsController.Chat(new ChatRequest("show me residents"), CancellationToken.None);
        Assert.Contains("no records", JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(noResults).Value), StringComparison.OrdinalIgnoreCase);

        using var residentDb = CreateDbContext();
        residentDb.Residents.Add(new Resident { ResidentId = 1, InternalCode = "Maria", CaseStatus = "Active" });
        await residentDb.SaveChangesAsync();
        var residentController = new ChatController(
            new GeminiChatService(new HttpClient(new GeminiStubHandler("resident-detail")), BuildConfiguration(new Dictionary<string, string?> { ["Gemini:ApiKey"] = "test-key" }), NullLogger<GeminiChatService>.Instance),
            new ChatQueryService(residentDb),
            new ChatValidationService());
        var residentResult = await residentController.Chat(new ChatRequest("what can I do for Maria"), CancellationToken.None);
        Assert.Contains("[[resident:1]]", JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(residentResult).Value));

        using var supporterDb = CreateDbContext();
        supporterDb.Supporters.Add(new Supporter
        {
            SupporterId = 10,
            FirstName = "Lea",
            LastName = "Jain",
            DisplayName = "Lea Jain",
            SupporterType = "Individual",
            Status = "Active"
        });
        await supporterDb.SaveChangesAsync();
        var supporterController = new ChatController(
            new GeminiChatService(new HttpClient(new GeminiStubHandler("supporter-detail")), BuildConfiguration(new Dictionary<string, string?> { ["Gemini:ApiKey"] = "test-key" }), NullLogger<GeminiChatService>.Instance),
            new ChatQueryService(supporterDb),
            new ChatValidationService());
        var supporterResult = await supporterController.Chat(new ChatRequest("how do I re-engage Lea Jain"), CancellationToken.None);
        Assert.Contains("[[supporter:10]]", JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(supporterResult).Value));
    }

    [Fact]
    public async Task Boarding_GetPlacementById_IncludesOrdersAndIncidentAlerts()
    {
        using var db = CreateDbContext();
        db.Safehouses.Add(new Safehouse { SafehouseId = 1, Name = "North House", Region = "North", CapacityGirls = 10, CurrentOccupancy = 6 });
        db.Residents.Add(new Resident { ResidentId = 1, InternalCode = "RES-1", CaseStatus = "Active", CurrentRiskLevel = "High", SafehouseId = 1 });
        db.BoardingPlacements.Add(new BoardingPlacement { BoardingPlacementId = 5, ResidentId = 1, SafehouseId = 1, PlacementStatus = "Incoming" });
        db.BoardingStandingOrders.Add(new BoardingStandingOrder { BoardingStandingOrderId = 11, BoardingPlacementId = 5, Title = "Night check", Status = "Open" });
        db.IncidentReports.Add(new IncidentReport
        {
            IncidentId = 12,
            ResidentId = 1,
            SafehouseId = 1,
            IncidentType = "Safety",
            Severity = "High",
            FollowUpRequired = true,
            Resolved = false,
            IncidentDate = DateOnly.FromDateTime(DateTime.UtcNow)
        });
        db.IncidentReports.Add(new IncidentReport
        {
            IncidentId = 13,
            ResidentId = 1,
            SafehouseId = 1,
            IncidentType = "Safety",
            Severity = "Medium",
            FollowUpRequired = false,
            Resolved = false,
            IncidentDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1))
        });
        await db.SaveChangesAsync();

        var controller = new BoardingController(db);
        Assert.IsType<BadRequestObjectResult>(await controller.CreatePlacement(new BoardingPlacementWriteRequest
        {
            ResidentId = 0,
            SafehouseId = 1,
            PlacementStatus = "Incoming"
        }));
        Assert.IsType<BadRequestObjectResult>(await controller.CreateOrder(new BoardingStandingOrderWriteRequest
        {
            BoardingPlacementId = 5,
            Title = "",
            Status = "Open"
        }));

        var result = await controller.GetPlacementById(5);

        var json = JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(result).Value);
        Assert.Contains("incidentActionRequired", json);
        Assert.Contains("boardingStandingOrderId", json);
    }

    [Fact]
    public async Task Donations_Residents_HomeVisitations_Supporters_And_Predictor_CoverEdgeBranches()
    {
        using var db = CreateDbContext();
        db.Donations.AddRange(
            new Donation { DonationId = 1, SupporterId = 1, DonationDate = new DateOnly(2026, 2, 1), Amount = 10, DonationType = "Monetary" },
            new Donation { DonationId = 2, SupporterId = 1, DonationDate = new DateOnly(2026, 1, 15), Amount = 20, DonationType = "Monetary" });
        db.Supporters.Add(new Supporter { SupporterId = 7, DisplayName = "Existing Supporter", SupporterType = "Individual" });
        db.Residents.Add(new Resident { ResidentId = 77, CurrentRiskLevel = "Critical", CaseCategory = "Surrendered" });
        await db.SaveChangesAsync();

        var trends = await new DonationsController(db).GetTrends();
        var trendsJson = JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(trends).Value);
        Assert.Contains("\"month\":1", trendsJson);
        Assert.Contains("\"month\":2", trendsJson);

        Assert.IsType<BadRequestObjectResult>(await new DonationsController(db).Create(new DonationWriteRequest
        {
            SupporterId = 0
        }));

        Assert.IsType<BadRequestObjectResult>(await new ResidentsController(db).Create(new ResidentWriteRequest
        {
            CaseStatus = "",
            InternalCode = "RES-BAD"
        }));

        var createResident = await new ResidentsController(db).Create(new ResidentWriteRequest
        {
            CaseStatus = "Active",
            InternalCode = "RES-NEW"
        });
        Assert.NotNull(Assert.IsType<Resident>(Assert.IsType<CreatedAtActionResult>(createResident).Value).CreatedAt);

        Assert.IsType<BadRequestObjectResult>(await new HomeVisitationsController(db).Create(new HomeVisitationWriteRequest
        {
            ResidentId = 0,
            VisitType = ""
        }));

        var supportersController = new SupportersController(db);
        Assert.IsType<BadRequestObjectResult>(await supportersController.Create(new SupporterWriteRequest
        {
            SupporterType = "",
            DisplayName = "Invalid"
        }));
        Assert.IsType<BadRequestObjectResult>(await supportersController.Update(7, JsonSerializer.SerializeToElement(new
        {
            supporterType = ""
        })));

        var predictor = await new VisitationPredictorController(db).Predict(new VisitationPredictionRequest
        {
            ResidentId = 77,
            VisitType = "HomeStay",
            FamilyCooperationLevel = "Uncooperative",
            SafetyConcerns = true
        });
        Assert.Contains("Likely Unfavorable", JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(predictor).Value));
    }

    [Fact]
    public void StaffDirectory_BuildDisplayName_WithBlankLocalPart_ReturnsStaff()
    {
        var method = typeof(StaffDirectoryController).GetMethod("BuildDisplayName", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        Assert.NotNull(method);

        var result = (string?)method!.Invoke(null, [new ApplicationUser { Email = "@staff.local" }]);

        Assert.Equal("Staff", result);
    }
}
