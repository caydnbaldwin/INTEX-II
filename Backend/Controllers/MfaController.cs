using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Backend.Data;

namespace Backend.Controllers;

[ApiController]
[Route("api/mfa")]
[Authorize]
public class MfaController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    /// <summary>
    /// Returns whether MFA is currently enabled for the authenticated user.
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        return Ok(new { isMfaEnabled = await userManager.GetTwoFactorEnabledAsync(user) });
    }

    /// <summary>
    /// Returns the TOTP shared key and a QR code URI for authenticator app setup.
    /// The QR code URI follows the otpauth:// format compatible with Google Authenticator,
    /// Authy, and other TOTP apps.
    /// </summary>
    [HttpGet("setup")]
    public async Task<IActionResult> GetSetup()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        await userManager.ResetAuthenticatorKeyAsync(user);
        var key = await userManager.GetAuthenticatorKeyAsync(user);

        if (string.IsNullOrWhiteSpace(key))
            return Problem("Unable to generate authenticator key.");

        var email = user.Email ?? user.UserName ?? "user";
        const string issuer = "LunasProject";

        // Format: otpauth://totp/{issuer}:{account}?secret={key}&issuer={issuer}&digits=6
        var qrCodeUri = $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(email)}" +
                        $"?secret={key}&issuer={Uri.EscapeDataString(issuer)}&digits=6";

        return Ok(new { sharedKey = key, qrCodeUri });
    }

    /// <summary>
    /// Verifies a TOTP code and enables MFA for the authenticated user.
    /// </summary>
    [HttpPost("enable")]
    public async Task<IActionResult> Enable([FromBody] MfaCodeRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var isValid = await userManager.VerifyTwoFactorTokenAsync(
            user,
            userManager.Options.Tokens.AuthenticatorTokenProvider,
            request.Code.Replace(" ", "").Replace("-", ""));

        if (!isValid)
            return BadRequest(new { message = "Invalid verification code. Please try again." });

        await userManager.SetTwoFactorEnabledAsync(user, true);
        return Ok(new { message = "MFA has been enabled." });
    }

    /// <summary>
    /// Disables MFA for the authenticated user.
    /// </summary>
    [HttpPost("disable")]
    public async Task<IActionResult> Disable()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.ResetAuthenticatorKeyAsync(user);
        return Ok(new { message = "MFA has been disabled." });
    }
}

public record MfaCodeRequest(string Code);
