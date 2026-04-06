# INITIAL PROJECT SETUP GUIDE
### IS 413 – Enterprise Application Development | INTEX II

**Goal of this document:** Get the CI/CD pipeline live end-to-end with the simplest possible working app. No auth, no business logic, no fancy UI. Just:
1. A backend deployed to Azure with all 17 database tables seeded from CSV
2. A frontend deployed to Vercel with two buttons to verify connectivity
3. Automatic redeployment on every push to `main`

Everything else — auth, pages, roles, ML, security — gets layered on top in later sprints.

---

## Prerequisites

Install these before you start:

- [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/) (comes with npm)
- [Git](https://git-scm.com/)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)

Verify your installs:

```bash
dotnet --version   # must be 10.x.x
node --version     # must be 20.x.x or higher
az --version       # any recent version
```

You also need:
- An [Azure for Students](https://azure.microsoft.com/en-us/free/students/) account
- A [Vercel](https://vercel.com/) account (sign up with GitHub for seamless integration)
- Your team's GitHub repository

---

## How Secrets Work in This Project

Before touching any code, understand this — it will save you hours of confusion.

**The rule:** Secrets (database passwords, API keys) live in exactly two places:
1. **Locally**: A `.env` file (frontend) or `dotnet user-secrets` (backend) — both are gitignored
2. **In production**: Azure App Service "Application Settings" (backend) and Vercel "Environment Variables" (frontend)

**Azure App Service Application Settings** are just environment variables that Azure injects into your app process at runtime. You set them in the Azure Portal or via CLI. Your C# code reads them the same way it reads `appsettings.json` — via `builder.Configuration["Key"]`. No extra service, no Key Vault, nothing complicated. When you run `dotnet user-secrets set "ConnectionStrings:DefaultConnection" "..."` locally, the production equivalent is setting `ConnectionStrings__DefaultConnection` (note the double underscore) as an Azure App Setting.

**There is no secrets file in the repository.** Ever. The `.gitignore` takes care of this.

---

## Part 1 — Initialize the ASP.NET Backend

### 1.1 Scaffold the Project

From the root of the repository:

```bash
dotnet new webapi -n Backend --use-controllers -o ./Backend
cd Backend
```

### 1.2 Install NuGet Packages

```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package CsvHelper
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
```

`CsvHelper` is a well-maintained library for parsing CSV files in C#. It handles quoted fields, type conversion, and edge cases that manual string splitting will not.

`Microsoft.AspNetCore.Identity.EntityFrameworkCore` wires ASP.NET Identity into EF Core, so user/role tables are created alongside your application tables in the same migration.

### 1.3 Project Structure

Create the following folders inside `./Backend`:

```
Backend/
├── Controllers/
├── Data/
│   ├── AppDbContext.cs
│   └── DataSeeder.cs
├── Models/             ← one file per table
├── Migrations/         ← auto-generated, do not edit manually
├── Properties/
│   └── launchSettings.json
├── appsettings.json
├── appsettings.Development.json
├── Program.cs
└── Backend.csproj
```

### 1.4 Copy the CSV Files Into the Backend Project

The CSV data files need to ship with the backend so the seeder can find them at startup.

```bash
# From the repo root
mkdir -p Backend/Data/SeedData
cp LighthouseData/*.csv Backend/Data/SeedData/
```

Then open `Backend/Backend.csproj` and add this inside the `<Project>` block so the CSV files are copied to the build output:

```xml
<ItemGroup>
  <Content Include="Data\SeedData\*.csv">
    <CopyToOutputDirectory>Always</CopyToOutputDirectory>
  </Content>
</ItemGroup>
```

This ensures that when the app is published and deployed, the CSV files travel with it.

### 1.5 Create the Model Classes

Create one C# class per CSV file inside `./Backend/Models/`. The property names should match the CSV column headers (CsvHelper will map them automatically by convention).

Below is the full set of models. Each class maps directly to one CSV file and will become one database table.

**`Models/Safehouse.cs`**
```csharp
namespace Backend.Models;

public class Safehouse
{
    public int SafehouseId { get; set; }
    public string? SafehouseCode { get; set; }
    public string? Name { get; set; }
    public string? Region { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? Country { get; set; }
    public DateOnly? OpenDate { get; set; }
    public string? Status { get; set; }
    public int? CapacityGirls { get; set; }
    public int? CapacityStaff { get; set; }
    public int? CurrentOccupancy { get; set; }
    public string? Notes { get; set; }
}
```

**`Models/Resident.cs`** (abbreviated — follow the same pattern for all columns in residents.csv)
```csharp
namespace Backend.Models;

public class Resident
{
    public int ResidentId { get; set; }
    public string? CaseControlNo { get; set; }
    public string? InternalCode { get; set; }
    public int? SafehouseId { get; set; }
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
    public DateTime? CreatedAt { get; set; }
    public string? NotesRestricted { get; set; }
}
```

Follow the same pattern — one property per CSV column, using the camelCase version of the column name — for each of the remaining 15 models:

| CSV File | Model Class Name | Primary Key Property |
|---|---|---|
| `donations.csv` | `Donation` | `DonationId` |
| `donation_allocations.csv` | `DonationAllocation` | `AllocationId` |
| `education_records.csv` | `EducationRecord` | `EducationId` |
| `health_wellbeing_records.csv` | `HealthWellbeingRecord` | `HealthId` |
| `home_visitations.csv` | `HomeVisitation` | `VisitationId` |
| `in_kind_donation_items.csv` | `InKindDonationItem` | `ItemId` |
| `incident_reports.csv` | `IncidentReport` | `IncidentId` |
| `intervention_plans.csv` | `InterventionPlan` | `PlanId` |
| `partners.csv` | `Partner` | `PartnerId` |
| `partner_assignments.csv` | `PartnerAssignment` | `AssignmentId` |
| `process_recordings.csv` | `ProcessRecording` | `RecordingId` |
| `public_impact_snapshots.csv` | `PublicImpactSnapshot` | `SnapshotId` |
| `safehouse_monthly_metrics.csv` | `SafehouseMonthlyMetric` | `MetricId` |
| `social_media_posts.csv` | `SocialMediaPost` | `PostId` |
| `supporters.csv` | `Supporter` | `SupporterId` |

> **Tip:** Open each CSV in VS Code, look at the header row, and create one `public string? PropertyName { get; set; }` per column. Use nullable types (`string?`, `int?`, `bool?`, `DateOnly?`) for everything — CSV data is messy and nulls are common. You can tighten constraints later.

### 1.6 Create the DbContext

Create `./Backend/Data/AppDbContext.cs`:

```csharp
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

public class AppDbContext : IdentityDbContext<IdentityUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

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
```

### 1.7 Create the CSV Data Seeder

This class is called at startup. It checks whether each table is empty and, if so, reads the corresponding CSV and inserts all rows. This means it is safe to call on every startup — it will not duplicate data.

Create `./Backend/Data/DataSeeder.cs`:

```csharp
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
```

> **Why this order matters:** The seeder seeds parent tables before child tables. For example, `Safehouses` and `Partners` must exist before `Residents` (which references `SafehouseId`) and `PartnerAssignments` (which references `PartnerId`). If you add foreign key constraints later, this order prevents constraint violations. For now without enforced FK constraints, order still matters for clarity.

### 1.8 Create the Controllers

**`Controllers/HealthController.cs`** — Button 1:

```csharp
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { message = "Successfully connected." });
    }
}
```

**`Controllers/DbCheckController.cs`** — Button 2:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DbCheckController : ControllerBase
{
    private readonly AppDbContext _db;

    public DbCheckController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        // Attempt to fetch 1 row from each of the 17 tables.
        // Each entry is either the row data or an error message.
        var results = new Dictionary<string, object?>();

        results["safehouses"] = await TryFirst(_db.Safehouses);
        results["residents"] = await TryFirst(_db.Residents);
        results["donations"] = await TryFirst(_db.Donations);
        results["donation_allocations"] = await TryFirst(_db.DonationAllocations);
        results["education_records"] = await TryFirst(_db.EducationRecords);
        results["health_wellbeing_records"] = await TryFirst(_db.HealthWellbeingRecords);
        results["home_visitations"] = await TryFirst(_db.HomeVisitations);
        results["in_kind_donation_items"] = await TryFirst(_db.InKindDonationItems);
        results["incident_reports"] = await TryFirst(_db.IncidentReports);
        results["intervention_plans"] = await TryFirst(_db.InterventionPlans);
        results["partners"] = await TryFirst(_db.Partners);
        results["partner_assignments"] = await TryFirst(_db.PartnerAssignments);
        results["process_recordings"] = await TryFirst(_db.ProcessRecordings);
        results["public_impact_snapshots"] = await TryFirst(_db.PublicImpactSnapshots);
        results["safehouse_monthly_metrics"] = await TryFirst(_db.SafehouseMonthlyMetrics);
        results["social_media_posts"] = await TryFirst(_db.SocialMediaPosts);
        results["supporters"] = await TryFirst(_db.Supporters);

        return Ok(results);
    }

    private static async Task<object?> TryFirst<T>(IQueryable<T> set) where T : class
    {
        try
        {
            var row = await set.FirstOrDefaultAsync();
            return row as object ?? "empty table";
        }
        catch (Exception ex)
        {
            return $"error: {ex.Message}";
        }
    }
}
```

### 1.9 Configure `Program.cs`

```csharp
using Backend.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Identity ──────────────────────────────────────────────────────────────────
// AddRoles<IdentityRole>() enables role-based authorization (e.g. [Authorize(Roles = "Admin")]).
// Use the default IdentityUser for now — swap in a custom ApplicationUser later if you need
// extra profile fields (e.g. a foreign key to an employee or social worker record).
builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allows the Vercel frontend to call this API.
// Add your real Vercel URL here once you have it.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
            "http://localhost:5173",
            "https://your-app.vercel.app"   // ← update after Vercel deploy
        )
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ── Run migrations and seed data on startup ───────────────────────────────────
// This block runs every time the app starts. Migrations are applied if pending.
// The seeder only inserts data if tables are empty — it will not duplicate rows.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var seedPath = Path.Combine(AppContext.BaseDirectory, "Data", "SeedData");
    await DataSeeder.SeedAsync(db, seedPath);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### 1.10 Configure Local Secrets

```bash
cd Backend
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Server=YOUR_AZURE_SERVER.database.windows.net;Database=lunas-project-db;User Id=sqladmin;Password=YOUR_PASSWORD;TrustServerCertificate=False;Encrypt=True;"
```

> You will fill in the real server name and password after completing Part 3 (Azure setup). For now, you can use a local SQL Server Express connection string to test locally if you have it, or skip local DB testing and test against Azure directly.

### 1.11 Create the Initial Migration

```bash
dotnet ef migrations add InitialCreate
```

This generates the `Migrations/` folder with the SQL schema for all 17 tables. Do not run `dotnet ef database update` yet — the database does not exist locally. You will apply the migration via the startup code once Azure is configured.

### 1.12 Verify the Backend Builds

```bash
dotnet build
```

Fix any compilation errors before moving on. The most common issue at this stage is a model property type that does not match the CSV data — change it to `string?` if in doubt.

---

## Part 2 — Initialize the React Frontend

### 2.1 Scaffold the Project

From the **root of the repository** (not inside `./Backend`):

```bash
npm create vite@latest Frontend -- --template react-ts
cd Frontend
npm install
npm install axios
```

### 2.2 Configure Environment Variables

Create `./Frontend/.env` (this file is gitignored):

```
VITE_API_BASE_URL=http://localhost:5074
```

> The port number `5074` is whatever your local backend runs on. Check your `Backend/Properties/launchSettings.json` for the `applicationUrl` value and use the HTTP port for local development to avoid certificate issues.

Create `./Frontend/.env.example` (this IS committed — it documents what variables teammates need):

```
VITE_API_BASE_URL=https://your-azure-app-name.azurewebsites.net
```

Add `.env` to `./Frontend/.gitignore`:

```
.env
.env.local
.env.*.local
```

### 2.3 Build the Single-Page UI

Replace `./Frontend/src/App.tsx` with the following:

```tsx
import { useState } from 'react';
import axios from 'axios';
import './App.css';

const API = import.meta.env.VITE_API_BASE_URL;

type DbCheckResult = Record<string, unknown>;

function App() {
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [dbResults, setDbResults] = useState<DbCheckResult | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  async function verifyConnection() {
    setConnectionMessage(null);
    setConnectionError(false);
    try {
      const res = await axios.get<{ message: string }>(`${API}/api/health`);
      setConnectionMessage(res.data.message);
    } catch {
      setConnectionMessage('Failed to connect to backend.');
      setConnectionError(true);
    }
  }

  async function verifyDatabase() {
    setDbResults(null);
    setDbLoading(true);
    try {
      const res = await axios.get<DbCheckResult>(`${API}/api/dbcheck`);
      setDbResults(res.data);
    } catch {
      setDbResults({ error: 'Failed to reach backend.' });
    } finally {
      setDbLoading(false);
    }
  }

  const tableCount = dbResults
    ? Object.values(dbResults).filter((v) => typeof v !== 'string' || !v.startsWith('error')).length
    : 0;
  const totalTables = 17;
  const allGreen = tableCount === totalTables;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h1>INTEX II — Pipeline Verification</h1>

      {/* ── Button 1: Backend Health ── */}
      <section style={{ marginBottom: 32 }}>
        <button onClick={verifyConnection} style={btnStyle}>
          Verify Connection to Backend
        </button>
        {connectionMessage && (
          <p style={{ color: connectionError ? 'red' : 'green', marginTop: 8, fontWeight: 'bold' }}>
            {connectionMessage}
          </p>
        )}
      </section>

      {/* ── Button 2: Database Check ── */}
      <section>
        <button onClick={verifyDatabase} disabled={dbLoading} style={btnStyle}>
          {dbLoading ? 'Checking...' : 'Verify Database Connection'}
        </button>

        {dbResults && (
          <>
            {/* Score banner */}
            <p style={{
              marginTop: 16,
              fontSize: 20,
              fontWeight: 'bold',
              color: allGreen ? 'green' : 'red',
            }}>
              {tableCount}/{totalTables} tables connected
            </p>

            {/* One card per table */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginTop: 16 }}>
              {Object.entries(dbResults).map(([table, row]) => {
                const isError = typeof row === 'string' && row.startsWith('error');
                const isEmpty = row === 'empty table';
                return (
                  <div key={table} style={{
                    border: `2px solid ${isError ? 'red' : 'green'}`,
                    borderRadius: 8,
                    padding: 12,
                    background: isError ? '#fff5f5' : isEmpty ? '#fffbe6' : '#f0fff4',
                  }}>
                    <strong style={{ textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                      {table.replace(/_/g, ' ')}
                    </strong>
                    {isError || isEmpty ? (
                      <p style={{ color: isError ? 'red' : '#aaa', fontSize: 13, marginTop: 4 }}>
                        {String(row)}
                      </p>
                    ) : (
                      <pre style={{ fontSize: 10, marginTop: 8, overflow: 'auto', maxHeight: 120 }}>
                        {JSON.stringify(row, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '10px 24px',
  fontSize: 15,
  cursor: 'pointer',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#1a1a1a',
  color: 'white',
};

export default App;
```

### 2.4 Verify the Frontend Runs Locally

```bash
npm run dev
```

Open `http://localhost:5173`. You should see both buttons. They will not work yet until the backend is running.

---

## Part 3 — Set Up Azure Resources

### 3.1 Log In

```bash
az login
```

### 3.2 Create Resource Group, SQL Server, and Database

Run these commands one at a time. Replace `YourStrongPassword123!` with a real password your team will remember:

```bash
# Resource group — one container for everything
az group create --name lunas-project-rg --location eastus

# SQL Server instance
az sql server create \
  --name lunas-project-sql \
  --resource-group lunas-project-rg \
  --location eastus \
  --admin-user sqladmin \
  --admin-password "YourStrongPassword123!"

# Allow Azure services (including your App Service) to connect to the SQL server
az sql server firewall-rule create \
  --resource-group lunas-project-rg \
  --server lunas-project-sql \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your local machine to connect (for running migrations locally against Azure)
az sql server firewall-rule create \
  --resource-group lunas-project-rg \
  --server lunas-project-sql \
  --name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP

# Create the database (Basic tier = ~$5/month, sufficient for development)
az sql db create \
  --resource-group lunas-project-rg \
  --server lunas-project-sql \
  --name lunas-project-db \
  --service-objective Basic
```

> To find your IP address, run `curl ifconfig.me` in your terminal.

### 3.3 Create the App Service

```bash
# App Service Plan — the underlying VM that hosts your app
az appservice plan create \
  --name lunas-project-plan \
  --resource-group lunas-project-rg \
  --sku B1 \
  --is-linux

# Web App — replace YOUR_APP_NAME with something unique like intex-api-teamname
az webapp create \
  --resource-group lunas-project-rg \
  --plan lunas-project-plan \
  --name YOUR_APP_NAME \
  --runtime "DOTNETCORE:10.0"
```

> Use B1 (Basic) instead of F1 (Free) — the free tier does not support always-on, which means the app sleeps and your first request after idle takes 30+ seconds. B1 is roughly $13/month and well within your Azure credits.

### 3.4 Set the Connection String in Azure

This is the production equivalent of `dotnet user-secrets`. These values are stored in Azure and injected as environment variables at runtime. They are **never in your code or git repository**:

```bash
az webapp config connection-string set \
  --resource-group lunas-project-rg \
  --name YOUR_APP_NAME \
  --connection-string-type SQLAzure \
  --settings DefaultConnection="Server=lunas-project-sql.database.windows.net;Database=lunas-project-db;User Id=sqladmin;Password=YourStrongPassword123!;TrustServerCertificate=False;Encrypt=True;"
```

---

## Part 4 — Set Up CI/CD (GitHub Actions → Azure)

This is the most important part. After this, every push to `main` automatically redeploys the backend to Azure. You never run a manual deploy again.

### 4.1 Get the Azure Publish Profile

In the Azure Portal:
1. Navigate to your App Service (`YOUR_APP_NAME`)
2. Click **Get publish profile** (download button near the top)
3. Open the downloaded `.PublishSettings` file in a text editor and copy its entire contents

### 4.2 Store the Publish Profile as a GitHub Secret

In your GitHub repository:
1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Value: paste the entire contents of the `.PublishSettings` file

This secret lets GitHub Actions authenticate with Azure without exposing credentials in your code.

### 4.3 Create the GitHub Actions Workflow

Create the file `.github/workflows/deploy-backend.yml` in your repository:

```yaml
name: Deploy Backend to Azure

on:
  push:
    branches:
      - main
    paths:
      - 'Backend/**'        # only trigger when backend files change
      - '.github/workflows/deploy-backend.yml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up .NET 10
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.x'

      - name: Restore dependencies
        run: dotnet restore ./Backend/Backend.csproj

      - name: Build
        run: dotnet build ./Backend/Backend.csproj --configuration Release --no-restore

      - name: Publish
        run: dotnet publish ./Backend/Backend.csproj --configuration Release --output ./publish

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: YOUR_APP_NAME         # ← replace with your actual App Service name
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./publish
```

Commit and push this file. The first deployment will trigger automatically within seconds.

---

## Part 5 — Set Up CI/CD (GitHub → Vercel)

Vercel handles its own CI/CD once connected to GitHub. There is no workflow file needed.

### 5.1 Import the Project into Vercel

1. Go to [vercel.com](https://vercel.com/) → **Add New... → Project**
2. Select your GitHub repository
3. Set **Root Directory** to `Frontend`
4. Vercel will detect Vite automatically. The build settings should be:
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 5.2 Set the Environment Variable

Before clicking Deploy, expand **Environment Variables** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_BASE_URL` | `https://YOUR_APP_NAME.azurewebsites.net` | Production |
| `VITE_API_BASE_URL` | `http://localhost:5074` | Development |

### 5.3 Deploy

Click **Deploy**. From this point on, every push to `main` that changes anything in `./Frontend` will trigger a new Vercel deployment automatically. No configuration required.

### 5.4 Update the Backend CORS Policy

Once Vercel gives you your URL (e.g., `https://intex-teamname.vercel.app`), update `Program.cs`:

```csharp
.WithOrigins(
    "http://localhost:5173",
    "https://intex-teamname.vercel.app"   // ← your real Vercel URL
)
```

Push this change — the GitHub Action will redeploy the backend automatically.

---

## Part 6 — Verify Everything End-to-End

Walk through this checklist after both services are deployed:

1. **Backend health**: Open `https://YOUR_APP_NAME.azurewebsites.net/api/health` in your browser. You should see `{"message":"Successfully connected."}`.

2. **Swagger UI**: Open `https://YOUR_APP_NAME.azurewebsites.net/swagger`. You should see both endpoints documented.

3. **Frontend loads**: Open your Vercel URL. Both buttons should appear.

4. **Button 1**: Click "Verify Connection to Backend." The text "Successfully connected." should appear in green.

5. **Button 2**: Click "Verify Database Connection." After a few seconds (the first call triggers seeding if it hasn't run yet), you should see 17 cards and the banner reads **17/17** in green.

6. **CI/CD check**: Make a trivial change (e.g., change the `<h1>` text in `App.tsx`), commit, and push to `main`. Watch the Vercel dashboard — it should redeploy within 1–2 minutes.

---

## Troubleshooting

**"Could not connect to database" error in the Azure logs:**
- Confirm the App Service connection string was set correctly: `az webapp config connection-string list --resource-group lunas-project-rg --name YOUR_APP_NAME`
- Confirm the firewall rule for Azure services is in place

**First load takes 60+ seconds:**
- You are on the F1 (free) tier. Upgrade to B1 as noted above.

**Button 2 shows 0/17 or errors:**
- Check the Azure App Service log stream in the Portal for seeder output. Look for `[Seeder]` lines.
- The CSV files may not have been included in the publish output. Verify the `<CopyToOutputDirectory>Always</CopyToOutputDirectory>` entry is in `Backend.csproj`.

**CORS error in browser console:**
- Your Vercel URL is not in the `WithOrigins()` list in `Program.cs`. Update it and redeploy.

**GitHub Action fails on build:**
- Read the full error in the Actions tab. Usually a missing package reference or a model property type mismatch.
