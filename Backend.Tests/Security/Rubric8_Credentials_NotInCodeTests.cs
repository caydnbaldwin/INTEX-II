using System.Text.Json;

namespace Backend.Tests.Security;

/// <summary>
/// IS 414 Security Rubric - Credentials Stored Securely - 1 pt
///
/// Verifies that production secrets are not hardcoded in tracked config files.
/// </summary>
public class Rubric8_Credentials_NotInCodeTests
{
    private static readonly string AppSettingsPath =
        Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..",
            "Backend", "appsettings.json"));

    private static JsonDocument? LoadSettings(string path)
    {
        if (!File.Exists(path)) return null;
        return JsonDocument.Parse(File.ReadAllText(path));
    }

    [Fact]
    public void AppSettings_DefaultConnection_Is_Empty()
    {
        using var doc = LoadSettings(AppSettingsPath);
        if (doc is null) return;

        var conn = doc.RootElement
            .GetProperty("ConnectionStrings")
            .GetProperty("DefaultConnection")
            .GetString();

        Assert.True(string.IsNullOrEmpty(conn),
            "DefaultConnection must be empty in appsettings.json.");
    }

    [Fact]
    public void AppSettings_GoogleClientSecret_Is_Empty()
    {
        using var doc = LoadSettings(AppSettingsPath);
        if (doc is null) return;

        var secret = doc.RootElement
            .GetProperty("Authentication")
            .GetProperty("Google")
            .GetProperty("ClientSecret")
            .GetString();

        Assert.True(string.IsNullOrEmpty(secret),
            "Google ClientSecret must not be committed to appsettings.json.");
    }

    [Fact]
    public void AppSettings_GoogleClientId_Is_Empty()
    {
        using var doc = LoadSettings(AppSettingsPath);
        if (doc is null) return;

        var id = doc.RootElement
            .GetProperty("Authentication")
            .GetProperty("Google")
            .GetProperty("ClientId")
            .GetString();

        Assert.True(string.IsNullOrEmpty(id),
            "Google ClientId must not be committed to appsettings.json.");
    }

    [Fact]
    public void AppSettings_GeminiApiKey_Is_Empty()
    {
        using var doc = LoadSettings(AppSettingsPath);
        if (doc is null) return;

        var key = doc.RootElement
            .GetProperty("Gemini")
            .GetProperty("ApiKey")
            .GetString();

        Assert.True(string.IsNullOrEmpty(key),
            "Gemini API key must not be committed to appsettings.json.");
    }

    [Fact]
    public void AppSettings_StripeSecretKey_Is_Empty()
    {
        using var doc = LoadSettings(AppSettingsPath);
        if (doc is null) return;

        var key = doc.RootElement
            .GetProperty("Stripe")
            .GetProperty("SecretKey")
            .GetString();

        Assert.True(string.IsNullOrEmpty(key),
            "Stripe SecretKey must not be committed to appsettings.json.");
    }

    [Fact]
    public void AppSettings_StripeWebhookSecret_Is_Empty()
    {
        using var doc = LoadSettings(AppSettingsPath);
        if (doc is null) return;

        var key = doc.RootElement
            .GetProperty("Stripe")
            .GetProperty("WebhookSecret")
            .GetString();

        Assert.True(string.IsNullOrEmpty(key),
            "Stripe WebhookSecret must not be committed to appsettings.json.");
    }

    [Fact]
    public void AppSettings_AdminPassword_Is_Empty()
    {
        using var doc = LoadSettings(AppSettingsPath);
        if (doc is null) return;

        var password = doc.RootElement
            .GetProperty("GenerateDefaultIdentityAdmin")
            .GetProperty("Password")
            .GetString();

        Assert.True(string.IsNullOrEmpty(password),
            "Admin seed password must not be committed to appsettings.json.");
    }

    [Fact]
    public void AppSettings_ResendApiKey_Is_Empty()
    {
        using var doc = LoadSettings(AppSettingsPath);
        if (doc is null) return;

        var key = doc.RootElement
            .GetProperty("Resend")
            .GetProperty("ApiKey")
            .GetString();

        Assert.True(string.IsNullOrEmpty(key),
            "Resend API key must not be committed to appsettings.json.");
    }
}
