using System.ComponentModel.DataAnnotations;

namespace Backend.Contracts;

public class ResidentWriteRequest
{
    public string? CaseControlNo { get; set; }

    [MinLength(1)]
    public string? InternalCode { get; set; }

    [Range(1, int.MaxValue)]
    public int? SafehouseId { get; set; }

    [MinLength(1)]
    public string? CaseStatus { get; set; }

    public string? Sex { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? BirthStatus { get; set; }
    public string? PlaceOfBirth { get; set; }
    public string? Religion { get; set; }
    public string? CaseCategory { get; set; }
    public bool? SubCatOrphaned { get; set; }
    public bool? SubCatTrafficked { get; set; }
    public bool? SubCatChildLabor { get; set; }
    public bool? SubCatPhysicalAbuse { get; set; }
    public bool? SubCatSexualAbuse { get; set; }
    public bool? SubCatOsaec { get; set; }
    public bool? SubCatCicl { get; set; }
    public bool? SubCatAtRisk { get; set; }
    public bool? SubCatStreetChild { get; set; }
    public bool? SubCatChildWithHiv { get; set; }
    public bool? IsPwd { get; set; }
    public string? PwdType { get; set; }
    public bool? HasSpecialNeeds { get; set; }
    public string? SpecialNeedsDiagnosis { get; set; }
    public bool? FamilyIs4ps { get; set; }
    public bool? FamilySoloParent { get; set; }
    public bool? FamilyIndigenous { get; set; }
    public bool? FamilyParentPwd { get; set; }
    public bool? FamilyInformalSettler { get; set; }
    public DateOnly? DateOfAdmission { get; set; }
    public string? AgeUponAdmission { get; set; }
    public string? PresentAge { get; set; }
    public string? LengthOfStay { get; set; }
    public string? ReferralSource { get; set; }
    public string? ReferringAgencyPerson { get; set; }
    public DateOnly? DateColbRegistered { get; set; }
    public DateOnly? DateColbObtained { get; set; }
    public string? AssignedSocialWorker { get; set; }
    public string? InitialCaseAssessment { get; set; }
    public DateOnly? DateCaseStudyPrepared { get; set; }
    public string? ReintegrationType { get; set; }
    public string? ReintegrationStatus { get; set; }
    public string? InitialRiskLevel { get; set; }
    public string? CurrentRiskLevel { get; set; }
    public DateOnly? DateEnrolled { get; set; }
    public DateOnly? DateClosed { get; set; }
    public string? NotesRestricted { get; set; }
}

public class SupporterWriteRequest
{
    [MinLength(1)]
    public string? SupporterType { get; set; }
    public string? DisplayName { get; set; }
    public string? OrganizationName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? RelationshipType { get; set; }
    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Status { get; set; }
    public DateOnly? FirstDonationDate { get; set; }
    public string? AcquisitionChannel { get; set; }
}

public class DonationWriteRequest
{
    [Range(1, int.MaxValue)]
    public int? SupporterId { get; set; }

    public string? DonationType { get; set; }
    public DateOnly? DonationDate { get; set; }
    public bool? IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string? ChannelSource { get; set; }
    public string? CurrencyCode { get; set; }
    public decimal? Amount { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? ImpactUnit { get; set; }
    public string? Notes { get; set; }
    public int? ReferralPostId { get; set; }
}

public class HomeVisitationWriteRequest
{
    [Range(1, int.MaxValue)]
    public int? ResidentId { get; set; }

    public DateOnly? VisitDate { get; set; }
    public string? SocialWorker { get; set; }

    [MinLength(1)]
    public string? VisitType { get; set; }

    public string? LocationVisited { get; set; }
    public string? FamilyMembersPresent { get; set; }
    public string? Purpose { get; set; }
    public string? Observations { get; set; }
    public string? FamilyCooperationLevel { get; set; }
    public bool? SafetyConcernsNoted { get; set; }
    public bool? FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string? VisitOutcome { get; set; }
}

public class ProcessRecordingWriteRequest
{
    [Range(1, int.MaxValue)]
    public int? ResidentId { get; set; }

    public DateOnly? SessionDate { get; set; }
    public string? SocialWorker { get; set; }

    [MinLength(1)]
    public string? SessionType { get; set; }

    public int? SessionDurationMinutes { get; set; }
    public string? EmotionalStateObserved { get; set; }
    public string? EmotionalStateEnd { get; set; }

    [MinLength(1)]
    public string? SessionNarrative { get; set; }

    public string? InterventionsApplied { get; set; }
    public string? FollowUpActions { get; set; }
    public bool? ProgressNoted { get; set; }
    public bool? ConcernsFlagged { get; set; }
    public bool? ReferralMade { get; set; }
    public string? NotesRestricted { get; set; }
}

public class BoardingPlacementWriteRequest
{
    [Range(1, int.MaxValue)]
    public int? ResidentId { get; set; }

    [Range(1, int.MaxValue)]
    public int? SafehouseId { get; set; }

    [MinLength(1)]
    public string? PlacementStatus { get; set; }

    public string? ConfidentialResidentName { get; set; }
    public string? BedLabel { get; set; }
    public DateOnly? ExpectedCheckIn { get; set; }
    public DateOnly? ExpectedCheckOut { get; set; }
    public DateOnly? ActualCheckIn { get; set; }
    public DateOnly? ActualCheckOut { get; set; }
    public string? Sensitivities { get; set; }
    public string? SpecialConsiderations { get; set; }
    public string? RelationshipSummary { get; set; }
    public string? ChildrenSummary { get; set; }
    public string? PlacementNotes { get; set; }
}

public class BoardingStandingOrderWriteRequest
{
    [Range(1, int.MaxValue)]
    public int? BoardingPlacementId { get; set; }

    public string? Category { get; set; }

    [MinLength(1)]
    public string? Title { get; set; }

    public string? Details { get; set; }
    public DateOnly? DueDate { get; set; }

    [MinLength(1)]
    public string? Status { get; set; }
}

public class IncidentWriteRequest
{
    [Range(1, int.MaxValue)]
    public int? ResidentId { get; set; }

    [Range(1, int.MaxValue)]
    public int? SafehouseId { get; set; }

    public DateOnly? IncidentDate { get; set; }
    public string? IncidentType { get; set; }
    public string? Severity { get; set; }
    public string? Description { get; set; }
    public string? ResponseTaken { get; set; }
    public bool? Resolved { get; set; }
    public DateOnly? ResolutionDate { get; set; }
    public string? ReportedBy { get; set; }
    public bool? FollowUpRequired { get; set; }
    public string? AssignedStaffUserId { get; set; }
    public string? AssignedStaffDisplayName { get; set; }
}
