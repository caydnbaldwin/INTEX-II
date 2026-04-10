using Backend.Contracts;
using Backend.Models;

namespace Backend.Infrastructure;

public static class CrudWriteMapper
{
    public static void ApplyResident(
        Resident entity,
        ResidentWriteRequest request,
        JsonRequestPatch<ResidentWriteRequest>? patch = null)
    {
        SetIfPresent(patch, "caseControlNo", () => entity.CaseControlNo = CrudValueNormalizer.NormalizeOptionalText(request.CaseControlNo));
        SetIfPresent(patch, "internalCode", () => entity.InternalCode = CrudValueNormalizer.NormalizeOptionalText(request.InternalCode));
        SetIfPresent(patch, "safehouseId", () => entity.SafehouseId = request.SafehouseId);
        SetIfPresent(patch, "caseStatus", () => entity.CaseStatus = CrudValueNormalizer.NormalizeOptionalText(request.CaseStatus));
        SetIfPresent(patch, "sex", () => entity.Sex = CrudValueNormalizer.NormalizeOptionalText(request.Sex));
        SetIfPresent(patch, "dateOfBirth", () => entity.DateOfBirth = request.DateOfBirth);
        SetIfPresent(patch, "birthStatus", () => entity.BirthStatus = CrudValueNormalizer.NormalizeOptionalText(request.BirthStatus));
        SetIfPresent(patch, "placeOfBirth", () => entity.PlaceOfBirth = CrudValueNormalizer.NormalizeOptionalText(request.PlaceOfBirth));
        SetIfPresent(patch, "religion", () => entity.Religion = CrudValueNormalizer.NormalizeOptionalText(request.Religion));
        SetIfPresent(patch, "caseCategory", () => entity.CaseCategory = CrudValueNormalizer.NormalizeOptionalText(request.CaseCategory));
        SetIfPresent(patch, "subCatOrphaned", () => entity.SubCatOrphaned = request.SubCatOrphaned);
        SetIfPresent(patch, "subCatTrafficked", () => entity.SubCatTrafficked = request.SubCatTrafficked);
        SetIfPresent(patch, "subCatChildLabor", () => entity.SubCatChildLabor = request.SubCatChildLabor);
        SetIfPresent(patch, "subCatPhysicalAbuse", () => entity.SubCatPhysicalAbuse = request.SubCatPhysicalAbuse);
        SetIfPresent(patch, "subCatSexualAbuse", () => entity.SubCatSexualAbuse = request.SubCatSexualAbuse);
        SetIfPresent(patch, "subCatOsaec", () => entity.SubCatOsaec = request.SubCatOsaec);
        SetIfPresent(patch, "subCatCicl", () => entity.SubCatCicl = request.SubCatCicl);
        SetIfPresent(patch, "subCatAtRisk", () => entity.SubCatAtRisk = request.SubCatAtRisk);
        SetIfPresent(patch, "subCatStreetChild", () => entity.SubCatStreetChild = request.SubCatStreetChild);
        SetIfPresent(patch, "subCatChildWithHiv", () => entity.SubCatChildWithHiv = request.SubCatChildWithHiv);
        SetIfPresent(patch, "isPwd", () => entity.IsPwd = request.IsPwd);
        SetIfPresent(patch, "pwdType", () => entity.PwdType = CrudValueNormalizer.NormalizeOptionalText(request.PwdType));
        SetIfPresent(patch, "hasSpecialNeeds", () => entity.HasSpecialNeeds = request.HasSpecialNeeds);
        SetIfPresent(patch, "specialNeedsDiagnosis", () => entity.SpecialNeedsDiagnosis = CrudValueNormalizer.NormalizeOptionalText(request.SpecialNeedsDiagnosis));
        SetIfPresent(patch, "familyIs4ps", () => entity.FamilyIs4ps = request.FamilyIs4ps);
        SetIfPresent(patch, "familySoloParent", () => entity.FamilySoloParent = request.FamilySoloParent);
        SetIfPresent(patch, "familyIndigenous", () => entity.FamilyIndigenous = request.FamilyIndigenous);
        SetIfPresent(patch, "familyParentPwd", () => entity.FamilyParentPwd = request.FamilyParentPwd);
        SetIfPresent(patch, "familyInformalSettler", () => entity.FamilyInformalSettler = request.FamilyInformalSettler);
        SetIfPresent(patch, "dateOfAdmission", () => entity.DateOfAdmission = request.DateOfAdmission);
        SetIfPresent(patch, "ageUponAdmission", () => entity.AgeUponAdmission = CrudValueNormalizer.NormalizeOptionalText(request.AgeUponAdmission));
        SetIfPresent(patch, "presentAge", () => entity.PresentAge = CrudValueNormalizer.NormalizeOptionalText(request.PresentAge));
        SetIfPresent(patch, "lengthOfStay", () => entity.LengthOfStay = CrudValueNormalizer.NormalizeOptionalText(request.LengthOfStay));
        SetIfPresent(patch, "referralSource", () => entity.ReferralSource = CrudValueNormalizer.NormalizeOptionalText(request.ReferralSource));
        SetIfPresent(patch, "referringAgencyPerson", () => entity.ReferringAgencyPerson = CrudValueNormalizer.NormalizeOptionalText(request.ReferringAgencyPerson));
        SetIfPresent(patch, "dateColbRegistered", () => entity.DateColbRegistered = request.DateColbRegistered);
        SetIfPresent(patch, "dateColbObtained", () => entity.DateColbObtained = request.DateColbObtained);
        SetIfPresent(patch, "assignedSocialWorker", () => entity.AssignedSocialWorker = CrudValueNormalizer.NormalizeOptionalText(request.AssignedSocialWorker));
        SetIfPresent(patch, "initialCaseAssessment", () => entity.InitialCaseAssessment = CrudValueNormalizer.NormalizeOptionalText(request.InitialCaseAssessment));
        SetIfPresent(patch, "dateCaseStudyPrepared", () => entity.DateCaseStudyPrepared = request.DateCaseStudyPrepared);
        SetIfPresent(patch, "reintegrationType", () => entity.ReintegrationType = CrudValueNormalizer.NormalizeOptionalText(request.ReintegrationType));
        SetIfPresent(patch, "reintegrationStatus", () => entity.ReintegrationStatus = CrudValueNormalizer.NormalizeOptionalText(request.ReintegrationStatus));
        SetIfPresent(patch, "initialRiskLevel", () => entity.InitialRiskLevel = CrudValueNormalizer.NormalizeOptionalText(request.InitialRiskLevel));
        SetIfPresent(patch, "currentRiskLevel", () => entity.CurrentRiskLevel = CrudValueNormalizer.NormalizeOptionalText(request.CurrentRiskLevel));
        SetIfPresent(patch, "dateEnrolled", () => entity.DateEnrolled = request.DateEnrolled);
        SetIfPresent(patch, "dateClosed", () => entity.DateClosed = request.DateClosed);
        SetIfPresent(patch, "notesRestricted", () => entity.NotesRestricted = CrudValueNormalizer.NormalizeOptionalText(request.NotesRestricted));
    }

    public static void ApplySupporter(
        Supporter entity,
        SupporterWriteRequest request,
        JsonRequestPatch<SupporterWriteRequest>? patch = null)
    {
        SetIfPresent(patch, "supporterType", () => entity.SupporterType = CrudValueNormalizer.NormalizeOptionalText(request.SupporterType));
        SetIfPresent(patch, "displayName", () => entity.DisplayName = CrudValueNormalizer.NormalizeOptionalText(request.DisplayName));
        SetIfPresent(patch, "organizationName", () => entity.OrganizationName = CrudValueNormalizer.NormalizeOptionalText(request.OrganizationName));
        SetIfPresent(patch, "firstName", () => entity.FirstName = CrudValueNormalizer.NormalizeOptionalText(request.FirstName));
        SetIfPresent(patch, "lastName", () => entity.LastName = CrudValueNormalizer.NormalizeOptionalText(request.LastName));
        SetIfPresent(patch, "relationshipType", () => entity.RelationshipType = CrudValueNormalizer.NormalizeOptionalText(request.RelationshipType));
        SetIfPresent(patch, "region", () => entity.Region = CrudValueNormalizer.NormalizeOptionalText(request.Region));
        SetIfPresent(patch, "country", () => entity.Country = CrudValueNormalizer.NormalizeOptionalText(request.Country));
        SetIfPresent(patch, "email", () => entity.Email = CrudValueNormalizer.NormalizeOptionalText(request.Email));
        SetIfPresent(patch, "phone", () => entity.Phone = CrudValueNormalizer.NormalizeOptionalText(request.Phone));
        SetIfPresent(patch, "status", () => entity.Status = CrudValueNormalizer.NormalizeOptionalText(request.Status));
        SetIfPresent(patch, "firstDonationDate", () => entity.FirstDonationDate = request.FirstDonationDate);
        SetIfPresent(patch, "acquisitionChannel", () => entity.AcquisitionChannel = CrudValueNormalizer.NormalizeOptionalText(request.AcquisitionChannel));
    }

    public static void ApplyDonation(
        Donation entity,
        DonationWriteRequest request,
        JsonRequestPatch<DonationWriteRequest>? patch = null)
    {
        SetIfPresent(patch, "supporterId", () => entity.SupporterId = request.SupporterId);
        SetIfPresent(patch, "donationType", () => entity.DonationType = CrudValueNormalizer.NormalizeOptionalText(request.DonationType));
        SetIfPresent(patch, "donationDate", () => entity.DonationDate = request.DonationDate);
        SetIfPresent(patch, "isRecurring", () => entity.IsRecurring = request.IsRecurring);
        SetIfPresent(patch, "campaignName", () => entity.CampaignName = CrudValueNormalizer.NormalizeOptionalText(request.CampaignName));
        SetIfPresent(patch, "channelSource", () => entity.ChannelSource = CrudValueNormalizer.NormalizeOptionalText(request.ChannelSource));
        SetIfPresent(patch, "currencyCode", () => entity.CurrencyCode = CrudValueNormalizer.NormalizeOptionalText(request.CurrencyCode));
        SetIfPresent(patch, "amount", () => entity.Amount = request.Amount);
        SetIfPresent(patch, "estimatedValue", () => entity.EstimatedValue = request.EstimatedValue);
        SetIfPresent(patch, "impactUnit", () => entity.ImpactUnit = CrudValueNormalizer.NormalizeOptionalText(request.ImpactUnit));
        SetIfPresent(patch, "notes", () => entity.Notes = CrudValueNormalizer.NormalizeOptionalText(request.Notes));
        SetIfPresent(patch, "referralPostId", () => entity.ReferralPostId = request.ReferralPostId);
    }

    public static void ApplyHomeVisitation(
        HomeVisitation entity,
        HomeVisitationWriteRequest request,
        JsonRequestPatch<HomeVisitationWriteRequest>? patch = null)
    {
        SetIfPresent(patch, "residentId", () => entity.ResidentId = request.ResidentId);
        SetIfPresent(patch, "visitDate", () => entity.VisitDate = request.VisitDate);
        SetIfPresent(patch, "socialWorker", () => entity.SocialWorker = CrudValueNormalizer.NormalizeOptionalText(request.SocialWorker));
        SetIfPresent(patch, "visitType", () => entity.VisitType = CrudValueNormalizer.NormalizeOptionalText(request.VisitType));
        SetIfPresent(patch, "locationVisited", () => entity.LocationVisited = CrudValueNormalizer.NormalizeOptionalText(request.LocationVisited));
        SetIfPresent(patch, "familyMembersPresent", () => entity.FamilyMembersPresent = CrudValueNormalizer.NormalizeOptionalText(request.FamilyMembersPresent));
        SetIfPresent(patch, "purpose", () => entity.Purpose = CrudValueNormalizer.NormalizeOptionalText(request.Purpose));
        SetIfPresent(patch, "observations", () => entity.Observations = CrudValueNormalizer.NormalizeOptionalText(request.Observations));
        SetIfPresent(patch, "familyCooperationLevel", () => entity.FamilyCooperationLevel = CrudValueNormalizer.NormalizeOptionalText(request.FamilyCooperationLevel));
        SetIfPresent(patch, "safetyConcernsNoted", () => entity.SafetyConcernsNoted = request.SafetyConcernsNoted);
        SetIfPresent(patch, "followUpNeeded", () => entity.FollowUpNeeded = request.FollowUpNeeded);
        SetIfPresent(patch, "followUpNotes", () => entity.FollowUpNotes = CrudValueNormalizer.NormalizeOptionalText(request.FollowUpNotes));
        SetIfPresent(patch, "visitOutcome", () => entity.VisitOutcome = CrudValueNormalizer.NormalizeOptionalText(request.VisitOutcome));
    }

    public static void ApplyProcessRecording(
        ProcessRecording entity,
        ProcessRecordingWriteRequest request,
        JsonRequestPatch<ProcessRecordingWriteRequest>? patch = null)
    {
        SetIfPresent(patch, "residentId", () => entity.ResidentId = request.ResidentId);
        SetIfPresent(patch, "sessionDate", () => entity.SessionDate = request.SessionDate);
        SetIfPresent(patch, "socialWorker", () => entity.SocialWorker = CrudValueNormalizer.NormalizeOptionalText(request.SocialWorker));
        SetIfPresent(patch, "sessionType", () => entity.SessionType = CrudValueNormalizer.NormalizeOptionalText(request.SessionType));
        SetIfPresent(patch, "sessionDurationMinutes", () => entity.SessionDurationMinutes = request.SessionDurationMinutes);
        SetIfPresent(patch, "emotionalStateObserved", () => entity.EmotionalStateObserved = CrudValueNormalizer.NormalizeOptionalText(request.EmotionalStateObserved));
        SetIfPresent(patch, "emotionalStateEnd", () => entity.EmotionalStateEnd = CrudValueNormalizer.NormalizeOptionalText(request.EmotionalStateEnd));
        SetIfPresent(patch, "sessionNarrative", () => entity.SessionNarrative = CrudValueNormalizer.NormalizeOptionalText(request.SessionNarrative));
        SetIfPresent(patch, "interventionsApplied", () => entity.InterventionsApplied = CrudValueNormalizer.NormalizeOptionalText(request.InterventionsApplied));
        SetIfPresent(patch, "followUpActions", () => entity.FollowUpActions = CrudValueNormalizer.NormalizeOptionalText(request.FollowUpActions));
        SetIfPresent(patch, "progressNoted", () => entity.ProgressNoted = request.ProgressNoted);
        SetIfPresent(patch, "concernsFlagged", () => entity.ConcernsFlagged = request.ConcernsFlagged);
        SetIfPresent(patch, "referralMade", () => entity.ReferralMade = request.ReferralMade);
        SetIfPresent(patch, "notesRestricted", () => entity.NotesRestricted = CrudValueNormalizer.NormalizeOptionalText(request.NotesRestricted));
    }

    public static void ApplyBoardingPlacement(
        BoardingPlacement entity,
        BoardingPlacementWriteRequest request,
        JsonRequestPatch<BoardingPlacementWriteRequest>? patch = null)
    {
        SetIfPresent(patch, "residentId", () => entity.ResidentId = request.ResidentId);
        SetIfPresent(patch, "safehouseId", () => entity.SafehouseId = request.SafehouseId);
        SetIfPresent(patch, "placementStatus", () => entity.PlacementStatus = CrudValueNormalizer.NormalizeOptionalText(request.PlacementStatus));
        SetIfPresent(patch, "confidentialResidentName", () => entity.ConfidentialResidentName = CrudValueNormalizer.NormalizeOptionalText(request.ConfidentialResidentName));
        SetIfPresent(patch, "bedLabel", () => entity.BedLabel = CrudValueNormalizer.NormalizeOptionalText(request.BedLabel));
        SetIfPresent(patch, "expectedCheckIn", () => entity.ExpectedCheckIn = request.ExpectedCheckIn);
        SetIfPresent(patch, "expectedCheckOut", () => entity.ExpectedCheckOut = request.ExpectedCheckOut);
        SetIfPresent(patch, "actualCheckIn", () => entity.ActualCheckIn = request.ActualCheckIn);
        SetIfPresent(patch, "actualCheckOut", () => entity.ActualCheckOut = request.ActualCheckOut);
        SetIfPresent(patch, "sensitivities", () => entity.Sensitivities = CrudValueNormalizer.NormalizeOptionalText(request.Sensitivities));
        SetIfPresent(patch, "specialConsiderations", () => entity.SpecialConsiderations = CrudValueNormalizer.NormalizeOptionalText(request.SpecialConsiderations));
        SetIfPresent(patch, "relationshipSummary", () => entity.RelationshipSummary = CrudValueNormalizer.NormalizeOptionalText(request.RelationshipSummary));
        SetIfPresent(patch, "childrenSummary", () => entity.ChildrenSummary = CrudValueNormalizer.NormalizeOptionalText(request.ChildrenSummary));
        SetIfPresent(patch, "placementNotes", () => entity.PlacementNotes = CrudValueNormalizer.NormalizeOptionalText(request.PlacementNotes));
    }

    public static void ApplyBoardingStandingOrder(
        BoardingStandingOrder entity,
        BoardingStandingOrderWriteRequest request,
        JsonRequestPatch<BoardingStandingOrderWriteRequest>? patch = null)
    {
        SetIfPresent(patch, "boardingPlacementId", () => entity.BoardingPlacementId = request.BoardingPlacementId ?? entity.BoardingPlacementId);
        SetIfPresent(patch, "category", () => entity.Category = CrudValueNormalizer.NormalizeOptionalText(request.Category));
        SetIfPresent(patch, "title", () => entity.Title = CrudValueNormalizer.NormalizeOptionalText(request.Title));
        SetIfPresent(patch, "details", () => entity.Details = CrudValueNormalizer.NormalizeOptionalText(request.Details));
        SetIfPresent(patch, "dueDate", () => entity.DueDate = request.DueDate);
        SetIfPresent(patch, "status", () => entity.Status = CrudValueNormalizer.NormalizeOptionalText(request.Status));
    }

    public static void ApplyIncident(
        IncidentReport entity,
        IncidentWriteRequest request,
        JsonRequestPatch<IncidentWriteRequest>? patch = null)
    {
        SetIfPresent(patch, "residentId", () => entity.ResidentId = request.ResidentId);
        SetIfPresent(patch, "safehouseId", () => entity.SafehouseId = request.SafehouseId);
        SetIfPresent(patch, "incidentDate", () => entity.IncidentDate = request.IncidentDate);
        SetIfPresent(patch, "incidentType", () => entity.IncidentType = CrudValueNormalizer.NormalizeOptionalText(request.IncidentType));
        SetIfPresent(patch, "severity", () => entity.Severity = CrudValueNormalizer.NormalizeOptionalText(request.Severity));
        SetIfPresent(patch, "description", () => entity.Description = CrudValueNormalizer.NormalizeOptionalText(request.Description));
        SetIfPresent(patch, "responseTaken", () => entity.ResponseTaken = CrudValueNormalizer.NormalizeOptionalText(request.ResponseTaken));
        SetIfPresent(patch, "resolved", () => entity.Resolved = request.Resolved);
        SetIfPresent(patch, "resolutionDate", () => entity.ResolutionDate = request.ResolutionDate);
        SetIfPresent(patch, "reportedBy", () => entity.ReportedBy = CrudValueNormalizer.NormalizeOptionalText(request.ReportedBy));
        SetIfPresent(patch, "followUpRequired", () => entity.FollowUpRequired = request.FollowUpRequired);
        SetIfPresent(patch, "assignedStaffUserId", () => entity.AssignedStaffUserId = CrudValueNormalizer.NormalizeOptionalText(request.AssignedStaffUserId));
        SetIfPresent(patch, "assignedStaffDisplayName", () => entity.AssignedStaffDisplayName = CrudValueNormalizer.NormalizeOptionalText(request.AssignedStaffDisplayName));
    }

    private static void SetIfPresent<T>(
        JsonRequestPatch<T>? patch,
        string propertyName,
        Action assignment)
        where T : class, new()
    {
        if (patch is null || patch.HasProperty(propertyName))
            assignment();
    }
}
