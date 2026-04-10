-- Wave 2 data remediation script
-- Run this BEFORE applying the wave 2 EF migration.
-- All operations are wrapped in a single transaction so the entire
-- batch succeeds or rolls back together.
-- Review the printed row counts for each step before committing.
--
-- Safe to rerun: every UPDATE and DELETE is guarded by a WHERE clause
-- that is a no-op if the data has already been corrected.

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

PRINT '=== Wave 2 data remediation ===';
PRINT '';

-- ----------------------------------------------------------------
-- 1. Null out orphaned FK columns so the schema FK constraints
--    can be applied without violation errors.
-- ----------------------------------------------------------------

PRINT '--- 1. Orphaned FK nullification ---';

-- Residents.SafehouseId -> Safehouses
UPDATE r
SET r.SafehouseId = NULL
FROM Residents r
LEFT JOIN Safehouses s ON s.SafehouseId = r.SafehouseId
WHERE r.SafehouseId IS NOT NULL AND s.SafehouseId IS NULL;
PRINT 'Residents.SafehouseId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- Donations.SupporterId -> Supporters
UPDATE d
SET d.SupporterId = NULL
FROM Donations d
LEFT JOIN Supporters s ON s.SupporterId = d.SupporterId
WHERE d.SupporterId IS NOT NULL AND s.SupporterId IS NULL;
PRINT 'Donations.SupporterId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- DonationAllocations.DonationId -> Donations
-- (These will be CASCADE-deleted when the parent Donation is deleted,
--  but orphans that already exist need to be cleaned up first.)
DELETE a
FROM DonationAllocations a
LEFT JOIN Donations d ON d.DonationId = a.DonationId
WHERE a.DonationId IS NOT NULL AND d.DonationId IS NULL;
PRINT 'DonationAllocations orphaned rows deleted: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- DonationAllocations.SafehouseId -> Safehouses
UPDATE a
SET a.SafehouseId = NULL
FROM DonationAllocations a
LEFT JOIN Safehouses s ON s.SafehouseId = a.SafehouseId
WHERE a.SafehouseId IS NOT NULL AND s.SafehouseId IS NULL;
PRINT 'DonationAllocations.SafehouseId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- InKindDonationItems.DonationId -> Donations
-- (CASCADE on delete, so clean up existing orphans now)
DELETE i
FROM InKindDonationItems i
LEFT JOIN Donations d ON d.DonationId = i.DonationId
WHERE i.DonationId IS NOT NULL AND d.DonationId IS NULL;
PRINT 'InKindDonationItems orphaned rows deleted: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- HomeVisitations.ResidentId -> Residents
UPDATE v
SET v.ResidentId = NULL
FROM HomeVisitations v
LEFT JOIN Residents r ON r.ResidentId = v.ResidentId
WHERE v.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
PRINT 'HomeVisitations.ResidentId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- ProcessRecordings.ResidentId -> Residents
UPDATE p
SET p.ResidentId = NULL
FROM ProcessRecordings p
LEFT JOIN Residents r ON r.ResidentId = p.ResidentId
WHERE p.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
PRINT 'ProcessRecordings.ResidentId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- EducationRecords.ResidentId -> Residents
UPDATE e
SET e.ResidentId = NULL
FROM EducationRecords e
LEFT JOIN Residents r ON r.ResidentId = e.ResidentId
WHERE e.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
PRINT 'EducationRecords.ResidentId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- HealthWellbeingRecords.ResidentId -> Residents
UPDATE h
SET h.ResidentId = NULL
FROM HealthWellbeingRecords h
LEFT JOIN Residents r ON r.ResidentId = h.ResidentId
WHERE h.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
PRINT 'HealthWellbeingRecords.ResidentId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- InterventionPlans.ResidentId -> Residents
UPDATE p
SET p.ResidentId = NULL
FROM InterventionPlans p
LEFT JOIN Residents r ON r.ResidentId = p.ResidentId
WHERE p.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
PRINT 'InterventionPlans.ResidentId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- IncidentReports.ResidentId -> Residents
UPDATE i
SET i.ResidentId = NULL
FROM IncidentReports i
LEFT JOIN Residents r ON r.ResidentId = i.ResidentId
WHERE i.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
PRINT 'IncidentReports.ResidentId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- IncidentReports.SafehouseId -> Safehouses
UPDATE i
SET i.SafehouseId = NULL
FROM IncidentReports i
LEFT JOIN Safehouses s ON s.SafehouseId = i.SafehouseId
WHERE i.SafehouseId IS NOT NULL AND s.SafehouseId IS NULL;
PRINT 'IncidentReports.SafehouseId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- SafehouseMonthlyMetrics.SafehouseId -> Safehouses
UPDATE m
SET m.SafehouseId = NULL
FROM SafehouseMonthlyMetrics m
LEFT JOIN Safehouses s ON s.SafehouseId = m.SafehouseId
WHERE m.SafehouseId IS NOT NULL AND s.SafehouseId IS NULL;
PRINT 'SafehouseMonthlyMetrics.SafehouseId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- BoardingPlacements.ResidentId -> Residents (FK already exists; clean for completeness)
UPDATE p
SET p.ResidentId = NULL
FROM BoardingPlacements p
LEFT JOIN Residents r ON r.ResidentId = p.ResidentId
WHERE p.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
PRINT 'BoardingPlacements.ResidentId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- BoardingPlacements.SafehouseId -> Safehouses
UPDATE p
SET p.SafehouseId = NULL
FROM BoardingPlacements p
LEFT JOIN Safehouses s ON s.SafehouseId = p.SafehouseId
WHERE p.SafehouseId IS NOT NULL AND s.SafehouseId IS NULL;
PRINT 'BoardingPlacements.SafehouseId orphans nulled: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- BoardingStandingOrders with no matching placement (these cannot be
-- set-null because BoardingPlacementId is NOT NULL; delete instead)
DELETE o
FROM BoardingStandingOrders o
LEFT JOIN BoardingPlacements p ON p.BoardingPlacementId = o.BoardingPlacementId
WHERE p.BoardingPlacementId IS NULL;
PRINT 'BoardingStandingOrders orphaned rows deleted: ' + CAST(@@ROWCOUNT AS VARCHAR);

PRINT '';

-- ----------------------------------------------------------------
-- 2. Fix invalid enum-like string values
-- ----------------------------------------------------------------

PRINT '--- 2. Invalid enum-like value corrections ---';

-- Residents.CaseStatus: accepted values are Active, Closed, Pending Review, Transferred
-- Anything else is mapped to Pending Review as a safe default.
UPDATE Residents
SET CaseStatus = 'Pending Review'
WHERE NULLIF(LTRIM(RTRIM(CaseStatus)), '') IS NOT NULL
  AND CaseStatus NOT IN ('Active', 'Closed', 'Pending Review', 'Transferred');
PRINT 'Residents.CaseStatus invalid values corrected: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- Supporters.Status: accepted values are Active, Inactive
UPDATE Supporters
SET Status = 'Active'
WHERE NULLIF(LTRIM(RTRIM(Status)), '') IS NOT NULL
  AND Status NOT IN ('Active', 'Inactive');
PRINT 'Supporters.Status invalid values corrected: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- BoardingPlacements.PlacementStatus
UPDATE BoardingPlacements
SET PlacementStatus = 'Current'
WHERE NULLIF(LTRIM(RTRIM(PlacementStatus)), '') IS NOT NULL
  AND PlacementStatus NOT IN ('Incoming', 'Current', 'CheckedOut', 'Transferred', 'Cancelled');
PRINT 'BoardingPlacements.PlacementStatus invalid values corrected: ' + CAST(@@ROWCOUNT AS VARCHAR);

PRINT '';

-- ----------------------------------------------------------------
-- 3. Fix logical date inversions
-- ----------------------------------------------------------------

PRINT '--- 3. Date inversion fixes ---';

-- Residents where DateClosed < DateOfAdmission: clear DateClosed
-- (we cannot know the correct closed date, so we remove the bad value
--  and leave the record open for manual review)
UPDATE Residents
SET DateClosed = NULL
WHERE DateClosed IS NOT NULL
  AND DateOfAdmission IS NOT NULL
  AND DateClosed < DateOfAdmission;
PRINT 'Residents: DateClosed cleared where < DateOfAdmission: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- BoardingPlacements where ExpectedCheckOut < ExpectedCheckIn: swap them
UPDATE BoardingPlacements
SET ExpectedCheckOut = ExpectedCheckIn,
    ExpectedCheckIn  = ExpectedCheckOut
WHERE ExpectedCheckIn IS NOT NULL
  AND ExpectedCheckOut IS NOT NULL
  AND ExpectedCheckOut < ExpectedCheckIn;
PRINT 'BoardingPlacements expected dates swapped where inverted: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- BoardingPlacements where ActualCheckOut < ActualCheckIn: clear ActualCheckOut
UPDATE BoardingPlacements
SET ActualCheckOut = NULL
WHERE ActualCheckIn IS NOT NULL
  AND ActualCheckOut IS NOT NULL
  AND ActualCheckOut < ActualCheckIn;
PRINT 'BoardingPlacements: ActualCheckOut cleared where < ActualCheckIn: ' + CAST(@@ROWCOUNT AS VARCHAR);

PRINT '';

-- ----------------------------------------------------------------
-- 4. Fix semantic inconsistencies
-- ----------------------------------------------------------------

PRINT '--- 4. Semantic consistency fixes ---';

-- BoardingStandingOrders: Status = Completed but CompletedAt is NULL
-- Use UpdatedAt as best estimate; fall back to SYSUTCDATETIME()
UPDATE BoardingStandingOrders
SET CompletedAt = ISNULL(UpdatedAt, SYSUTCDATETIME())
WHERE Status = 'Completed'
  AND CompletedAt IS NULL;
PRINT 'BoardingStandingOrders.CompletedAt backfilled for Completed orders: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- Trim leading/trailing whitespace from key business identifier columns
-- to prevent duplicate detection from being fooled by invisible whitespace.
UPDATE Residents
SET InternalCode = LTRIM(RTRIM(InternalCode))
WHERE InternalCode <> LTRIM(RTRIM(InternalCode));
PRINT 'Residents.InternalCode whitespace trimmed: ' + CAST(@@ROWCOUNT AS VARCHAR);

UPDATE Residents
SET CaseControlNo = LTRIM(RTRIM(CaseControlNo))
WHERE CaseControlNo IS NOT NULL AND CaseControlNo <> LTRIM(RTRIM(CaseControlNo));
PRINT 'Residents.CaseControlNo whitespace trimmed: ' + CAST(@@ROWCOUNT AS VARCHAR);

UPDATE Supporters
SET Email = LTRIM(RTRIM(Email))
WHERE Email IS NOT NULL AND Email <> LTRIM(RTRIM(Email));
PRINT 'Supporters.Email whitespace trimmed: ' + CAST(@@ROWCOUNT AS VARCHAR);

PRINT '';

-- ----------------------------------------------------------------
-- 5. Post-remediation audit (read-only — same checks as audit script)
-- ----------------------------------------------------------------

PRINT '--- 5. Post-remediation audit counts (all should be 0) ---';

SELECT 'Residents SafehouseId orphans remaining'        AS Check_, COUNT(*) AS Remaining FROM Residents r LEFT JOIN Safehouses s ON s.SafehouseId = r.SafehouseId WHERE r.SafehouseId IS NOT NULL AND s.SafehouseId IS NULL;
SELECT 'Donations SupporterId orphans remaining'        AS Check_, COUNT(*) AS Remaining FROM Donations d LEFT JOIN Supporters s ON s.SupporterId = d.SupporterId WHERE d.SupporterId IS NOT NULL AND s.SupporterId IS NULL;
SELECT 'DonationAllocations DonationId orphans'        AS Check_, COUNT(*) AS Remaining FROM DonationAllocations a LEFT JOIN Donations d ON d.DonationId = a.DonationId WHERE a.DonationId IS NOT NULL AND d.DonationId IS NULL;
SELECT 'DonationAllocations SafehouseId orphans'       AS Check_, COUNT(*) AS Remaining FROM DonationAllocations a LEFT JOIN Safehouses s ON s.SafehouseId = a.SafehouseId WHERE a.SafehouseId IS NOT NULL AND s.SafehouseId IS NULL;
SELECT 'InKindDonationItems DonationId orphans'        AS Check_, COUNT(*) AS Remaining FROM InKindDonationItems i LEFT JOIN Donations d ON d.DonationId = i.DonationId WHERE i.DonationId IS NOT NULL AND d.DonationId IS NULL;
SELECT 'HomeVisitations ResidentId orphans'            AS Check_, COUNT(*) AS Remaining FROM HomeVisitations v LEFT JOIN Residents r ON r.ResidentId = v.ResidentId WHERE v.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
SELECT 'ProcessRecordings ResidentId orphans'          AS Check_, COUNT(*) AS Remaining FROM ProcessRecordings p LEFT JOIN Residents r ON r.ResidentId = p.ResidentId WHERE p.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
SELECT 'EducationRecords ResidentId orphans'           AS Check_, COUNT(*) AS Remaining FROM EducationRecords e LEFT JOIN Residents r ON r.ResidentId = e.ResidentId WHERE e.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
SELECT 'HealthWellbeingRecords ResidentId orphans'     AS Check_, COUNT(*) AS Remaining FROM HealthWellbeingRecords h LEFT JOIN Residents r ON r.ResidentId = h.ResidentId WHERE h.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
SELECT 'InterventionPlans ResidentId orphans'          AS Check_, COUNT(*) AS Remaining FROM InterventionPlans p LEFT JOIN Residents r ON r.ResidentId = p.ResidentId WHERE p.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
SELECT 'IncidentReports ResidentId orphans'            AS Check_, COUNT(*) AS Remaining FROM IncidentReports i LEFT JOIN Residents r ON r.ResidentId = i.ResidentId WHERE i.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
SELECT 'IncidentReports SafehouseId orphans'           AS Check_, COUNT(*) AS Remaining FROM IncidentReports i LEFT JOIN Safehouses s ON s.SafehouseId = i.SafehouseId WHERE i.SafehouseId IS NOT NULL AND s.SafehouseId IS NULL;
SELECT 'SafehouseMonthlyMetrics SafehouseId orphans'   AS Check_, COUNT(*) AS Remaining FROM SafehouseMonthlyMetrics m LEFT JOIN Safehouses s ON s.SafehouseId = m.SafehouseId WHERE m.SafehouseId IS NOT NULL AND s.SafehouseId IS NULL;
SELECT 'BoardingPlacements ResidentId orphans'         AS Check_, COUNT(*) AS Remaining FROM BoardingPlacements p LEFT JOIN Residents r ON r.ResidentId = p.ResidentId WHERE p.ResidentId IS NOT NULL AND r.ResidentId IS NULL;
SELECT 'BoardingPlacements SafehouseId orphans'        AS Check_, COUNT(*) AS Remaining FROM BoardingPlacements p LEFT JOIN Safehouses s ON s.SafehouseId = p.SafehouseId WHERE p.SafehouseId IS NOT NULL AND s.SafehouseId IS NULL;
SELECT 'BoardingStandingOrders placement orphans'      AS Check_, COUNT(*) AS Remaining FROM BoardingStandingOrders o LEFT JOIN BoardingPlacements p ON p.BoardingPlacementId = o.BoardingPlacementId WHERE p.BoardingPlacementId IS NULL;
SELECT 'Residents invalid CaseStatus'                  AS Check_, COUNT(*) AS Remaining FROM Residents WHERE NULLIF(LTRIM(RTRIM(CaseStatus)), '') IS NOT NULL AND CaseStatus NOT IN ('Active', 'Closed', 'Pending Review', 'Transferred');
SELECT 'Supporters invalid Status'                     AS Check_, COUNT(*) AS Remaining FROM Supporters WHERE NULLIF(LTRIM(RTRIM(Status)), '') IS NOT NULL AND Status NOT IN ('Active', 'Inactive');
SELECT 'BoardingPlacements invalid PlacementStatus'    AS Check_, COUNT(*) AS Remaining FROM BoardingPlacements WHERE NULLIF(LTRIM(RTRIM(PlacementStatus)), '') IS NOT NULL AND PlacementStatus NOT IN ('Incoming', 'Current', 'CheckedOut', 'Transferred', 'Cancelled');
SELECT 'Residents DateClosed < DateOfAdmission'        AS Check_, COUNT(*) AS Remaining FROM Residents WHERE DateClosed IS NOT NULL AND DateOfAdmission IS NOT NULL AND DateClosed < DateOfAdmission;
SELECT 'BoardingPlacements ActualCheckOut < CheckIn'   AS Check_, COUNT(*) AS Remaining FROM BoardingPlacements WHERE ActualCheckIn IS NOT NULL AND ActualCheckOut IS NOT NULL AND ActualCheckOut < ActualCheckIn;
SELECT 'BoardingStandingOrders Completed no timestamp' AS Check_, COUNT(*) AS Remaining FROM BoardingStandingOrders WHERE Status = 'Completed' AND CompletedAt IS NULL;

PRINT '';
PRINT '=== Remediation complete. Review all Remaining counts above. ===';
PRINT 'If all counts are 0, COMMIT; otherwise ROLLBACK and investigate.';
PRINT '';
PRINT 'To commit:   COMMIT TRANSACTION;';
PRINT 'To rollback: ROLLBACK TRANSACTION;';
