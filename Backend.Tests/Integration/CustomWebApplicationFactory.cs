using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Backend.Tests.Integration;

/// <summary>
/// Spins up the full ASP.NET pipeline in the "Testing" environment.
/// Program.cs gates the database provider on the environment name:
///   - Testing  → InMemory (no real DB connection needed)
///   - All else → SQL Server
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Switches Program.cs to the InMemory database path and skips EF migrations.
        builder.UseEnvironment("Testing");

        // Each factory instance gets its own isolated InMemory database so test
        // classes don't share state or race on the identity seeder.
        var uniqueDbName = "TestDb_" + Guid.NewGuid();

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Testing:DatabaseName"]                  = uniqueDbName,
                ["GenerateDefaultIdentityAdmin:Email"]    = "test-admin@test.local",
                ["GenerateDefaultIdentityAdmin:Password"] = "TestAdminPassword!!"
            });
        });
    }
}
