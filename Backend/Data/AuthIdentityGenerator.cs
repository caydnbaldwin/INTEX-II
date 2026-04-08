using Microsoft.AspNetCore.Identity;

namespace Backend.Data;

public static class AuthIdentityGenerator
{
    public static async Task GenerateDefaultIdentityAsync(
        IServiceProvider serviceProvider,
        IConfiguration configuration)
    {
        const string defaultAdminEmail = "testadmin@lunas-project.site";

        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Ensure all roles exist
        foreach (var roleName in new[] { AuthRoles.Admin, AuthRoles.Donor, AuthRoles.Staff })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(roleName));
                if (!result.Succeeded)
                    throw new Exception($"Failed to create role '{roleName}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }

        // ── Admin account (no MFA) ────────────────────────────────────────────
        var adminSection = configuration.GetSection("GenerateDefaultIdentityAdmin");
        var configuredAdminEmail = adminSection["Email"];
        var adminEmail = string.IsNullOrWhiteSpace(configuredAdminEmail)
            ? defaultAdminEmail
            : configuredAdminEmail;

        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            var adminPassword = adminSection["Password"];
            if (string.IsNullOrWhiteSpace(adminPassword))
                throw new Exception(
                    "Admin seed password is not configured. Set GenerateDefaultIdentityAdmin:Password before first startup.");

            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(adminUser, adminPassword);
            if (!createResult.Succeeded)
                throw new Exception($"Failed to create admin user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
        }

        if (!await userManager.IsInRoleAsync(adminUser, AuthRoles.Admin))
        {
            var roleResult = await userManager.AddToRoleAsync(adminUser, AuthRoles.Admin);
            if (!roleResult.Succeeded)
                throw new Exception($"Failed to assign Admin role: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
        }

        // ── Donor account (no MFA, linked to SupporterId=3 — Noah Chen, MonetaryDonor) ──
        var donorSection = configuration.GetSection("GenerateDefaultIdentityDonor");
        var donorEmail = donorSection["Email"];
        if (!string.IsNullOrWhiteSpace(donorEmail))
        {
            var donorUser = await userManager.FindByEmailAsync(donorEmail);
            if (donorUser == null)
            {
                var donorPassword = donorSection["Password"];
                if (string.IsNullOrWhiteSpace(donorPassword))
                    throw new Exception(
                        "Donor seed password is not configured. Set GenerateDefaultIdentityDonor:Password.");

                donorUser = new ApplicationUser
                {
                    UserName = donorEmail,
                    Email = donorEmail,
                    EmailConfirmed = true,
                    SupporterId = 3  // Noah Chen — MonetaryDonor with donation history in seed data
                };

                var createResult = await userManager.CreateAsync(donorUser, donorPassword);
                if (!createResult.Succeeded)
                    throw new Exception($"Failed to create donor user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
            }

            if (!await userManager.IsInRoleAsync(donorUser, AuthRoles.Donor))
                await userManager.AddToRoleAsync(donorUser, AuthRoles.Donor);
        }

        // ── MFA account (Staff role, TwoFactorEnabled = true) ────────────────
        var mfaSection = configuration.GetSection("GenerateDefaultIdentityMfa");
        var mfaEmail = mfaSection["Email"];
        if (!string.IsNullOrWhiteSpace(mfaEmail))
        {
            var mfaUser = await userManager.FindByEmailAsync(mfaEmail);
            if (mfaUser == null)
            {
                var mfaPassword = mfaSection["Password"];
                if (string.IsNullOrWhiteSpace(mfaPassword))
                    throw new Exception(
                        "MFA seed password is not configured. Set GenerateDefaultIdentityMfa:Password.");

                mfaUser = new ApplicationUser
                {
                    UserName = mfaEmail,
                    Email = mfaEmail,
                    EmailConfirmed = true
                };

                var createResult = await userManager.CreateAsync(mfaUser, mfaPassword);
                if (!createResult.Succeeded)
                    throw new Exception($"Failed to create MFA user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");

                // Generate and enable TOTP authenticator
                await userManager.ResetAuthenticatorKeyAsync(mfaUser);
                var totpKey = await userManager.GetAuthenticatorKeyAsync(mfaUser);
                await userManager.SetTwoFactorEnabledAsync(mfaUser, true);

                Console.WriteLine("=================================================");
                Console.WriteLine("[Seeder] MFA account created.");
                Console.WriteLine($"[Seeder] Email:    {mfaEmail}");
                Console.WriteLine($"[Seeder] TOTP key: {totpKey}");
                Console.WriteLine("  Save this key — it is only shown once.");
                Console.WriteLine("  Use an authenticator app (Google Auth, Authy) to");
                Console.WriteLine("  scan/enter this key for the grader submission.");
                Console.WriteLine("=================================================");
            }

            if (!await userManager.IsInRoleAsync(mfaUser, AuthRoles.Staff))
                await userManager.AddToRoleAsync(mfaUser, AuthRoles.Staff);
        }
    }
}
