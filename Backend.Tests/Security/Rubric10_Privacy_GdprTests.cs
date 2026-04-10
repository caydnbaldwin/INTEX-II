namespace Backend.Tests.Security;

/// <summary>
/// IS 414 Security Rubric - Privacy (2 pts)
///
/// Verifies that the project includes a tailored privacy policy and a functional
/// cookie-consent flow with both accept and reject behavior.
/// </summary>
public class Rubric10_Privacy_GdprTests
{
    [Fact]
    public void App_Registers_Privacy_Route_And_Cookie_Banner()
    {
        var source = SecuritySourceFileReader.Read("Frontend\\src\\App.tsx");

        Assert.Contains("path=\"privacy\"", source, StringComparison.Ordinal);
        Assert.Contains("<CookieConsentBanner />", source, StringComparison.Ordinal);
    }

    [Fact]
    public void Public_Layout_Footer_Links_To_Privacy_Policy()
    {
        var source = SecuritySourceFileReader.Read("Frontend\\src\\layouts\\PublicLayout.tsx");

        Assert.Contains("to=\"/privacy\"", source, StringComparison.Ordinal);
        Assert.Contains("Privacy Policy", source, StringComparison.Ordinal);
    }

    [Fact]
    public void Privacy_Policy_Is_Tailored_To_Lunas_And_Covers_Gdpr_Topics()
    {
        var source = SecuritySourceFileReader.Read("Frontend\\src\\pages\\privacy-policy.tsx");

        Assert.Contains("Lunas", source, StringComparison.Ordinal);
        Assert.Contains("Donors & Supporters", source, StringComparison.Ordinal);
        Assert.Contains("Residents (Internal Use Only", source, StringComparison.Ordinal);
        Assert.Contains("Right to Erasure", source, StringComparison.Ordinal);
        Assert.Contains("Cookie Policy", source, StringComparison.Ordinal);
        Assert.Contains("Stripe", source, StringComparison.Ordinal);
        Assert.Contains("Microsoft Azure", source, StringComparison.Ordinal);
        Assert.Contains("Vercel", source, StringComparison.Ordinal);
    }

    [Fact]
    public void Cookie_Consent_Banner_Offers_Accept_And_Reject_Choices()
    {
        var source = SecuritySourceFileReader.Read(
            "Frontend\\src\\components\\CookieConsentBanner.tsx");

        Assert.Contains("Reject", source, StringComparison.Ordinal);
        Assert.Contains("Accept", source, StringComparison.Ordinal);
        Assert.Contains("Privacy Policy", source, StringComparison.Ordinal);
    }

    [Fact]
    public void Cookie_Consent_State_Is_Persisted_And_Rejection_Clears_NonEssential_Cookies()
    {
        var source = SecuritySourceFileReader.Read(
            "Frontend\\src\\context\\CookieConsentContext.tsx");

        Assert.Contains("window.localStorage.setItem(STORAGE_KEY, 'accepted')", source, StringComparison.Ordinal);
        Assert.Contains("window.localStorage.setItem(STORAGE_KEY, 'rejected')", source, StringComparison.Ordinal);
        Assert.Contains("document.cookie = 'user-theme=; Max-Age=0; path=/; Secure'", source, StringComparison.Ordinal);
        Assert.Contains("document.cookie = 'sidebar_state=; Max-Age=0; path=/; Secure'", source, StringComparison.Ordinal);
    }

    [Fact]
    public void Theme_Cookie_Is_Only_Written_When_Consent_Is_Accepted()
    {
        var source = SecuritySourceFileReader.Read(
            "Frontend\\src\\components\\theme-provider.tsx");

        Assert.Contains("if (consentStatus === 'accepted')", source, StringComparison.Ordinal);
        Assert.Contains("document.cookie = `user-theme=${newTheme};", source, StringComparison.Ordinal);
        Assert.Contains("else if (consentStatus === 'rejected')", source, StringComparison.Ordinal);
    }
}
