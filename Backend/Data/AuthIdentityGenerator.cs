using Microsoft.AspNetCore.Identity;

namespace Backend.Data;

public static class AuthIdentityGenerator
{
    public static async Task GenerateDefaultIdentityAsync(
        IServiceProvider serviceProvider,
        IConfiguration configuration)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Ensure roles exist
        foreach (var roleName in new[] { AuthRoles.Admin, AuthRoles.Donor })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(roleName));
                if (!result.Succeeded)
                    throw new Exception($"Failed to create role '{roleName}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }

        // Seed default admin user
        var adminSection = configuration.GetSection("GenerateDefaultIdentityAdmin");
        var adminEmail = adminSection["Email"] ?? "admin@lunas-project.site";
        var adminPassword = adminSection["Password"] ?? throw new Exception("Admin seed password is not configured.");

        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
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
    }
}
