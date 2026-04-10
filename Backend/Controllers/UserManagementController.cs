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
                isActive = !u.LockoutEnd.HasValue || u.LockoutEnd <= DateTimeOffset.UtcNow,
            })
            .OrderBy(u => u.displayName)
            .ThenBy(u => u.email)
            .ToList();

        return Ok(results);
    }

    [HttpPost("{userId}/deactivate")]
    public async Task<IActionResult> Deactivate(string userId)
    {
        var currentUserId = userManager.GetUserId(User);
        if (userId == currentUserId)
            return BadRequest(new { error = "You cannot deactivate your own account." });

        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound(new { error = "User not found." });

        await userManager.SetLockoutEnabledAsync(user, true);
        await userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
        return Ok(new { isActive = false });
    }

    [HttpPost("{userId}/activate")]
    public async Task<IActionResult> Activate(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound(new { error = "User not found." });

        await userManager.SetLockoutEndDateAsync(user, null);
        return Ok(new { isActive = true });
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> Delete(string userId)
    {
        var currentUserId = userManager.GetUserId(User);
        if (userId == currentUserId)
            return BadRequest(new { error = "You cannot delete your own account." });

        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound(new { error = "User not found." });

        // Prevent deleting the last admin
        var isAdmin = await userManager.IsInRoleAsync(user, AuthRoles.Admin);
        if (isAdmin && (await userManager.GetUsersInRoleAsync(AuthRoles.Admin)).Count <= 1)
            return BadRequest(new { error = "Cannot delete the last admin account." });

        var result = await userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { error = string.Join("; ", result.Errors.Select(e => e.Description)) });

        return NoContent();
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
