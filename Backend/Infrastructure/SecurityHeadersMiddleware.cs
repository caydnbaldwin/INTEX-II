namespace Backend.Infrastructure;

public static class SecurityHeadersMiddleware
{
    // Tech stack: React + Vite (compiled → 'self'), TailwindCSS (compiled → 'self'),
    // Shadcn/ui with Lucide React (compiled → 'self'), Material Theme Builder tokens
    // (consumed at build time → no CDN), Google OAuth (accounts.google.com).
    //
    // 'unsafe-inline' in style-src is acceptable — Shadcn/Tailwind inject runtime styles.
    // Do NOT add 'unsafe-inline' to script-src; that would fail the requirement.
    public const string ContentSecurityPolicy =
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "font-src 'self'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://accounts.google.com; " +
        "frame-src https://accounts.google.com; " +
        "frame-ancestors 'none'; " +
        "object-src 'none'; " +
        "base-uri 'self'";

    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        var environment = app.ApplicationServices
            .GetRequiredService<IWebHostEnvironment>();

        return app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                if (!(environment.IsDevelopment() &&
                      context.Request.Path.StartsWithSegments("/swagger")))
                {
                    context.Response.Headers["Content-Security-Policy"] = ContentSecurityPolicy;
                    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
                    context.Response.Headers["X-Frame-Options"] = "DENY";
                    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                }
                return Task.CompletedTask;
            });
            await next();
        });
    }
}
