# Auth Fix — Cookie-Based Login

## Problem

The frontend expects cookie-based auth (`credentials: 'include'` on every fetch), but the backend's `MapIdentityApi` returns a **Bearer token** by default. The token is never stored, so all subsequent API calls go out unauthenticated and return 401.

## Root Cause

`MapIdentityApi<ApplicationUser>()` in Program.cs (line 154) supports both cookies and tokens. By default it returns tokens. To get cookies, the login request must include `?useCookies=true`.

## Fix

### 1. Frontend: Add `?useCookies=true` to login URL

**File:** `Frontend/src/lib/authApi.ts`, line 17

```diff
- const res = await fetch(`${API}/api/auth/login`, {
+ const res = await fetch(`${API}/api/auth/login?useCookies=true`, {
```

That's the only code change needed. The backend already has cookie middleware configured.

### 2. Clear Preview Mode

The "Preview as Admin" button sets `sessionStorage.devBypass = 'true'`, which bypasses frontend auth checks but doesn't actually authenticate with the backend. Anyone testing needs to:

1. Open browser DevTools → Application → Session Storage
2. Delete the `devBypass` key
3. Log in with real credentials

### 3. Test Admin Credentials

- **Email:** `testadmin@lunas-project.site`
- **Password:** `super secure p@ssw0rd`

This account exists in Azure SQL and has the Admin role assigned. The original `admin@lunas-project.site` account has an unknown password — it was created during an earlier deployment.

### 4. CORS

CORS is already configured in Program.cs (lines 88-101) to allow `http://localhost:4200` with `AllowCredentials()`. No changes needed there.

### 5. How to verify it works

```bash
# This should return a Set-Cookie header with .AspNetCore.Identity.Application
curl -sk -X POST 'https://localhost:5200/api/auth/login?useCookies=true' \
  -H 'Content-Type: application/json' \
  -d '{"email":"testadmin@lunas-project.site","password":"super secure p@ssw0rd"}' \
  -c -

# Then use the cookie to hit an admin endpoint
curl -sk https://localhost:5200/api/safehouses/occupancy \
  -b '.AspNetCore.Identity.Application=<cookie-value>'
```

### 6. Optional cleanup

- Delete the old admin account that nobody knows the password for:
  ```sql
  DELETE FROM AspNetUserRoles WHERE UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'admin@lunas-project.site');
  DELETE FROM AspNetUsers WHERE Email = 'admin@lunas-project.site';
  ```
- Consider removing or hiding the "Preview as Admin" button in `Frontend/src/pages/login.tsx` (lines 238-265) before submission, since it bypasses auth and shows broken data.
