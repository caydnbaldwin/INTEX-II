namespace Backend.Models;

public class PipelineResult
{
    public int PipelineResultId { get; set; }
    public string? PipelineName { get; set; }
    public string? ResultType { get; set; }
    public int? EntityId { get; set; }
    public string? EntityType { get; set; }
    public decimal? Score { get; set; }
    public string? Label { get; set; }
    public string? DetailsJson { get; set; }
    public DateTime? GeneratedAt { get; set; }
}
