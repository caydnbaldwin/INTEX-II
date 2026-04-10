# Clone Validation Smoke Checklist

## Before Schema Changes
- Generate a fresh idempotent migration artifact with `Backend/Scripts/generate_idempotent_migration.ps1`.
- Restore a production-like clone database and confirm row counts for `Residents`, `Supporters`, `Donations`, `HomeVisitations`, `ProcessRecordings`, `BoardingPlacements`, and `BoardingStandingOrders`.
- Run `Backend/Scripts/audit_data_integrity_readonly.sql` against the clone and save the output.

## Application Verification
- Run `dotnet test Backend.Tests/Backend.Tests.csproj` and confirm the CRUD/auth suite passes.
- Build the frontend with `npm.cmd run build` from `Frontend`.
- Start the backend against the clone and verify these authenticated API reads return `200` with valid JSON:
  - `/api/residents`
  - `/api/home-visitations`
  - `/api/process-recordings`
  - `/api/boarding/placements`
  - `/api/supporters`
  - `/api/donations`
  - `/api/reports/risk-distribution`

## Critical UI Smoke
- Admin login loads `/admin`.
- Staff login lands on `/admin/caseload` and does not expose donor/reporting pages.
- Caseload edit saves without wiping untouched resident fields.
- Donor edit saves without forcing `status` back to `Active`.
- Home visitation edit preserves fields not present in the modal.
- Process recording edit preserves restricted notes and other untouched fields.
- Boarding placement edit preserves notes and bed metadata when only status/dates change.

## After Additive Schema Hardening
- Re-run `Backend/Scripts/audit_data_integrity_readonly.sql` and confirm failing counts moved in the expected direction.
- Re-run the backend test suite.
- Re-run the critical UI smoke list above.
- Keep the prior application artifact ready for fast rollback if any page contract regresses.
