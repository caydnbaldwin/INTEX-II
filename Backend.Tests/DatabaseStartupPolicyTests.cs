using Backend.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace Backend.Tests;

public class DatabaseStartupPolicyTests
{
    [Fact]
    public void Testing_Disables_Migrations_And_Seeding()
    {
        var environment = new FakeHostEnvironment("Testing");
        var configuration = new ConfigurationBuilder().Build();

        var policy = DatabaseStartupPolicy.Resolve(environment, configuration);

        Assert.False(policy.ApplyMigrations);
        Assert.False(policy.RunSeedData);
    }

    [Fact]
    public void Development_Defaults_To_Migrations_And_Seeding()
    {
        var environment = new FakeHostEnvironment(Environments.Development);
        var configuration = new ConfigurationBuilder().Build();

        var policy = DatabaseStartupPolicy.Resolve(environment, configuration);

        Assert.True(policy.ApplyMigrations);
        Assert.True(policy.RunSeedData);
    }

    [Fact]
    public void Production_Defaults_To_Manual_Database_Changes()
    {
        var environment = new FakeHostEnvironment(Environments.Production);
        var configuration = new ConfigurationBuilder().Build();

        var policy = DatabaseStartupPolicy.Resolve(environment, configuration);

        Assert.False(policy.ApplyMigrations);
        Assert.False(policy.RunSeedData);
    }

    [Fact]
    public void Explicit_Configuration_Overrides_Defaults()
    {
        var environment = new FakeHostEnvironment(Environments.Production);
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DatabaseStartup:ApplyMigrations"] = "true",
                ["DatabaseStartup:RunSeedData"] = "true"
            })
            .Build();

        var policy = DatabaseStartupPolicy.Resolve(environment, configuration);

        Assert.True(policy.ApplyMigrations);
        Assert.True(policy.RunSeedData);
    }

    private sealed class FakeHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "Backend.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
