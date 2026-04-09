using Backend.Data;
using Backend.Infrastructure;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Logging.ClearProviders();
    builder.Logging.AddConsole();
}

const string FrontendCorsPolicy = "AllowFrontend";
const string DefaultFrontendUrl = "http://localhost:4200";
var frontendUrl = builder.Configuration["FrontendUrl"] ?? DefaultFrontendUrl;
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];

// ── Database ──────────────────────────────────────────────────────────────────
// In the Testing environment (WebApplicationFactory) the InMemory provider is used
// so integration tests run without a real database connection. The factory passes
// a unique database name via configuration to keep test classes isolated.
// All other environments use SQL Server.
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (builder.Environment.IsEnvironment("Testing"))
        options.UseInMemoryDatabase(
            builder.Configuration["TestDatabaseName"] ?? "TestDb");
    else
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"));
});

// ── Identity ──────────────────────────────────────────────────────────────────
// AddIdentityApiEndpoints maps /register, /login, /refresh, etc. under any prefix
// you choose (see app.MapGroup below). It is designed for SPA / API clients.
builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Password policy — must match what was taught in IS 414 (NOT Microsoft doc defaults).
builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 14;
    options.Password.RequiredUniqueChars = 1;
});

// Cookie configuration for browser clients.
// Dev: SameSite=None is required because the frontend (http://localhost:4200) and backend
// (https://localhost:5200) use different schemes. Chrome's schemeful same-site treats
// these as cross-site, blocking Lax cookies on fetch requests. None+Secure allows them.
// Production: Lax is correct — frontend and backend share the same scheme and domain.
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.None
        : SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
});

// The two-factor partial sign-in cookie (Identity.TwoFactorUserId) is a separate scheme
// and must also be set to SameSite=None in dev, otherwise Chrome blocks it cross-origin
// and TwoFactorAuthenticatorSignInAsync can't find the pending sign-in state.
builder.Services.Configure<CookieAuthenticationOptions>(
    IdentityConstants.TwoFactorUserIdScheme,
    options =>
    {
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = builder.Environment.IsDevelopment()
            ? SameSiteMode.None
            : SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    });

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Secrets stored in appsettings.Development.json (dev) and Azure App Settings (prod).
// The block is skipped entirely if the keys are absent so local dev without Google
// credentials still starts successfully.
if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    builder.Services.AddAuthentication()
        .AddGoogle(options =>
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;
            options.SignInScheme = IdentityConstants.ExternalScheme;
            options.CallbackPath = "/signin-google";
        });
}

// ── Authorization policies ────────────────────────────────────────────────────
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthPolicies.AdminOnly, policy =>
        policy.RequireRole(AuthRoles.Admin));
    options.AddPolicy(AuthPolicies.StaffOrAdmin, policy =>
        policy.RequireRole(AuthRoles.Admin, AuthRoles.Staff));
});

// ── HSTS ──────────────────────────────────────────────────────────────────────
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
});

// ── CORS ──────────────────────────────────────────────────────────────────────
// AllowCredentials() is required for cookie-based auth to work across origins.
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins(
                frontendUrl,
                "http://localhost:4200",
                "https://lunas-project.site",
                "https://www.lunas-project.site",
                "https://intex-ii.vercel.app"
            )
            .AllowCredentials()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddControllers();
// ── Gemini Audio Autofill ─────────────────────────────────────────────────────
builder.Services.AddHttpClient<IAudioAutofillService, AudioAutofillService>();

// ── Email Automation ─────────────────────────────────────────────────────────
builder.Services.AddHttpClient<IEmailService, ResendEmailService>();
builder.Services.AddScoped<IDonorScoringService, DonorScoringService>();
builder.Services.AddHostedService<WeeklyEmailHostedService>();
builder.Services.AddOpenApi();

var app = builder.Build();

// ── Seed roles and default admin user ─────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (app.Environment.IsEnvironment("Testing"))
        db.Database.EnsureCreated();
    else
        db.Database.Migrate();

    // Skip CSV seeding in the Testing environment: tests don't need production
    // data, and the InMemory provider rejects duplicate PKs that SQL Server
    // would catch at the constraint level.
    if (!app.Environment.IsEnvironment("Testing"))
    {
        var seedPath = Path.Combine(AppContext.BaseDirectory, "Data", "SeedData");
        await DataSeeder.SeedAsync(db, seedPath);
    }

    await AuthIdentityGenerator.GenerateDefaultIdentityAsync(
        scope.ServiceProvider, app.Configuration);
}

// ── Middleware pipeline ────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// Security headers (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
// must come before UseCors so headers are set on every response.
app.UseSecurityHeaders();

app.UseCors(FrontendCorsPolicy);

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Maps Identity API minimal endpoints: /register, /login, /refresh, /confirmEmail, etc.
app.MapGroup("/api/auth").MapIdentityApi<ApplicationUser>();

app.Run();

// Exposes the generated Program class to the test assembly via WebApplicationFactory<Program>.
public partial class Program { }
