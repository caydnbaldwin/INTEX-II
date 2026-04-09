using System.Globalization;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
public class StaffDirectoryController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpGet("directory")]
    public async Task<IActionResult> GetDirectory()
    {
        var assignableUsers = new Dictionary<string, (ApplicationUser User, HashSet<string> Roles)>(StringComparer.Ordinal);

        foreach (var role in new[] { AuthRoles.Staff, AuthRoles.Admin })
        {
            var usersInRole = await userManager.GetUsersInRoleAsync(role);
            foreach (var user in usersInRole)
            {
                if (!assignableUsers.TryGetValue(user.Id, out var existing))
                {
                    assignableUsers[user.Id] = (user, new HashSet<string>(StringComparer.OrdinalIgnoreCase) { role });
                    continue;
                }

                existing.Roles.Add(role);
                assignableUsers[user.Id] = existing;
            }
        }

        var results = assignableUsers.Values
            .Select(entry => new
            {
                id = entry.User.Id,
                email = entry.User.Email,
                userName = entry.User.UserName,
                displayName = BuildDisplayName(entry.User),
                roles = entry.Roles.OrderBy(role => role).ToArray()
            })
            .OrderBy(entry => entry.displayName)
            .ThenBy(entry => entry.email)
            .ToList();

        return Ok(results);
    }

    private static string BuildDisplayName(ApplicationUser user)
    {
        var source = user.Email ?? user.UserName ?? "Staff";
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
            return "Staff";

        return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(normalized.ToLowerInvariant());
    }
}
