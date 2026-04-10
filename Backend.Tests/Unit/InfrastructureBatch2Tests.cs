using System.ComponentModel.DataAnnotations;
using Backend.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace Backend.Tests.Unit;

/// <summary>
/// Covers Infrastructure branches not reached by existing tests:
///   • DatabaseStartupPolicy.Resolve — non-Testing environment paths (config-driven + dev defaults)
///   • RequestValidation.ToCamelCase — the empty-string short-circuit on line 54
/// </summary>
public class InfrastructureBatch2Tests
{
    // ── DatabaseStartupPolicy ─────────────────────────────────────────────────

    [Fact]
    public void DatabaseStartupPolicy_Testing_AlwaysReturnsFalse()
    {
        var env    = MakeEnv("Testing");
        var config = new ConfigurationBuilder().Build();

        var policy = DatabaseStartupPolicy.Resolve(env, config);

        Assert.False(policy.ApplyMigrations);
        Assert.False(policy.RunSeedData);
    }

    [Fact]
    public void DatabaseStartupPolicy_Development_DefaultsToTrue()
    {
        // Lines 13-17: non-Testing branch with no config section present.
        // IsDevelopment() returns true → both flags default to true.
        var env    = MakeEnv("Development");
        var config = new ConfigurationBuilder().Build();

        var policy = DatabaseStartupPolicy.Resolve(env, config);

        Assert.True(policy.ApplyMigrations);
        Assert.True(policy.RunSeedData);
    }

    [Fact]
    public void DatabaseStartupPolicy_Production_DefaultsToFalse()
    {
        // Production is not Development → IsDevelopment() == false → both flags false by default.
        var env    = MakeEnv("Production");
        var config = new ConfigurationBuilder().Build();

        var policy = DatabaseStartupPolicy.Resolve(env, config);

        Assert.False(policy.ApplyMigrations);
        Assert.False(policy.RunSeedData);
    }

    [Fact]
    public void DatabaseStartupPolicy_ConfigOverride_AppliesWhenPresent()
    {
        // Lines 14-15: config section values override the environment default.
        var env = MakeEnv("Production");
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DatabaseStartup:ApplyMigrations"] = "true",
                ["DatabaseStartup:RunSeedData"]     = "false"
            })
            .Build();

        var policy = DatabaseStartupPolicy.Resolve(env, config);

        Assert.True(policy.ApplyMigrations);
        Assert.False(policy.RunSeedData);
    }

    [Fact]
    public void DatabaseStartupPolicy_BothConfigTrue_Works()
    {
        var env = MakeEnv("Staging");
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DatabaseStartup:ApplyMigrations"] = "true",
                ["DatabaseStartup:RunSeedData"]     = "true"
            })
            .Build();

        var policy = DatabaseStartupPolicy.Resolve(env, config);

        Assert.True(policy.ApplyMigrations);
        Assert.True(policy.RunSeedData);
    }

    // ── RequestValidation — empty MemberName path ──────────────────────────

    [Fact]
    public void RequestValidation_ValidationResult_WithNoMemberNames_MapsToEmptyKey()
    {
        // ToCamelCase receives string.Empty when a ValidationResult carries no
        // member names. The guard on line 53-54 returns string.Empty directly.
        var model = new ModelWithGlobalError();

        var ok = RequestValidation.TryValidate(model, out var problem, "Global error test");

        Assert.False(ok);
        Assert.NotNull(problem);
        // The empty-string key should be present in the errors dictionary
        Assert.Contains(string.Empty, problem!.Errors.Keys);
        Assert.Equal("Global validation error", problem.Errors[string.Empty][0]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static IHostEnvironment MakeEnv(string name) => new FakeHostEnvironment(name);

    private sealed class FakeHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "Backend";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    /// <summary>
    /// IValidatableObject that returns a ValidationResult with NO MemberNames,
    /// which triggers the string.Empty branch inside RequestValidation.ToCamelCase.
    /// </summary>
    private sealed class ModelWithGlobalError : IValidatableObject
    {
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // MemberNames is empty → RequestValidation will use [string.Empty] as the key
            yield return new ValidationResult("Global validation error");
        }
    }
}
