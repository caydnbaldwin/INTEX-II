using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController(
    IConfiguration configuration,
    AppDbContext db,
    UserManager<ApplicationUser> userManager,
    IStripeClient? stripeClient = null
) : ControllerBase
{
    // ── Create payment intent (one-time or recurring) ─────────────────────────
    [HttpPost("create-payment-intent")]
    [AllowAnonymous]
    public async Task<IActionResult> CreatePaymentIntent([FromBody] CreatePaymentIntentRequest request)
    {
        if (request.AmountCents < 50)
            return BadRequest(new { error = "Minimum donation is $0.50." });

        var secretKey = configuration["Stripe:SecretKey"];
        if (string.IsNullOrEmpty(secretKey))
            return StatusCode(503, new { error = "Payment processing is not configured." });

        if (stripeClient is null) StripeConfiguration.ApiKey = secretKey;

        try
        {
            if (request.Recurring)
            {
                var customerService = stripeClient is null ? new CustomerService() : new CustomerService(stripeClient);
                var priceService = stripeClient is null ? new PriceService() : new PriceService(stripeClient);
                var subscriptionService = stripeClient is null ? new SubscriptionService() : new SubscriptionService(stripeClient);
                var invoiceService = stripeClient is null ? new InvoiceService() : new InvoiceService(stripeClient);

                var customer = await customerService.CreateAsync(new CustomerCreateOptions
                {
                    Metadata = new Dictionary<string, string> { { "source", "donate_page" } },
                });

                var price = await priceService.CreateAsync(new PriceCreateOptions
                {
                    Currency    = "usd",
                    UnitAmount  = request.AmountCents,
                    Recurring   = new PriceRecurringOptions { Interval = "month" },
                    ProductData = new PriceProductDataOptions { Name = "Monthly Donation – Lunas Project" },
                });

                var subscription = await subscriptionService.CreateAsync(new SubscriptionCreateOptions
                {
                    Customer        = customer.Id,
                    Items           = [new SubscriptionItemOptions { Price = price.Id }],
                    PaymentBehavior = "default_incomplete",
                });

                var invoiceId = subscription.LatestInvoiceId;
                if (invoiceId is null)
                    return StatusCode(500, new { error = "Failed to initialize recurring payment." });

                var invoice = await invoiceService.GetAsync(invoiceId, new InvoiceGetOptions
                {
                    Expand = ["payments.data.payment.payment_intent"],
                });

                var clientSecret = invoice.Payments?.Data
                    ?.FirstOrDefault()?.Payment?.PaymentIntent?.ClientSecret;

                if (clientSecret is null)
                    return StatusCode(500, new { error = "Failed to initialize recurring payment." });

                return Ok(new { clientSecret, subscriptionId = subscription.Id });
            }
            else
            {
                var paymentIntentService = stripeClient is null ? new PaymentIntentService() : new PaymentIntentService(stripeClient);
                var intent = await paymentIntentService.CreateAsync(new PaymentIntentCreateOptions
                {
                    Amount   = request.AmountCents,
                    Currency = "usd",
                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true },
                    Metadata = new Dictionary<string, string> { { "source", "donate_page" } },
                });

                return Ok(new { clientSecret = intent.ClientSecret });
            }
        }
        catch (StripeException ex)
        {
            return StatusCode(502, new { error = ex.StripeError?.Message ?? ex.Message });
        }
    }

    // ── Stripe webhook ────────────────────────────────────────────────────────
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> StripeWebhook()
    {
        string json;
        using (var reader = new System.IO.StreamReader(Request.Body))
            json = await reader.ReadToEndAsync();

        var webhookSecret = configuration["Stripe:WebhookSecret"];
        var secretKey     = configuration["Stripe:SecretKey"];
        if (!string.IsNullOrEmpty(secretKey))
            StripeConfiguration.ApiKey = secretKey;

        Event stripeEvent;
        try
        {
            stripeEvent = !string.IsNullOrEmpty(webhookSecret)
                ? EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], webhookSecret)
                : EventUtility.ParseEvent(json); // no signature check — dev only
        }
        catch (StripeException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        if (stripeEvent.Type == "payment_intent.succeeded")
        {
            var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
            if (paymentIntent is null) return Ok();

            // Idempotency — skip if already recorded
            if (await db.Donations.AnyAsync(d => d.StripePaymentIntentId == paymentIntent.Id))
                return Ok();

            var nextId = (await db.Donations.MaxAsync(d => (int?)d.DonationId) ?? 0) + 1;

            db.Donations.Add(new Donation
            {
                DonationId            = nextId,
                StripePaymentIntentId = paymentIntent.Id,
                Amount                = paymentIntent.Amount / 100m,
                CurrencyCode          = paymentIntent.Currency.ToUpperInvariant(),
                DonationDate          = DateOnly.FromDateTime(DateTime.UtcNow),
                DonationType          = "Monetary",
                ChannelSource         = "Stripe",
                IsRecurring           = !(paymentIntent.Metadata?.ContainsKey("source") ?? false),
                CampaignName          = "Online Donation",
            });

            await db.SaveChangesAsync();
        }

        return Ok();
    }

    // ── Claim a donation after sign-in ────────────────────────────────────────
    [HttpPost("claim")]
    [Authorize]
    public async Task<IActionResult> ClaimDonation([FromBody] ClaimDonationRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var donation = await db.Donations.FirstOrDefaultAsync(d =>
            d.StripePaymentIntentId == request.PaymentIntentId &&
            d.SupporterId == null);

        if (donation is null)
            return NotFound(new { error = "Donation not found or already linked." });

        int supporterId;
        if (user.SupporterId.HasValue)
        {
            supporterId = user.SupporterId.Value;
        }
        else
        {
            // Create a Supporter record for this user
            var nextSupporterId = (await db.Supporters.MaxAsync(s => (int?)s.SupporterId) ?? 0) + 1;
            var supporter = new Supporter
            {
                SupporterId    = nextSupporterId,
                Email          = user.Email,
                SupporterType  = "Individual",
                Status         = "Active",
                CreatedAt      = DateTime.UtcNow,
                FirstDonationDate = donation.DonationDate,
            };
            db.Supporters.Add(supporter);
            user.SupporterId = nextSupporterId;
            await userManager.UpdateAsync(user);
            supporterId = nextSupporterId;
        }

        donation.SupporterId = supporterId;
        await db.SaveChangesAsync();

        return Ok(new { message = "Donation linked to your account." });
    }
}

public record CreatePaymentIntentRequest(long AmountCents, bool Recurring = false);
public record ClaimDonationRequest(string PaymentIntentId);
