using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class BoardingPlacement
{
    [Key]
    public int BoardingPlacementId { get; set; }
    public int? ResidentId { get; set; }
    public int? SafehouseId { get; set; }
    public string? PlacementStatus { get; set; }
    public string? ConfidentialResidentName { get; set; }
    public string? BedLabel { get; set; }
    public DateOnly? ExpectedCheckIn { get; set; }
    public DateOnly? ExpectedCheckOut { get; set; }
    public DateOnly? ActualCheckIn { get; set; }
    public DateOnly? ActualCheckOut { get; set; }
    public string? Sensitivities { get; set; }
    public string? SpecialConsiderations { get; set; }
    public string? RelationshipSummary { get; set; }
    public string? ChildrenSummary { get; set; }
    public string? PlacementNotes { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
