# Security Hardening Plan — INTEX-II
> IS 414 Security — 20 pts total
> Deadline: Friday April 10, 2026

This document is the single source of truth for every security feature. Items are split into **"do now"** (infrastructure that can be wired up before IS 413 pages exist) and **"do when routes exist"** (things that depend on having real pages and controllers).

Each item maps to a requirement section and point value.

---

## CRITICAL — Do Before the Next Commit

> **`Backend/appsettings.json` contains the real database password (`M0nson10!`) and is tracked by git.**
> If you commit this file as-is, the password will be in git history permanently and `git log --all -p` will show it — instant 0 on the Credentials section.

**Fix before next `git add` / `git commit`:**

1. Strip the password from `appsettings.json` — replace the full connection string value with an empty string or a comment placeholder.
2. Add the real connection string to `appsettings.Development.json` (already gitignored).
3. In Azure App Settings (production), set `ConnectionStrings__DefaultConnection` to the full connection string.
4. Verify: `git diff` should show zero secrets before committing.

---

## Section 1 — Credentials (1 pt)

**Goal:** Zero passwords/API keys in `git log --all -p`.

### Do Now

- [ ] **Strip password from `appsettings.json`** (see CRITICAL block above)
- [ ] **Move dev connection string to `appsettings.Development.json`** — already gitignored; put the full connection string there for local development
- [ ] **Move production connection string to Azure App Settings** — key: `ConnectionStrings__DefaultConnection`
- [ ] **Add Google OAuth secrets to user-secrets (dev) and Azure App Settings (prod)** — keys: `Authentication:Google:ClientId`, `Authentication:Google:ClientSecret`
- [ ] **Add default admin seed credentials to user-secrets (dev) and Azure App Settings (prod)** — keys: `GenerateDefaultIdentityAdmin:Email`, `GenerateDefaultIdentityAdmin:Password`
- [ ] **Verify clean history** — run `git log --all -p | grep -i "password\|secret\|clientsecret"` and confirm zero hits

### Video demo requirement
Show the Azure App Settings screen with the secrets keys visible (values blurred). Run `git log --all -p` in the terminal and show it returns nothing sensitive.

---

## Section 2 — Confidentiality (1.5 pts)

**Goal:** HTTPS everywhere, HTTP redirects to HTTPS, valid certificate.

### Do Now (Backend — `Program.cs`)

- [ ] **HTTPS redirect** — `app.UseHttpsRedirection()` already present ✓
- [ ] **HSTS header** — Add the following block in `Program.cs`:
  ```csharp
  // After builder.Build(), before app.Run():
  if (!app.Environment.IsDevelopment())
  {
      app.UseHsts();
  }
  ```
  And register the service:
  ```csharp
  builder.Services.AddHsts(options =>
  {
      options.MaxAge = TimeSpan.FromDays(365);
      options.IncludeSubDomains = true;
  });
  ```
  > HSTS also counts toward the Additional Security Features (2 pt section).

### Video demo requirement
Show browser lock icon on lunas-project.site. Navigate to `http://lunas-project.site` and show it auto-redirects to `https://`. Open DevTools → Network → Response Headers and show `Strict-Transport-Security` header.

---

## Section 3 — Authentication (5 pts)

**Goal:** ASP.NET Identity login/register/logout, stronger-than-default password policy, protected endpoints.

### Do Now (Backend)

**3a. Custom ApplicationUser + Identity config**

- [ ] Create `Backend/Data/ApplicationUser.cs`:
  ```csharp
  using Microsoft.AspNetCore.Identity;
  namespace Backend.Data;
  public class ApplicationUser : IdentityUser { }
  ```

- [ ] Update `AppDbContext` to extend `IdentityDbContext<ApplicationUser>` instead of `IdentityDbContext<IdentityUser>`

- [ ] Update `Program.cs` Identity registration:
  ```csharp
  builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
      .AddRoles<IdentityRole>()
      .AddEntityFrameworkStores<AppDbContext>();
  ```
  Remove the existing `AddIdentity<IdentityUser, IdentityRole>()` call.

- [ ] Add password policy to `Program.cs` (must match what was taught in class — 14+ chars, not Microsoft defaults):
  ```csharp
  builder.Services.Configure<IdentityOptions>(options =>
  {
      options.Password.RequireDigit = false;
      options.Password.RequireLowercase = false;
      options.Password.RequireNonAlphanumeric = false;
      options.Password.RequireUppercase = false;
      options.Password.RequiredLength = 14;
      options.Password.RequiredUniqueChars = 1;
  });
  ```

- [ ] Add cookie configuration to `Program.cs`:
  ```csharp
  builder.Services.ConfigureApplicationCookie(options =>
  {
      options.Cookie.HttpOnly = true;
      options.Cookie.SameSite = SameSiteMode.Lax;
      options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
      options.ExpireTimeSpan = TimeSpan.FromDays(7);
      options.SlidingExpiration = true;
  });
  ```

- [ ] Map Identity API endpoints in `Program.cs`:
  ```csharp
  app.MapGroup("/api/auth").MapIdentityApi<ApplicationUser>();
  ```

**3b. AuthController** — Create `Backend/Controllers/AuthController.cs` (port from RootkitIdentityW26):
- [ ] `GET /api/auth/me` — returns `{ isAuthenticated, userName, email, roles[] }`, public (no [Authorize])
- [ ] `POST /api/auth/logout` — calls `signInManager.SignOutAsync()`
- [ ] `GET /api/auth/providers` — returns available external providers
- [ ] `GET /api/auth/external-login` — redirects to Google
- [ ] `GET /api/auth/external-callback` — handles OAuth callback, creates user if new

**3c. Role seeding** — Create `Backend/Data/AuthRoles.cs` and `AuthIdentityGenerator.cs` (port from RootkitIdentityW26):
- [ ] Roles: `Admin`, `Donor` (not Customer — INTEX uses Donor)
- [ ] Seed a default Admin user from config (email + password in user-secrets, not appsettings.json)
- [ ] Call `AuthIdentityGenerator.GenerateDefaultIdentityAsync()` during startup in `Program.cs`

**3d. CORS fix** — Current CORS policy is missing `AllowCredentials()`, which breaks cookie auth:
- [ ] Update CORS policy in `Program.cs`:
  ```csharp
  policy.WithOrigins(...)
        .AllowCredentials()   // ADD THIS
        .AllowAnyHeader()
        .AllowAnyMethod();
  ```

**3e. New migration** — After updating `AppDbContext` and `ApplicationUser`:
- [ ] Run `dotnet ef migrations add AddIdentityTables`
- [ ] Run `dotnet ef database update`
- [ ] Confirm Identity tables appear in Azure SQL (not SQLite — this satisfies the "real DBMS" additional feature)

### Do When IS 413 Pages Exist (Frontend)

- [ ] Create `Frontend/src/context/AuthContext.tsx` — wraps `GET /api/auth/me`, exposes `{ authSession, isAuthenticated, isLoading, refreshAuthState }`
- [ ] Create `Frontend/src/pages/LoginPage.tsx` — email/password form, Google OAuth button, error handling
- [ ] Create `Frontend/src/pages/RegisterPage.tsx` — form with password validation feedback
- [ ] Create `Frontend/src/pages/LogoutPage.tsx`
- [ ] Create `Frontend/src/components/ProtectedRoute.tsx` — redirects unauthenticated users to `/login`
- [ ] Wrap all authenticated routes in `<ProtectedRoute>`

### Do When IS 413 Routes Exist (Backend)

- [ ] Add `[Authorize]` to every controller that reads sensitive data
- [ ] Add `[Authorize(Roles = "Admin")]` to every CUD endpoint
- [ ] Confirm `GET /api/auth/me`, `/api/health`, `/login`, `/privacy-policy` remain public
- [ ] Verify: curl a protected endpoint without a cookie → 401

### Video demo requirement
Register a new user, log in, log out, navigate to a protected page and get blocked. Show password rejection for passwords under 14 chars.

---

## Section 4 — Authorization / RBAC (1.5 pts)

**Goal:** Admin-only CUD, Donor can only view own data, visitors see only public pages.

### Do Now (Backend)

- [ ] Create `Backend/Data/AuthPolicies.cs`:
  ```csharp
  namespace Backend.Data;
  public static class AuthPolicies
  {
      public const string AdminOnly = "AdminOnly";
  }
  ```
- [ ] Register policy in `Program.cs`:
  ```csharp
  builder.Services.AddAuthorization(options =>
  {
      options.AddPolicy(AuthPolicies.AdminOnly,
          policy => policy.RequireRole(AuthRoles.Admin));
  });
  ```

### Do When IS 413 Routes Exist (Backend)

- [ ] Apply `[Authorize(Policy = AuthPolicies.AdminOnly)]` to all Create/Update/Delete endpoints
- [ ] Donor-scoped read endpoints: filter by `User.FindFirstValue(ClaimTypes.NameIdentifier)` to return only that user's data
- [ ] Verify: log in as Donor, attempt an admin endpoint → 403

### Video demo requirement
Log in as Donor → try an admin API endpoint → show 403. Log in as Admin → same endpoint succeeds.

---

## Section 5 — Integrity (1 pt)

**Goal:** Confirmation dialog before any delete.

### Do When IS 413 Pages Exist (Frontend)

- [ ] Every delete button shows a modal/dialog: "Are you sure you want to delete [name]? This cannot be undone."
- [ ] Canceling the dialog makes zero API calls
- [ ] Confirming sends the DELETE request

### Video demo requirement
Click delete on any record, show the confirmation dialog, click cancel (nothing happens), click delete again and confirm (record disappears).

---

## Section 6 — Privacy (2 pts)

**Goal:** Org-specific privacy policy linked from every footer; GDPR cookie consent with accept AND reject.

### Do Now (Frontend)

**6a. Cookie consent — fully functional (accept + reject)**

- [ ] Create `Frontend/src/context/CookieConsentContext.tsx`:
  - State: `consentStatus: 'pending' | 'accepted' | 'rejected'`
  - Read from `localStorage` on init
  - `acceptConsent()` — writes `'accepted'` to localStorage
  - `rejectConsent()` — writes `'rejected'` to localStorage
  - When status is `'rejected'`, do not load any analytics or tracking scripts

- [ ] Create `Frontend/src/components/CookieConsentBanner.tsx`:
  - Shows on first visit (when status is `'pending'`)
  - Two buttons: **Accept** and **Reject**
  - On accept: hides banner, sets status to `'accepted'`
  - On reject: hides banner, sets status to `'rejected'`, disables analytics

- [ ] Wire `<CookieConsentProvider>` and `<CookieConsentBanner />` into `App.tsx`

### Do When IS 413 Pages Exist (Frontend)

**6b. Privacy policy page**

- [ ] Create `/privacy-policy` route with `Frontend/src/pages/PrivacyPolicyPage.tsx`
- [ ] Content must be specific to **Luna's organization** (names of data collected, why, retention period, contact info) — not generic boilerplate
- [ ] Include: what PII is collected, how it is used, cookie policy, resident data handling, donor data handling, right to erasure
- [ ] Link to `/privacy-policy` in every page footer

### Video demo requirement
Show banner on first visit. Click Reject — banner disappears, choice persisted (reload and it doesn't reappear). Show privacy policy is accessible from every page footer and is specific to the organization.

---

## Section 7 — Attack Mitigations / CSP (2 pts)

**Goal:** `Content-Security-Policy` HTTP response header (not a meta tag) with only needed sources.

### Do Now (Backend)

- [ ] Create `Backend/Infrastructure/SecurityHeadersMiddleware.cs` (port from RootkitIdentityW26):
  ```csharp
  namespace Backend.Infrastructure;

  public static class SecurityHeadersMiddleware
  {
      // Tech stack: React + Vite (compiled to 'self'), TailwindCSS (compiled to 'self'),
      // Shadcn/ui (compiled to 'self'), Google Material Design / Google Fonts (CDN).
      //
      // TailwindCSS and Shadcn are npm packages — they compile into your static bundle.
      // They do NOT need CDN entries. Only Google Fonts requires external sources.
      //
      // Google OAuth requires accounts.google.com in connect-src and frame-src.
      //
      // If you add chart libraries (Recharts, Chart.js, etc.) they are also npm packages
      // and compile to 'self' — no CDN entry needed.
      //
      // WARNING: Do NOT add 'unsafe-inline' to script-src — that fails the requirement.
      // Vite inlines a small script bootstrap; use a nonce or move to external chunk if needed.
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
      // NOTE on 'unsafe-inline' in style-src: this is acceptable for styles (not scripts).
      // Shadcn and Tailwind may inject inline styles at runtime; 'unsafe-inline' in style-src
      // is the standard approach and does not violate the grading requirement.

      public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
      {
          var environment = app.ApplicationServices
              .GetRequiredService<IWebHostEnvironment>();

          return app.Use(async (context, next) =>
          {
              context.Response.OnStarting(() =>
              {
                  // Skip CSP for Swagger in development
                  if (!(environment.IsDevelopment() &&
                        context.Request.Path.StartsWithSegments("/swagger")))
                  {
                      context.Response.Headers["Content-Security-Policy"] =
                          ContentSecurityPolicy;
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
  ```

- [ ] Call `app.UseSecurityHeaders()` in `Program.cs` **before** `app.UseCors()`:
  ```csharp
  app.UseSecurityHeaders();
  app.UseCors("AllowFrontend");
  app.UseHttpsRedirection();
  ```

> **CSP source notes for this stack:**
> - **TailwindCSS** — compiled to static CSS at build time → `'self'` only
> - **Shadcn/ui** — npm package, compiled → `'self'` only
> - **Lucide React** (icons) — npm package, compiled → `'self'` only
> - **Material Theme Builder JSON** — design tokens mapped into `tailwind.config.ts` at build time → no CDN, no CSP entry needed
> - **Google OAuth** — redirect flow hits `accounts.google.com` → `connect-src` + `frame-src`
> - **Chart libraries** (Recharts, Chart.js, etc.) — npm packages, compiled → `'self'` only

### Video demo requirement
Open DevTools → Network → click any page response → Response Headers tab → show `Content-Security-Policy` header with value (not a meta tag). Must be on a real response, not just shown in code.

---

## Section 8 — Availability (4 pts)

**Goal:** Site publicly accessible at lunas-project.site without VPN.

### Do Now

- [ ] Confirm Azure App Service is running and accessible at `https://lunas-project.site`
- [ ] Confirm Vercel frontend is accessible at `https://intex-ii.vercel.app` (or custom domain)
- [ ] No auth required to reach public pages (home, login, privacy policy)

### Video demo requirement
Open the URL in an incognito window. Navigate through public pages. No VPN, no login required.

---

## Section 9 — Additional Security Features (2 pts)

Pick from the list; each must be demonstrated in the video.

### 9a. Google OAuth (Third-party authentication)

**Do Now (Backend):**
- [ ] Add `Microsoft.AspNetCore.Authentication.Google` NuGet package
- [ ] Add Google config in `Program.cs`:
  ```csharp
  if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
  {
      builder.Services.AddAuthentication()
          .AddGoogle(options =>
          {
              options.ClientId = googleClientId;
              options.ClientSecret = googleClientSecret;
              options.SignInScheme = IdentityConstants.ExternalScheme;
              options.CallbackPath = "/signin-google";
          });
  }
  ```
- [ ] Read client ID/secret from config (not hardcoded):
  ```csharp
  var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
  var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
  ```
- [ ] Store secrets in user-secrets (dev) and Azure App Settings (prod)
- [ ] AuthController `/api/auth/external-login` and `/api/auth/external-callback` endpoints handle the OAuth flow

**Do When Login Page Exists (Frontend):**
- [ ] Add "Sign in with Google" button on `LoginPage.tsx`
- [ ] Button calls `GET /api/auth/external-login?provider=Google`

**Video:** Click "Sign in with Google," complete Google auth flow, land back in the app as authenticated.

---

### 9b. MFA / TOTP

**Do Now (Backend):**
- [ ] Verify `AddDefaultTokenProviders()` is included in Identity setup (enables TOTP token generation)
- [ ] Create `Backend/Controllers/MfaController.cs` with endpoints:
  - `GET /api/mfa/setup` — `[Authorize]` — returns shared key and QR code URI
  - `POST /api/mfa/enable` — `[Authorize]` — verifies TOTP code and enables 2FA
  - `POST /api/mfa/disable` — `[Authorize]` — disables 2FA for the user
  - `GET /api/mfa/status` — `[Authorize]` — returns `{ isMfaEnabled: bool }`

**Do When IS 413 Pages Exist (Frontend):**
- [ ] Create `Frontend/src/pages/ManageMFAPage.tsx`:
  - Show QR code (use a QR library like `qrcode.react`)
  - Input field for TOTP verification code
  - Enable / Disable buttons with confirmation

**Test accounts required for submission:**
- [ ] Admin account — NO MFA
- [ ] Donor account — NO MFA, linked to historical donations
- [ ] One account — WITH MFA enabled (graders verify it prompts; they won't log in)

**Video:** Navigate to MFA setup page, scan QR code in authenticator app, enter code to enable, show MFA is now required at next login.

---

### 9c. HSTS Header

Already covered in Section 2. Confirm `Strict-Transport-Security` appears in response headers.

---

### 9d. Browser-Accessible Cookie for User Setting

**Goal:** A cookie that is NOT HttpOnly (so React JS can read it) stores a user preference. This is the infrastructure; the actual UI (e.g., dark mode toggle) is added with IS 413 pages.

**Do Now (Backend):**
- [ ] Add endpoint `POST /api/preferences/theme` — `[Authorize]` — accepts `{ theme: "light" | "dark" }`, sets a non-HttpOnly cookie:
  ```csharp
  Response.Cookies.Append("user-theme", theme, new CookieOptions
  {
      HttpOnly = false,   // Must be readable by JS
      Secure = true,
      SameSite = SameSiteMode.Lax,
      Expires = DateTimeOffset.UtcNow.AddDays(365)
  });
  ```

**Do When IS 413 Pages Exist (Frontend):**
- [ ] On app load, read `document.cookie` for `user-theme` and apply the theme class
- [ ] Add a theme toggle in the header/navbar that calls `POST /api/preferences/theme`

**Video:** Toggle dark/light mode, show in Application → Cookies (DevTools) that `user-theme` cookie is set and is NOT HttpOnly.

---

### 9e. Data Sanitization / Encoding

**Goal:** Prevent XSS and injection by sanitizing incoming data and encoding rendered output.

**Do Now (Backend):**
- [ ] Add model validation attributes to all request DTOs:
  ```csharp
  [Required]
  [StringLength(200, MinimumLength = 1)]
  public string Name { get; set; } = "";
  ```
- [ ] Enable automatic model state validation (returns 400 on invalid input):
  ```csharp
  builder.Services.AddControllers()
      .ConfigureApiBehaviorOptions(options =>
      {
          // Default behavior already returns 400 — confirm it is not disabled
      });
  ```
- [ ] Confirm EF Core is used for all DB queries (parameterized by default — no raw SQL string interpolation)

**Do Now (Frontend):**
- [ ] Install DOMPurify: `npm install dompurify @types/dompurify`
- [ ] Any place user-supplied content is rendered with `dangerouslySetInnerHTML`, wrap it:
  ```tsx
  import DOMPurify from 'dompurify';
  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
  ```
- [ ] If no `dangerouslySetInnerHTML` is used (React escapes by default), document this in the video

**Video:** Show model validation rejecting a request with missing required fields (400 response). Show that React renders user content without executing scripts.

---

### 9f. Both Databases on Real DBMS (Azure SQL)

**Goal:** Identity tables and application tables both live in Azure SQL, not SQLite.

**Do Now (Backend):**
- [ ] `AppDbContext` already uses SQL Server (Azure SQL) ✓
- [ ] Do NOT add a separate SQLite connection for Identity — Identity tables go into the same `AppDbContext` (or a separate Azure SQL database)
- [ ] After updating `AppDbContext` to extend `IdentityDbContext<ApplicationUser>`, run migrations — Identity tables will be created in Azure SQL
- [ ] Verify in Azure Portal: navigate to the database and confirm `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles` tables exist

**Video:** Open Azure Portal → SQL Database → Query editor (or SSMS) → show `AspNetUsers` table exists alongside the application tables.

---

## Test Accounts Required for Submission

These must exist before the video is recorded:

| Account | Role | MFA | Notes |
|---|---|---|---|
| `admin@lunas-project.site` | Admin | No | Seeded by `AuthIdentityGenerator` at startup |
| `donor@lunas-project.site` | Donor | No | Must be linked to historical donation records |
| `mfa@lunas-project.site` | Admin or Donor | **Yes** | Graders verify MFA prompt; they won't log in |

Credentials submitted to graders via Qualtrics.

---

## Implementation Order (Suggested)

> Do these in order to avoid blocking yourself.

### Phase 1 — Do Now (No IS 413 pages needed)
1. Strip credentials from `appsettings.json` → move to `appsettings.Development.json` + Azure App Settings
2. Create `ApplicationUser.cs`, update `AppDbContext`, migrate Identity tables to Azure SQL
3. Update `Program.cs`: Identity config, password policy, cookie config, HSTS, CORS fix, Google OAuth
4. Create `AuthController.cs` (me, logout, external-login, external-callback, providers)
5. Create `MfaController.cs` (setup, enable, disable, status)
6. Create `SecurityHeadersMiddleware.cs`, call `app.UseSecurityHeaders()`
7. Create `AuthRoles.cs`, `AuthPolicies.cs`, `AuthIdentityGenerator.cs` — seed Admin/Donor roles
8. Create preferences endpoint for browser-accessible theme cookie
9. Install DOMPurify on frontend
10. Build `CookieConsentContext` + `CookieConsentBanner` with accept/reject
11. Verify `git log --all -p` has zero secrets

### Phase 2 — Do When IS 413 Pages Are Built
12. Wire `AuthContext` into frontend, build Login/Register/Logout pages
13. Add `ProtectedRoute` wrapper, protect all authenticated routes
14. Add `[Authorize]` and `[Authorize(Roles = "Admin")]` to every relevant controller
15. Add confirmation dialogs before all delete actions
16. Build `ManageMFAPage` with QR code and TOTP input
17. Add Google "Sign in with Google" button to login page
18. Add theme toggle (reads/writes browser-accessible cookie)
19. Build privacy policy page, link from every footer
20. Tighten CSP `script-src` / `style-src` once you know which CDNs are used
21. Create and verify the three test accounts

---

## IS 414 Point Checklist

| Requirement | Points | Status |
|---|---|---|
| HTTPS/TLS with valid cert | 1 pt | Pending |
| HTTP → HTTPS redirect (`UseHttpsRedirection`) | 0.5 pt | ✓ Already in Program.cs |
| ASP.NET Identity login/register/logout | 3 pts | Pending |
| Password policy stronger than defaults (14+ chars) | 1 pt | Pending |
| Protected endpoints (401/403 when unauthed) | 1 pt | Pending |
| RBAC — Admin-only CUD | 1.5 pts | Pending |
| Confirmation before delete | 1 pt | Pending |
| Credentials not in repo | 1 pt | **CRITICAL — fix before next commit** |
| Privacy policy (org-specific, in footer) | 1 pt | Pending |
| GDPR cookie consent (functional accept/reject) | 1 pt | Pending |
| CSP response header (not meta tag) | 2 pts | Pending |
| Site publicly accessible | 4 pts | Pending — verify deployment |
| Additional features (Google OAuth, MFA, HSTS, browser cookie, sanitization, real DBMS) | 2 pts | Pending |
| **Total** | **20 pts** | |
