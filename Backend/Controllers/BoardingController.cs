using Backend.Data;
using Backend.Contracts;
using Backend.Infrastructure;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Backend.Controllers;

[ApiController]
[Route("api/boarding")]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
public class BoardingController(AppDbContext db) : ControllerBase
{
    private static readonly string[] HistoricalPlacementStatuses =
    [
        "CheckedOut",
        "Transferred",
        "Cancelled"
    ];

    [HttpGet("placements")]
    public async Task<IActionResult> GetPlacements(
        [FromQuery] string? status,
        [FromQuery] int? safehouseId,
        [FromQuery] int? residentId)
    {
        var query = db.BoardingPlacements.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = status.Equals("Historical", StringComparison.OrdinalIgnoreCase)
                ? query.Where(p => HistoricalPlacementStatuses.Contains(p.PlacementStatus ?? string.Empty))
                : query.Where(p => p.PlacementStatus == status);
        }

        if (safehouseId.HasValue)
            query = query.Where(p => p.SafehouseId == safehouseId);

        if (residentId.HasValue)
            query = query.Where(p => p.ResidentId == residentId);

        var placements = await query
            .OrderBy(p => p.SafehouseId)
            .ThenBy(p => p.BedLabel)
            .ThenByDescending(p => p.ExpectedCheckIn)
            .ToListAsync();

        return Ok(await BuildPlacementResponsesAsync(placements));
    }

    [HttpGet("placements/{id}")]
    public async Task<IActionResult> GetPlacementById(int id)
    {
        var placement = await db.BoardingPlacements
            .FirstOrDefaultAsync(p => p.BoardingPlacementId == id);

        if (placement is null)
            return NotFound();

        var response = (await BuildPlacementResponsesAsync([placement])).Single();
        return Ok(response);
    }

    [HttpPost("placements")]
    public async Task<IActionResult> CreatePlacement([FromBody] BoardingPlacementWriteRequest request)
    {
        if (!RequestValidation.TryValidate(request, out var validationProblem, "Unable to save boarding placement."))
            return BadRequest(validationProblem);
        if (request.SafehouseId is null)
            return BadRequest(CreateFieldProblem("safehouseId", "Safehouse is required.", "Unable to save boarding placement."));

        var placement = new BoardingPlacement();
        CrudWriteMapper.ApplyBoardingPlacement(placement, request);

        placement.BoardingPlacementId = await db.BoardingPlacements.AnyAsync()
            ? await db.BoardingPlacements.MaxAsync(p => p.BoardingPlacementId) + 1
            : 1;
        placement.PlacementStatus ??= "Incoming";
        placement.CreatedAt = DateTime.UtcNow;
        placement.UpdatedAt = placement.CreatedAt;

        db.BoardingPlacements.Add(placement);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPlacementById), new { id = placement.BoardingPlacementId }, placement);
    }

    [HttpPut("placements/{id}")]
    public async Task<IActionResult> UpdatePlacement(int id, [FromBody] JsonElement body)
    {
        if (!JsonRequestPatch<BoardingPlacementWriteRequest>.TryParse(body, out var patch, out var parseProblem))
            return BadRequest(parseProblem);
        if (!RequestValidation.TryValidate(patch!.Model, out var validationProblem, "Unable to update boarding placement."))
            return BadRequest(validationProblem);

        var existing = await db.BoardingPlacements.FindAsync(id);
        if (existing is null)
            return NotFound();

        CrudWriteMapper.ApplyBoardingPlacement(existing, patch.Model, patch);
        if (existing.SafehouseId is null)
            return BadRequest(CreateFieldProblem("safehouseId", "Safehouse is required.", "Unable to update boarding placement."));

        existing.BoardingPlacementId = id;
        existing.CreatedAt ??= DateTime.UtcNow;
        existing.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("placements/{id}")]
    public async Task<IActionResult> DeletePlacement(int id)
    {
        var placement = await db.BoardingPlacements.FindAsync(id);
        if (placement is null)
            return NotFound();

        var standingOrders = await db.BoardingStandingOrders
            .Where(o => o.BoardingPlacementId == id)
            .ToListAsync();

        if (standingOrders.Count > 0)
            db.BoardingStandingOrders.RemoveRange(standingOrders);

        db.BoardingPlacements.Remove(placement);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("placements/{id}/orders")]
    public async Task<IActionResult> GetOrdersForPlacement(int id)
    {
        var placementExists = await db.BoardingPlacements.AnyAsync(p => p.BoardingPlacementId == id);
        if (!placementExists)
            return NotFound();

        var orders = await db.BoardingStandingOrders
            .Where(o => o.BoardingPlacementId == id)
            .OrderBy(o => o.Status == "Completed")
            .ThenBy(o => o.DueDate)
            .ThenBy(o => o.Title)
            .ToListAsync();

        return Ok(orders);
    }

    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] BoardingStandingOrderWriteRequest request)
    {
        if (!RequestValidation.TryValidate(request, out var validationProblem, "Unable to save boarding order."))
            return BadRequest(validationProblem);

        var placementId = request.BoardingPlacementId ?? 0;
        var placementExists = placementId > 0
            && await db.BoardingPlacements.AnyAsync(p => p.BoardingPlacementId == placementId);
        if (!placementExists)
            return BadRequest(CreateFieldProblem("boardingPlacementId", "BoardingPlacementId is invalid.", "Unable to save boarding order."));

        var order = new BoardingStandingOrder();
        CrudWriteMapper.ApplyBoardingStandingOrder(order, request);

        order.BoardingStandingOrderId = await db.BoardingStandingOrders.AnyAsync()
            ? await db.BoardingStandingOrders.MaxAsync(o => o.BoardingStandingOrderId) + 1
            : 1;
        order.BoardingPlacementId = placementId;
        order.Status ??= "Open";
        order.CreatedAt = DateTime.UtcNow;
        order.UpdatedAt = order.CreatedAt;
        if (string.Equals(order.Status, "Completed", StringComparison.OrdinalIgnoreCase) && order.CompletedAt is null)
            order.CompletedAt = DateTime.UtcNow;

        db.BoardingStandingOrders.Add(order);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrdersForPlacement), new { id = order.BoardingPlacementId }, order);
    }

    [HttpPut("orders/{id}")]
    public async Task<IActionResult> UpdateOrder(int id, [FromBody] JsonElement body)
    {
        if (!JsonRequestPatch<BoardingStandingOrderWriteRequest>.TryParse(body, out var patch, out var parseProblem))
            return BadRequest(parseProblem);
        if (!RequestValidation.TryValidate(patch!.Model, out var validationProblem, "Unable to update boarding order."))
            return BadRequest(validationProblem);

        var existing = await db.BoardingStandingOrders.FindAsync(id);
        if (existing is null)
            return NotFound();

        var placementId = patch.HasProperty("boardingPlacementId")
            ? patch.Model.BoardingPlacementId ?? 0
            : existing.BoardingPlacementId;

        var placementExists = placementId > 0
            && await db.BoardingPlacements.AnyAsync(p => p.BoardingPlacementId == placementId);
        if (!placementExists)
            return BadRequest(CreateFieldProblem("boardingPlacementId", "BoardingPlacementId is invalid.", "Unable to update boarding order."));

        CrudWriteMapper.ApplyBoardingStandingOrder(existing, patch.Model, patch);
        existing.BoardingPlacementId = placementId;
        existing.BoardingStandingOrderId = id;
        existing.CreatedAt ??= DateTime.UtcNow;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.CompletedAt = string.Equals(existing.Status, "Completed", StringComparison.OrdinalIgnoreCase)
            ? existing.CompletedAt ?? DateTime.UtcNow
            : null;

        await db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("orders/{id}")]
    public async Task<IActionResult> DeleteOrder(int id)
    {
        var order = await db.BoardingStandingOrders.FindAsync(id);
        if (order is null)
            return NotFound();

        db.BoardingStandingOrders.Remove(order);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<List<object>> BuildPlacementResponsesAsync(List<BoardingPlacement> placements)
    {
        var residentIds = placements
            .Where(p => p.ResidentId.HasValue)
            .Select(p => p.ResidentId!.Value)
            .Distinct()
            .ToList();

        var safehouseIds = placements
            .Where(p => p.SafehouseId.HasValue)
            .Select(p => p.SafehouseId!.Value)
            .Distinct()
            .ToList();

        var placementIds = placements
            .Select(p => p.BoardingPlacementId)
            .ToList();

        var residents = await db.Residents
            .Where(r => residentIds.Contains(r.ResidentId))
            .Select(r => new
            {
                r.ResidentId,
                r.InternalCode,
                r.CaseControlNo,
                r.CaseStatus,
                r.CurrentRiskLevel,
                r.HasSpecialNeeds,
                r.SpecialNeedsDiagnosis,
                r.DateOfAdmission,
                r.DateOfBirth
            })
            .ToDictionaryAsync(r => r.ResidentId);

        var safehouses = await db.Safehouses
            .Where(s => safehouseIds.Contains(s.SafehouseId))
            .Select(s => new
            {
                s.SafehouseId,
                s.Name,
                s.Region,
                s.CapacityGirls,
                s.CurrentOccupancy
            })
            .ToDictionaryAsync(s => s.SafehouseId);

        var ordersByPlacement = (await db.BoardingStandingOrders
            .Where(o => placementIds.Contains(o.BoardingPlacementId))
            .OrderBy(o => o.Status == "Completed")
            .ThenBy(o => o.DueDate)
            .ThenBy(o => o.Title)
            .ToListAsync())
            .GroupBy(o => o.BoardingPlacementId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(o => new
                {
                    boardingStandingOrderId = o.BoardingStandingOrderId,
                    boardingPlacementId = o.BoardingPlacementId,
                    category = o.Category,
                    title = o.Title,
                    details = o.Details,
                    dueDate = o.DueDate,
                    status = o.Status,
                    createdAt = o.CreatedAt,
                    updatedAt = o.UpdatedAt,
                    completedAt = o.CompletedAt
                }).ToList());

        var incidentRecords = await db.IncidentReports
            .Where(i => i.ResidentId.HasValue && residentIds.Contains(i.ResidentId.Value))
            .OrderByDescending(i => i.IncidentDate)
            .ThenByDescending(i => i.IncidentId)
            .ToListAsync();

        var incidentsByResident = incidentRecords
            .GroupBy(i => i.ResidentId!.Value)
            .ToDictionary(
                g => g.Key,
                g => g.Select(i => new
                {
                    incidentId = i.IncidentId,
                    residentId = i.ResidentId,
                    safehouseId = i.SafehouseId,
                    incidentDate = i.IncidentDate,
                    incidentType = i.IncidentType,
                    severity = i.Severity,
                    description = i.Description,
                    responseTaken = i.ResponseTaken,
                    resolved = i.Resolved,
                    resolutionDate = i.ResolutionDate,
                    reportedBy = i.ReportedBy,
                    // Resolved incidents should never continue surfacing as action-required.
                    followUpRequired = i.Resolved == true ? false : i.FollowUpRequired,
                    assignedStaffUserId = i.AssignedStaffUserId,
                    assignedStaffDisplayName = i.AssignedStaffDisplayName
                }).ToList());

        var incidentAlertsByResident = incidentRecords
            .GroupBy(i => i.ResidentId!.Value)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var actionItems = g
                        .Where(i => i.Resolved != true)
                        .OrderByDescending(i => i.IncidentDate)
                        .ThenByDescending(i => i.IncidentId)
                        .ToList();

                    var latest = actionItems.FirstOrDefault();
                    return new
                    {
                        Count = actionItems.Count,
                        IncidentType = latest?.IncidentType,
                        IncidentDate = latest?.IncidentDate,
                        Severity = latest?.Severity,
                        RequiresFollowUp = actionItems.Any(i => i.FollowUpRequired == true),
                        HasAction = actionItems.Count > 0
                    };
                });

        return placements
            .Select(p =>
            {
                residents.TryGetValue(p.ResidentId ?? 0, out var resident);
                safehouses.TryGetValue(p.SafehouseId ?? 0, out var safehouse);
                ordersByPlacement.TryGetValue(p.BoardingPlacementId, out var standingOrders);
                incidentAlertsByResident.TryGetValue(p.ResidentId ?? 0, out var incidentAlert);
                incidentsByResident.TryGetValue(p.ResidentId ?? 0, out var incidents);

                return (object)new
                {
                    boardingPlacementId = p.BoardingPlacementId,
                    residentId = p.ResidentId,
                    residentInternalCode = resident?.InternalCode,
                    residentCaseControlNo = resident?.CaseControlNo,
                    residentCaseStatus = resident?.CaseStatus,
                    residentRiskLevel = resident?.CurrentRiskLevel,
                    residentHasSpecialNeeds = resident?.HasSpecialNeeds,
                    residentSpecialNeedsDiagnosis = resident?.SpecialNeedsDiagnosis,
                    residentDateOfAdmission = resident?.DateOfAdmission,
                    residentDateOfBirth = resident?.DateOfBirth,
                    safehouseId = p.SafehouseId,
                    safehouseName = safehouse?.Name,
                    safehouseRegion = safehouse?.Region,
                    safehouseCapacityGirls = safehouse?.CapacityGirls,
                    safehouseCurrentOccupancy = safehouse?.CurrentOccupancy,
                    placementStatus = p.PlacementStatus,
                    confidentialResidentName = p.ConfidentialResidentName,
                    bedLabel = p.BedLabel,
                    expectedCheckIn = p.ExpectedCheckIn,
                    expectedCheckOut = p.ExpectedCheckOut,
                    actualCheckIn = p.ActualCheckIn,
                    actualCheckOut = p.ActualCheckOut,
                    sensitivities = p.Sensitivities,
                    specialConsiderations = p.SpecialConsiderations,
                    relationshipSummary = p.RelationshipSummary,
                    childrenSummary = p.ChildrenSummary,
                    placementNotes = p.PlacementNotes,
                    createdAt = p.CreatedAt,
                    updatedAt = p.UpdatedAt,
                    incidentActionRequired = incidentAlert?.HasAction ?? false,
                    incidentAlertCount = incidentAlert?.Count ?? 0,
                    latestIncidentType = incidentAlert?.IncidentType,
                    latestIncidentDate = incidentAlert?.IncidentDate,
                    latestIncidentSeverity = incidentAlert?.Severity,
                    incidentFollowUpRequired = incidentAlert?.RequiresFollowUp ?? false,
                    incidents = incidents ?? [],
                    standingOrders = standingOrders ?? []
                };
            })
            .ToList();
    }

    private static ValidationProblemDetails CreateFieldProblem(string field, string message, string title) =>
        new(new Dictionary<string, string[]>
        {
            [field] = [message]
        })
        {
            Status = StatusCodes.Status400BadRequest,
            Title = title
        };
}
