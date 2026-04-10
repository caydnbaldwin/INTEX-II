using System.Net;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Integration;

public class ControllerBatch4HighImpactTests
{
    [Fact]
    public async Task UserManagement_AdminEndpoints_CoverRoleAndLifecycleBranches()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        string managedUserId;
        using (var scope = factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = new ApplicationUser
            {
                Email = "managed-user@test.local",
                UserName = "managed-user@test.local",
                EmailConfirmed = true
            };
            var create = await userManager.CreateAsync(user, "ManagedUserPassword123!!");
            Assert.True(create.Succeeded);
            await userManager.AddToRoleAsync(user, AuthRoles.Staff);
            managedUserId = user.Id;
        }

        var list = await admin.GetAsync("/api/users");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);

        var deactivateSelf = await admin.PostAsync("/api/users/invalid-self/deactivate", Json(new { }));
        Assert.Equal(HttpStatusCode.NotFound, deactivateSelf.StatusCode);

        var deactivateManaged = await admin.PostAsync($"/api/users/{managedUserId}/deactivate", Json(new { }));
        Assert.Equal(HttpStatusCode.OK, deactivateManaged.StatusCode);

        var activateManaged = await admin.PostAsync($"/api/users/{managedUserId}/activate", Json(new { }));
        Assert.Equal(HttpStatusCode.OK, activateManaged.StatusCode);

        var rolesUpdate = await admin.PutAsync($"/api/users/{managedUserId}/roles", Json(new
        {
            roles = new[] { "Donor" }
        }));
        Assert.Equal(HttpStatusCode.OK, rolesUpdate.StatusCode);

        var deleteManaged = await admin.DeleteAsync($"/api/users/{managedUserId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteManaged.StatusCode);
    }

    [Fact]
    public async Task StaffDirectory_AndDbCheck_Endpoints_ReturnData()
    {
        using var factory = new CustomWebApplicationFactory();
        var staff = await TestAuthHelper.CreateStaffClientAsync(factory);
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Safehouses.Add(new Safehouse { SafehouseId = 6101, Name = "DbCheck House", Region = "R1" });
            db.Residents.Add(new Resident { ResidentId = 6201, SafehouseId = 6101, CaseStatus = "Active" });
            await db.SaveChangesAsync();
        }

        Assert.Equal(HttpStatusCode.OK, (await staff.GetAsync("/api/staff/directory")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/dbcheck")).StatusCode);
    }

    [Fact]
    public async Task VisitationPredictor_ReturnsPredictionPayload()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Residents.Add(new Resident
            {
                ResidentId = 7101,
                CaseCategory = "Neglected",
                CurrentRiskLevel = "Medium"
            });
            db.HomeVisitations.Add(new HomeVisitation
            {
                VisitationId = 7201,
                ResidentId = 7101,
                VisitDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-14)),
                VisitOutcome = "Favorable"
            });
            await db.SaveChangesAsync();
        }

        var predict = await admin.PostAsync("/api/predict/visitation-outcome", Json(new
        {
            residentId = 7101,
            visitType = "Routine Follow-Up",
            familyCooperationLevel = "Cooperative",
            safetyConcerns = false
        }));

        Assert.Equal(HttpStatusCode.OK, predict.StatusCode);
        var body = await predict.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("favorableProbability", out _));
        Assert.True(doc.RootElement.TryGetProperty("riskLabel", out _));
        Assert.True(doc.RootElement.TryGetProperty("factors", out _));
    }

    [Fact]
    public async Task PaymentController_NonExternalBranches_Work()
    {
        using var factory = new CustomWebApplicationFactory();
        var admin = await TestAuthHelper.CreateAdminClientAsync(factory);

        var tooSmall = await admin.PostAsync("/api/payments/create-payment-intent", Json(new
        {
            amountCents = 25,
            recurring = false
        }));
        Assert.Equal(HttpStatusCode.BadRequest, tooSmall.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Donations.Add(new Donation
            {
                DonationId = 8101,
                StripePaymentIntentId = "pi_claim_test_1",
                SupporterId = null,
                Amount = 50,
                DonationType = "Monetary",
                DonationDate = DateOnly.FromDateTime(DateTime.UtcNow)
            });
            await db.SaveChangesAsync();
        }

        var claim = await admin.PostAsync("/api/payments/claim", Json(new
        {
            paymentIntentId = "pi_claim_test_1"
        }));
        Assert.Equal(HttpStatusCode.OK, claim.StatusCode);

        var claimMissing = await admin.PostAsync("/api/payments/claim", Json(new
        {
            paymentIntentId = "pi_missing"
        }));
        Assert.Equal(HttpStatusCode.NotFound, claimMissing.StatusCode);
    }

    private static StringContent Json(object payload)
        => new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
}
