using Backend.Infrastructure;

namespace Backend.Tests.Unit;

/// <summary>
/// Validates the Content-Security-Policy string constant without spinning up the HTTP pipeline.
/// These are pure string assertions — fast and dependency-free.
///
/// IS 414 grading anchor: CSP must be a response header (not meta tag) and must restrict
/// sources to only what the app needs. The constant is what gets emitted as a header.
/// </summary>
public class SecurityHeadersMiddlewareTests
{
    private readonly string _csp = SecurityHeadersMiddleware.ContentSecurityPolicy;

    // ── Directive presence ────────────────────────────────────────────────────

    [Fact]
    public void Csp_Contains_DefaultSrc_Self()
    {
        Assert.Contains("default-src 'self'", _csp);
    }

    [Fact]
    public void Csp_Contains_ScriptSrc_Self()
    {
        Assert.Contains("script-src 'self'", _csp);
    }

    [Fact]
    public void Csp_Contains_StyleSrc_With_UnsafeInline()
    {
        // Tailwind + Shadcn inject runtime styles — unsafe-inline is acceptable here.
        Assert.Contains("style-src 'self' 'unsafe-inline'", _csp);
    }

    [Fact]
    public void Csp_Contains_ImgSrc()
    {
        Assert.Contains("img-src 'self'", _csp);
    }

    [Fact]
    public void Csp_Contains_ConnectSrc_Google()
    {
        // Google OAuth calls are made from the browser via fetch.
        Assert.Contains("connect-src 'self' https://accounts.google.com", _csp);
    }

    [Fact]
    public void Csp_Contains_FrameSrc_Google()
    {
        Assert.Contains("frame-src https://accounts.google.com", _csp);
    }

    [Fact]
    public void Csp_Contains_FrameAncestors_None()
    {
        // Prevents the app from being embedded in iframes (clickjacking defense).
        Assert.Contains("frame-ancestors 'none'", _csp);
    }

    [Fact]
    public void Csp_Contains_ObjectSrc_None()
    {
        // Blocks Flash, Silverlight, and other plugins.
        Assert.Contains("object-src 'none'", _csp);
    }

    [Fact]
    public void Csp_Contains_BaseUri_Self()
    {
        // Prevents base-tag hijacking attacks.
        Assert.Contains("base-uri 'self'", _csp);
    }

    // ── Critical: script-src must NOT include unsafe-inline ──────────────────

    [Fact]
    public void ScriptSrc_Does_Not_Allow_UnsafeInline()
    {
        // IS 414 explicit requirement: 'unsafe-inline' in script-src fails the grade.
        // Parse only the script-src directive to avoid false positives from style-src.
        var directives = _csp.Split(';', StringSplitOptions.TrimEntries);
        var scriptSrc = directives.FirstOrDefault(d =>
            d.StartsWith("script-src", StringComparison.Ordinal));

        Assert.NotNull(scriptSrc);
        Assert.DoesNotContain("'unsafe-inline'", scriptSrc);
    }

    [Fact]
    public void ScriptSrc_Does_Not_Allow_UnsafeEval()
    {
        var directives = _csp.Split(';', StringSplitOptions.TrimEntries);
        var scriptSrc = directives.FirstOrDefault(d =>
            d.StartsWith("script-src", StringComparison.Ordinal));

        Assert.NotNull(scriptSrc);
        Assert.DoesNotContain("'unsafe-eval'", scriptSrc);
    }

    // ── Policy is a single-line, non-empty string ─────────────────────────────

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
}
