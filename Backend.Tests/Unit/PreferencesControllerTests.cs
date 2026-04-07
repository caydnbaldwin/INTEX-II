using Backend.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Tests.Unit;

/// <summary>
/// Unit tests for PreferencesController.SetTheme input validation.
/// The controller is instantiated directly — no HTTP pipeline needed.
///
/// IS 414 additional feature: browser-accessible (non-HttpOnly) cookie that saves a
/// user setting used by React. These tests verify the validation logic that guards
/// what goes into that cookie.
/// </summary>
public class PreferencesControllerTests
{
    private static PreferencesController BuildController()
    {
        var controller = new PreferencesController();

        // Provide a real HttpContext so Response.Cookies.Append doesn't throw.
        var httpContext = new DefaultHttpContext();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }

    // ── Happy paths ───────────────────────────────────────────────────────────

    [Fact]
    public void SetTheme_Light_Returns_200()
    {
        var controller = BuildController();
        var result = controller.SetTheme(new ThemeRequest("light"));

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    [Fact]
    public void SetTheme_Dark_Returns_200()
    {
        var controller = BuildController();
        var result = controller.SetTheme(new ThemeRequest("dark"));

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    [Fact]
    public void SetTheme_Light_Response_Contains_Theme_Value()
    {
        var controller = BuildController();
        var result = controller.SetTheme(new ThemeRequest("light"));

        var ok = Assert.IsType<OkObjectResult>(result);
        var body = ok.Value!.ToString();
        Assert.Contains("light", body);
    }

    // ── Rejected inputs (injection / validation guard) ────────────────────────

    [Theory]
    [InlineData("invalid")]
    [InlineData("")]
    [InlineData("Light")]        // case-sensitive
    [InlineData("DARK")]         // case-sensitive
    [InlineData("<script>")]     // XSS attempt
    [InlineData("light; drop-table")] // injection attempt
    public void SetTheme_InvalidValue_Returns_400(string theme)
    {
        var controller = BuildController();
        var result = controller.SetTheme(new ThemeRequest(theme));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ── Cookie is NOT HttpOnly ────────────────────────────────────────────────

    [Fact]
    public void SetTheme_Cookie_Is_Not_HttpOnly()
    {
        // IS 414 requirement: the user-theme cookie must be readable by JavaScript.
        // This validates the CookieOptions.HttpOnly = false setting is in effect.
        var controller = BuildController();
        controller.SetTheme(new ThemeRequest("dark"));

        var cookies = controller.HttpContext.Response.Headers["Set-Cookie"];
        var cookie = cookies.FirstOrDefault(c => c != null && c.Contains("user-theme"));

        Assert.NotNull(cookie);
        // If HttpOnly were set, the string would contain "httponly" (case-insensitive).
        Assert.DoesNotContain("httponly", cookie, StringComparison.OrdinalIgnoreCase);
    }
}
