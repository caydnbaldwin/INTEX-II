using Backend.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Integration;

/// <summary>
/// Spins up the full ASP.NET pipeline in the "Testing" environment with an
/// InMemory database substituted for SQL Server.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // Each factory instance gets its own isolated InMemory database so test
        // classes don't share state or race on the identity seeder.
        var uniqueDbName = "TestDb_" + Guid.NewGuid();

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GenerateDefaultIdentityAdmin:Email"]    = "test-admin@test.local",
                ["GenerateDefaultIdentityAdmin:Password"] = "TestAdminPassword!!"
            });
        });

        // Replace the SQL Server DbContext registered in Program.cs with InMemory.
        // ConfigureServices runs after Program.cs, so removing the options descriptor
        // and re-registering is sufficient to swap the provider.
        builder.ConfigureServices(services =>
        {
            var optDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (optDescriptor != null)
                services.Remove(optDescriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(uniqueDbName));
        });
    }
}
