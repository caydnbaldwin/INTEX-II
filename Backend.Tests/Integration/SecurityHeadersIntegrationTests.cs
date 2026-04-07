using Backend.Infrastructure;

namespace Backend.Tests.Integration;

/// <summary>
/// Verifies that security headers are actually emitted on real HTTP responses.
/// Unit tests confirm the CSP constant is correct; these tests confirm the middleware
/// correctly wires and emits those headers through the full pipeline.
///
/// IS 414 grading anchor: CSP, X-Content-Type-Options, X-Frame-Options, and
/// Referrer-Policy must all be present as response headers.
/// </summary>
public class SecurityHeadersIntegrationTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    // A public endpoint used as the test target — any endpoint would do.
    private const string ProbeUrl = "/api/health";

    [Fact]
    public async Task Response_Has_ContentSecurityPolicy_Header()
    {
        var response = await _client.GetAsync(ProbeUrl);
        Assert.True(response.Headers.Contains("Content-Security-Policy"),
            "Content-Security-Policy header must be present on every response.");
    }

    [Fact]
    public async Task ContentSecurityPolicy_Header_Matches_Constant()
    {
        var response = await _client.GetAsync(ProbeUrl);
        var cspHeader = response.Headers.GetValues("Content-Security-Policy").First();

        Assert.Equal(SecurityHeadersMiddleware.ContentSecurityPolicy, cspHeader);
    }

    [Fact]
    public async Task Response_Has_XContentTypeOptions_Nosniff()
    {
        var response = await _client.GetAsync(ProbeUrl);
        var value = response.Headers.GetValues("X-Content-Type-Options").First();

        Assert.Equal("nosniff", value);
    }

    [Fact]
    public async Task Response_Has_XFrameOptions_Deny()
    {
        var response = await _client.GetAsync(ProbeUrl);
        var value = response.Headers.GetValues("X-Frame-Options").First();

        Assert.Equal("DENY", value);
    }

    [Fact]
    public async Task Response_Has_ReferrerPolicy()
    {
        var response = await _client.GetAsync(ProbeUrl);
        var value = response.Headers.GetValues("Referrer-Policy").First();

        Assert.Equal("strict-origin-when-cross-origin", value);
    }

    [Fact]
    public async Task Security_Headers_Are_Present_On_Auth_Endpoint_Too()
    {
        // Headers must appear on every response, not just /api/health.
        var response = await _client.GetAsync("/api/auth/me");

        Assert.True(response.Headers.Contains("Content-Security-Policy"));
        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.True(response.Headers.Contains("X-Frame-Options"));
        Assert.True(response.Headers.Contains("Referrer-Policy"));
    }
}
