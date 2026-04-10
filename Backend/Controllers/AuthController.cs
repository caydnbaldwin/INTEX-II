using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IConfiguration configuration,
    AppDbContext db) : ControllerBase
{
    private const string DefaultFrontendUrl = "http://localhost:4200";
    private const string DefaultExternalReturnPath = "/dashboard";

    /// <summary>
    /// Returns the current session state. Public — no [Authorize].
    /// React calls this on load to decide which UI to show.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentSession()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return Ok(new
            {
                isAuthenticated = false,
                userName = (string?)null,
                email = (string?)null,
                roles = Array.Empty<string>()
            });
        }

        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        // Read roles from the database (source of truth) rather than from the
        // session cookie claims, which are stamped at login time and would not
        // reflect an admin role change made after the cookie was issued.
        var roles = await userManager.GetRolesAsync(user);

        return Ok(new
        {
            isAuthenticated = true,
            userName = user.UserName ?? User.Identity?.Name,
            email = user.Email,
            roles = roles.OrderBy(r => r).ToArray()
        });
    }

    /// <summary>
    /// Returns which external OAuth providers are configured.
    /// </summary>
    [HttpGet("providers")]
    public IActionResult GetExternalProviders()
    {
        var providers = new List<object>();

        if (IsGoogleConfigured())
        {
            providers.Add(new
            {
                name = GoogleDefaults.AuthenticationScheme,
                displayName = "Google"
            });
        }

        return Ok(providers);
    }

    /// <summary>
    /// Initiates the Google OAuth redirect flow.
    /// </summary>
    [HttpGet("external-login")]
    public IActionResult ExternalLogin(
        [FromQuery] string provider,
        [FromQuery] string? returnPath = null)
    {
        if (!string.Equals(provider, GoogleDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase)
            || !IsGoogleConfigured())
        {
            return BadRequest(new { message = "The requested external login provider is not available." });
        }

        var callbackUrl = Url.Action(nameof(ExternalLoginCallback), new
        {
            returnPath = NormalizeReturnPath(returnPath)
        });

        if (string.IsNullOrWhiteSpace(callbackUrl))
            return Problem("Unable to create the external login callback URL.");

        var properties = signInManager.ConfigureExternalAuthenticationProperties(
            GoogleDefaults.AuthenticationScheme, callbackUrl);

        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Handles the OAuth callback from Google.
    /// Creates a local account if this is the user's first Google login.
    /// New Google users are assigned the Donor role by default.
    /// </summary>
    [HttpGet("external-callback")]
    public async Task<IActionResult> ExternalLoginCallback(
        [FromQuery] string? returnPath = null,
        [FromQuery] string? remoteError = null)
    {
        if (!string.IsNullOrWhiteSpace(remoteError))
            return Redirect(BuildFrontendErrorUrl("External login failed."));

        var info = await signInManager.GetExternalLoginInfoAsync();
        if (info is null)
            return Redirect(BuildFrontendErrorUrl("External login information was unavailable."));

        var signInResult = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider, info.ProviderKey, isPersistent: false, bypassTwoFactor: false);

        if (signInResult.Succeeded)
            return Redirect(BuildFrontendSuccessUrl(returnPath));

        if (signInResult.RequiresTwoFactor)
        {
            var frontendUrl = configuration["FrontendUrl"] ?? DefaultFrontendUrl;
            var challengeUrl = $"{frontendUrl.TrimEnd('/')}/mfa-challenge" +
                               $"?returnPath={Uri.EscapeDataString(NormalizeReturnPath(returnPath))}";
            return Redirect(challengeUrl);
        }

        var email = info.Principal.FindFirstValue(ClaimTypes.Email)
                    ?? info.Principal.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(email))
            return Redirect(BuildFrontendErrorUrl("The external provider did not return an email address."));

        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            var firstName = info.Principal.FindFirstValue(ClaimTypes.GivenName);
            var lastName  = info.Principal.FindFirstValue(ClaimTypes.Surname);
            var fullName  = info.Principal.FindFirstValue(ClaimTypes.Name);

            // Create a Supporter record so the user has a name in the system
            var nextSupporterId = (await db.Supporters.MaxAsync(s => (int?)s.SupporterId) ?? 0) + 1;
            var supporter = new Supporter
            {
                SupporterId   = nextSupporterId,
                Email         = email,
                FirstName     = firstName ?? fullName?.Split(' ').FirstOrDefault(),
                LastName      = lastName  ?? (fullName?.Contains(' ') == true ? fullName.Split(' ', 2)[1] : null),
                DisplayName   = fullName ?? firstName ?? email,
                SupporterType = "Individual",
                Status        = "Active",
                CreatedAt     = DateTime.UtcNow,
            };
            db.Supporters.Add(supporter);
            await db.SaveChangesAsync();

            user = new ApplicationUser
            {
                UserName    = email,
                Email       = email,
                EmailConfirmed = true,
                SupporterId = nextSupporterId,
            };

            var createResult = await userManager.CreateAsync(user);
            if (!createResult.Succeeded)
                return Redirect(BuildFrontendErrorUrl("Unable to create a local account for the external login."));

            // Assign Donor role to new Google-authenticated users
            await userManager.AddToRoleAsync(user, AuthRoles.Donor);
        }

        var addLoginResult = await userManager.AddLoginAsync(user, info);
        if (!addLoginResult.Succeeded)
            return Redirect(BuildFrontendErrorUrl("Unable to associate the external login with the local account."));

        await signInManager.SignInAsync(user, isPersistent: false, info.LoginProvider);
        return Redirect(BuildFrontendSuccessUrl(returnPath));
    }

    /// <summary>
    /// Completes a pending two-factor sign-in (used after Google OAuth when MFA is enabled).
    /// The pending external login state is held in an Identity cookie set during the OAuth callback.
    /// </summary>
    [HttpPost("mfa-challenge")]
    public async Task<IActionResult> MfaChallenge([FromBody] MfaChallengeRequest request)
    {
        // Guard against null/missing Code before calling Replace — a null Code
        // would otherwise throw NullReferenceException and return 500.
        if (string.IsNullOrWhiteSpace(request?.Code))
            return BadRequest(new { message = "Verification code is required." });

        var code = request.Code.Replace(" ", "").Replace("-", "");
        if (string.IsNullOrEmpty(code))
            return BadRequest(new { message = "Verification code is required." });

        var result = await signInManager.TwoFactorAuthenticatorSignInAsync(
            code,
            isPersistent: false,
            rememberClient: false);

        if (result.Succeeded)
            return Ok(new { message = "Sign-in complete." });

        if (result.IsLockedOut)
            return BadRequest(new { message = "Account is locked. Please try again later." });

        return BadRequest(new { message = "Invalid verification code. Please try again." });
    }

    /// <summary>
    /// Logs out the current user.
    /// </summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok(new { message = "Logout successful." });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private bool IsGoogleConfigured() =>
        !string.IsNullOrWhiteSpace(configuration["Authentication:Google:ClientId"]) &&
        !string.IsNullOrWhiteSpace(configuration["Authentication:Google:ClientSecret"]);

    private static string NormalizeReturnPath(string? returnPath) =>
        string.IsNullOrWhiteSpace(returnPath) || !returnPath.StartsWith('/')
            ? DefaultExternalReturnPath
            : returnPath;

    private string BuildFrontendSuccessUrl(string? returnPath)
    {
        var frontendUrl = configuration["FrontendUrl"] ?? DefaultFrontendUrl;
        return $"{frontendUrl.TrimEnd('/')}{NormalizeReturnPath(returnPath)}";
    }

    private string BuildFrontendErrorUrl(string errorMessage)
    {
        var frontendUrl = configuration["FrontendUrl"] ?? DefaultFrontendUrl;
        var loginUrl = $"{frontendUrl.TrimEnd('/')}/login";
        return QueryHelpers.AddQueryString(loginUrl, "externalError", errorMessage);
    }
}

public record MfaChallengeRequest(string Code);
