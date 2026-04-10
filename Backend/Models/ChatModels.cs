namespace Backend.Models;

public record ChatRequest(string Question);

public record ChatResponse(
    string Answer,
    List<RecordReference> References
);

public record RecordReference(
    string Type,
    int Id,
    string Label,
    string Route
);

public record IntentResult(
    string Category,
    int? SafehouseId,
    string? Metric,
    int Limit,
    string? Sort,
    string? EntityName = null
);
