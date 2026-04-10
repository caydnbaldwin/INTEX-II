using Backend.Infrastructure;

namespace Backend.Tests.Security;

/// <summary>
/// IS 414 Security Rubric — Content-Security-Policy (CSP) — 2 pts
///
/// Graders evaluate the CSP HEADER in browser developer tools.
/// A &lt;meta&gt; tag is NOT sufficient and is explicitly not evaluated here.
///
/// Rules:
///   - CSP header present on every HTTP response.
///   - Sources restricted to only what the app needs.
///   - script-src must NOT include 'unsafe-inline' (explicit grading failure).
///   - script-src must NOT include 'unsafe-eval'.
///   - frame-ancestors 'none' prevents clickjacking.
///   - object-src 'none' blocks plugins.
/// </summary>
public class Rubric6_AttackMitigation_CspTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly string _csp = SecurityHeadersMiddleware.ContentSecurityPolicy;

    // ── CSP header must be present on every HTTP response ────────────────────

    [Fact]
    public async Task CspHeader_Is_Present_On_Health_Endpoint()
    {
        var response = await _client.GetAsync("/api/health");
        Assert.True(response.Headers.Contains("Content-Security-Policy"),
            "Content-Security-Policy header must be present on every response.");
    }

    [Fact]
    public async Task CspHeader_Is_Present_On_Auth_Endpoint()
    {
        // Headers must appear on all responses — not just selected routes.
        var response = await _client.GetAsync("/api/auth/me");
        Assert.True(response.Headers.Contains("Content-Security-Policy"),
            "CSP header must be present on auth endpoints too.");
    }

    [Fact]
    public async Task CspHeader_Value_Matches_Middleware_Constant()
    {
        // The emitted header must exactly match the configured constant.
        var response = await _client.GetAsync("/api/health");
        var headerValue = response.Headers.GetValues("Content-Security-Policy").First();
        Assert.Equal(SecurityHeadersMiddleware.ContentSecurityPolicy, headerValue);
    }

    // ── Required CSP directives ───────────────────────────────────────────────

    [Fact]
    public void Csp_Has_DefaultSrc_Self()
    {
        // Fall-back for any directive not explicitly listed.
        Assert.Contains("default-src 'self'", _csp);
    }

    [Fact]
    public void Csp_Has_ScriptSrc_Self()
    {
        // Scripts must only load from the same origin (React/Vite compiled bundle).
        Assert.Contains("script-src 'self'", _csp);
    }

    [Fact]
    public void Csp_Has_StyleSrc()
    {
        // Styles may include 'unsafe-inline' — Tailwind/Shadcn inject runtime styles.
        Assert.Contains("style-src", _csp);
    }

    [Fact]
    public void Csp_Has_ImgSrc()
    {
        Assert.Contains("img-src", _csp);
    }

    [Fact]
    public void Csp_Has_ConnectSrc()
    {
        // Restricts fetch/XHR/WebSocket targets.
        Assert.Contains("connect-src", _csp);
    }

    [Fact]
    public void Csp_Has_FrameAncestors_None()
    {
        // Prevents this app from being embedded in iframes (clickjacking defence).
        Assert.Contains("frame-ancestors 'none'", _csp);
    }

    [Fact]
    public void Csp_Has_ObjectSrc_None()
    {
        // Blocks Flash, Silverlight, and other legacy plugins.
        Assert.Contains("object-src 'none'", _csp);
    }

    [Fact]
    public void Csp_Has_BaseUri_Self()
    {
        // Prevents base-tag hijacking attacks.
        Assert.Contains("base-uri 'self'", _csp);
    }

    // ── script-src must NOT include unsafe sources (explicit grading criteria) ─

    [Fact]
    public void ScriptSrc_Does_Not_Allow_UnsafeInline()
    {
        // 'unsafe-inline' in script-src is an explicit IS 414 grading failure.
        // Parse only the script-src directive to avoid false positives from style-src.
        var scriptSrc = GetDirective("script-src");
        Assert.NotNull(scriptSrc);
        Assert.DoesNotContain("'unsafe-inline'", scriptSrc);
    }

    [Fact]
    public void ScriptSrc_Does_Not_Allow_UnsafeEval()
    {
        // 'unsafe-eval' allows eval() and new Function() — a common XSS vector.
        var scriptSrc = GetDirective("script-src");
        Assert.NotNull(scriptSrc);
        Assert.DoesNotContain("'unsafe-eval'", scriptSrc);
    }

    // ── connect-src: no wildcards ─────────────────────────────────────────────

    [Fact]
    public void ConnectSrc_Does_Not_Allow_Bare_Wildcard()
    {
        // A wildcard allows JS to fetch any origin, defeating the directive.
        var connectSrc = GetDirective("connect-src");
        Assert.NotNull(connectSrc);
        Assert.DoesNotContain(" * ", $" {connectSrc} ");
    }

    [Fact]
    public void ConnectSrc_Does_Not_Allow_Http_Scheme_Wildcard()
    {
        // "https:" in connect-src (scheme wildcard) is too broad — acceptable for
        // img-src but not for fetch/XHR targets.
        var connectSrc = GetDirective("connect-src");
        Assert.NotNull(connectSrc);
        Assert.DoesNotContain(" https: ", $" {connectSrc} ");
    }

    [Fact]
    public void ConnectSrc_Allows_Self()
    {
        var connectSrc = GetDirective("connect-src");
        Assert.NotNull(connectSrc);
        Assert.Contains("'self'", connectSrc);
    }

    // ── img-src: no bare wildcard, allows data: for MFA QR codes ─────────────

    [Fact]
    public void ImgSrc_Does_Not_Allow_Bare_Wildcard()
    {
        // "img-src *" allows images from any HTTP origin — too permissive.
        var imgSrc = GetDirective("img-src");
        Assert.NotNull(imgSrc);
        Assert.DoesNotContain("img-src *", imgSrc);
    }

    [Fact]
    public void ImgSrc_Does_Not_Allow_Http_Scheme_Unqualified()
    {
        // "http:" (without 's') in img-src enables mixed-content image loads.
        var imgSrc = GetDirective("img-src");
        Assert.NotNull(imgSrc);
        var withoutHttps = imgSrc!.Replace("https:", "REPLACED");
        Assert.DoesNotContain("http:", withoutHttps);
    }

    [Fact]
    public void ImgSrc_Allows_DataUri()
    {
        // MFA setup generates a QR code as a data: URI (base64 PNG).
        // Without "data:" the QR code is blocked by the CSP.
        var imgSrc = GetDirective("img-src");
        Assert.NotNull(imgSrc);
        Assert.Contains("data:", imgSrc);
    }

    // ── CSP string format ─────────────────────────────────────────────────────

    [Fact]
    public void Csp_Is_Not_Empty()
    {
        Assert.False(string.IsNullOrWhiteSpace(_csp));
    }

    [Fact]
    public void Csp_Has_No_Newlines()
    {
        // HTTP header values must not contain CR or LF (header injection guard).
        Assert.DoesNotContain('\n', _csp);
        Assert.DoesNotContain('\r', _csp);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private string? GetDirective(string name) =>
        _csp.Split(';', StringSplitOptions.TrimEntries)
            .FirstOrDefault(d => d.StartsWith(name, StringComparison.Ordinal));
}
