using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace Backend.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController(IConfiguration configuration) : ControllerBase
{
    [HttpPost("create-payment-intent")]
    [AllowAnonymous]
    public async Task<IActionResult> CreatePaymentIntent([FromBody] CreatePaymentIntentRequest request)
    {
        if (request.AmountCents < 50)
            return BadRequest(new { error = "Minimum donation is $0.50." });

        var secretKey = configuration["Stripe:SecretKey"];
        if (string.IsNullOrEmpty(secretKey))
            return StatusCode(503, new { error = "Payment processing is not configured." });

        StripeConfiguration.ApiKey = secretKey;

        if (request.Recurring)
        {
            // ── Recurring: Customer → Price → Subscription ──────────────────
            var customer = await new CustomerService().CreateAsync(new CustomerCreateOptions
            {
                Metadata = new Dictionary<string, string> { { "source", "donate_page" } },
            });

            var price = await new PriceService().CreateAsync(new PriceCreateOptions
            {
                Currency   = "usd",
                UnitAmount = request.AmountCents,
                Recurring  = new PriceRecurringOptions { Interval = "month" },
                ProductData = new PriceProductDataOptions { Name = "Monthly Donation – Lunas Project" },
            });

            var subscription = await new SubscriptionService().CreateAsync(new SubscriptionCreateOptions
            {
                Customer        = customer.Id,
                Items           = [new SubscriptionItemOptions { Price = price.Id }],
                PaymentBehavior = "default_incomplete",
                Expand          = ["latest_invoice.payments.data.payment.payment_intent"],
            });

            var clientSecret = subscription.LatestInvoice?.Payments?.Data
                ?.FirstOrDefault()?.Payment?.PaymentIntent?.ClientSecret;
            if (clientSecret is null)
                return StatusCode(500, new { error = "Failed to initialize recurring payment." });

            return Ok(new { clientSecret, subscriptionId = subscription.Id });
        }
        else
        {
            // ── One-time: PaymentIntent ──────────────────────────────────────
            var intent = await new PaymentIntentService().CreateAsync(new PaymentIntentCreateOptions
            {
                Amount   = request.AmountCents,
                Currency = "usd",
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true },
                Metadata = new Dictionary<string, string> { { "source", "donate_page" } },
            });

            return Ok(new { clientSecret = intent.ClientSecret });
        }
    }
}

public record CreatePaymentIntentRequest(long AmountCents, bool Recurring = false);
