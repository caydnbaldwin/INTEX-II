using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/preferences")]
[Authorize]
public class PreferencesController : ControllerBase
{
    private static readonly HashSet<string> AllowedThemes = ["light", "dark"];

    /// <summary>
    /// Stores the user's theme preference in a browser-accessible (non-HttpOnly) cookie
    /// so React can read it on load without an API call.
    ///
    /// IS 414 additional feature: "Browser-accessible cookie (NOT httponly) that saves a
    /// user setting used by React."
    /// </summary>
    [HttpPost("theme")]
    public IActionResult SetTheme([FromBody] ThemeRequest request)
    {
        if (!AllowedThemes.Contains(request.Theme))
            return BadRequest(new { message = "Theme must be 'light' or 'dark'." });

        Response.Cookies.Append("user-theme", request.Theme, new CookieOptions
        {
            HttpOnly = false,       // Must be JS-readable for React to use it
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(365)
        });

        return Ok(new { theme = request.Theme });
    }

    /// <summary>
    /// Returns the current theme preference from the cookie.
    /// React can read this directly from document.cookie, but this endpoint
    /// is available as a fallback.
    /// </summary>
    [HttpGet("theme")]
    public IActionResult GetTheme()
    {
        var theme = Request.Cookies["user-theme"] ?? "light";
        return Ok(new { theme });
    }
}

public record ThemeRequest(string Theme);
