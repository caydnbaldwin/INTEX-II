using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class ChatQueryService(AppDbContext db)
{
    public async Task<(string Summary, List<RecordReference> Refs)> RunQueryAsync(
        IntentResult intent,
        CancellationToken ct = default)
    {
        return intent.Category switch
        {
            "resident_risk"    => await QueryResidentRiskAsync(intent, ct),
            "donor_churn"      => await QueryDonorChurnAsync(intent, ct),
            "resident_list"    => await QueryResidentListAsync(intent, ct),
            "incident_summary" => await QueryIncidentsAsync(intent, ct),
            "safehouse_capacity" => await QuerySafehouseCapacityAsync(intent, ct),
            _ => ("", [])
        };
    }

    private async Task<(string, List<RecordReference>)> QueryResidentRiskAsync(
        IntentResult intent, CancellationToken ct)
    {
        // Join PipelineResults (ResidentRisk) with Residents, filter by safehouse if specified.
        var pipelineQuery = db.PipelineResults
            .Where(p => p.PipelineName == "ResidentRisk" && p.ResultType == "Prediction")
            .AsQueryable();

        if (intent.SafehouseId.HasValue)
        {
            // Need to join with Residents to apply the safehouse filter.
            var safeResidentIds = await db.Residents
                .Where(r => r.SafehouseId == intent.SafehouseId)
                .Select(r => r.ResidentId)
                .ToListAsync(ct);

            pipelineQuery = pipelineQuery.Where(p => safeResidentIds.Contains(p.EntityId!.Value));
        }

        var results = await pipelineQuery
            .OrderByDescending(p => p.Score)
            .Take(intent.Limit)
            .ToListAsync(ct);

        var residentIds = results.Where(r => r.EntityId.HasValue).Select(r => r.EntityId!.Value).ToList();
        var residents = await db.Residents
            .Where(r => residentIds.Contains(r.ResidentId))
            .ToDictionaryAsync(r => r.ResidentId, ct);

        var refs = new List<RecordReference>();
        var lines = new List<string>();

        foreach (var r in results)
        {
            if (!r.EntityId.HasValue) continue;
            residents.TryGetValue(r.EntityId.Value, out var resident);
            var label = resident?.InternalCode ?? resident?.CaseControlNo ?? $"Resident {r.EntityId}";
            refs.Add(new RecordReference("resident", r.EntityId.Value, label, $"/admin/caseload?resident={r.EntityId.Value}"));
            lines.Add($"Resident [[resident:{r.EntityId}]] ({label}, SafehouseId={resident?.SafehouseId}): Score={r.Score:F2}, Label={r.Label}");
        }

        return (string.Join("\n", lines), refs);
    }

    private async Task<(string, List<RecordReference>)> QueryDonorChurnAsync(
        IntentResult intent, CancellationToken ct)
    {
        var results = await db.PipelineResults
            .Where(p => p.PipelineName == "DonorChurn" && p.ResultType == "Prediction")
            .OrderByDescending(p => p.Score)
            .Take(intent.Limit)
            .ToListAsync(ct);

        var supporterIds = results.Where(r => r.EntityId.HasValue).Select(r => r.EntityId!.Value).ToList();
        var supporters = await db.Supporters
            .Where(s => supporterIds.Contains(s.SupporterId))
            .ToDictionaryAsync(s => s.SupporterId, ct);

        var refs = new List<RecordReference>();
        var lines = new List<string>();

        foreach (var r in results)
        {
            if (!r.EntityId.HasValue) continue;
            supporters.TryGetValue(r.EntityId.Value, out var supporter);
            var label = supporter?.DisplayName ?? $"Supporter {r.EntityId}";
            refs.Add(new RecordReference("supporter", r.EntityId.Value, label, $"/admin/donors?donor={r.EntityId.Value}"));
            lines.Add($"Donor [[supporter:{r.EntityId}]] ({label}, Type={supporter?.SupporterType}, Status={supporter?.Status}): ChurnScore={r.Score:F2}, Label={r.Label}");
        }

        return (string.Join("\n", lines), refs);
    }

    private async Task<(string, List<RecordReference>)> QueryResidentListAsync(
        IntentResult intent, CancellationToken ct)
    {
        var query = db.Residents.AsQueryable();

        if (intent.SafehouseId.HasValue)
            query = query.Where(r => r.SafehouseId == intent.SafehouseId);

        if (!string.IsNullOrEmpty(intent.Metric))
        {
            // Attempt status match: "active" → "Active", "closed" → "Closed"
            var statusFilter = System.Globalization.CultureInfo.CurrentCulture.TextInfo
                .ToTitleCase(intent.Metric.ToLower());
            query = query.Where(r => r.CaseStatus == statusFilter);
        }

        var residents = await query
            .OrderBy(r => r.ResidentId)
            .Take(intent.Limit)
            .ToListAsync(ct);

        var refs = residents.Select(r =>
            new RecordReference("resident", r.ResidentId, r.InternalCode ?? r.CaseControlNo ?? $"Resident {r.ResidentId}", $"/admin/caseload?resident={r.ResidentId}")
        ).ToList();

        var lines = residents.Select(r =>
            $"Resident [[resident:{r.ResidentId}]] ({r.InternalCode ?? r.CaseControlNo}, Status={r.CaseStatus}, SafehouseId={r.SafehouseId}, RiskLevel={r.CurrentRiskLevel})"
        ).ToList();

        return (string.Join("\n", lines), refs);
    }

    private async Task<(string, List<RecordReference>)> QueryIncidentsAsync(
        IntentResult intent, CancellationToken ct)
    {
        var query = db.IncidentReports.AsQueryable();

        if (intent.SafehouseId.HasValue)
            query = query.Where(i => i.SafehouseId == intent.SafehouseId);

        // "unresolved" or default: show open incidents
        var showUnresolvedOnly = intent.Metric == null || intent.Metric.Contains("unresolved", StringComparison.OrdinalIgnoreCase);
        if (showUnresolvedOnly)
            query = query.Where(i => i.Resolved == false);

        query = intent.Sort == "date_desc"
            ? query.OrderByDescending(i => i.IncidentDate)
            : query.OrderByDescending(i => i.IncidentDate);

        var incidents = await query.Take(intent.Limit).ToListAsync(ct);

        var refs = incidents.Select(i =>
            new RecordReference("incident", i.IncidentId, $"Incident {i.IncidentId} ({i.IncidentType})", "/admin/safehouses/boarding")
        ).ToList();

        var lines = incidents.Select(i =>
            $"Incident [[incident:{i.IncidentId}]] (Type={i.IncidentType}, Severity={i.Severity}, Date={i.IncidentDate}, SafehouseId={i.SafehouseId}, Resolved={i.Resolved})"
        ).ToList();

        return (string.Join("\n", lines), refs);
    }

    private async Task<(string, List<RecordReference>)> QuerySafehouseCapacityAsync(
        IntentResult intent, CancellationToken ct)
    {
        var query = db.Safehouses.AsQueryable();

        // "near capacity" = occupancy >= 80% of capacity
        if (intent.Metric?.Contains("near", StringComparison.OrdinalIgnoreCase) == true ||
            intent.Metric?.Contains("full", StringComparison.OrdinalIgnoreCase) == true)
        {
            query = query.Where(s => s.CapacityGirls > 0 &&
                (double)(s.CurrentOccupancy ?? 0) / s.CapacityGirls!.Value >= 0.8);
        }

        var safehouses = await query
            .OrderByDescending(s => s.CurrentOccupancy)
            .Take(intent.Limit)
            .ToListAsync(ct);

        var refs = safehouses.Select(s =>
            new RecordReference("safehouse", s.SafehouseId, s.Name ?? $"Safehouse {s.SafehouseId}", "/admin/safehouses/boarding")
        ).ToList();

        var lines = safehouses.Select(s =>
            $"Safehouse [[safehouse:{s.SafehouseId}]] ({s.Name}, Occupancy={s.CurrentOccupancy}/{s.CapacityGirls})"
        ).ToList();

        return (string.Join("\n", lines), refs);
    }
}
