using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Stripe;

namespace Backend.Tests.Unit;

internal static class ControllerCoverageTestSupport
{
    internal static AppDbContext CreateDbContext(string? name = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString("N"))
            .Options;
        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    internal static TestUserManager CreateUserManager() => new(CreateDbContext());

    internal static TestSignInManager CreateSignInManager(TestUserManager userManager) => new(userManager);

    internal static ApplicationUser CreateUser(string id, string email, int? supporterId = null) =>
        new()
        {
            Id = id,
            Email = email,
            UserName = email,
            SupporterId = supporterId
        };

    internal static void SetAuthenticatedUser(ControllerBase controller, ApplicationUser user)
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Name, user.UserName ?? user.Email ?? user.Id)
                ], "TestAuth"))
            }
        };
    }

    internal static IConfiguration BuildConfiguration(Dictionary<string, string?>? values = null) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(values ?? new Dictionary<string, string?>())
            .Build();

    internal static ExternalLoginInfo CreateExternalLoginInfo(
        string? email,
        string? givenName = null,
        string? surname = null,
        string? fullName = null)
    {
        var claims = new List<Claim>();
        if (email is not null) claims.Add(new Claim(ClaimTypes.Email, email));
        if (givenName is not null) claims.Add(new Claim(ClaimTypes.GivenName, givenName));
        if (surname is not null) claims.Add(new Claim(ClaimTypes.Surname, surname));
        if (fullName is not null) claims.Add(new Claim(ClaimTypes.Name, fullName));

        return new ExternalLoginInfo(
            new ClaimsPrincipal(new ClaimsIdentity(claims, "Google")),
            "Google",
            "provider-key",
            "Google");
    }

    internal static IFormFile CreateFormFile(byte[] bytes, string fileName, string contentType)
    {
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "audio", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }

    internal sealed class StripeClientScope : IDisposable
    {
        private readonly IStripeClient? previousClient;
        private readonly string? previousApiKey;

        internal StripeClientScope(Func<HttpMethod, string, BaseOptions?, object?> handler)
        {
            previousClient = StripeConfiguration.StripeClient;
            previousApiKey = StripeConfiguration.ApiKey;
            StripeConfiguration.StripeClient = new DelegateStripeClient(handler);
        }

        public void Dispose()
        {
            StripeConfiguration.StripeClient = previousClient;
            StripeConfiguration.ApiKey = previousApiKey;
        }
    }

    internal sealed class DelegateStripeClient(Func<HttpMethod, string, BaseOptions?, object?> handler) : IStripeClient
    {
        public string ApiBase => "https://api.stripe.test";
        public string ApiKey => "sk_test";
        public string ClientId => string.Empty;
        public string ConnectBase => string.Empty;
        public string FilesBase => string.Empty;
        public string MeterEventsBase => string.Empty;

        Task<T> IStripeClient.RequestAsync<T>(
            HttpMethod method,
            string path,
            BaseOptions options,
            RequestOptions requestOptions,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult((T)handler(method, path, options)!);
        }

        Task<Stream> IStripeClient.RequestStreamingAsync(
            HttpMethod method,
            string path,
            BaseOptions options,
            RequestOptions requestOptions,
            CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
    }

    internal sealed class DelegateAudioAutofillService(
        Func<byte[], string, CancellationToken, Task<ProcessRecordingAutofillResult>> handler)
        : IAudioAutofillService
    {
        public Task<ProcessRecordingAutofillResult> GenerateProcessRecordingAutofillAsync(
            byte[] audioBytes,
            string fileName,
            CancellationToken cancellationToken = default)
            => handler(audioBytes, fileName, cancellationToken);
    }

    internal sealed class GeminiStubHandler(string mode) : HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);

            string text;
            if (body.Contains("intent classifier", StringComparison.OrdinalIgnoreCase))
            {
                text = mode switch
                {
                    "resident-detail" => "{\"category\":\"resident_detail\",\"entityName\":\"Maria\",\"limit\":1}",
                    "supporter-detail" => "{\"category\":\"supporter_detail\",\"entityName\":\"Lea Jain\",\"limit\":1}",
                    "no-results" => "{\"category\":\"resident_list\",\"limit\":5}",
                    _ => "{\"category\":\"unknown\",\"limit\":5}"
                };
            }
            else if (body.Contains("trauma-informed case assistant", StringComparison.OrdinalIgnoreCase))
            {
                text = "{\"residentTag\":\"[[resident:1]]\",\"riskLevel\":\"High\",\"concern\":\"urgent safety\",\"action\":\"schedule follow-up\"}";
            }
            else if (body.Contains("donor retention assistant", StringComparison.OrdinalIgnoreCase))
            {
                text = "{\"supporterTag\":\"[[supporter:10]]\",\"churnRisk\":\"High\",\"concern\":\"lapsed giving\",\"action\":\"call donor\"}";
            }
            else
            {
                text = "1. [[resident:1]] high risk.";
            }

            var payload = JsonSerializer.Serialize(new
            {
                candidates = new[]
                {
                    new
                    {
                        content = new
                        {
                            parts = new[]
                            {
                                new { text }
                            }
                        }
                    }
                }
            });

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/json")
            };
        }
    }

    internal sealed class StaticUrlHelper(string? actionUrl) : IUrlHelper
    {
        public ActionContext ActionContext => new();
        public string? Action(UrlActionContext actionContext) => actionUrl;
        public string? Content(string? contentPath) => contentPath;
        public bool IsLocalUrl(string? url) => true;
        public string? Link(string? routeName, object? values) => actionUrl;
        public string? RouteUrl(UrlRouteContext routeContext) => actionUrl;
    }

    internal sealed class TestSignInManager : SignInManager<ApplicationUser>
    {
        internal TestSignInManager(TestUserManager userManager)
            : base(
                userManager,
                new HttpContextAccessor(),
                new UserClaimsPrincipalFactory<ApplicationUser>(userManager, Microsoft.Extensions.Options.Options.Create(new IdentityOptions())),
                Microsoft.Extensions.Options.Options.Create(new IdentityOptions()),
                NullLogger<SignInManager<ApplicationUser>>.Instance,
                new AuthenticationSchemeProvider(Microsoft.Extensions.Options.Options.Create(new AuthenticationOptions())),
                new AlwaysConfirmedUserConfirmation())
        {
        }

        internal ExternalLoginInfo? ExternalLoginInfo { get; set; }
        internal Microsoft.AspNetCore.Identity.SignInResult ExternalLoginSignInResult { get; set; } = Microsoft.AspNetCore.Identity.SignInResult.Failed;
        internal Microsoft.AspNetCore.Identity.SignInResult TwoFactorAuthenticatorResult { get; set; } = Microsoft.AspNetCore.Identity.SignInResult.Failed;
        internal SignInCall? LastSignInCall { get; private set; }
        internal bool SignOutCalled { get; private set; }

        public override AuthenticationProperties ConfigureExternalAuthenticationProperties(string provider, string redirectUrl, string? userId = null)
            => new() { RedirectUri = redirectUrl };

        public override Task<ExternalLoginInfo?> GetExternalLoginInfoAsync(string? expectedXsrf = null)
            => Task.FromResult(ExternalLoginInfo);

        public override Task<Microsoft.AspNetCore.Identity.SignInResult> ExternalLoginSignInAsync(string loginProvider, string providerKey, bool isPersistent, bool bypassTwoFactor)
            => Task.FromResult(ExternalLoginSignInResult);

        public override Task SignInAsync(ApplicationUser user, bool isPersistent, string? authenticationMethod = null)
        {
            LastSignInCall = new SignInCall(user, isPersistent, authenticationMethod);
            return Task.CompletedTask;
        }

        public override Task SignOutAsync()
        {
            SignOutCalled = true;
            return Task.CompletedTask;
        }

        public override Task<Microsoft.AspNetCore.Identity.SignInResult> TwoFactorAuthenticatorSignInAsync(string code, bool isPersistent, bool rememberClient)
            => Task.FromResult(TwoFactorAuthenticatorResult);
    }

    internal sealed class TestUserManager : UserManager<ApplicationUser>
    {
        internal TestUserManager(AppDbContext dbContext)
            : base(
                new UserStore<ApplicationUser>(dbContext),
                Microsoft.Extensions.Options.Options.Create(CreateIdentityOptions()),
                new PasswordHasher<ApplicationUser>(),
                Array.Empty<IUserValidator<ApplicationUser>>(),
                Array.Empty<IPasswordValidator<ApplicationUser>>(),
                new UpperInvariantLookupNormalizer(),
                new IdentityErrorDescriber(),
                null,
                NullLogger<UserManager<ApplicationUser>>.Instance)
        {
        }

        internal ApplicationUser? CurrentUser { get; set; }
        internal Dictionary<string, ApplicationUser> UsersById { get; } = new(StringComparer.Ordinal);
        internal Dictionary<string, List<string>> RolesByUserId { get; } = new(StringComparer.Ordinal);
        internal Dictionary<string, bool> TwoFactorEnabledByUserId { get; } = new(StringComparer.Ordinal);
        internal Dictionary<string, string?> AuthenticatorKeysByUserId { get; } = new(StringComparer.Ordinal);
        internal IdentityResult CreateAsyncResult { get; set; } = IdentityResult.Success;
        internal IdentityResult AddLoginAsyncResult { get; set; } = IdentityResult.Success;
        internal IdentityResult UpdateAsyncResult { get; set; } = IdentityResult.Success;
        internal IdentityResult DeleteAsyncResult { get; set; } = IdentityResult.Success;
        internal IdentityResult RemoveFromRolesAsyncResult { get; set; } = IdentityResult.Success;
        internal IdentityResult AddToRolesAsyncResult { get; set; } = IdentityResult.Success;
        internal bool VerifyTwoFactorTokenResult { get; set; }
        internal bool ResetAuthenticatorKeyLeavesBlank { get; set; }

        public override IQueryable<ApplicationUser> Users => UsersById.Values.AsQueryable();

        internal void AddUser(ApplicationUser user, params string[] roles)
        {
            if (string.IsNullOrWhiteSpace(user.Id))
                user.Id = Guid.NewGuid().ToString("N");

            UsersById[user.Id] = user;
            RolesByUserId[user.Id] = roles.ToList();
            TwoFactorEnabledByUserId.TryAdd(user.Id, false);
            AuthenticatorKeysByUserId.TryAdd(user.Id, null);
        }

        internal IReadOnlyList<string> GetRoles(ApplicationUser user)
            => RolesByUserId.TryGetValue(user.Id, out var roles) ? roles : [];

        public override Task<ApplicationUser?> GetUserAsync(ClaimsPrincipal principal)
        {
            if (CurrentUser is not null)
                return Task.FromResult<ApplicationUser?>(CurrentUser);

            var userId = GetUserId(principal);
            return Task.FromResult(userId is not null && UsersById.TryGetValue(userId, out var user) ? user : null);
        }

        public override string? GetUserId(ClaimsPrincipal principal)
            => principal.FindFirstValue(ClaimTypes.NameIdentifier);

        public override Task<IList<string>> GetRolesAsync(ApplicationUser user)
            => Task.FromResult<IList<string>>(GetRoles(user).ToList());

        public override Task<ApplicationUser?> FindByEmailAsync(string email)
            => Task.FromResult(UsersById.Values.FirstOrDefault(user =>
                string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase)));

        public override Task<ApplicationUser?> FindByIdAsync(string userId)
            => Task.FromResult(UsersById.TryGetValue(userId, out var user) ? user : null);

        public override Task<IdentityResult> CreateAsync(ApplicationUser user)
        {
            if (CreateAsyncResult.Succeeded)
                AddUser(user);

            return Task.FromResult(CreateAsyncResult);
        }

        public override Task<IdentityResult> AddToRoleAsync(ApplicationUser user, string role)
        {
            AddUser(user);
            if (!RolesByUserId[user.Id].Contains(role, StringComparer.OrdinalIgnoreCase))
                RolesByUserId[user.Id].Add(role);

            return Task.FromResult(IdentityResult.Success);
        }

        public override Task<IdentityResult> AddLoginAsync(ApplicationUser user, UserLoginInfo login)
            => Task.FromResult(AddLoginAsyncResult);

        public override Task<IdentityResult> UpdateAsync(ApplicationUser user)
        {
            if (UpdateAsyncResult.Succeeded)
                UsersById[user.Id] = user;

            return Task.FromResult(UpdateAsyncResult);
        }

        public override Task<IdentityResult> DeleteAsync(ApplicationUser user)
        {
            if (DeleteAsyncResult.Succeeded)
            {
                UsersById.Remove(user.Id);
                RolesByUserId.Remove(user.Id);
            }

            return Task.FromResult(DeleteAsyncResult);
        }

        public override Task<bool> IsInRoleAsync(ApplicationUser user, string role)
            => Task.FromResult(GetRoles(user).Contains(role, StringComparer.OrdinalIgnoreCase));

        public override Task<IList<ApplicationUser>> GetUsersInRoleAsync(string role)
            => Task.FromResult<IList<ApplicationUser>>(UsersById.Values
                .Where(user => GetRoles(user).Contains(role, StringComparer.OrdinalIgnoreCase))
                .ToList());

        public override Task<IdentityResult> SetLockoutEnabledAsync(ApplicationUser user, bool enabled)
            => Task.FromResult(IdentityResult.Success);

        public override Task<IdentityResult> SetLockoutEndDateAsync(ApplicationUser user, DateTimeOffset? lockoutEnd)
        {
            user.LockoutEnd = lockoutEnd;
            return Task.FromResult(IdentityResult.Success);
        }

        public override Task<IdentityResult> RemoveFromRolesAsync(ApplicationUser user, IEnumerable<string> roles)
        {
            if (!RemoveFromRolesAsyncResult.Succeeded)
                return Task.FromResult(RemoveFromRolesAsyncResult);

            AddUser(user);
            RolesByUserId[user.Id] = RolesByUserId[user.Id]
                .Except(roles, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return Task.FromResult(IdentityResult.Success);
        }

        public override Task<IdentityResult> AddToRolesAsync(ApplicationUser user, IEnumerable<string> roles)
        {
            if (!AddToRolesAsyncResult.Succeeded)
                return Task.FromResult(AddToRolesAsyncResult);

            AddUser(user);
            foreach (var role in roles.Where(role => !RolesByUserId[user.Id].Contains(role, StringComparer.OrdinalIgnoreCase)))
                RolesByUserId[user.Id].Add(role);

            return Task.FromResult(IdentityResult.Success);
        }

        public override Task<bool> GetTwoFactorEnabledAsync(ApplicationUser user)
            => Task.FromResult(TwoFactorEnabledByUserId.GetValueOrDefault(user.Id));

        public override Task<string?> GetAuthenticatorKeyAsync(ApplicationUser user)
            => Task.FromResult(AuthenticatorKeysByUserId.GetValueOrDefault(user.Id));

        public override Task<IdentityResult> ResetAuthenticatorKeyAsync(ApplicationUser user)
        {
            AuthenticatorKeysByUserId[user.Id] = ResetAuthenticatorKeyLeavesBlank
                ? null
                : $"KEY-{user.Id}";
            return Task.FromResult(IdentityResult.Success);
        }

        public override Task<bool> VerifyTwoFactorTokenAsync(ApplicationUser user, string tokenProvider, string token)
            => Task.FromResult(VerifyTwoFactorTokenResult);

        public override Task<IdentityResult> SetTwoFactorEnabledAsync(ApplicationUser user, bool enabled)
        {
            TwoFactorEnabledByUserId[user.Id] = enabled;
            return Task.FromResult(IdentityResult.Success);
        }

        private static IdentityOptions CreateIdentityOptions()
        {
            var options = new IdentityOptions();
            options.Tokens.AuthenticatorTokenProvider = TokenOptions.DefaultAuthenticatorProvider;
            return options;
        }
    }

    internal sealed class AlwaysConfirmedUserConfirmation : IUserConfirmation<ApplicationUser>
    {
        public Task<bool> IsConfirmedAsync(UserManager<ApplicationUser> manager, ApplicationUser user)
            => Task.FromResult(true);
    }

    internal sealed record SignInCall(ApplicationUser User, bool IsPersistent, string? AuthenticationMethod);
}
