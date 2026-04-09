SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

DECLARE @BasePlacementId INT = ISNULL(
    (SELECT MAX(BoardingPlacementId) FROM BoardingPlacements),
    0
);

WITH SourceRows AS (
    SELECT
        r.ResidentId,
        r.SafehouseId,
        CASE
            WHEN r.CaseStatus = 'Transferred' THEN 'Transferred'
            WHEN r.CaseStatus = 'Closed' THEN 'CheckedOut'
            ELSE 'Current'
        END AS PlacementStatus,
        r.DateOfAdmission,
        r.DateClosed,
        ROW_NUMBER() OVER (ORDER BY r.ResidentId) AS RowNum
    FROM Residents r
    WHERE r.SafehouseId IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM BoardingPlacements bp
          WHERE bp.ResidentId = r.ResidentId
      )
)
INSERT INTO BoardingPlacements (
    BoardingPlacementId,
    ResidentId,
    SafehouseId,
    PlacementStatus,
    ConfidentialResidentName,
    BedLabel,
    ExpectedCheckIn,
    ExpectedCheckOut,
    ActualCheckIn,
    ActualCheckOut,
    Sensitivities,
    SpecialConsiderations,
    RelationshipSummary,
    ChildrenSummary,
    PlacementNotes,
    CreatedAt,
    UpdatedAt
)
SELECT
    @BasePlacementId + RowNum,
    ResidentId,
    SafehouseId,
    PlacementStatus,
    NULL,
    NULL,
    DateOfAdmission,
    CASE
        WHEN PlacementStatus IN ('CheckedOut', 'Transferred') THEN DateClosed
        ELSE NULL
    END,
    DateOfAdmission,
    CASE
        WHEN PlacementStatus IN ('CheckedOut', 'Transferred') THEN DateClosed
        ELSE NULL
    END,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    SYSUTCDATETIME(),
    SYSUTCDATETIME()
FROM SourceRows;

COMMIT TRANSACTION;

SELECT COUNT(*) AS BoardingPlacementsCount
FROM BoardingPlacements;

SELECT PlacementStatus, COUNT(*) AS PlacementCount
FROM BoardingPlacements
GROUP BY PlacementStatus
ORDER BY PlacementCount DESC, PlacementStatus;
