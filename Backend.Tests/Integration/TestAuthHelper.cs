using System.Text;
using System.Text.Json;
using Backend.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Integration;

/// <summary>
/// Creates pre-authenticated HttpClients for role-based integration tests.
///
/// HTTPS base address is required: Program.cs sets CookieSecurePolicy.Always,
/// meaning the auth cookie carries the Secure flag and the .NET CookieContainer
/// will not send it on plain HTTP test requests. Using https://localhost as the
/// base address tells the in-memory TestServer to treat requests as HTTPS, which
/// satisfies the Secure-flag constraint without needing a real TLS certificate.
/// </summary>
public static class TestAuthHelper
{
    private static readonly Uri HttpsBase = new("https://localhost");

    /// <summary>
    /// Returns an HttpClient authenticated as the seeded test admin user.
    /// Credentials are injected by CustomWebApplicationFactory via appsettings.
    /// </summary>
    public static async Task<HttpClient> CreateAdminClientAsync(
        CustomWebApplicationFactory factory)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = HttpsBase,
            HandleCookies = true
        });

        await LoginAsync(client, "test-admin@test.local", "TestAdminPassword!!");
        return client;
    }

    /// <summary>
    /// Registers a fresh user with a unique email, assigns the Donor role via
    /// the DI container, logs in, and returns the authenticated client.
    /// </summary>
    public static async Task<HttpClient> CreateDonorClientAsync(
        CustomWebApplicationFactory factory)
    {
        var email = $"donor-{Guid.NewGuid():N}@test.local";
        const string password = "DonorTestPassword1234!!";

        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = HttpsBase,
            HandleCookies = true
        });

        await RegisterAsync(client, email, password);

        // Assign the Donor role directly via the DI container — the Identity
        // API /register endpoint creates accounts with no role by default.
        // Google-OAuth sign-up is the normal Donor on-boarding path in production,
        // but that flow is not exercisable in integration tests.
        using (var scope = factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email);
            if (user is not null)
                await userManager.AddToRoleAsync(user, AuthRoles.Donor);
        }

        await LoginAsync(client, email, password);
        return client;
    }

    /// <summary>
    /// Registers a fresh user, assigns the Staff role, logs in, and returns
    /// the authenticated client.
    /// </summary>
    public static async Task<HttpClient> CreateStaffClientAsync(
        CustomWebApplicationFactory factory)
    {
        var email = $"staff-{Guid.NewGuid():N}@test.local";
        const string password = "StaffTestPassword1234!!";

        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = HttpsBase,
            HandleCookies = true
        });

        await RegisterAsync(client, email, password);

        using (var scope = factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email);
            if (user is not null)
                await userManager.AddToRoleAsync(user, AuthRoles.Staff);
        }

        await LoginAsync(client, email, password);
        return client;
    }

    /// <summary>
    /// Registers a fresh user with no role and logs in.
    /// Represents an authenticated user who has not yet been assigned a role
    /// (e.g., a self-registered account pending admin approval).
    /// </summary>
    public static async Task<HttpClient> CreateRolelessClientAsync(
        CustomWebApplicationFactory factory)
    {
        var email = $"roleless-{Guid.NewGuid():N}@test.local";
        const string password = "RolelessTestPassword1234!!";

        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = HttpsBase,
            HandleCookies = true
        });

        await RegisterAsync(client, email, password);
        await LoginAsync(client, email, password);
        return client;
    }

    // ── Re-usable building blocks ─────────────────────────────────────────────

    /// <summary>
    /// POSTs to the Identity API /register endpoint.
    /// Does not throw on failure — callers assert the response themselves.
    /// </summary>
    public static async Task RegisterAsync(HttpClient client, string email, string password)
    {
        var payload = JsonSerializer.Serialize(new { email, password });
        var content = new StringContent(payload, Encoding.UTF8, "application/json");
        await client.PostAsync("/api/auth/register", content);
    }

    /// <summary>
    /// POSTs to the Identity API /login endpoint with useCookies=true.
    /// On success, the auth cookie is stored in the client's CookieContainer
    /// and sent automatically on all subsequent requests.
    /// </summary>
    public static async Task LoginAsync(HttpClient client, string email, string password)
    {
        var payload = JsonSerializer.Serialize(new { email, password });
        var content = new StringContent(payload, Encoding.UTF8, "application/json");
        await client.PostAsync("/api/auth/login?useCookies=true", content);
    }
}
