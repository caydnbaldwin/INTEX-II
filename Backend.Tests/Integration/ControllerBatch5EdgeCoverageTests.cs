using System.Net;
using System.Text;
using System.Text.Json;

namespace Backend.Tests.Integration;

public class ControllerBatch5EdgeCoverageTests
{
    [Fact]
    public async Task Health_Get_IsPublic_And_ReturnsSuccessPayload()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Successfully connected.", body);
    }

    [Fact]
    public async Task Preferences_Theme_RejectsInvalidValue_And_PersistsValidCookie()
    {
        using var factory = new CustomWebApplicationFactory();
        var roleless = await TestAuthHelper.CreateRolelessClientAsync(factory);

        var invalid = await roleless.PostAsync("/api/preferences/theme", Json(new { theme = "neon" }));
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        var valid = await roleless.PostAsync("/api/preferences/theme", Json(new { theme = "dark" }));
        Assert.Equal(HttpStatusCode.OK, valid.StatusCode);

        var getTheme = await roleless.GetAsync("/api/preferences/theme");
        Assert.Equal(HttpStatusCode.OK, getTheme.StatusCode);

        var body = await getTheme.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("dark", doc.RootElement.GetProperty("theme").GetString());
    }

    [Fact]
    public async Task Mfa_Status_Setup_Disable_And_InvalidEnable_CodePaths_Work()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var status = await admin.GetAsync("/api/mfa/status");
        Assert.Equal(HttpStatusCode.OK, status.StatusCode);

        var setup = await admin.GetAsync("/api/mfa/setup");
        Assert.Equal(HttpStatusCode.OK, setup.StatusCode);
        var setupBody = await setup.Content.ReadAsStringAsync();
        Assert.Contains("sharedKey", setupBody);
        Assert.Contains("otpauth://", setupBody);

        var invalidEnable = await admin.PostAsync("/api/mfa/enable", Json(new { code = "000000" }));
        Assert.Equal(HttpStatusCode.BadRequest, invalidEnable.StatusCode);

        var disable = await admin.PostAsync("/api/mfa/disable", Json(new { }));
        Assert.Equal(HttpStatusCode.OK, disable.StatusCode);
    }

    [Fact]
    public async Task Auth_PublicEndpoints_ExerciseAnonymousAndErrorBranches()
    {
        using var factory = new CustomWebApplicationFactory();
        using var anonymous = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true,
            AllowAutoRedirect = false
        });

        var me = await anonymous.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        var meBody = await me.Content.ReadAsStringAsync();
        Assert.Contains("\"isAuthenticated\":false", meBody);

        var providers = await anonymous.GetAsync("/api/auth/providers");
        Assert.Equal(HttpStatusCode.OK, providers.StatusCode);

        var badProvider = await anonymous.GetAsync("/api/auth/external-login?provider=github");
        Assert.Equal(HttpStatusCode.BadRequest, badProvider.StatusCode);

        var mfaMissingCode = await anonymous.PostAsync("/api/auth/mfa-challenge", Json(new { code = "" }));
        Assert.Equal(HttpStatusCode.BadRequest, mfaMissingCode.StatusCode);

        var callbackError = await anonymous.GetAsync("/api/auth/external-callback?remoteError=denied");
        Assert.Equal(HttpStatusCode.Redirect, callbackError.StatusCode);
        Assert.NotNull(callbackError.Headers.Location);
        Assert.Contains("/login", callbackError.Headers.Location!.ToString());
        Assert.Contains("externalError=", callbackError.Headers.Location!.ToString());
    }

    private static StringContent Json(object payload)
        => new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
}
