using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Backend.Tests.Unit;

public class AuthIdentityGeneratorAndDataSeederEdgeTests
{
    [Fact]
    public async Task DataSeeder_InvalidCsv_And_SaveFailure_Branches_AreHandled()
    {
        var seedPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(seedPath);

        try
        {
            // Parse failure: SafehouseId cannot be converted to int.
            await using (var parseDb = CreateDb(nameof(DataSeeder_InvalidCsv_And_SaveFailure_Branches_AreHandled) + "_parse"))
            {
                await File.WriteAllTextAsync(
                    Path.Combine(seedPath, "safehouses.csv"),
                    "safehouse_id,name,region\nnot-an-int,Invalid,R1\n");

                await DataSeeder.SeedAsync(parseDb, seedPath);
                Assert.False(await parseDb.Safehouses.AnyAsync());
            }

            // Save failure path (with inner exception logging branch).
            await using (var saveDb = CreateThrowingDb(nameof(DataSeeder_InvalidCsv_And_SaveFailure_Branches_AreHandled) + "_save"))
            {
                await File.WriteAllTextAsync(
                    Path.Combine(seedPath, "safehouses.csv"),
                    "safehouse_id,name,region\n1,Seeded House,R1\n");

                await DataSeeder.SeedAsync(saveDb, seedPath);
                Assert.False(await saveDb.Safehouses.AnyAsync());
            }

            // Success path for parsed records -> AddRangeAsync + SaveChangesAsync + success logging.
            await using (var successDb = CreateDb(nameof(DataSeeder_InvalidCsv_And_SaveFailure_Branches_AreHandled) + "_success"))
            {
                await File.WriteAllTextAsync(
                    Path.Combine(seedPath, "safehouses.csv"),
                    "safehouse_id,name,region\n2,Successful House,R2\n");

                await DataSeeder.SeedAsync(successDb, seedPath);
                Assert.True(await successDb.Safehouses.AnyAsync(s => s.SafehouseId == 2));
            }
        }
        finally
        {
            Directory.Delete(seedPath, recursive: true);
        }
    }

    [Fact]
    public async Task AuthIdentityGenerator_Throws_OnRoleCreationFailure()
    {
        await using var db = CreateDb(nameof(AuthIdentityGenerator_Throws_OnRoleCreationFailure));
        var userManager = CreateConfigurableUserManager(db);
        var roleManager = new ConfigurableRoleManager(db)
        {
            ExistingRoles = [],
            CreateRoleResult = IdentityResult.Failed(new IdentityError { Description = "role create failed" })
        };

        var provider = BuildProvider(userManager, roleManager);
        var config = BuildConfiguration();

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            AuthIdentityGenerator.GenerateDefaultIdentityAsync(provider, config));

        Assert.Contains("Failed to create role", ex.Message);
    }

    [Fact]
    public async Task AuthIdentityGenerator_Throws_WhenAdminPasswordMissing()
    {
        await using var db = CreateDb(nameof(AuthIdentityGenerator_Throws_WhenAdminPasswordMissing));
        var userManager = CreateConfigurableUserManager(db);
        var roleManager = new ConfigurableRoleManager(db);

        var provider = BuildProvider(userManager, roleManager);
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["GenerateDefaultIdentityAdmin:Email"] = "admin@test.local",
            ["GenerateDefaultIdentityAdmin:Password"] = ""
        });

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            AuthIdentityGenerator.GenerateDefaultIdentityAsync(provider, config));

        Assert.Contains("Admin seed password is not configured", ex.Message);
    }

    [Fact]
    public async Task AuthIdentityGenerator_Throws_WhenAdminCreateFails_And_WhenAdminRoleAssignFails()
    {
        // Admin create failure.
        await using (var createFailDb = CreateDb(nameof(AuthIdentityGenerator_Throws_WhenAdminCreateFails_And_WhenAdminRoleAssignFails) + "_create"))
        {
            var createFailUserManager = CreateConfigurableUserManager(createFailDb);
            createFailUserManager.CreateUserResult = IdentityResult.Failed(new IdentityError { Description = "create failed" });
            var roleManager = new ConfigurableRoleManager(createFailDb);

            var provider = BuildProvider(createFailUserManager, roleManager);
            var config = BuildConfiguration(new Dictionary<string, string?>
            {
                ["GenerateDefaultIdentityAdmin:Email"] = "admin-create-fail@test.local",
                ["GenerateDefaultIdentityAdmin:Password"] = "AdminPassword123!!"
            });

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                AuthIdentityGenerator.GenerateDefaultIdentityAsync(provider, config));
            Assert.Contains("Failed to create admin user", ex.Message);
        }

        // Admin role assignment failure.
        await using (var roleFailDb = CreateDb(nameof(AuthIdentityGenerator_Throws_WhenAdminCreateFails_And_WhenAdminRoleAssignFails) + "_role"))
        {
            var roleFailUserManager = CreateConfigurableUserManager(roleFailDb);
            roleFailUserManager.AddToRoleResult = IdentityResult.Failed(new IdentityError { Description = "role assign failed" });
            var roleManager = new ConfigurableRoleManager(roleFailDb);

            var provider = BuildProvider(roleFailUserManager, roleManager);
            var config = BuildConfiguration(new Dictionary<string, string?>
            {
                ["GenerateDefaultIdentityAdmin:Email"] = "admin-role-fail@test.local",
                ["GenerateDefaultIdentityAdmin:Password"] = "AdminPassword123!!"
            });

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                AuthIdentityGenerator.GenerateDefaultIdentityAsync(provider, config));
            Assert.Contains("Failed to assign Admin role", ex.Message);
        }
    }

    [Fact]
    public async Task AuthIdentityGenerator_Throws_ForDonorAndMfa_MissingPassword_AndCreateFailure()
    {
        // Donor missing password.
        await using (var donorMissingDb = CreateDb(nameof(AuthIdentityGenerator_Throws_ForDonorAndMfa_MissingPassword_AndCreateFailure) + "_donor_missing"))
        {
            var userManager = CreateConfigurableUserManager(donorMissingDb);
            var roleManager = new ConfigurableRoleManager(donorMissingDb);
            var provider = BuildProvider(userManager, roleManager);
            var config = BuildConfiguration(new Dictionary<string, string?>
            {
                ["GenerateDefaultIdentityAdmin:Email"] = "admin@test.local",
                ["GenerateDefaultIdentityAdmin:Password"] = "AdminPassword123!!",
                ["GenerateDefaultIdentityDonor:Email"] = "donor@test.local",
                ["GenerateDefaultIdentityDonor:Password"] = ""
            });

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                AuthIdentityGenerator.GenerateDefaultIdentityAsync(provider, config));
            Assert.Contains("Donor seed password is not configured", ex.Message);
        }

        // Donor create failure.
        await using (var donorCreateFailDb = CreateDb(nameof(AuthIdentityGenerator_Throws_ForDonorAndMfa_MissingPassword_AndCreateFailure) + "_donor_create"))
        {
            var userManager = CreateConfigurableUserManager(donorCreateFailDb);
            userManager.FailCreateEmails.Add("donor-create-fail@test.local");
            var roleManager = new ConfigurableRoleManager(donorCreateFailDb);
            var provider = BuildProvider(userManager, roleManager);
            var config = BuildConfiguration(new Dictionary<string, string?>
            {
                ["GenerateDefaultIdentityAdmin:Email"] = "admin@test.local",
                ["GenerateDefaultIdentityAdmin:Password"] = "AdminPassword123!!",
                ["GenerateDefaultIdentityDonor:Email"] = "donor-create-fail@test.local",
                ["GenerateDefaultIdentityDonor:Password"] = "DonorPassword123!!"
            });

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                AuthIdentityGenerator.GenerateDefaultIdentityAsync(provider, config));
            Assert.Contains("Failed to create donor user", ex.Message);
        }

        // MFA missing password.
        await using (var mfaMissingDb = CreateDb(nameof(AuthIdentityGenerator_Throws_ForDonorAndMfa_MissingPassword_AndCreateFailure) + "_mfa_missing"))
        {
            var userManager = CreateConfigurableUserManager(mfaMissingDb);
            var roleManager = new ConfigurableRoleManager(mfaMissingDb);
            var provider = BuildProvider(userManager, roleManager);
            var config = BuildConfiguration(new Dictionary<string, string?>
            {
                ["GenerateDefaultIdentityAdmin:Email"] = "admin@test.local",
                ["GenerateDefaultIdentityAdmin:Password"] = "AdminPassword123!!",
                ["GenerateDefaultIdentityMfa:Email"] = "mfa@test.local",
                ["GenerateDefaultIdentityMfa:Password"] = ""
            });

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                AuthIdentityGenerator.GenerateDefaultIdentityAsync(provider, config));
            Assert.Contains("MFA seed password is not configured", ex.Message);
        }

        // MFA create failure.
        await using (var mfaCreateFailDb = CreateDb(nameof(AuthIdentityGenerator_Throws_ForDonorAndMfa_MissingPassword_AndCreateFailure) + "_mfa_create"))
        {
            var userManager = CreateConfigurableUserManager(mfaCreateFailDb);
            userManager.FailCreateEmails.Add("mfa-create-fail@test.local");
            var roleManager = new ConfigurableRoleManager(mfaCreateFailDb);
            var provider = BuildProvider(userManager, roleManager);
            var config = BuildConfiguration(new Dictionary<string, string?>
            {
                ["GenerateDefaultIdentityAdmin:Email"] = "admin@test.local",
                ["GenerateDefaultIdentityAdmin:Password"] = "AdminPassword123!!",
                ["GenerateDefaultIdentityMfa:Email"] = "mfa-create-fail@test.local",
                ["GenerateDefaultIdentityMfa:Password"] = "MfaPassword123!!"
            });

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                AuthIdentityGenerator.GenerateDefaultIdentityAsync(provider, config));
            Assert.Contains("Failed to create MFA user", ex.Message);
        }
    }

    private static AppDbContext CreateDb(string name)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"{name}_{Guid.NewGuid():N}")
            .Options;

        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    private static ThrowingSaveChangesAppDbContext CreateThrowingDb(string name)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"{name}_{Guid.NewGuid():N}")
            .Options;

        var db = new ThrowingSaveChangesAppDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    private static ConfigurableUserManager CreateConfigurableUserManager(AppDbContext db)
        => new(db);

    private static IConfiguration BuildConfiguration(Dictionary<string, string?>? values = null)
    {
        var defaults = new Dictionary<string, string?>
        {
            ["GenerateDefaultIdentityAdmin:Email"] = "admin@test.local",
            ["GenerateDefaultIdentityAdmin:Password"] = "AdminPassword123!!"
        };

        if (values is not null)
        {
            foreach (var pair in values)
                defaults[pair.Key] = pair.Value;
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(defaults)
            .Build();
    }

    private static IServiceProvider BuildProvider(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        var services = new ServiceCollection();
        services.AddSingleton(userManager);
        services.AddSingleton(roleManager);
        return services.BuildServiceProvider();
    }

    private sealed class ThrowingSaveChangesAppDbContext(DbContextOptions<AppDbContext> options)
        : AppDbContext(options)
    {
        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("save failed", new Exception("inner save failure"));
    }

    private sealed class ConfigurableRoleManager(AppDbContext db)
        : RoleManager<IdentityRole>(
            new RoleStore<IdentityRole, AppDbContext, string>(db),
            Array.Empty<IRoleValidator<IdentityRole>>(),
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            NullLogger<RoleManager<IdentityRole>>.Instance)
    {
        internal HashSet<string> ExistingRoles { get; set; } =
            [AuthRoles.Admin, AuthRoles.Donor, AuthRoles.Staff];

        internal IdentityResult CreateRoleResult { get; set; } = IdentityResult.Success;

        public override Task<bool> RoleExistsAsync(string roleName)
            => Task.FromResult(ExistingRoles.Contains(roleName));

        public override Task<IdentityResult> CreateAsync(IdentityRole role)
        {
            if (CreateRoleResult.Succeeded)
                ExistingRoles.Add(role.Name ?? string.Empty);

            return Task.FromResult(CreateRoleResult);
        }
    }

    private sealed class ConfigurableUserManager(AppDbContext db)
        : UserManager<ApplicationUser>(
            new UserStore<ApplicationUser>(db),
            Microsoft.Extensions.Options.Options.Create(new IdentityOptions()),
            new PasswordHasher<ApplicationUser>(),
            Array.Empty<IUserValidator<ApplicationUser>>(),
            Array.Empty<IPasswordValidator<ApplicationUser>>(),
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            null,
            NullLogger<UserManager<ApplicationUser>>.Instance)
    {
        internal IdentityResult CreateUserResult { get; set; } = IdentityResult.Success;
        internal IdentityResult AddToRoleResult { get; set; } = IdentityResult.Success;
        internal HashSet<string> FailCreateEmails { get; } = [];

        private readonly Dictionary<string, ApplicationUser> byEmail = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, HashSet<string>> rolesByUserId = new(StringComparer.OrdinalIgnoreCase);

        public override Task<ApplicationUser?> FindByEmailAsync(string email)
            => Task.FromResult(byEmail.TryGetValue(email, out var user) ? user : null);

        public override Task<IdentityResult> CreateAsync(ApplicationUser user, string password)
        {
            if (FailCreateEmails.Contains(user.Email ?? string.Empty))
            {
                return Task.FromResult(IdentityResult.Failed(new IdentityError
                {
                    Description = "forced create failure"
                }));
            }

            if (!CreateUserResult.Succeeded)
                return Task.FromResult(CreateUserResult);

            user.Id = string.IsNullOrWhiteSpace(user.Id) ? Guid.NewGuid().ToString("N") : user.Id;
            byEmail[user.Email ?? string.Empty] = user;
            rolesByUserId.TryAdd(user.Id, []);
            return Task.FromResult(IdentityResult.Success);
        }

        public override Task<bool> IsInRoleAsync(ApplicationUser user, string role)
        {
            if (string.IsNullOrWhiteSpace(user.Id))
                return Task.FromResult(false);

            var isInRole = rolesByUserId.TryGetValue(user.Id, out var roles) && roles.Contains(role);
            return Task.FromResult(isInRole);
        }

        public override Task<IdentityResult> AddToRoleAsync(ApplicationUser user, string role)
        {
            if (!AddToRoleResult.Succeeded)
                return Task.FromResult(AddToRoleResult);

            user.Id = string.IsNullOrWhiteSpace(user.Id) ? Guid.NewGuid().ToString("N") : user.Id;
            rolesByUserId.TryAdd(user.Id, []);
            rolesByUserId[user.Id].Add(role);
            return Task.FromResult(IdentityResult.Success);
        }
    }
}