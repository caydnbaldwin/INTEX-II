using System.Text.Json;
using Backend.Contracts;
using Backend.Infrastructure;
using Backend.Models;

namespace Backend.Tests.Unit;

public class InfrastructureBatch1Tests
{
    [Fact]
    public void NormalizeOptionalText_ReturnsTrimmedOrNull()
    {
        Assert.Null(CrudValueNormalizer.NormalizeOptionalText(null));
        Assert.Null(CrudValueNormalizer.NormalizeOptionalText("   "));
        Assert.Equal("hello", CrudValueNormalizer.NormalizeOptionalText("  hello  "));
    }

    [Fact]
    public void JsonRequestPatch_TryParse_ObjectBody_Succeeds_AndTracksPropertiesCaseInsensitive()
    {
        using var doc = JsonDocument.Parse("{\"Amount\":125.5,\"CampaignName\":\"  Summer  \"}");

        var ok = JsonRequestPatch<DonationWriteRequest>.TryParse(doc.RootElement, out var patch, out var problem);

        Assert.True(ok);
        Assert.Null(problem);
        Assert.NotNull(patch);
        Assert.True(patch!.HasProperty("amount"));
        Assert.True(patch.HasProperty("campaignName"));
        Assert.Equal(125.5m, patch.Model.Amount);
    }

    [Fact]
    public void JsonRequestPatch_TryParse_NonObject_FailsWithProblemDetails()
    {
        using var doc = JsonDocument.Parse("[1,2,3]");

        var ok = JsonRequestPatch<DonationWriteRequest>.TryParse(doc.RootElement, out var patch, out var problem);

        Assert.False(ok);
        Assert.Null(patch);
        Assert.NotNull(problem);
        Assert.Equal(400, problem!.Status);
    }

    [Fact]
    public void JsonRequestPatch_TryParse_InvalidModelShape_FailsWithProblemDetails()
    {
        using var doc = JsonDocument.Parse("{\"supporterId\":\"not-a-number\"}");

        var ok = JsonRequestPatch<DonationWriteRequest>.TryParse(doc.RootElement, out var patch, out var problem);

        Assert.False(ok);
        Assert.Null(patch);
        Assert.NotNull(problem);
        Assert.Equal(400, problem!.Status);
    }

    [Fact]
    public void RequestValidation_TryValidate_ReturnsValidationErrors_ForInvalidModel()
    {
        var request = new HomeVisitationWriteRequest
        {
            ResidentId = 0,
            VisitType = ""
        };

        var ok = RequestValidation.TryValidate(request, out var problem, "Unable to save visit.");

        Assert.False(ok);
        Assert.NotNull(problem);
        Assert.Equal("Unable to save visit.", problem!.Title);
        Assert.Contains("residentId", problem.Errors.Keys, StringComparer.OrdinalIgnoreCase);
        Assert.Contains("visitType", problem.Errors.Keys, StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public void RequestValidation_TryValidate_ReturnsTrue_ForValidModel()
    {
        var request = new ProcessRecordingWriteRequest
        {
            ResidentId = 1,
            SessionType = "Individual",
            SessionNarrative = "Session notes"
        };

        var ok = RequestValidation.TryValidate(request, out var problem);

        Assert.True(ok);
        Assert.Null(problem);
    }

    [Fact]
    public void CrudWriteMapper_AppliesAllMappings_WhenPatchIsNull()
    {
        var resident = new Resident();
        var supporter = new Supporter();
        var donation = new Donation();
        var homeVisitation = new HomeVisitation();
        var processRecording = new ProcessRecording();
        var placement = new BoardingPlacement();
        var standingOrder = new BoardingStandingOrder { BoardingPlacementId = 999 };
        var incident = new IncidentReport();

        CrudWriteMapper.ApplyResident(resident, new ResidentWriteRequest
        {
            CaseControlNo = " RC-1 ",
            InternalCode = " IC-1 ",
            SafehouseId = 1,
            CaseStatus = " Active ",
            CurrentRiskLevel = " High ",
            NotesRestricted = " note "
        });

        CrudWriteMapper.ApplySupporter(supporter, new SupporterWriteRequest
        {
            DisplayName = " Donor Name ",
            Email = " donor@example.com ",
            Status = " Active "
        });

        CrudWriteMapper.ApplyDonation(donation, new DonationWriteRequest
        {
            SupporterId = 1,
            DonationType = " Monetary ",
            CampaignName = " Campaign ",
            Amount = 100,
            Notes = " note "
        });

        CrudWriteMapper.ApplyHomeVisitation(homeVisitation, new HomeVisitationWriteRequest
        {
            ResidentId = 1,
            VisitType = " Routine ",
            SocialWorker = " Worker ",
            FollowUpNeeded = true
        });

        CrudWriteMapper.ApplyProcessRecording(processRecording, new ProcessRecordingWriteRequest
        {
            ResidentId = 1,
            SessionType = " Individual ",
            SessionNarrative = " Narrative ",
            SocialWorker = " Worker "
        });

        CrudWriteMapper.ApplyBoardingPlacement(placement, new BoardingPlacementWriteRequest
        {
            ResidentId = 1,
            SafehouseId = 1,
            PlacementStatus = " Incoming ",
            BedLabel = " Bed 1 "
        });

        CrudWriteMapper.ApplyBoardingStandingOrder(standingOrder, new BoardingStandingOrderWriteRequest
        {
            Category = " Safety ",
            Title = " Check-In ",
            Status = " Open "
        });

        CrudWriteMapper.ApplyIncident(incident, new IncidentWriteRequest
        {
            ResidentId = 1,
            SafehouseId = 1,
            IncidentType = " Security ",
            Severity = " High ",
            AssignedStaffDisplayName = " Admin "
        });

        Assert.Equal("RC-1", resident.CaseControlNo);
        Assert.Equal("donor@example.com", supporter.Email);
        Assert.Equal("Monetary", donation.DonationType);
        Assert.Equal("Routine", homeVisitation.VisitType);
        Assert.Equal("Individual", processRecording.SessionType);
        Assert.Equal("Incoming", placement.PlacementStatus);
        Assert.Equal("Check-In", standingOrder.Title);
        Assert.Equal("Security", incident.IncidentType);
    }

    [Fact]
    public void CrudWriteMapper_HonorsJsonPatchProperties()
    {
        var donation = new Donation
        {
            CampaignName = "Existing Campaign",
            Amount = 10
        };

        using var doc = JsonDocument.Parse("{\"amount\":250}");
        var ok = JsonRequestPatch<DonationWriteRequest>.TryParse(doc.RootElement, out var patch, out _);
        Assert.True(ok);

        CrudWriteMapper.ApplyDonation(donation, new DonationWriteRequest
        {
            CampaignName = "New Campaign",
            Amount = 250
        }, patch);

        Assert.Equal(250, donation.Amount);
        Assert.Equal("Existing Campaign", donation.CampaignName);
    }
}
