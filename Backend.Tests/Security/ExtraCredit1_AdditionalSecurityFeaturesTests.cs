using System.Net;
using System.Text;
using Backend.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Backend.Tests.Security;

/// <summary>
/// IS 414 extra credit security coverage.
///
/// Features verified here:
///   1. HSTS.
///   2. Defense-in-depth response headers.
///   3. MFA / TOTP.
///   4. Google OAuth wiring.
///   5. Browser-accessible preference cookie.
///   6. Frontend sanitization and privacy-safe pseudonyms.
/// </summary>
public class ExtraCredit1_AdditionalSecurityFeaturesTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _visitor = factory.CreateClient();

    [Fact]
    public void Hsts_MaxAge_Is_At_Least_365_Days()
    {
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptions<HstsOptions>>().Value;

        Assert.True(opts.MaxAge >= TimeSpan.FromDays(365),
            $"HSTS max-age is {opts.MaxAge.TotalDays:F0} days. Must be >= 365.");
    }

    [Fact]
    public void Hsts_IncludeSubDomains_Is_True()
    {
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptions<HstsOptions>>().Value;

        Assert.True(opts.IncludeSubDomains,
            "HSTS should include subdomains so the whole deployment stays pinned to HTTPS.");
    }

    [Fact]
    public async Task All_Four_Security_Headers_Are_Present_On_Every_Response()
    {
        var response = await _visitor.GetAsync("/api/health");

        Assert.True(response.Headers.Contains("Content-Security-Policy"));
        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.True(response.Headers.Contains("X-Frame-Options"));
        Assert.True(response.Headers.Contains("Referrer-Policy"));
    }

    [Fact]
    public async Task XContentTypeOptions_Is_Nosniff()
    {
        var response = await _visitor.GetAsync("/api/health");
        var value = response.Headers.GetValues("X-Content-Type-Options").First();
        Assert.Equal("nosniff", value);
    }

    [Fact]
    public async Task XFrameOptions_Is_Deny()
    {
        var response = await _visitor.GetAsync("/api/health");
        var value = response.Headers.GetValues("X-Frame-Options").First();
        Assert.Equal("DENY", value);
    }

    [Fact]
    public async Task ReferrerPolicy_Is_StrictOriginWhenCrossOrigin()
    {
        var response = await _visitor.GetAsync("/api/health");
        var value = response.Headers.GetValues("Referrer-Policy").First();
        Assert.Equal("strict-origin-when-cross-origin", value);
    }

    [Fact]
    public async Task Security_Headers_Are_Present_On_Auth_Endpoint_Too()
    {
        var response = await _visitor.GetAsync("/api/auth/me");
        Assert.True(response.Headers.Contains("Content-Security-Policy"));
        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.True(response.Headers.Contains("X-Frame-Options"));
        Assert.True(response.Headers.Contains("Referrer-Policy"));
    }

    [Fact]
    public async Task MfaStatus_Without_Auth_Returns_401()
    {
        var response = await _visitor.GetAsync("/api/mfa/status");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MfaSetup_Without_Auth_Returns_401()
    {
        var response = await _visitor.GetAsync("/api/mfa/setup");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MfaEnable_Without_Auth_Returns_401()
    {
        var response = await _visitor.PostAsync("/api/mfa/enable",
            Json("{\"code\":\"123456\"}"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MfaDisable_Without_Auth_Returns_401()
    {
        var response = await _visitor.PostAsync("/api/mfa/disable", Json("{}"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MfaChallenge_Null_Code_Returns_BadRequest_Not_500()
    {
        var response = await _visitor.PostAsync("/api/auth/mfa-challenge",
            Json("{\"code\":null}"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MfaChallenge_Empty_Code_Returns_BadRequest()
    {
        var response = await _visitor.PostAsync("/api/auth/mfa-challenge",
            Json("{\"code\":\"\"}"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MfaChallenge_Whitespace_Code_Returns_BadRequest()
    {
        var response = await _visitor.PostAsync("/api/auth/mfa-challenge",
            Json("{\"code\":\"   \"}"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MfaChallenge_Valid_Code_Without_Pending_SignIn_Returns_BadRequest()
    {
        var response = await _visitor.PostAsync("/api/auth/mfa-challenge",
            Json("{\"code\":\"123456\"}"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MfaChallenge_400_Response_Includes_A_Message_Body()
    {
        var response = await _visitor.PostAsync("/api/auth/mfa-challenge",
            Json("{\"code\":null}"));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace(body));
    }

    [Fact]
    public void Login_Page_Offers_Google_Sign_In()
    {
        var source = SecuritySourceFileReader.Read("Frontend\\src\\pages\\login.tsx");

        Assert.Contains("Continue with Google", source, StringComparison.Ordinal);
        Assert.Contains("getGoogleLoginUrl", source, StringComparison.Ordinal);
    }

    [Fact]
    public void AuthController_Exposes_Google_External_Login_Endpoints()
    {
        var source = SecuritySourceFileReader.Read("Backend\\Controllers\\AuthController.cs");

        Assert.Contains("[HttpGet(\"providers\")]", source, StringComparison.Ordinal);
        Assert.Contains("[HttpGet(\"external-login\")]", source, StringComparison.Ordinal);
        Assert.Contains("GoogleDefaults.AuthenticationScheme", source, StringComparison.Ordinal);
    }

    [Fact]
    public void ThemeCookie_Is_Not_HttpOnly()
    {
        var controller = BuildController();
        controller.SetTheme(new ThemeRequest("dark"));

        var cookies = controller.HttpContext.Response.Headers["Set-Cookie"];
        var cookie = cookies.FirstOrDefault(c => c is not null && c.Contains("user-theme"));

        Assert.NotNull(cookie);
        Assert.DoesNotContain("httponly", cookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ThemeCookie_Accepts_Light_Value()
    {
        var result = BuildController().SetTheme(new ThemeRequest("light"));
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void ThemeCookie_Accepts_Dark_Value()
    {
        var result = BuildController().SetTheme(new ThemeRequest("dark"));
        Assert.IsType<OkObjectResult>(result);
    }

    [Theory]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("light; drop-table")]
    [InlineData("invalid")]
    [InlineData("")]
    [InlineData("DARK")]
    [InlineData("Light")]
    public void ThemeCookie_Rejects_Invalid_Values(string badTheme)
    {
        var result = BuildController().SetTheme(new ThemeRequest(badTheme));
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public void Frontend_Uses_Dompurify_For_Rendered_User_Content()
    {
        var sanitizeSource = SecuritySourceFileReader.Read("Frontend\\src\\lib\\sanitize.ts");
        var donorsSource = SecuritySourceFileReader.Read("Frontend\\src\\pages\\admin\\donors.tsx");
        var processRecordingSource = SecuritySourceFileReader.Read("Frontend\\src\\pages\\admin\\process-recording.tsx");

        Assert.Contains("DOMPurify.sanitize", sanitizeSource, StringComparison.Ordinal);
        Assert.Contains("sanitize(", donorsSource, StringComparison.Ordinal);
        Assert.Contains("sanitize(", processRecordingSource, StringComparison.Ordinal);
    }

    [Fact]
    public void Public_Stories_Use_Privacy_Safe_Pseudonyms()
    {
        var pseudonymSource = SecuritySourceFileReader.Read("Frontend\\src\\lib\\residentPseudonym.ts");
        var publicStoriesSource = SecuritySourceFileReader.Read("Frontend\\src\\lib\\publicResidentStories.ts");

        Assert.Contains("pseudonymForResidentId", pseudonymSource, StringComparison.Ordinal);
        Assert.Contains("pseudonym: pseudonymForResidentId(residentId)", publicStoriesSource, StringComparison.Ordinal);
    }

    private static StringContent Json(string raw) =>
        new(raw, Encoding.UTF8, "application/json");

    private static PreferencesController BuildController()
    {
        var controller = new PreferencesController();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }
}
