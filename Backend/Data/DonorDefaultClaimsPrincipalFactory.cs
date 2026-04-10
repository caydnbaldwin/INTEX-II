using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Backend.Data;

/// <summary>
/// Ensures every email/password registrant is assigned the Donor role on their
/// first login. The built-in Identity /register endpoint creates accounts with
/// no role; this factory runs at sign-in time (before the auth cookie is issued)
/// so the role is in both the database and the session claims from the start.
/// </summary>
public class DonorDefaultClaimsPrincipalFactory(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager,
    IOptions<IdentityOptions> options)
    : UserClaimsPrincipalFactory<ApplicationUser, IdentityRole>(userManager, roleManager, options)
{
    public override async Task<System.Security.Claims.ClaimsPrincipal> CreateAsync(ApplicationUser user)
    {
        var roles = await UserManager.GetRolesAsync(user);

        if (roles.Count == 0)
            await UserManager.AddToRoleAsync(user, AuthRoles.Donor);

        return await base.CreateAsync(user);
    }
}
