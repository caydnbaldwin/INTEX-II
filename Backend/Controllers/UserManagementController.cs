using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace Backend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = AuthRoles.Admin)]
public class UserManagementController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    private static readonly string[] AllRoles = [AuthRoles.Admin, AuthRoles.Staff, AuthRoles.Donor];

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Build a map of userId -> roles for all known roles
        var roleMap = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);

        foreach (var role in AllRoles)
        {
            var usersInRole = await userManager.GetUsersInRoleAsync(role);
            foreach (var user in usersInRole)
            {
                if (!roleMap.TryGetValue(user.Id, out var roles))
                {
                    roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    roleMap[user.Id] = roles;
                }
                roles.Add(role);
            }
        }

        // Get ALL users (including those with no roles)
        var allUsers = userManager.Users.ToList();

        var results = allUsers
            .Select(u => new
            {
                id = u.Id,
                email = u.Email,
                userName = u.UserName,
                displayName = BuildDisplayName(u),
                roles = roleMap.TryGetValue(u.Id, out var r)
                    ? r.OrderBy(role => role).ToArray()
                    : Array.Empty<string>(),
            })
            .OrderBy(u => u.displayName)
            .ThenBy(u => u.email)
            .ToList();

        return Ok(results);
    }

    [HttpPut("{userId}/roles")]
    public async Task<IActionResult> UpdateRoles(string userId, [FromBody] UpdateRolesRequest request)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new { error = "User not found." });

        // Prevent admins from removing their own Admin role
        var currentUserId = userManager.GetUserId(User);
        if (userId == currentUserId && !(request.Roles ?? []).Contains(AuthRoles.Admin, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "You cannot remove your own Admin role." });
        }

        var currentRoles = await userManager.GetRolesAsync(user);
        var desiredRoles = (request.Roles ?? [])
            .Where(r => AllRoles.Contains(r, StringComparer.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var toRemove = currentRoles.Except(desiredRoles, StringComparer.OrdinalIgnoreCase).ToList();
        var toAdd = desiredRoles.Except(currentRoles, StringComparer.OrdinalIgnoreCase).ToList();

        if (toRemove.Count > 0)
        {
            var removeResult = await userManager.RemoveFromRolesAsync(user, toRemove);
            if (!removeResult.Succeeded)
                return BadRequest(new { error = string.Join("; ", removeResult.Errors.Select(e => e.Description)) });
        }

        if (toAdd.Count > 0)
        {
            var addResult = await userManager.AddToRolesAsync(user, toAdd);
            if (!addResult.Succeeded)
                return BadRequest(new { error = string.Join("; ", addResult.Errors.Select(e => e.Description)) });
        }

        var updatedRoles = await userManager.GetRolesAsync(user);
        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            userName = user.UserName,
            displayName = BuildDisplayName(user),
            roles = updatedRoles.OrderBy(r => r).ToArray(),
        });
    }

    private static string BuildDisplayName(ApplicationUser user)
    {
        var source = user.Email ?? user.UserName ?? "User";
        var localPart = source.Contains('@', StringComparison.Ordinal)
            ? source[..source.IndexOf('@', StringComparison.Ordinal)]
            : source;

        var normalized = string.Join(
            ' ',
            localPart
                .Replace('.', ' ')
                .Replace('_', ' ')
                .Replace('-', ' ')
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

        if (string.IsNullOrWhiteSpace(normalized))
            return "User";

        return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(normalized.ToLowerInvariant());
    }

    public class UpdateRolesRequest
    {
        public string[] Roles { get; set; } = [];
    }
}
