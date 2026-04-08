using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Backend.Tests.Integration;

/// <summary>
/// Verifies HSTS is configured correctly per IS 414 additional security features.
///
/// Gap 7 addressed: HSTS is enabled via UseHsts() in Program.cs but was never
/// tested. The Strict-Transport-Security header is only emitted over HTTPS
/// connections by ASP.NET Core's HstsMiddleware, and the WebApplicationFactory
/// in-memory transport does not use real TLS. These tests therefore verify the
/// registered HstsOptions rather than the wire header.
///
/// To manually verify the header in the deployed environment:
///   curl -sI https://api.lunas-project.site/api/health | grep -i strict
///   → Strict-Transport-Security: max-age=31536000; includeSubDomains
///
/// UseHsts() is also guarded by !IsDevelopment() in Program.cs, so the header
/// is only emitted in Staging and Production — correct behavior.
/// </summary>
public class HstsConfigurationTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private HstsOptions GetOptions()
    {
        using var scope = factory.Services.CreateScope();
        return scope.ServiceProvider
            .GetRequiredService<IOptions<HstsOptions>>()
            .Value;
    }

    [Fact]
    public void Hsts_MaxAge_Is_One_Year()
    {
        // One year (365 days = 31,536,000 seconds) is the IS 414 requirement
        // and is the minimum for HSTS preload list inclusion.
        Assert.Equal(TimeSpan.FromDays(365), GetOptions().MaxAge);
    }

    [Fact]
    public void Hsts_IncludesSubDomains_Is_True()
    {
        // includeSubDomains ensures api.lunas-project.site is covered in addition
        // to the root domain. Without this, the API subdomain could be targeted
        // by a protocol-downgrade attack even if the root domain enforces HTTPS.
        Assert.True(GetOptions().IncludeSubDomains);
    }

    [Fact]
    public void Hsts_MaxAge_Is_At_Least_180_Days()
    {
        // 180 days is the lower bound considered "meaningful" HSTS.
        // Anything shorter is treated as non-persistent by most browsers.
        var maxAge = GetOptions().MaxAge;
        Assert.True(maxAge >= TimeSpan.FromDays(180),
            $"HSTS MaxAge of {maxAge.TotalDays:F0} days is below the 180-day minimum. " +
            "Increase to at least 365 days.");
    }

    [Fact]
    public void Hsts_MaxAge_In_Seconds_Matches_Expected_Header_Value()
    {
        // The Strict-Transport-Security header value is max-age=<seconds>.
        // Verify the configured value converts to exactly 31536000 (1 year).
        var expectedSeconds = (long)TimeSpan.FromDays(365).TotalSeconds; // 31_536_000
        var actualSeconds   = (long)GetOptions().MaxAge.TotalSeconds;

        Assert.Equal(expectedSeconds, actualSeconds);
    }
}
