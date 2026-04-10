using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Backend.Tests.Security;

/// <summary>
/// IS 414 Security Rubric — Password Policy — 1 pt
///
/// Policy taught in class (length-only gate, no character-class requirements):
///   RequiredLength         = 14  (NOT the ASP.NET Identity default of 6)
///   RequireDigit           = false
///   RequireLowercase       = false
///   RequireNonAlphanumeric = false
///   RequireUppercase       = false
///   RequiredUniqueChars    = 1
///
/// NOTE: This policy was explicitly taught in IS 413/414. It conflicts with
/// Microsoft's documentation defaults, which require digit/upper/lower/symbol.
/// The class instruction takes precedence.
/// </summary>
public class Rubric3_Authentication_PasswordPolicyTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    // ── DI: verify each policy option is configured correctly ─────────────────

    [Fact]
    public void PasswordPolicy_RequiredLength_Is_14()
    {
        // Core requirement: 14 characters minimum (not the default 6).
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptions<IdentityOptions>>().Value;
        Assert.Equal(14, opts.Password.RequiredLength);
    }

    [Fact]
    public void PasswordPolicy_RequireDigit_Is_False()
    {
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptions<IdentityOptions>>().Value;
        Assert.False(opts.Password.RequireDigit,
            "Password policy must not require digits — length-only gate.");
    }

    [Fact]
    public void PasswordPolicy_RequireLowercase_Is_False()
    {
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptions<IdentityOptions>>().Value;
        Assert.False(opts.Password.RequireLowercase,
            "Password policy must not require lowercase — length-only gate.");
    }

    [Fact]
    public void PasswordPolicy_RequireUppercase_Is_False()
    {
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptions<IdentityOptions>>().Value;
        Assert.False(opts.Password.RequireUppercase,
            "Password policy must not require uppercase — length-only gate.");
    }

    [Fact]
    public void PasswordPolicy_RequireNonAlphanumeric_Is_False()
    {
        using var scope = factory.Services.CreateScope();
        var opts = scope.ServiceProvider
            .GetRequiredService<IOptions<IdentityOptions>>().Value;
        Assert.False(opts.Password.RequireNonAlphanumeric,
            "Password policy must not require symbols — length-only gate.");
    }

    // ── Registration: passwords under 14 characters are rejected ─────────────

    [Theory]
    [InlineData("")]                  // empty
    [InlineData("abc")]               // 3 chars
    [InlineData("short")]             // 5 chars
    [InlineData("13charlongpw!")]     // 13 chars — one under the limit
    public async Task Register_Password_Under_14_Chars_Is_Rejected(string tooShort)
    {
        var client = factory.CreateClient();
        var response = await RegisterAsync(client, UniqueEmail(), tooShort);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Registration: 14+ characters accepted with no character-class gate ────

    [Theory]
    [InlineData("14charlongpwd!")]           // exactly 14 chars
    [InlineData("alllowercase12345")]        // no uppercase — must be accepted
    [InlineData("ALLUPPERCASE12345")]        // no lowercase — must be accepted
    [InlineData("nospecialcharshre")]        // no symbols, 16 chars — must be accepted
    [InlineData("00000000000000")]           // all digits, 14 chars — must be accepted
    [InlineData("averylongpasswordindeed")]  // well over 14 chars
    public async Task Register_Password_14Plus_Chars_Is_Accepted(string validPassword)
    {
        var client = factory.CreateClient();
        var response = await RegisterAsync(client, UniqueEmail(), validPassword);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string UniqueEmail() => $"pwtest-{Guid.NewGuid():N}@test.local";

    private static async Task<HttpResponseMessage> RegisterAsync(
        HttpClient client, string email, string password) =>
        await client.PostAsync("/api/auth/register",
            new StringContent(
                JsonSerializer.Serialize(new { email, password }),
                Encoding.UTF8, "application/json"));
}
