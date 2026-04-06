using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DonationAllocations",
                columns: table => new
                {
                    AllocationId = table.Column<int>(type: "int", nullable: false),
                    DonationId = table.Column<int>(type: "int", nullable: true),
                    SafehouseId = table.Column<int>(type: "int", nullable: true),
                    ProgramArea = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AmountAllocated = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AllocationDate = table.Column<DateOnly>(type: "date", nullable: true),
                    AllocationNotes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DonationAllocations", x => x.AllocationId);
                });

            migrationBuilder.CreateTable(
                name: "Donations",
                columns: table => new
                {
                    DonationId = table.Column<int>(type: "int", nullable: false),
                    SupporterId = table.Column<int>(type: "int", nullable: true),
                    DonationType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DonationDate = table.Column<DateOnly>(type: "date", nullable: true),
                    IsRecurring = table.Column<bool>(type: "bit", nullable: true),
                    CampaignName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChannelSource = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CurrencyCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    EstimatedValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ImpactUnit = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferralPostId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Donations", x => x.DonationId);
                });

            migrationBuilder.CreateTable(
                name: "EducationRecords",
                columns: table => new
                {
                    EducationRecordId = table.Column<int>(type: "int", nullable: false),
                    ResidentId = table.Column<int>(type: "int", nullable: true),
                    RecordDate = table.Column<DateOnly>(type: "date", nullable: true),
                    EducationLevel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SchoolName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EnrollmentStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttendanceRate = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ProgressPercent = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CompletionStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EducationRecords", x => x.EducationRecordId);
                });

            migrationBuilder.CreateTable(
                name: "HealthWellbeingRecords",
                columns: table => new
                {
                    HealthRecordId = table.Column<int>(type: "int", nullable: false),
                    ResidentId = table.Column<int>(type: "int", nullable: true),
                    RecordDate = table.Column<DateOnly>(type: "date", nullable: true),
                    GeneralHealthScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    NutritionScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    SleepQualityScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    EnergyLevelScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    HeightCm = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    WeightKg = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Bmi = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MedicalCheckupDone = table.Column<bool>(type: "bit", nullable: true),
                    DentalCheckupDone = table.Column<bool>(type: "bit", nullable: true),
                    PsychologicalCheckupDone = table.Column<bool>(type: "bit", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthWellbeingRecords", x => x.HealthRecordId);
                });

            migrationBuilder.CreateTable(
                name: "HomeVisitations",
                columns: table => new
                {
                    VisitationId = table.Column<int>(type: "int", nullable: false),
                    ResidentId = table.Column<int>(type: "int", nullable: true),
                    VisitDate = table.Column<DateOnly>(type: "date", nullable: true),
                    SocialWorker = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VisitType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LocationVisited = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FamilyMembersPresent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Purpose = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Observations = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FamilyCooperationLevel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SafetyConcernsNoted = table.Column<bool>(type: "bit", nullable: true),
                    FollowUpNeeded = table.Column<bool>(type: "bit", nullable: true),
                    FollowUpNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VisitOutcome = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HomeVisitations", x => x.VisitationId);
                });

            migrationBuilder.CreateTable(
                name: "IncidentReports",
                columns: table => new
                {
                    IncidentId = table.Column<int>(type: "int", nullable: false),
                    ResidentId = table.Column<int>(type: "int", nullable: true),
                    SafehouseId = table.Column<int>(type: "int", nullable: true),
                    IncidentDate = table.Column<DateOnly>(type: "date", nullable: true),
                    IncidentType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Severity = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResponseTaken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Resolved = table.Column<bool>(type: "bit", nullable: true),
                    ResolutionDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ReportedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FollowUpRequired = table.Column<bool>(type: "bit", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentReports", x => x.IncidentId);
                });

            migrationBuilder.CreateTable(
                name: "InKindDonationItems",
                columns: table => new
                {
                    ItemId = table.Column<int>(type: "int", nullable: false),
                    DonationId = table.Column<int>(type: "int", nullable: true),
                    ItemName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ItemCategory = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    UnitOfMeasure = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EstimatedUnitValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    IntendedUse = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReceivedCondition = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InKindDonationItems", x => x.ItemId);
                });

            migrationBuilder.CreateTable(
                name: "InterventionPlans",
                columns: table => new
                {
                    PlanId = table.Column<int>(type: "int", nullable: false),
                    ResidentId = table.Column<int>(type: "int", nullable: true),
                    PlanCategory = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlanDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ServicesProvided = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TargetValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TargetDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CaseConferenceDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterventionPlans", x => x.PlanId);
                });

            migrationBuilder.CreateTable(
                name: "PartnerAssignments",
                columns: table => new
                {
                    AssignmentId = table.Column<int>(type: "int", nullable: false),
                    PartnerId = table.Column<int>(type: "int", nullable: true),
                    SafehouseId = table.Column<int>(type: "int", nullable: true),
                    ProgramArea = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssignmentStart = table.Column<DateOnly>(type: "date", nullable: true),
                    AssignmentEnd = table.Column<DateOnly>(type: "date", nullable: true),
                    ResponsibilityNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartnerAssignments", x => x.AssignmentId);
                });

            migrationBuilder.CreateTable(
                name: "Partners",
                columns: table => new
                {
                    PartnerId = table.Column<int>(type: "int", nullable: false),
                    PartnerName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PartnerType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RoleType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Region = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Partners", x => x.PartnerId);
                });

            migrationBuilder.CreateTable(
                name: "ProcessRecordings",
                columns: table => new
                {
                    RecordingId = table.Column<int>(type: "int", nullable: false),
                    ResidentId = table.Column<int>(type: "int", nullable: true),
                    SessionDate = table.Column<DateOnly>(type: "date", nullable: true),
                    SocialWorker = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SessionType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SessionDurationMinutes = table.Column<int>(type: "int", nullable: true),
                    EmotionalStateObserved = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmotionalStateEnd = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SessionNarrative = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InterventionsApplied = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FollowUpActions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProgressNoted = table.Column<bool>(type: "bit", nullable: true),
                    ConcernsFlagged = table.Column<bool>(type: "bit", nullable: true),
                    ReferralMade = table.Column<bool>(type: "bit", nullable: true),
                    NotesRestricted = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessRecordings", x => x.RecordingId);
                });

            migrationBuilder.CreateTable(
                name: "PublicImpactSnapshots",
                columns: table => new
                {
                    SnapshotId = table.Column<int>(type: "int", nullable: false),
                    SnapshotDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Headline = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SummaryText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MetricPayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPublished = table.Column<bool>(type: "bit", nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicImpactSnapshots", x => x.SnapshotId);
                });

            migrationBuilder.CreateTable(
                name: "Residents",
                columns: table => new
                {
                    ResidentId = table.Column<int>(type: "int", nullable: false),
                    CaseControlNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InternalCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SafehouseId = table.Column<int>(type: "int", nullable: true),
                    CaseStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Sex = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    BirthStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlaceOfBirth = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Religion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CaseCategory = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubCatOrphaned = table.Column<bool>(type: "bit", nullable: true),
                    SubCatTrafficked = table.Column<bool>(type: "bit", nullable: true),
                    SubCatChildLabor = table.Column<bool>(type: "bit", nullable: true),
                    SubCatPhysicalAbuse = table.Column<bool>(type: "bit", nullable: true),
                    SubCatSexualAbuse = table.Column<bool>(type: "bit", nullable: true),
                    SubCatOsaec = table.Column<bool>(type: "bit", nullable: true),
                    SubCatCicl = table.Column<bool>(type: "bit", nullable: true),
                    SubCatAtRisk = table.Column<bool>(type: "bit", nullable: true),
                    SubCatStreetChild = table.Column<bool>(type: "bit", nullable: true),
                    SubCatChildWithHiv = table.Column<bool>(type: "bit", nullable: true),
                    IsPwd = table.Column<bool>(type: "bit", nullable: true),
                    PwdType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HasSpecialNeeds = table.Column<bool>(type: "bit", nullable: true),
                    SpecialNeedsDiagnosis = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FamilyIs4ps = table.Column<bool>(type: "bit", nullable: true),
                    FamilySoloParent = table.Column<bool>(type: "bit", nullable: true),
                    FamilyIndigenous = table.Column<bool>(type: "bit", nullable: true),
                    FamilyParentPwd = table.Column<bool>(type: "bit", nullable: true),
                    FamilyInformalSettler = table.Column<bool>(type: "bit", nullable: true),
                    DateOfAdmission = table.Column<DateOnly>(type: "date", nullable: true),
                    AgeUponAdmission = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PresentAge = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LengthOfStay = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferralSource = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferringAgencyPerson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateColbRegistered = table.Column<DateOnly>(type: "date", nullable: true),
                    DateColbObtained = table.Column<DateOnly>(type: "date", nullable: true),
                    AssignedSocialWorker = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InitialCaseAssessment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateCaseStudyPrepared = table.Column<DateOnly>(type: "date", nullable: true),
                    ReintegrationType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReintegrationStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InitialRiskLevel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CurrentRiskLevel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateEnrolled = table.Column<DateOnly>(type: "date", nullable: true),
                    DateClosed = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NotesRestricted = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Residents", x => x.ResidentId);
                });

            migrationBuilder.CreateTable(
                name: "SafehouseMonthlyMetrics",
                columns: table => new
                {
                    MetricId = table.Column<int>(type: "int", nullable: false),
                    SafehouseId = table.Column<int>(type: "int", nullable: true),
                    MonthStart = table.Column<DateOnly>(type: "date", nullable: true),
                    MonthEnd = table.Column<DateOnly>(type: "date", nullable: true),
                    ActiveResidents = table.Column<int>(type: "int", nullable: true),
                    AvgEducationProgress = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AvgHealthScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ProcessRecordingCount = table.Column<int>(type: "int", nullable: true),
                    HomeVisitationCount = table.Column<int>(type: "int", nullable: true),
                    IncidentCount = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SafehouseMonthlyMetrics", x => x.MetricId);
                });

            migrationBuilder.CreateTable(
                name: "Safehouses",
                columns: table => new
                {
                    SafehouseId = table.Column<int>(type: "int", nullable: false),
                    SafehouseCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Region = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Province = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Country = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OpenDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CapacityGirls = table.Column<int>(type: "int", nullable: true),
                    CapacityStaff = table.Column<int>(type: "int", nullable: true),
                    CurrentOccupancy = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Safehouses", x => x.SafehouseId);
                });

            migrationBuilder.CreateTable(
                name: "SocialMediaPosts",
                columns: table => new
                {
                    PostId = table.Column<int>(type: "int", nullable: false),
                    Platform = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlatformPostId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PostUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DayOfWeek = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PostHour = table.Column<int>(type: "int", nullable: true),
                    PostType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MediaType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Caption = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Hashtags = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NumHashtags = table.Column<int>(type: "int", nullable: true),
                    MentionsCount = table.Column<int>(type: "int", nullable: true),
                    HasCallToAction = table.Column<bool>(type: "bit", nullable: true),
                    CallToActionType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContentTopic = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SentimentTone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CaptionLength = table.Column<int>(type: "int", nullable: true),
                    FeaturesResidentStory = table.Column<bool>(type: "bit", nullable: true),
                    CampaignName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsBoosted = table.Column<bool>(type: "bit", nullable: true),
                    BoostBudgetPhp = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Impressions = table.Column<int>(type: "int", nullable: true),
                    Reach = table.Column<int>(type: "int", nullable: true),
                    Likes = table.Column<int>(type: "int", nullable: true),
                    Comments = table.Column<int>(type: "int", nullable: true),
                    Shares = table.Column<int>(type: "int", nullable: true),
                    Saves = table.Column<int>(type: "int", nullable: true),
                    ClickThroughs = table.Column<int>(type: "int", nullable: true),
                    VideoViews = table.Column<int>(type: "int", nullable: true),
                    EngagementRate = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ProfileVisits = table.Column<int>(type: "int", nullable: true),
                    DonationReferrals = table.Column<int>(type: "int", nullable: true),
                    EstimatedDonationValuePhp = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    FollowerCountAtPost = table.Column<int>(type: "int", nullable: true),
                    WatchTimeSeconds = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AvgViewDurationSeconds = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    SubscriberCountAtPost = table.Column<int>(type: "int", nullable: true),
                    Forwards = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialMediaPosts", x => x.PostId);
                });

            migrationBuilder.CreateTable(
                name: "Supporters",
                columns: table => new
                {
                    SupporterId = table.Column<int>(type: "int", nullable: false),
                    SupporterType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OrganizationName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RelationshipType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Region = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Country = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FirstDonationDate = table.Column<DateOnly>(type: "date", nullable: true),
                    AcquisitionChannel = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Supporters", x => x.SupporterId);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "DonationAllocations");

            migrationBuilder.DropTable(
                name: "Donations");

            migrationBuilder.DropTable(
                name: "EducationRecords");

            migrationBuilder.DropTable(
                name: "HealthWellbeingRecords");

            migrationBuilder.DropTable(
                name: "HomeVisitations");

            migrationBuilder.DropTable(
                name: "IncidentReports");

            migrationBuilder.DropTable(
                name: "InKindDonationItems");

            migrationBuilder.DropTable(
                name: "InterventionPlans");

            migrationBuilder.DropTable(
                name: "PartnerAssignments");

            migrationBuilder.DropTable(
                name: "Partners");

            migrationBuilder.DropTable(
                name: "ProcessRecordings");

            migrationBuilder.DropTable(
                name: "PublicImpactSnapshots");

            migrationBuilder.DropTable(
                name: "Residents");

            migrationBuilder.DropTable(
                name: "SafehouseMonthlyMetrics");

            migrationBuilder.DropTable(
                name: "Safehouses");

            migrationBuilder.DropTable(
                name: "SocialMediaPosts");

            migrationBuilder.DropTable(
                name: "Supporters");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");
        }
    }
}
