# Test Credentials

These accounts are seeded automatically on startup for grader use.
All accounts use the same password.

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | testadmin@lunas-project.site | super secure p@ssw0rd | No MFA |
| Donor | testdonor@lunas-project.site | super secure p@ssw0rd | No MFA |
| Staff | teststaff@lunas-project.site | super secure p@ssw0rd | MFA enabled — TOTP key printed to server console on startup |

> The TOTP key for the Staff account is printed to the backend console the first time the seed runs.
> Copy it into an authenticator app (e.g., Google Authenticator) to complete MFA logins.

## Stripe Test Card

Use these fields on the `/donate` page (test mode — no real charges):

| Field | Value |
|-------|-------|
| Card number | 4242 4242 4242 4242 |
| Expiry | 12/34 |
| CVC | 123 |
| ZIP | 10001 |
