using Microsoft.AspNetCore.Identity;
// ApplicationUser inherits IdentityUser — no extra columns, but EF must know the concrete type.
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // The CSV files contain explicit IDs that must be preserved to maintain
        // foreign key relationships across tables. Tell EF not to treat these as
        // auto-generated identity columns so we can insert the CSV values directly.
        modelBuilder.Entity<Safehouse>().Property(e => e.SafehouseId).ValueGeneratedNever();
        modelBuilder.Entity<Resident>().Property(e => e.ResidentId).ValueGeneratedNever();
        modelBuilder.Entity<BoardingPlacement>().Property(e => e.BoardingPlacementId).ValueGeneratedNever();
        modelBuilder.Entity<BoardingStandingOrder>().Property(e => e.BoardingStandingOrderId).ValueGeneratedNever();
        modelBuilder.Entity<Donation>().Property(e => e.DonationId).ValueGeneratedNever();
        modelBuilder.Entity<DonationAllocation>().Property(e => e.AllocationId).ValueGeneratedNever();
        modelBuilder.Entity<EducationRecord>().Property(e => e.EducationRecordId).ValueGeneratedNever();
        modelBuilder.Entity<HealthWellbeingRecord>().Property(e => e.HealthRecordId).ValueGeneratedNever();
        modelBuilder.Entity<HomeVisitation>().Property(e => e.VisitationId).ValueGeneratedNever();
        modelBuilder.Entity<InKindDonationItem>().Property(e => e.ItemId).ValueGeneratedNever();
        modelBuilder.Entity<IncidentReport>().Property(e => e.IncidentId).ValueGeneratedNever();
        modelBuilder.Entity<InterventionPlan>().Property(e => e.PlanId).ValueGeneratedNever();
        modelBuilder.Entity<Partner>().Property(e => e.PartnerId).ValueGeneratedNever();
        modelBuilder.Entity<PartnerAssignment>().Property(e => e.AssignmentId).ValueGeneratedNever();
        modelBuilder.Entity<ProcessRecording>().Property(e => e.RecordingId).ValueGeneratedNever();
        modelBuilder.Entity<PublicImpactSnapshot>().Property(e => e.SnapshotId).ValueGeneratedNever();
        modelBuilder.Entity<SafehouseMonthlyMetric>().Property(e => e.MetricId).ValueGeneratedNever();
        modelBuilder.Entity<SocialMediaPost>().Property(e => e.PostId).ValueGeneratedNever();
        modelBuilder.Entity<Supporter>().Property(e => e.SupporterId).ValueGeneratedNever();
        modelBuilder.Entity<PipelineResult>().Property(e => e.PipelineResultId).ValueGeneratedNever();
        modelBuilder.Entity<PipelineResult>().Property(e => e.Score).HasPrecision(18, 6);

        // Email automation tables
        modelBuilder.Entity<EmailTemplate>().HasKey(e => e.TemplateId);
        modelBuilder.Entity<EmailTemplate>().Property(e => e.TemplateId).ValueGeneratedNever();

        modelBuilder.Entity<AutomationState>().HasData(
            new AutomationState { Id = 1, Enabled = false, EmailsThisWeek = 0 }
        );

        modelBuilder.Entity<EmailTemplate>().HasData(
            new EmailTemplate
            {
                TemplateId = "loyal",
                Name = "Loyal Donors",
                Description = "3+ gifts — partner-level tone",
                Trigger = "frequency >= 3",
                Subject = "You're making a difference, {{first_name}}",
                Body = "{{first_name}},\n\nYou are making a difference. We are so grateful for your commitment to these girls. You are one of our best supporters — your {{frequency}} heartfelt donations have helped fund {{program_area}}, supported girls through some of their hardest moments, and kept our doors open for those who need us most.\n\nWe are growing more than ever and working to reach more girls across the Philippines. Right now we are in need of funding for {{program_area}}, and even a donation of {{suggested_amount}} would help us get closer to our goal. Anything you give goes a long way to protecting our girls.\n\n{{donate_button}}\n\n— Lunas Project",
                LastEdited = new DateTime(2026, 4, 8, 0, 0, 0, DateTimeKind.Utc),
                LastEditedBy = "system"
            },
            new EmailTemplate
            {
                TemplateId = "first_time",
                Name = "First-Time Donors",
                Description = "1-2 gifts — welcome tone",
                Trigger = "frequency <= 2",
                Subject = "{{first_name}}, your gift is already making an impact",
                Body = "{{first_name}},\n\nYou are making a difference. Thank you for your generous gift to Lunas Foundation — it means more than you know. Your donation has gone toward {{program_area}}, directly supporting girls who had nowhere else to turn.\n\nWe are growing and working hard to reach even more girls who need us. A donation of {{suggested_amount}} would help us continue that work. Every contribution, no matter the size, goes directly to protecting and empowering the girls in our care.\n\n{{donate_button}}\n\n— Lunas Project",
                LastEdited = new DateTime(2026, 4, 8, 0, 0, 0, DateTimeKind.Utc),
                LastEditedBy = "system"
            },
            new EmailTemplate
            {
                TemplateId = "win_back",
                Name = "Win-Back",
                Description = "90+ days since last gift — reactivation tone",
                Trigger = "recency > 90",
                Subject = "We miss you, {{first_name}}",
                Body = "{{first_name}},\n\nYou made a difference — and we haven't forgotten it. Your past generosity helped fund {{program_area}} and supported girls during some of their most vulnerable moments. That gift mattered then, and it still matters now.\n\nA lot has happened since your last donation. We are reaching more girls than ever and growing every month — but we need supporters like you to keep going. Even a gift of {{suggested_amount}} would help us continue the work you helped start.\n\n{{donate_button}}\n\n— Lunas Project",
                LastEdited = new DateTime(2026, 4, 8, 0, 0, 0, DateTimeKind.Utc),
                LastEditedBy = "system"
            }
        );

        modelBuilder.Entity<BoardingPlacement>()
            .HasOne<Resident>()
            .WithMany()
            .HasForeignKey(e => e.ResidentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BoardingPlacement>()
            .HasOne<Safehouse>()
            .WithMany()
            .HasForeignKey(e => e.SafehouseId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BoardingStandingOrder>()
            .HasOne<BoardingPlacement>()
            .WithMany()
            .HasForeignKey(e => e.BoardingPlacementId)
            .OnDelete(DeleteBehavior.Cascade);

        // Explicit SQL precision prevents EF Core from falling back to provider defaults
        // that can silently truncate money, ratios, and measurement data.
        modelBuilder.Entity<Donation>(entity =>
        {
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.EstimatedValue).HasPrecision(18, 2);
        });

        modelBuilder.Entity<DonationAllocation>(entity =>
        {
            entity.Property(e => e.AmountAllocated).HasPrecision(18, 2);
        });

        modelBuilder.Entity<EducationRecord>(entity =>
        {
            entity.Property(e => e.AttendanceRate).HasPrecision(9, 4);
            entity.Property(e => e.ProgressPercent).HasPrecision(9, 4);
        });

        modelBuilder.Entity<HealthWellbeingRecord>(entity =>
        {
            entity.Property(e => e.GeneralHealthScore).HasPrecision(9, 2);
            entity.Property(e => e.NutritionScore).HasPrecision(9, 2);
            entity.Property(e => e.SleepQualityScore).HasPrecision(9, 2);
            entity.Property(e => e.EnergyLevelScore).HasPrecision(9, 2);
            entity.Property(e => e.HeightCm).HasPrecision(9, 2);
            entity.Property(e => e.WeightKg).HasPrecision(9, 2);
            entity.Property(e => e.Bmi).HasPrecision(9, 2);
        });

        modelBuilder.Entity<InKindDonationItem>(entity =>
        {
            entity.Property(e => e.Quantity).HasPrecision(18, 2);
            entity.Property(e => e.EstimatedUnitValue).HasPrecision(18, 2);
        });

        modelBuilder.Entity<SafehouseMonthlyMetric>(entity =>
        {
            entity.Property(e => e.AvgEducationProgress).HasPrecision(9, 4);
            entity.Property(e => e.AvgHealthScore).HasPrecision(9, 2);
        });

        modelBuilder.Entity<SocialMediaPost>(entity =>
        {
            entity.Property(e => e.BoostBudgetPhp).HasPrecision(18, 2);
            entity.Property(e => e.EngagementRate).HasPrecision(9, 4);
            entity.Property(e => e.EstimatedDonationValuePhp).HasPrecision(18, 2);
            entity.Property(e => e.WatchTimeSeconds).HasPrecision(18, 2);
            entity.Property(e => e.AvgViewDurationSeconds).HasPrecision(18, 2);
        });
    }

    public DbSet<Safehouse> Safehouses { get; set; }
    public DbSet<Resident> Residents { get; set; }
    public DbSet<BoardingPlacement> BoardingPlacements { get; set; }
    public DbSet<BoardingStandingOrder> BoardingStandingOrders { get; set; }
    public DbSet<Donation> Donations { get; set; }
    public DbSet<DonationAllocation> DonationAllocations { get; set; }
    public DbSet<EducationRecord> EducationRecords { get; set; }
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords { get; set; }
    public DbSet<HomeVisitation> HomeVisitations { get; set; }
    public DbSet<InKindDonationItem> InKindDonationItems { get; set; }
    public DbSet<IncidentReport> IncidentReports { get; set; }
    public DbSet<InterventionPlan> InterventionPlans { get; set; }
    public DbSet<Partner> Partners { get; set; }
    public DbSet<PartnerAssignment> PartnerAssignments { get; set; }
    public DbSet<ProcessRecording> ProcessRecordings { get; set; }
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots { get; set; }
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics { get; set; }
    public DbSet<SocialMediaPost> SocialMediaPosts { get; set; }
    public DbSet<Supporter> Supporters { get; set; }
    public DbSet<PipelineResult> PipelineResults { get; set; }
    public DbSet<EmailTemplate> EmailTemplates { get; set; }
    public DbSet<OutreachEmailLog> OutreachEmailLogs { get; set; }
    public DbSet<AutomationState> AutomationStates { get; set; }
}
