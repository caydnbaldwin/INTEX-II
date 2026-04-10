using Backend.Models;
using Backend.Services;

namespace Backend.Tests.Unit;

/// <summary>
/// Covers model classes and DTOs that were otherwise unreachable from existing tests.
/// No business logic — simply exercises property getters/setters and record constructors
/// so the coverage tool counts those lines.
/// </summary>
public class ModelsCoverageTests
{
    [Fact]
    public void Partner_AllProperties_SetAndGet()
    {
        var p = new Partner
        {
            PartnerId   = 1,
            PartnerName = "Helping Hands NGO",
            PartnerType = "NGO",
            RoleType    = "Service Provider",
            ContactName = "Maria Cruz",
            Email       = "maria@helpinghands.ph",
            Phone       = "+63-912-345-6789",
            Region      = "Region I",
            Status      = "Active",
            StartDate   = new DateOnly(2023, 6, 1),
            EndDate     = new DateOnly(2025, 12, 31),
            Notes       = "Primary shelter support partner"
        };

        Assert.Equal(1, p.PartnerId);
        Assert.Equal("Helping Hands NGO", p.PartnerName);
        Assert.Equal("NGO", p.PartnerType);
        Assert.Equal("Service Provider", p.RoleType);
        Assert.Equal("Maria Cruz", p.ContactName);
        Assert.Equal("maria@helpinghands.ph", p.Email);
        Assert.Equal("+63-912-345-6789", p.Phone);
        Assert.Equal("Region I", p.Region);
        Assert.Equal("Active", p.Status);
        Assert.Equal(new DateOnly(2023, 6, 1), p.StartDate);
        Assert.Equal(new DateOnly(2025, 12, 31), p.EndDate);
        Assert.Equal("Primary shelter support partner", p.Notes);
    }

    [Fact]
    public void PartnerAssignment_AllProperties_SetAndGet()
    {
        var pa = new PartnerAssignment
        {
            AssignmentId       = 42,
            PartnerId          = 7,
            SafehouseId        = 3,
            ProgramArea        = "Education",
            AssignmentStart    = new DateOnly(2024, 1, 15),
            AssignmentEnd      = new DateOnly(2024, 12, 31),
            ResponsibilityNotes = "Lead educational support for Region I",
            IsPrimary          = true,
            Status             = "Active"
        };

        Assert.Equal(42, pa.AssignmentId);
        Assert.Equal(7, pa.PartnerId);
        Assert.Equal(3, pa.SafehouseId);
        Assert.Equal("Education", pa.ProgramArea);
        Assert.Equal(new DateOnly(2024, 1, 15), pa.AssignmentStart);
        Assert.Equal(new DateOnly(2024, 12, 31), pa.AssignmentEnd);
        Assert.Equal("Lead educational support for Region I", pa.ResponsibilityNotes);
        Assert.True(pa.IsPrimary);
        Assert.Equal("Active", pa.Status);
    }

    [Fact]
    public void PartnerAssignment_NullableProperties_AcceptNull()
    {
        var pa = new PartnerAssignment { AssignmentId = 1 };

        Assert.Null(pa.PartnerId);
        Assert.Null(pa.SafehouseId);
        Assert.Null(pa.ProgramArea);
        Assert.Null(pa.AssignmentStart);
        Assert.Null(pa.AssignmentEnd);
        Assert.Null(pa.ResponsibilityNotes);
        Assert.Null(pa.IsPrimary);
        Assert.Null(pa.Status);
    }

    [Fact]
    public void SocialMediaPost_AllProperties_SetAndGet()
    {
        var ts = new DateTime(2026, 4, 10, 9, 0, 0, DateTimeKind.Utc);

        var post = new SocialMediaPost
        {
            PostId                    = 500,
            Platform                  = "Facebook",
            PlatformPostId            = "fb_post_abc123",
            PostUrl                   = "https://facebook.com/lunasproject/posts/abc123",
            CreatedAt                 = ts,
            DayOfWeek                 = "Thursday",
            PostHour                  = 9,
            PostType                  = "Video",
            MediaType                 = "Reel",
            Caption                   = "Empowering survivors every day.",
            Hashtags                  = "#LunasProject #Hope",
            NumHashtags               = 2,
            MentionsCount             = 1,
            HasCallToAction           = true,
            CallToActionType          = "Donate",
            ContentTopic              = "Survivor Stories",
            SentimentTone             = "Inspirational",
            CaptionLength             = 33,
            FeaturesResidentStory     = true,
            CampaignName              = "Spring 2026",
            IsBoosted                 = false,
            BoostBudgetPhp            = 0m,
            Impressions               = 12500,
            Reach                     = 10800,
            Likes                     = 620,
            Comments                  = 45,
            Shares                    = 88,
            Saves                     = 30,
            ClickThroughs             = 210,
            VideoViews                = 7800,
            EngagementRate            = 0.078m,
            ProfileVisits             = 95,
            DonationReferrals         = 14,
            EstimatedDonationValuePhp = 42000m,
            FollowerCountAtPost       = 18400,
            WatchTimeSeconds          = 45.5m,
            AvgViewDurationSeconds    = 32.1m,
            SubscriberCountAtPost     = 18400,
            Forwards                  = 12
        };

        Assert.Equal(500, post.PostId);
        Assert.Equal("Facebook", post.Platform);
        Assert.Equal("fb_post_abc123", post.PlatformPostId);
        Assert.Equal("https://facebook.com/lunasproject/posts/abc123", post.PostUrl);
        Assert.Equal(ts, post.CreatedAt);
        Assert.Equal("Thursday", post.DayOfWeek);
        Assert.Equal(9, post.PostHour);
        Assert.Equal("Video", post.PostType);
        Assert.Equal("Reel", post.MediaType);
        Assert.Equal("Empowering survivors every day.", post.Caption);
        Assert.Equal("#LunasProject #Hope", post.Hashtags);
        Assert.Equal(2, post.NumHashtags);
        Assert.Equal(1, post.MentionsCount);
        Assert.True(post.HasCallToAction);
        Assert.Equal("Donate", post.CallToActionType);
        Assert.Equal("Survivor Stories", post.ContentTopic);
        Assert.Equal("Inspirational", post.SentimentTone);
        Assert.Equal(33, post.CaptionLength);
        Assert.True(post.FeaturesResidentStory);
        Assert.Equal("Spring 2026", post.CampaignName);
        Assert.False(post.IsBoosted);
        Assert.Equal(0m, post.BoostBudgetPhp);
        Assert.Equal(12500, post.Impressions);
        Assert.Equal(10800, post.Reach);
        Assert.Equal(620, post.Likes);
        Assert.Equal(45, post.Comments);
        Assert.Equal(88, post.Shares);
        Assert.Equal(30, post.Saves);
        Assert.Equal(210, post.ClickThroughs);
        Assert.Equal(7800, post.VideoViews);
        Assert.Equal(0.078m, post.EngagementRate);
        Assert.Equal(95, post.ProfileVisits);
        Assert.Equal(14, post.DonationReferrals);
        Assert.Equal(42000m, post.EstimatedDonationValuePhp);
        Assert.Equal(18400, post.FollowerCountAtPost);
        Assert.Equal(45.5m, post.WatchTimeSeconds);
        Assert.Equal(32.1m, post.AvgViewDurationSeconds);
        Assert.Equal(18400, post.SubscriberCountAtPost);
        Assert.Equal(12, post.Forwards);
    }

    [Fact]
    public void OutreachEmailLog_OutreachEmailLogId_SetAndGet()
    {
        // Line 5 in OutreachEmailLog.cs — the OutreachEmailLogId primary key property
        var log = new OutreachEmailLog
        {
            OutreachEmailLogId = 999,
            SupporterId        = 42,
            DonorName          = "Jose Santos",
            Email              = "jose.santos@example.com",
            TemplateId         = "loyal",
            Subject            = "Thank you for your loyal support",
            Body               = "Dear Jose, ...",
            Status             = "sent",
            SentAt             = DateTime.UtcNow
        };

        Assert.Equal(999, log.OutreachEmailLogId);
        Assert.Equal(42, log.SupporterId);
        Assert.Equal("Jose Santos", log.DonorName);
        Assert.Equal("jose.santos@example.com", log.Email);
        Assert.Equal("loyal", log.TemplateId);
        Assert.Equal("Thank you for your loyal support", log.Subject);
        Assert.Equal("sent", log.Status);
    }

    [Fact]
    public void IntentResult_WithEntityName_UsesNamedParameter()
    {
        // Line 23 of ChatModels.cs — EntityName optional parameter
        var withName = new IntentResult(
            Category:   "resident_detail",
            SafehouseId: null,
            Metric:     null,
            Limit:      1,
            Sort:       null,
            EntityName: "RC-0042");

        Assert.Equal("resident_detail", withName.Category);
        Assert.Equal("RC-0042", withName.EntityName);

        // Default path (no EntityName)
        var noName = new IntentResult("donor_churn", null, null, 10, "desc");
        Assert.Null(noName.EntityName);
    }

    [Fact]
    public void ExpansionDtos_ConstructedAndRead()
    {
        // SegmentRate record
        var seg = new SegmentRate("Trafficked", 120, 90, 0.75, 0.20);
        Assert.Equal("Trafficked", seg.Segment);
        Assert.Equal(120, seg.Count);
        Assert.Equal(90, seg.SuccessCount);
        Assert.Equal(0.75, seg.SuccessRate);
        Assert.Equal(0.20, seg.LiftOverBaseline);

        // SuccessProfile record
        var profile = new SuccessProfile(
            TotalResidentsAnalyzed: 200,
            TotalSuccessful:        150,
            OverallSuccessRate:     0.75,
            ByCaseSubcategory:      [seg],
            ByAgeGroup:             [],
            ByFamilyProfile:        [],
            ByInitialRisk:          [],
            ByReferralSource:       []
        );
        Assert.Equal(200, profile.TotalResidentsAnalyzed);
        Assert.Equal(150, profile.TotalSuccessful);
        Assert.Equal(0.75, profile.OverallSuccessRate);
        Assert.Single(profile.ByCaseSubcategory);

        // RegionRecommendation record
        var region = new RegionRecommendation(
            RegionCode:           "BARMM",
            RegionName:           "Bangsamoro",
            IslandGroup:          "Mindanao",
            NeedScore:            88,
            SuccessMatchScore:    72.5,
            FinalScore:           80.3,
            Rank:                 1,
            SafetyFlag:           true,
            TopMatchingSegments:  ["Trafficked", "Age 13-15"],
            AiRationale:          null
        );
        Assert.Equal("BARMM", region.RegionCode);
        Assert.Equal(1, region.Rank);
        Assert.True(region.SafetyFlag);
        Assert.Null(region.AiRationale);
        Assert.Equal(2, region.TopMatchingSegments.Count);

        // RegionRecommendation with AI rationale
        var withRationale = region with { AiRationale = "Strong demographic match." };
        Assert.Equal("Strong demographic match.", withRationale.AiRationale);

        // ExpansionRecommendationDto record
        var generatedAt = DateTime.UtcNow;
        var dto = new ExpansionRecommendationDto(
            GeneratedAt:   generatedAt,
            SuccessProfile: profile,
            RankedRegions: [region],
            OverallInsight: "BARMM shows highest unmet need."
        );
        Assert.Equal(generatedAt, dto.GeneratedAt);
        Assert.Equal("BARMM shows highest unmet need.", dto.OverallInsight);
        Assert.Single(dto.RankedRegions);
    }
}
