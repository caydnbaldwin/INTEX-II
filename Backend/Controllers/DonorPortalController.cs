using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/donor")]
[Authorize(Roles = AuthRoles.Donor)]
public class DonorPortalController(AppDbContext db, UserManager<ApplicationUser> userManager) : ControllerBase
{
    /// <summary>
    /// Returns the authenticated donor's own donation history.
    /// Requires Donor role. Unauthenticated → 401, Admin without Donor role → 403.
    /// </summary>
    [HttpGet("my-donations")]
    public async Task<IActionResult> GetMyDonations()
    {
        var user = await userManager.GetUserAsync(User);
        if (user?.SupporterId == null)
            return Ok(Array.Empty<object>());

        var donations = await db.Donations
            .Where(d => d.SupporterId == user.SupporterId)
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();

        return Ok(donations);
    }
}
