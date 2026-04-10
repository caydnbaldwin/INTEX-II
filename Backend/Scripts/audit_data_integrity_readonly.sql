SET NOCOUNT ON;

PRINT 'Lunas data integrity audit (read-only)';

SELECT 'Residents missing internal code' AS AuditCheck, COUNT(*) AS FailingRows
FROM Residents
WHERE NULLIF(LTRIM(RTRIM(InternalCode)), '') IS NULL;

SELECT 'Residents missing case status' AS AuditCheck, COUNT(*) AS FailingRows
FROM Residents
WHERE NULLIF(LTRIM(RTRIM(CaseStatus)), '') IS NULL;

SELECT 'Residents duplicate internal code' AS AuditCheck, COUNT(*) AS DuplicateGroups
FROM (
    SELECT InternalCode
    FROM Residents
    WHERE NULLIF(LTRIM(RTRIM(InternalCode)), '') IS NOT NULL
    GROUP BY InternalCode
    HAVING COUNT(*) > 1
) duplicates;

SELECT 'Residents duplicate case control number' AS AuditCheck, COUNT(*) AS DuplicateGroups
FROM (
    SELECT CaseControlNo
    FROM Residents
    WHERE NULLIF(LTRIM(RTRIM(CaseControlNo)), '') IS NOT NULL
    GROUP BY CaseControlNo
    HAVING COUNT(*) > 1
) duplicates;

SELECT 'Residents invalid case status' AS AuditCheck, COUNT(*) AS FailingRows
FROM Residents
WHERE NULLIF(LTRIM(RTRIM(CaseStatus)), '') IS NOT NULL
  AND CaseStatus NOT IN ('Active', 'Closed', 'Pending Review');

SELECT 'Residents safehouse reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM Residents r
LEFT JOIN Safehouses s ON s.SafehouseId = r.SafehouseId
WHERE r.SafehouseId IS NOT NULL
  AND s.SafehouseId IS NULL;

SELECT 'Residents closed before admission' AS AuditCheck, COUNT(*) AS FailingRows
FROM Residents
WHERE DateClosed IS NOT NULL
  AND DateOfAdmission IS NOT NULL
  AND DateClosed < DateOfAdmission;

SELECT 'Supporters duplicate email' AS AuditCheck, COUNT(*) AS DuplicateGroups
FROM (
    SELECT Email
    FROM Supporters
    WHERE NULLIF(LTRIM(RTRIM(Email)), '') IS NOT NULL
    GROUP BY Email
    HAVING COUNT(*) > 1
) duplicates;

SELECT 'Supporters invalid status' AS AuditCheck, COUNT(*) AS FailingRows
FROM Supporters
WHERE NULLIF(LTRIM(RTRIM(Status)), '') IS NOT NULL
  AND Status NOT IN ('Active', 'Inactive');

SELECT 'Donations supporter reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM Donations d
LEFT JOIN Supporters s ON s.SupporterId = d.SupporterId
WHERE d.SupporterId IS NOT NULL
  AND s.SupporterId IS NULL;

SELECT 'Donation allocations donation reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM DonationAllocations a
LEFT JOIN Donations d ON d.DonationId = a.DonationId
WHERE a.DonationId IS NOT NULL
  AND d.DonationId IS NULL;

SELECT 'In-kind donation items donation reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM InKindDonationItems i
LEFT JOIN Donations d ON d.DonationId = i.DonationId
WHERE i.DonationId IS NOT NULL
  AND d.DonationId IS NULL;

SELECT 'Home visitations resident reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM HomeVisitations v
LEFT JOIN Residents r ON r.ResidentId = v.ResidentId
WHERE v.ResidentId IS NOT NULL
  AND r.ResidentId IS NULL;

SELECT 'Process recordings resident reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM ProcessRecordings p
LEFT JOIN Residents r ON r.ResidentId = p.ResidentId
WHERE p.ResidentId IS NOT NULL
  AND r.ResidentId IS NULL;

SELECT 'Education records resident reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM EducationRecords e
LEFT JOIN Residents r ON r.ResidentId = e.ResidentId
WHERE e.ResidentId IS NOT NULL
  AND r.ResidentId IS NULL;

SELECT 'Health records resident reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM HealthWellbeingRecords h
LEFT JOIN Residents r ON r.ResidentId = h.ResidentId
WHERE h.ResidentId IS NOT NULL
  AND r.ResidentId IS NULL;

SELECT 'Intervention plans resident reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM InterventionPlans p
LEFT JOIN Residents r ON r.ResidentId = p.ResidentId
WHERE p.ResidentId IS NOT NULL
  AND r.ResidentId IS NULL;

SELECT 'Incident reports resident reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM IncidentReports i
LEFT JOIN Residents r ON r.ResidentId = i.ResidentId
WHERE i.ResidentId IS NOT NULL
  AND r.ResidentId IS NULL;

SELECT 'Incident reports safehouse reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM IncidentReports i
LEFT JOIN Safehouses s ON s.SafehouseId = i.SafehouseId
WHERE i.SafehouseId IS NOT NULL
  AND s.SafehouseId IS NULL;

SELECT 'Boarding placements resident reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM BoardingPlacements p
LEFT JOIN Residents r ON r.ResidentId = p.ResidentId
WHERE p.ResidentId IS NOT NULL
  AND r.ResidentId IS NULL;

SELECT 'Boarding placements safehouse reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM BoardingPlacements p
LEFT JOIN Safehouses s ON s.SafehouseId = p.SafehouseId
WHERE p.SafehouseId IS NOT NULL
  AND s.SafehouseId IS NULL;

SELECT 'Boarding placements invalid placement status' AS AuditCheck, COUNT(*) AS FailingRows
FROM BoardingPlacements
WHERE NULLIF(LTRIM(RTRIM(PlacementStatus)), '') IS NOT NULL
  AND PlacementStatus NOT IN ('Incoming', 'Current', 'CheckedOut', 'Transferred', 'Cancelled');

SELECT 'Boarding placements expected checkout before expected checkin' AS AuditCheck, COUNT(*) AS FailingRows
FROM BoardingPlacements
WHERE ExpectedCheckIn IS NOT NULL
  AND ExpectedCheckOut IS NOT NULL
  AND ExpectedCheckOut < ExpectedCheckIn;

SELECT 'Boarding placements actual checkout before actual checkin' AS AuditCheck, COUNT(*) AS FailingRows
FROM BoardingPlacements
WHERE ActualCheckIn IS NOT NULL
  AND ActualCheckOut IS NOT NULL
  AND ActualCheckOut < ActualCheckIn;

SELECT 'Boarding standing orders missing placement parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM BoardingStandingOrders o
LEFT JOIN BoardingPlacements p ON p.BoardingPlacementId = o.BoardingPlacementId
WHERE p.BoardingPlacementId IS NULL;

SELECT 'Boarding standing orders completed without completion timestamp' AS AuditCheck, COUNT(*) AS FailingRows
FROM BoardingStandingOrders
WHERE Status = 'Completed'
  AND CompletedAt IS NULL;

SELECT 'Safehouse monthly metrics safehouse reference missing parent' AS AuditCheck, COUNT(*) AS FailingRows
FROM SafehouseMonthlyMetrics m
LEFT JOIN Safehouses s ON s.SafehouseId = m.SafehouseId
WHERE m.SafehouseId IS NOT NULL
  AND s.SafehouseId IS NULL;

SELECT TOP 50
    r.ResidentId,
    r.InternalCode,
    r.CaseControlNo,
    r.SafehouseId,
    r.CaseStatus,
    r.DateOfAdmission,
    r.DateClosed
FROM Residents r
WHERE NULLIF(LTRIM(RTRIM(r.InternalCode)), '') IS NULL
   OR NULLIF(LTRIM(RTRIM(r.CaseStatus)), '') IS NULL
   OR (r.DateClosed IS NOT NULL AND r.DateOfAdmission IS NOT NULL AND r.DateClosed < r.DateOfAdmission)
ORDER BY r.ResidentId;
