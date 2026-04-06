using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db, string seedDataPath)
    {
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HeaderValidated = null,   // ignore columns in CSV that don't map to a property
            MissingFieldFound = null, // ignore missing columns gracefully
            BadDataFound = null,      // skip rows with bad data rather than throwing
        };

        await SeedTable(db.Safehouses, "safehouses.csv", seedDataPath, config, db);
        await SeedTable(db.Partners, "partners.csv", seedDataPath, config, db);
        await SeedTable(db.Supporters, "supporters.csv", seedDataPath, config, db);
        await SeedTable(db.Residents, "residents.csv", seedDataPath, config, db);
        await SeedTable(db.Donations, "donations.csv", seedDataPath, config, db);
        await SeedTable(db.DonationAllocations, "donation_allocations.csv", seedDataPath, config, db);
        await SeedTable(db.EducationRecords, "education_records.csv", seedDataPath, config, db);
        await SeedTable(db.HealthWellbeingRecords, "health_wellbeing_records.csv", seedDataPath, config, db);
        await SeedTable(db.HomeVisitations, "home_visitations.csv", seedDataPath, config, db);
        await SeedTable(db.InKindDonationItems, "in_kind_donation_items.csv", seedDataPath, config, db);
        await SeedTable(db.IncidentReports, "incident_reports.csv", seedDataPath, config, db);
        await SeedTable(db.InterventionPlans, "intervention_plans.csv", seedDataPath, config, db);
        await SeedTable(db.PartnerAssignments, "partner_assignments.csv", seedDataPath, config, db);
        await SeedTable(db.ProcessRecordings, "process_recordings.csv", seedDataPath, config, db);
        await SeedTable(db.PublicImpactSnapshots, "public_impact_snapshots.csv", seedDataPath, config, db);
        await SeedTable(db.SafehouseMonthlyMetrics, "safehouse_monthly_metrics.csv", seedDataPath, config, db);
        await SeedTable(db.SocialMediaPosts, "social_media_posts.csv", seedDataPath, config, db);
    }

    private static async Task SeedTable<T>(
        DbSet<T> dbSet,
        string fileName,
        string seedDataPath,
        CsvConfiguration config,
        AppDbContext db) where T : class
    {
        if (await dbSet.AnyAsync()) return; // already seeded, skip

        var filePath = Path.Combine(seedDataPath, fileName);
        if (!File.Exists(filePath))
        {
            Console.WriteLine($"[Seeder] Skipping {fileName} — file not found.");
            return;
        }

        using var reader = new StreamReader(filePath);
        using var csv = new CsvReader(reader, config);

        var records = csv.GetRecords<T>().ToList();
        await dbSet.AddRangeAsync(records);
        await db.SaveChangesAsync();
        Console.WriteLine($"[Seeder] Seeded {records.Count} rows into {typeof(T).Name}.");
    }
}
