using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace Backend.Tests.Integration;

public class AuthControllerBatchHighImpactTests
{
    [Fact]
    public async Task AuthMe_AuthenticatedUser_ReturnsSessionAndRoles()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var response = await admin.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"isAuthenticated\":true", body);
        Assert.Contains("Admin", body);
    }

    [Fact]
    public async Task Providers_GoogleConfigured_HitsConfiguredBranch()
    {
        using var factory = new GoogleConfiguredFactory();
        using var anonymous = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true,
            AllowAutoRedirect = false
        });

        var providers = await anonymous.GetAsync("/api/auth/providers");
        Assert.Equal(HttpStatusCode.OK, providers.StatusCode);
        var providersBody = await providers.Content.ReadAsStringAsync();
        Assert.Contains("Google", providersBody);
    }

    [Fact]
    public async Task ExternalCallback_WithoutRemoteError_AndNoExternalInfo_RedirectsError()
    {
        using var factory = new CustomWebApplicationFactory();
        using var anonymous = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true,
            AllowAutoRedirect = false
        });

        var response = await anonymous.GetAsync("/api/auth/external-callback");

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.Contains("externalError=", response.Headers.Location!.ToString());
    }

    [Fact]
    public async Task MfaChallenge_WithInvalidCode_ReturnsBadRequest()
    {
        using var factory = new CustomWebApplicationFactory();
        using var anonymous = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true,
            AllowAutoRedirect = false
        });

        var response = await anonymous.PostAsync("/api/auth/mfa-challenge", Json(new { code = "123456" }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private sealed class GoogleConfiguredFactory : CustomWebApplicationFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);

            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Authentication:Google:ClientId"] = "integration-google-client-id",
                    ["Authentication:Google:ClientSecret"] = "integration-google-client-secret"
                });
            });
        }
    }

    private static StringContent Json(object payload)
        => new(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
}
