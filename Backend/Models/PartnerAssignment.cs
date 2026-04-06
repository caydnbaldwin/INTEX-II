using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class PartnerAssignment
{
    [Key]
    public int AssignmentId { get; set; }
    public int? PartnerId { get; set; }
    public int? SafehouseId { get; set; }
    public string? ProgramArea { get; set; }
    public DateOnly? AssignmentStart { get; set; }
    public DateOnly? AssignmentEnd { get; set; }
    public string? ResponsibilityNotes { get; set; }
    public bool? IsPrimary { get; set; }
    public string? Status { get; set; }
}
