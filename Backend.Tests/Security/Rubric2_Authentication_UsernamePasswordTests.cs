using System.Net;
using System.Text;
using System.Text.Json;

namespace Backend.Tests.Security;

/// <summary>
/// IS 414 Security Rubric — Authentication (username/password) — 3 pts
///
/// Requirements:
///   - Users can register with email + password via ASP.NET Identity.
///   - Users can log in with email + password and receive a session cookie.
///   - /api/auth/me is publicly accessible — React calls it on every page load.
///   - Authenticated users see isAuthenticated=true with email and roles.
///   - Invalid credentials are rejected with 401 Unauthorized.
///   - Logout is available and idempotent.
/// </summary>
public class Rubric2_Authentication_UsernamePasswordTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    // ── Public: /api/auth/me requires no auth ─────────────────────────────────

    [Fact]
    public async Task AuthMe_Is_Publicly_Accessible_Without_Credentials()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AuthMe_Unauthenticated_Returns_IsAuthenticated_False()
    {
        var client = factory.CreateClient();
        var doc = await GetJsonAsync(client, "/api/auth/me");
        Assert.False(doc.RootElement.GetProperty("isAuthenticated").GetBoolean());
    }

    [Fact]
    public async Task AuthMe_Unauthenticated_Returns_Null_Email()
    {
        var client = factory.CreateClient();
        var doc = await GetJsonAsync(client, "/api/auth/me");
        Assert.Equal(JsonValueKind.Null, doc.RootElement.GetProperty("email").ValueKind);
    }

    [Fact]
    public async Task AuthMe_Unauthenticated_Returns_Empty_Roles()
    {
        var client = factory.CreateClient();
        var doc = await GetJsonAsync(client, "/api/auth/me");
        Assert.Empty(doc.RootElement.GetProperty("roles").EnumerateArray());
    }

    // ── Registration ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_With_Valid_Email_And_Long_Password_Returns_200()
    {
        var client = factory.CreateClient();
        var response = await PostAsync(client, "/api/auth/register",
            new { email = UniqueEmail(), password = "ValidLongPassword1234" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Register_With_Invalid_Email_Returns_BadRequest()
    {
        var client = factory.CreateClient();
        var response = await PostAsync(client, "/api/auth/register",
            new { email = "notanemail", password = "ValidLongPassword1234" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_With_Duplicate_Email_Returns_BadRequest()
    {
        var client = factory.CreateClient();
        var email = UniqueEmail();
        const string pw = "ValidLongPassword1234";

        await PostAsync(client, "/api/auth/register", new { email, password = pw });
        var second = await PostAsync(client, "/api/auth/register", new { email, password = pw });
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_With_Correct_Credentials_Returns_200()
    {
        var client = CookieClient();
        var email = UniqueEmail();
        const string pw = "ValidLongPassword1234";

        await TestAuthHelper.RegisterAsync(client, email, pw);
        var login = await PostAsync(client, "/api/auth/login?useCookies=true",
            new { email, password = pw });

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    [Fact]
    public async Task Login_Wrong_Password_Returns_401()
    {
        var client = CookieClient();
        var email = UniqueEmail();
        await TestAuthHelper.RegisterAsync(client, email, "CorrectPassword1234");

        var login = await PostAsync(client, "/api/auth/login?useCookies=true",
            new { email, password = "WrongPassword1234!!" });

        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }

    [Fact]
    public async Task Login_Unknown_Email_Returns_401()
    {
        var client = CookieClient();
        var login = await PostAsync(client, "/api/auth/login?useCookies=true",
            new { email = UniqueEmail(), password = "SomePassword1234!!" });

        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }

    // ── Authenticated session: /api/auth/me reflects logged-in user ───────────

    [Fact]
    public async Task After_Login_AuthMe_Returns_IsAuthenticated_True()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var doc = await GetJsonAsync(client, "/api/auth/me");
        Assert.True(doc.RootElement.GetProperty("isAuthenticated").GetBoolean());
    }

    [Fact]
    public async Task After_Login_AuthMe_Returns_Correct_Email()
    {
        var client = CookieClient();
        var email = UniqueEmail();
        const string pw = "ValidLongPassword1234";

        await TestAuthHelper.RegisterAsync(client, email, pw);
        await TestAuthHelper.LoginAsync(client, email, pw);

        var doc = await GetJsonAsync(client, "/api/auth/me");
        Assert.Equal(email, doc.RootElement.GetProperty("email").GetString());
    }

    [Fact]
    public async Task After_Login_AuthMe_Returns_Roles_Array()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var doc = await GetJsonAsync(client, "/api/auth/me");

        Assert.True(doc.RootElement.TryGetProperty("roles", out var roles),
            "Response must include a 'roles' property.");
        Assert.Equal(JsonValueKind.Array, roles.ValueKind);
    }

    [Fact]
    public async Task Admin_Login_AuthMe_Contains_Admin_Role()
    {
        var client = await TestAuthHelper.CreateAdminClientAsync(factory);
        var doc = await GetJsonAsync(client, "/api/auth/me");
        var roles = doc.RootElement.GetProperty("roles")
            .EnumerateArray().Select(r => r.GetString()).ToList();
        Assert.Contains("Admin", roles);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Logout_Without_Session_Returns_200()
    {
        // SignOutAsync is idempotent — calling it without a session is safe.
        var client = factory.CreateClient();
        var response = await PostAsync(client, "/api/auth/logout", new { });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private HttpClient CookieClient() =>
        factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = true
        });

    private static string UniqueEmail() => $"test-{Guid.NewGuid():N}@test.local";

    private static async Task<HttpResponseMessage> PostAsync(
        HttpClient client, string url, object body) =>
        await client.PostAsync(url,
            new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));

    private static async Task<JsonDocument> GetJsonAsync(HttpClient client, string url)
    {
        var response = await client.GetAsync(url);
        return JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    }
}
