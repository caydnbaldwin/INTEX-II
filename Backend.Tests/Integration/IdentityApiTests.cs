using System.Net;
using System.Text;
using System.Text.Json;

namespace Backend.Tests.Integration;

/// <summary>
/// Validates the Identity API /register and /login endpoints.
///
/// Gap 5 addressed: MapIdentityApi endpoints (/register, /login) are exercised for:
///   - Password policy enforcement (IS 414 requirement)
///   - Registration + login round-trip (IS 413 requirement)
///   - Error responses for invalid input
///
/// IS 414 password policy (Program.cs — must NOT follow Microsoft docs defaults):
///   RequiredLength          = 14  (NOT the default 6)
///   RequireDigit            = false
///   RequireLowercase        = false
///   RequireNonAlphanumeric  = false
///   RequireUppercase        = false
///   RequiredUniqueChars     = 1
///
/// The policy was taught in class: length-only, no character-class requirements.
/// Tests below verify the length gate and confirm character-class requirements
/// are intentionally absent (a password of all lowercase should be accepted).
/// </summary>
public class IdentityApiTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    // ── Password policy: rejections (under 14 characters) ────────────────────

    [Theory]
    [InlineData("short")]             // 5 chars
    [InlineData("13charlongpw!")]     // 13 chars — one under the limit
    [InlineData("abc")]               // 3 chars
    [InlineData("")]                  // empty
    public async Task Register_Password_Under_14_Chars_Returns_BadRequest(string weakPassword)
    {
        var email = $"pwtest-{Guid.NewGuid():N}@test.local";
        var response = await PostRegisterAsync(email, weakPassword);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Password policy: acceptances (14+ chars, no character-class gates) ───

    [Theory]
    [InlineData("14charlongpwd!")]        // exactly 14 chars
    [InlineData("alllowercase12345")]     // no uppercase — must be accepted
    [InlineData("ALLUPPERCASE12345")]     // no lowercase — must be accepted
    [InlineData("nospeci4lcharhere")]     // no symbols — must be accepted
    [InlineData("00000000000000")]        // all digits — must be accepted (14 chars)
    [InlineData("averylongpasswordindeed")]  // well over 14 chars
    public async Task Register_Password_14Plus_Chars_Returns_200(string validPassword)
    {
        var email = $"pwtest-{Guid.NewGuid():N}@test.local";
        var response = await PostRegisterAsync(email, validPassword);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Registration input validation ─────────────────────────────────────────

    [Fact]
    public async Task Register_Empty_Email_Returns_BadRequest()
    {
        var response = await PostRegisterAsync("", "ValidPassword1234!!");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_Invalid_Email_Format_Returns_BadRequest()
    {
        var response = await PostRegisterAsync("notanemail", "ValidPassword1234!!");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_Duplicate_Email_Returns_BadRequest()
    {
        var email = $"dup-{Guid.NewGuid():N}@test.local";
        const string password = "DuplicateTest1234!!";

        // First registration succeeds
        var first = await PostRegisterAsync(email, password);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        // Second registration with same email fails
        var second = await PostRegisterAsync(email, password);
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    // ── Registration + Login round-trip ──────────────────────────────────────

    [Fact]
    public async Task Register_Then_Login_With_Cookie_Returns_200()
    {
        var email = $"roundtrip-{Guid.NewGuid():N}@test.local";
        const string password = "RoundTripPassword1234!!";

        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true
        });

        var registerResponse = await PostRegisterOnClientAsync(client, email, password);
        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        var loginPayload = new StringContent(
            JsonSerializer.Serialize(new { email, password }),
            Encoding.UTF8, "application/json");

        var loginResponse = await client.PostAsync(
            "/api/auth/login?useCookies=true", loginPayload);

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    [Fact]
    public async Task Registered_And_Logged_In_User_AuthMe_IsAuthenticated_True()
    {
        var email = $"authme-{Guid.NewGuid():N}@test.local";
        const string password = "AuthMeTestPassword1234!!";

        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true
        });

        await TestAuthHelper.RegisterAsync(client, email, password);
        await TestAuthHelper.LoginAsync(client, email, password);

        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.True(doc.RootElement.GetProperty("isAuthenticated").GetBoolean());
    }

    [Fact]
    public async Task Registered_And_Logged_In_User_AuthMe_Returns_Correct_Email()
    {
        var email = $"emailcheck-{Guid.NewGuid():N}@test.local";
        const string password = "EmailCheckPassword1234!!";

        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true
        });

        await TestAuthHelper.RegisterAsync(client, email, password);
        await TestAuthHelper.LoginAsync(client, email, password);

        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.Equal(email, doc.RootElement.GetProperty("email").GetString());
    }

    // ── Login failures ────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_Wrong_Password_Returns_401()
    {
        var email = $"wrongpwd-{Guid.NewGuid():N}@test.local";
        const string correct = "CorrectPassword1234!!";
        const string wrong = "WrongPassword1234!!";

        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true
        });

        await PostRegisterOnClientAsync(client, email, correct);

        var loginPayload = new StringContent(
            JsonSerializer.Serialize(new { email, password = wrong }),
            Encoding.UTF8, "application/json");

        var response = await client.PostAsync(
            "/api/auth/login?useCookies=true", loginPayload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_Unknown_Email_Returns_401()
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true
        });

        var loginPayload = new StringContent(
            JsonSerializer.Serialize(new
            {
                email = $"nobody-{Guid.NewGuid():N}@test.local",
                password = "SomePassword1234!!"
            }),
            Encoding.UTF8, "application/json");

        var response = await client.PostAsync(
            "/api/auth/login?useCookies=true", loginPayload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<HttpResponseMessage> PostRegisterAsync(string email, string password)
    {
        // These tests don't need cookie auth, so a plain HTTP client is fine.
        var client = factory.CreateClient();
        return await PostRegisterOnClientAsync(client, email, password);
    }

    private static async Task<HttpResponseMessage> PostRegisterOnClientAsync(
        HttpClient client, string email, string password)
    {
        var payload = new StringContent(
            JsonSerializer.Serialize(new { email, password }),
            Encoding.UTF8, "application/json");

        return await client.PostAsync("/api/auth/register", payload);
    }
}
