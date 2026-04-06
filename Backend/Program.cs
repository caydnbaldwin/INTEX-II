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
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
            "http://localhost:5173",
            "https://lunas-project.site",
            "https://www.lunas-project.site",
            "https://intex-ii.vercel.app"
        )
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// ── Run migrations and seed data on startup ───────────────────────────────────
// Migrations are applied if pending. The seeder only inserts data if tables are
// empty — it will not duplicate rows on subsequent startups.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var seedPath = Path.Combine(AppContext.BaseDirectory, "Data", "SeedData");
    await DataSeeder.SeedAsync(db, seedPath);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
