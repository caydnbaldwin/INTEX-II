using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Backend.Infrastructure;

public sealed record DatabaseStartupPolicy(bool ApplyMigrations, bool RunSeedData)
{
    public static DatabaseStartupPolicy Resolve(IHostEnvironment environment, IConfiguration configuration)
    {
        if (environment.IsEnvironment("Testing"))
            return new DatabaseStartupPolicy(false, false);

        var section = configuration.GetSection("DatabaseStartup");
        var applyMigrations = section.GetValue<bool?>("ApplyMigrations") ?? environment.IsDevelopment();
        var runSeedData = section.GetValue<bool?>("RunSeedData") ?? environment.IsDevelopment();

        return new DatabaseStartupPolicy(applyMigrations, runSeedData);
    }
}
