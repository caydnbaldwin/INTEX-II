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
}
