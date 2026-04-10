using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Tests.Integration;

/// <summary>
/// Spins up the full ASP.NET pipeline in the "Testing" environment.
/// Program.cs detects "Testing" and registers an InMemory database automatically,
/// so no provider-swapping is needed here — that pattern breaks in EF Core 8+
/// when both SQL Server and InMemory infrastructure end up in the same DI container.
/// Each factory instance gets a unique database name so test classes don't share state.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TestDatabaseName"]                       = "TestDb_" + Guid.NewGuid(),
                ["DatabaseStartup:ApplyMigrations"]       = "false",
                ["DatabaseStartup:RunSeedData"]           = "false",
                ["GenerateDefaultIdentityAdmin:Email"]    = "test-admin@test.local",
                ["GenerateDefaultIdentityAdmin:Password"] = "TestAdminPassword!!"
            });
        });

        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddConsole();
        });
    }
}
