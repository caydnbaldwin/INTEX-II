using System.Text.Json;
using Backend.Controllers;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using static Backend.Tests.Unit.ControllerCoverageTestSupport;

namespace Backend.Tests.Unit;

public class ControllerCoverageAuthPaymentsTests
{
    [Fact]
    public async Task Auth_GetCurrentSession_Authenticated_ReturnsOrderedRoles()
    {
        using var db = CreateDbContext();
        var userManager = CreateUserManager();
        var user = CreateUser("auth-user", "auth@test.local");
        userManager.AddUser(user, AuthRoles.Staff, AuthRoles.Admin);

        var controller = new AuthController(userManager, CreateSignInManager(userManager), BuildConfiguration(), db);
        SetAuthenticatedUser(controller, user);

        var result = await controller.GetCurrentSession();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Contains("[\"Admin\",\"Staff\"]", JsonSerializer.Serialize(ok.Value));
    }

    [Fact]
    public void Auth_ExternalLogin_WhenCallbackUrlCannotBeBuilt_ReturnsProblem()
    {
        using var db = CreateDbContext();
        var userManager = CreateUserManager();
        var signInManager = CreateSignInManager(userManager);
        var controller = new AuthController(
            userManager,
            signInManager,
            BuildConfiguration(new Dictionary<string, string?>
            {
                ["Authentication:Google:ClientId"] = "client",
                ["Authentication:Google:ClientSecret"] = "secret"
            }),
            db)
        {
            Url = new StaticUrlHelper(null)
        };

        var result = controller.ExternalLogin(GoogleDefaults.AuthenticationScheme, "/reports");

        var problem = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status500InternalServerError, problem.StatusCode);
    }

    [Fact]
    public void Auth_ExternalLogin_WithConfiguredGoogle_ReturnsChallenge()
    {
        using var db = CreateDbContext();
        var userManager = CreateUserManager();
        var signInManager = CreateSignInManager(userManager);
        var controller = new AuthController(
            userManager,
            signInManager,
            BuildConfiguration(new Dictionary<string, string?>
            {
                ["Authentication:Google:ClientId"] = "client",
                ["Authentication:Google:ClientSecret"] = "secret"
            }),
            db)
        {
            Url = new StaticUrlHelper("https://backend.test/api/auth/external-callback?returnPath=%2Fdashboard")
        };

        var result = controller.ExternalLogin(GoogleDefaults.AuthenticationScheme, "/dashboard");

        var challenge = Assert.IsType<ChallengeResult>(result);
        Assert.Equal(GoogleDefaults.AuthenticationScheme, Assert.Single(challenge.AuthenticationSchemes));
        Assert.Equal("https://backend.test/api/auth/external-callback?returnPath=%2Fdashboard", challenge.Properties?.RedirectUri);
    }

    [Fact]
    public async Task Auth_ExternalCallback_CoversSuccessTwoFactorAndErrors()
    {
        using var db = CreateDbContext();
        var userManager = CreateUserManager();
        var signInManager = CreateSignInManager(userManager);

        signInManager.ExternalLoginInfo = CreateExternalLoginInfo("existing@test.local");
        signInManager.ExternalLoginSignInResult = Microsoft.AspNetCore.Identity.SignInResult.Success;
        var successController = new AuthController(userManager, signInManager, BuildConfiguration(new Dictionary<string, string?> { ["FrontendUrl"] = "https://ui.test.local" }), db);
        var success = await successController.ExternalLoginCallback("/donor");
        Assert.Equal("https://ui.test.local/donor", Assert.IsType<RedirectResult>(success).Url);

        signInManager.ExternalLoginSignInResult = Microsoft.AspNetCore.Identity.SignInResult.TwoFactorRequired;
        var challenge = await successController.ExternalLoginCallback("/safe path");
        Assert.Equal("https://ui.test.local/mfa-challenge?returnPath=%2Fsafe%20path", Assert.IsType<RedirectResult>(challenge).Url);

        signInManager.ExternalLoginInfo = CreateExternalLoginInfo(null);
        signInManager.ExternalLoginSignInResult = Microsoft.AspNetCore.Identity.SignInResult.Failed;
        var missingEmail = await successController.ExternalLoginCallback();
        Assert.Contains("externalError=", Assert.IsType<RedirectResult>(missingEmail).Url);
    }

    [Fact]
    public async Task Auth_ExternalCallback_CoversCreateFailureAddLoginFailureAndSuccess()
    {
        using var createFailDb = CreateDbContext();
        var createFailManager = CreateUserManager();
        createFailManager.CreateAsyncResult = IdentityResult.Failed(new IdentityError { Description = "create failed" });
        var createFailSignIn = CreateSignInManager(createFailManager);
        createFailSignIn.ExternalLoginInfo = CreateExternalLoginInfo("new-user@test.local", "New", "User", "New User");
        var createFailController = new AuthController(
            createFailManager,
            createFailSignIn,
            BuildConfiguration(new Dictionary<string, string?> { ["FrontendUrl"] = "https://ui.test.local" }),
            createFailDb);

        var createFail = await createFailController.ExternalLoginCallback("/dashboard");
        Assert.Contains("Unable%20to%20create%20a%20local%20account", Assert.IsType<RedirectResult>(createFail).Url);

        using var addLoginDb = CreateDbContext();
        var addLoginManager = CreateUserManager();
        addLoginManager.AddUser(CreateUser("existing-user", "existing@test.local"), AuthRoles.Donor);
        addLoginManager.AddLoginAsyncResult = IdentityResult.Failed(new IdentityError { Description = "login failed" });
        var addLoginSignIn = CreateSignInManager(addLoginManager);
        addLoginSignIn.ExternalLoginInfo = CreateExternalLoginInfo("existing@test.local");
        var addLoginController = new AuthController(
            addLoginManager,
            addLoginSignIn,
            BuildConfiguration(new Dictionary<string, string?> { ["FrontendUrl"] = "https://ui.test.local" }),
            addLoginDb);

        var addLoginFail = await addLoginController.ExternalLoginCallback();
        Assert.Contains("Unable%20to%20associate%20the%20external%20login", Assert.IsType<RedirectResult>(addLoginFail).Url);

        using var successDb = CreateDbContext();
        var successManager = CreateUserManager();
        var successSignIn = CreateSignInManager(successManager);
        successSignIn.ExternalLoginInfo = CreateExternalLoginInfo("new-success@test.local", "Mia", "Chen", "Mia Chen");
        var successController = new AuthController(
            successManager,
            successSignIn,
            BuildConfiguration(new Dictionary<string, string?> { ["FrontendUrl"] = "https://ui.test.local" }),
            successDb);

        var success = await successController.ExternalLoginCallback("/welcome");
        Assert.Equal("https://ui.test.local/welcome", Assert.IsType<RedirectResult>(success).Url);
        Assert.Equal(1, await successDb.Supporters.CountAsync());
        Assert.Contains(AuthRoles.Donor, successManager.GetRoles(Assert.Single(successManager.Users)));
        Assert.Equal("Google", successSignIn.LastSignInCall?.AuthenticationMethod);
    }

    [Fact]
    public async Task Auth_MfaChallenge_And_Logout_CoverRemainingBranches()
    {
        using var db = CreateDbContext();
        var userManager = CreateUserManager();
        var signInManager = CreateSignInManager(userManager);
        var controller = new AuthController(userManager, signInManager, BuildConfiguration(), db);

        var blankAfterCleanup = await controller.MfaChallenge(new MfaChallengeRequest(" - - "));
        Assert.IsType<BadRequestObjectResult>(blankAfterCleanup);

        signInManager.TwoFactorAuthenticatorResult = Microsoft.AspNetCore.Identity.SignInResult.Success;
        Assert.IsType<OkObjectResult>(await controller.MfaChallenge(new MfaChallengeRequest("123-456")));

        signInManager.TwoFactorAuthenticatorResult = Microsoft.AspNetCore.Identity.SignInResult.LockedOut;
        Assert.IsType<BadRequestObjectResult>(await controller.MfaChallenge(new MfaChallengeRequest("654321")));

        var logout = await controller.Logout();
        Assert.IsType<OkObjectResult>(logout);
        Assert.True(signInManager.SignOutCalled);
    }

    [Fact]
    public async Task Payment_CreatePaymentIntent_CoversSuccessFailureAndRecurringBranches()
    {
        using var db = CreateDbContext();
        var userManager = CreateUserManager();

        var successClient = new DelegateStripeClient((method, path, _) =>
        {
            Assert.Equal(path == "/v1/invoices/in_test" ? HttpMethod.Get : HttpMethod.Post, method);
            return path switch
            {
                "/v1/payment_intents" => new PaymentIntent { Id = "pi_test", ClientSecret = "pi_secret_test" },
                "/v1/customers" => new Customer { Id = "cus_test" },
                "/v1/prices" => new Price { Id = "price_test" },
                "/v1/subscriptions" => new Subscription { Id = "sub_test", LatestInvoiceId = "in_test" },
                "/v1/invoices/in_test" => new Invoice
                {
                    Payments = new StripeList<InvoicePayment>
                    {
                        Data =
                        [
                            new InvoicePayment
                            {
                                Payment = new InvoicePaymentPayment
                                {
                                    PaymentIntent = new PaymentIntent { ClientSecret = "recurring_secret" }
                                }
                            }
                        ]
                    }
                },
                _ => throw new InvalidOperationException($"Unexpected path {path}")
            };
        });
        var successController = new PaymentController(
            BuildConfiguration(new Dictionary<string, string?> { ["Stripe:SecretKey"] = "sk_test" }),
            db,
            userManager,
            successClient);

        var oneTime = await successController.CreatePaymentIntent(new CreatePaymentIntentRequest(500, false));
        Assert.Contains("pi_secret_test", JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(oneTime).Value));

        var recurring = await successController.CreatePaymentIntent(new CreatePaymentIntentRequest(1500, true));
        var recurringJson = JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(recurring).Value);
        Assert.Contains("recurring_secret", recurringJson);
        Assert.Contains("sub_test", recurringJson);

        var missingInvoiceController = new PaymentController(
            BuildConfiguration(new Dictionary<string, string?> { ["Stripe:SecretKey"] = "sk_test" }),
            db,
            userManager,
            new DelegateStripeClient((_, path, _) => path switch
            {
                "/v1/customers" => new Customer { Id = "cus_test" },
                "/v1/prices" => new Price { Id = "price_test" },
                "/v1/subscriptions" => new Subscription { Id = "sub_test", LatestInvoiceId = null },
                _ => throw new InvalidOperationException($"Unexpected path {path}")
            }));

        var missingInvoice = await missingInvoiceController.CreatePaymentIntent(new CreatePaymentIntentRequest(1500, true));
        Assert.Equal(StatusCodes.Status500InternalServerError, Assert.IsType<ObjectResult>(missingInvoice).StatusCode);

        var missingSecretController = new PaymentController(
            BuildConfiguration(new Dictionary<string, string?> { ["Stripe:SecretKey"] = "sk_test" }),
            db,
            userManager,
            new DelegateStripeClient((_, path, _) => path switch
            {
                "/v1/customers" => new Customer { Id = "cus_test" },
                "/v1/prices" => new Price { Id = "price_test" },
                "/v1/subscriptions" => new Subscription { Id = "sub_test", LatestInvoiceId = "in_test" },
                "/v1/invoices/in_test" => new Invoice
                {
                    Payments = new StripeList<InvoicePayment>
                    {
                        Data = [new InvoicePayment { Payment = new InvoicePaymentPayment() }]
                    }
                },
                _ => throw new InvalidOperationException($"Unexpected path {path}")
            }));

        var missingSecret = await missingSecretController.CreatePaymentIntent(new CreatePaymentIntentRequest(1500, true));
        Assert.Equal(StatusCodes.Status500InternalServerError, Assert.IsType<ObjectResult>(missingSecret).StatusCode);

        var errorController = new PaymentController(
            BuildConfiguration(new Dictionary<string, string?> { ["Stripe:SecretKey"] = "sk_test" }),
            db,
            userManager,
            new DelegateStripeClient((_, _, _) => throw new StripeException("Stripe exploded")));

        var error = await errorController.CreatePaymentIntent(new CreatePaymentIntentRequest(500, false));
        Assert.Equal(StatusCodes.Status502BadGateway, Assert.IsType<ObjectResult>(error).StatusCode);
    }

    [Fact]
    public async Task Payment_Webhook_And_ClaimDonation_CoverConfiguredSecretAndExistingSupporter()
    {
        using var db = CreateDbContext();
        var userManager = CreateUserManager();
        var controller = new PaymentController(
            BuildConfiguration(new Dictionary<string, string?> { ["Stripe:SecretKey"] = "sk_test" }),
            db,
            userManager)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        controller.Request.Body = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("""
            {
              "id": "evt_with_secret",
              "object": "event",
              "api_version": "2026-03-25.dahlia",
              "type": "payment_intent.succeeded",
              "data": {
                "object": {
                  "id": "pi_with_secret",
                  "object": "payment_intent",
                  "amount": 999,
                  "currency": "usd",
                  "status": "succeeded",
                  "metadata": { "source": "donate_page" }
                }
              }
            }
            """));

        Assert.IsType<OkResult>(await controller.StripeWebhook());
        Assert.Equal("pi_with_secret", Assert.Single(db.Donations).StripePaymentIntentId);

        var user = CreateUser("donor-user", "donor@test.local", supporterId: 44);
        userManager.AddUser(user, AuthRoles.Donor);
        SetAuthenticatedUser(controller, user);
        db.Donations.Add(new Donation
        {
            DonationId = 2,
            StripePaymentIntentId = "pi_claim_existing",
            DonationType = "Monetary",
            Amount = 25m,
            DonationDate = DateOnly.FromDateTime(DateTime.UtcNow)
        });
        await db.SaveChangesAsync();

        Assert.IsType<OkObjectResult>(await controller.ClaimDonation(new ClaimDonationRequest("pi_claim_existing")));
        Assert.Equal(44, db.Donations.Single(d => d.DonationId == 2).SupporterId);
    }

    [Fact]
    public async Task Mfa_And_UserManagement_CoverRemainingIdentityBranches()
    {
        using var db = CreateDbContext();
        var userManager = CreateUserManager();

        var mfaUser = CreateUser("mfa-user", "mfa@test.local");
        userManager.AddUser(mfaUser);
        userManager.CurrentUser = mfaUser;
        userManager.ResetAuthenticatorKeyLeavesBlank = true;

        var mfaController = new MfaController(userManager);
        SetAuthenticatedUser(mfaController, mfaUser);
        var setupProblem = await mfaController.GetSetup();
        Assert.Equal(StatusCodes.Status500InternalServerError, Assert.IsType<ObjectResult>(setupProblem).StatusCode);

        userManager.ResetAuthenticatorKeyLeavesBlank = false;
        userManager.VerifyTwoFactorTokenResult = true;
        Assert.IsType<OkObjectResult>(await mfaController.Enable(new MfaCodeRequest("123 456")));
        Assert.True(userManager.TwoFactorEnabledByUserId[mfaUser.Id]);

        var currentUser = CreateUser("current-admin", "current.admin@test.local");
        var targetAdmin = CreateUser("target-admin", "target.admin@test.local");
        var roleless = CreateUser("roleless", "roleless@test.local");
        userManager.AddUser(currentUser, AuthRoles.Admin);
        userManager.AddUser(targetAdmin, AuthRoles.Admin, AuthRoles.Staff);
        userManager.AddUser(roleless);

        var userController = new UserManagementController(userManager);
        SetAuthenticatedUser(userController, currentUser);

        var getAll = await userController.GetAll();
        var getAllJson = JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(getAll).Value);
        Assert.Contains("\"roles\":[\"Admin\",\"Staff\"]", getAllJson);
        Assert.Contains("\"roles\":[]", getAllJson);

        userManager.RolesByUserId[currentUser.Id].Clear();
        var lastAdmin = await userController.Delete(targetAdmin.Id);
        Assert.Contains("last admin", JsonSerializer.Serialize(Assert.IsType<BadRequestObjectResult>(lastAdmin).Value), StringComparison.OrdinalIgnoreCase);

        userManager.RolesByUserId[targetAdmin.Id].Clear();
        userManager.DeleteAsyncResult = IdentityResult.Failed(new IdentityError { Description = "delete failed" });
        var deleteFailure = await userController.Delete(targetAdmin.Id);
        Assert.Contains("delete failed", JsonSerializer.Serialize(Assert.IsType<BadRequestObjectResult>(deleteFailure).Value));

        userManager.DeleteAsyncResult = IdentityResult.Success;
        userManager.AddUser(targetAdmin, AuthRoles.Staff);
        userManager.RemoveFromRolesAsyncResult = IdentityResult.Failed(new IdentityError { Description = "remove failed" });
        var removeFailure = await userController.UpdateRoles(targetAdmin.Id, new UserManagementController.UpdateRolesRequest { Roles = [] });
        Assert.Contains("remove failed", JsonSerializer.Serialize(Assert.IsType<BadRequestObjectResult>(removeFailure).Value));

        userManager.RemoveFromRolesAsyncResult = IdentityResult.Success;
        userManager.RolesByUserId[targetAdmin.Id].Clear();
        userManager.AddToRolesAsyncResult = IdentityResult.Failed(new IdentityError { Description = "add failed" });
        var addFailure = await userController.UpdateRoles(targetAdmin.Id, new UserManagementController.UpdateRolesRequest { Roles = [AuthRoles.Donor] });
        Assert.Contains("add failed", JsonSerializer.Serialize(Assert.IsType<BadRequestObjectResult>(addFailure).Value));

        userManager.AddToRolesAsyncResult = IdentityResult.Success;
        var updateSuccess = await userController.UpdateRoles(targetAdmin.Id, new UserManagementController.UpdateRolesRequest
        {
            Roles = [AuthRoles.Donor, AuthRoles.Staff]
        });
        Assert.Contains("\"roles\":[\"Donor\",\"Staff\"]", JsonSerializer.Serialize(Assert.IsType<OkObjectResult>(updateSuccess).Value));
    }

    [Fact]
    public void UserManagement_BuildDisplayName_WithBlankLocalPart_ReturnsUser()
    {
        var method = typeof(UserManagementController).GetMethod("BuildDisplayName", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        Assert.NotNull(method);

        var result = (string?)method!.Invoke(null, [new ApplicationUser { Email = "@test.local" }]);

        Assert.Equal("User", result);
    }
}
