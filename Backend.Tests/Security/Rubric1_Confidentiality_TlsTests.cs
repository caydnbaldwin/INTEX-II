using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Backend.Tests.Security;

/// <summary>
/// IS 414 Security Rubric - Confidentiality (1.5 pts total)
///
/// Objective 1 - Use HTTPS/TLS (1 pt):
///   - Auth cookies carry the Secure flag (SecurePolicy.Always).
///   - Auth cookies are HttpOnly (not readable by JavaScript).
///   - The two-factor interim sign-in cookie is also Secure + HttpOnly.
///
/// Objective 2 - Redirect HTTP to HTTPS (0.5 pt):
///   - HTTP requests receive a 3xx redirect to the HTTPS equivalent.
/// </summary>
public class Rubric1_Confidentiality_TlsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public void ApplicationCookie_Is_HttpOnly()
    {
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptionsSnapshot<CookieAuthenticationOptions>>()
            .Get(IdentityConstants.ApplicationScheme);

        Assert.True(opts.Cookie.HttpOnly,
            "Auth cookie must be HttpOnly to prevent theft via XSS.");
    }

    [Fact]
    public void ApplicationCookie_SecurePolicy_Is_Always()
    {
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptionsSnapshot<CookieAuthenticationOptions>>()
            .Get(IdentityConstants.ApplicationScheme);

        Assert.Equal(CookieSecurePolicy.Always, opts.Cookie.SecurePolicy);
    }

    [Fact]
    public void TwoFactorCookie_Is_HttpOnly()
    {
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptionsSnapshot<CookieAuthenticationOptions>>()
            .Get(IdentityConstants.TwoFactorUserIdScheme);

        Assert.True(opts.Cookie.HttpOnly,
            "Two-factor cookie must be HttpOnly while the MFA challenge is pending.");
    }

    [Fact]
    public void TwoFactorCookie_SecurePolicy_Is_Always()
    {
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptionsSnapshot<CookieAuthenticationOptions>>()
            .Get(IdentityConstants.TwoFactorUserIdScheme);

        Assert.Equal(CookieSecurePolicy.Always, opts.Cookie.SecurePolicy);
    }

    [Fact]
    public async Task Http_Request_Is_Redirected_To_Https()
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            BaseAddress = new Uri("http://localhost")
        });

        var response = await client.GetAsync("/api/health");

        Assert.True(
            response.StatusCode == System.Net.HttpStatusCode.MovedPermanently ||
            response.StatusCode == System.Net.HttpStatusCode.Found ||
            response.StatusCode == System.Net.HttpStatusCode.TemporaryRedirect ||
            response.StatusCode == System.Net.HttpStatusCode.PermanentRedirect,
            $"Expected a redirect for HTTP request but got {(int)response.StatusCode} {response.StatusCode}.");
    }

    [Fact]
    public async Task Http_Redirect_Location_Uses_Https_Scheme()
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            BaseAddress = new Uri("http://localhost")
        });

        var response = await client.GetAsync("/api/health");
        var location = response.Headers.Location;

        if (location is not null)
        {
            Assert.True(
                location.Scheme == "https" ||
                location.OriginalString.StartsWith("https://", StringComparison.OrdinalIgnoreCase),
                $"Redirect location must use HTTPS. Got: {location}");
        }
    }
}
