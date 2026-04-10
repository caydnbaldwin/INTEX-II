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
            "resident_detail"  => await QueryResidentByNameAsync(intent, ct),
            "supporter_detail" => await QuerySupporterByNameAsync(intent, ct),
            "resident_risk"    => await QueryResidentRiskAsync(intent, ct),
            "donor_churn"      => await QueryDonorChurnAsync(intent, ct),
            "resident_list"    => await QueryResidentListAsync(intent, ct),
            "incident_summary" => await QueryIncidentsAsync(intent, ct),
            "safehouse_capacity" => await QuerySafehouseCapacityAsync(intent, ct),
            _ => ("", [])
        };
    }

    private async Task<(string, List<RecordReference>)> QueryResidentByNameAsync(
        IntentResult intent, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(intent.EntityName))
            return ("", []);

        var name = intent.EntityName.Trim();

        var resident = await db.Residents
            .Where(r => r.InternalCode != null && EF.Functions.Like(r.InternalCode, $"%{name}%"))
            .FirstOrDefaultAsync(ct)
            ?? await db.Residents
                .Where(r => r.CaseControlNo != null && EF.Functions.Like(r.CaseControlNo, $"%{name}%"))
                .FirstOrDefaultAsync(ct);

        if (resident is null)
            return ("", []);

        return await QueryResidentDetailAsync(resident.ResidentId, ct);
    }

    private async Task<(string, List<RecordReference>)> QuerySupporterByNameAsync(
        IntentResult intent, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(intent.EntityName))
            return ("", []);

        var name = intent.EntityName.Trim();

        var supporter = await db.Supporters
            .Where(s => EF.Functions.Like(s.FirstName + " " + s.LastName, $"%{name}%")
                     || EF.Functions.Like(s.OrganizationName ?? "", $"%{name}%"))
            .FirstOrDefaultAsync(ct);

        if (supporter is null)
            return ("", []);

        return await QuerySupporterDetailAsync(supporter.SupporterId, ct);
    }

    private async Task<(string, List<RecordReference>)> QuerySupporterDetailAsync(
        int supporterId,
        CancellationToken ct = default)
    {
        var supporter = await db.Supporters.FindAsync([supporterId], ct);
        if (supporter is null)
            return ("Supporter not found.", []);

        var label = supporter.DisplayName ?? $"Supporter {supporterId}";
        var refs = new List<RecordReference>
        {
            new("supporter", supporterId, label, $"/admin/donors?donor={supporterId}")
        };

        var churn = await db.PipelineResults
            .Where(p => p.PipelineName == "DonorChurn" && p.ResultType == "Prediction" && p.EntityId == supporterId)
            .OrderByDescending(p => p.GeneratedAt)
            .FirstOrDefaultAsync(ct);

        var lines = new List<string>
        {
            $"Supporter [[supporter:{supporterId}]] ({label})",
            $"Type: {supporter.SupporterType ?? "—"} | Status: {supporter.Status ?? "—"}",
            $"Email: {(string.IsNullOrWhiteSpace(supporter.Email) ? "None on file" : supporter.Email)}"
        };

        if (churn is not null)
            lines.Add($"Churn Score: {churn.Score:F2} ({churn.Label})");

        return (string.Join("\n", lines), refs);
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

    /// <summary>
    /// Fetches the full case bundle for a single resident: demographic data,
    /// latest intervention plan, last two process recordings, most recent home
    /// visitation, and ML pipeline scores. Used for the "Ask AI about this resident"
    /// flow where the caller already knows the resident ID.
    /// </summary>
    public async Task<(string Summary, List<RecordReference> Refs)> QueryResidentDetailAsync(
        int residentId,
        CancellationToken ct = default)
    {
        var resident = await db.Residents.FindAsync([residentId], ct);
        if (resident is null)
            return ("Resident not found.", []);

        var label = resident.InternalCode ?? resident.CaseControlNo ?? $"Resident {residentId}";
        var refs = new List<RecordReference>
        {
            new("resident", residentId, label, $"/admin/caseload?resident={residentId}")
        };

        var lines = new List<string>();

        // Core demographics
        var subcats = new List<string>();
        if (resident.SubCatTrafficked == true)    subcats.Add("Trafficked");
        if (resident.SubCatPhysicalAbuse == true)  subcats.Add("Physical Abuse");
        if (resident.SubCatSexualAbuse == true)    subcats.Add("Sexual Abuse");
        if (resident.SubCatChildLabor == true)     subcats.Add("Child Labor");
        if (resident.SubCatOrphaned == true)       subcats.Add("Orphaned");
        if (resident.SubCatAtRisk == true)         subcats.Add("At Risk");

        lines.Add($"Resident [[resident:{residentId}]] ({label})");
        lines.Add($"Category: {resident.CaseCategory ?? "Unknown"}" +
                  (subcats.Count > 0 ? $" | Sub-categories: {string.Join(", ", subcats)}" : ""));
        lines.Add($"Status: {resident.CaseStatus ?? "Unknown"} | Risk Level: {resident.CurrentRiskLevel ?? "Unknown"}");
        lines.Add($"Assigned Social Worker: {resident.AssignedSocialWorker ?? "Unassigned"}");
        lines.Add($"Reintegration: {resident.ReintegrationType ?? "—"} ({resident.ReintegrationStatus ?? "Not Started"})");
        if (resident.HasSpecialNeeds == true)
            lines.Add($"Special Needs: {resident.SpecialNeedsDiagnosis ?? "Yes"}");

        // ML risk score
        var mlRisk = await db.PipelineResults
            .Where(p => p.PipelineName == "ResidentRisk" && p.ResultType == "Prediction" && p.EntityId == residentId)
            .OrderByDescending(p => p.GeneratedAt)
            .FirstOrDefaultAsync(ct);
        if (mlRisk is not null)
            lines.Add($"ML Risk Score: {mlRisk.Score:F2} ({mlRisk.Label})");

        // Latest intervention plan
        var plan = await db.InterventionPlans
            .Where(p => p.ResidentId == residentId)
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .FirstOrDefaultAsync(ct);
        if (plan is not null)
        {
            lines.Add($"Intervention Plan: {plan.PlanCategory ?? "—"} | Status: {plan.Status ?? "—"}");
            if (!string.IsNullOrWhiteSpace(plan.ServicesProvided))
                lines.Add($"Services: {plan.ServicesProvided}");
            if (plan.CaseConferenceDate.HasValue)
                lines.Add($"Next Case Conference: {plan.CaseConferenceDate}");
        }

        // Last two process recordings
        var recordings = await db.ProcessRecordings
            .Where(r => r.ResidentId == residentId)
            .OrderByDescending(r => r.SessionDate)
            .Take(2)
            .ToListAsync(ct);
        foreach (var rec in recordings)
        {
            lines.Add($"Session ({rec.SessionDate}): {rec.EmotionalStateObserved}→{rec.EmotionalStateEnd}" +
                      (rec.ConcernsFlagged == true ? " [Concerns flagged]" : "") +
                      (rec.ProgressNoted == true ? " [Progress noted]" : ""));
            if (!string.IsNullOrWhiteSpace(rec.FollowUpActions))
                lines.Add($"  Follow-up: {rec.FollowUpActions}");
        }

        // Most recent home visitation
        var visit = await db.HomeVisitations
            .Where(v => v.ResidentId == residentId)
            .OrderByDescending(v => v.VisitDate)
            .FirstOrDefaultAsync(ct);
        if (visit is not null)
        {
            lines.Add($"Last Home Visit ({visit.VisitDate}): Outcome={visit.VisitOutcome ?? "—"}" +
                      (visit.SafetyConcernsNoted == true ? " [Safety concerns noted]" : "") +
                      (visit.FollowUpNeeded == true ? " [Follow-up needed]" : ""));
        }

        return (string.Join("\n", lines), refs);
    }
}
