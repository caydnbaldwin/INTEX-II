using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class BoardingStandingOrder
{
    [Key]
    public int BoardingStandingOrderId { get; set; }
    public int BoardingPlacementId { get; set; }
    public string? Category { get; set; }
    public string? Title { get; set; }
    public string? Details { get; set; }
    public DateOnly? DueDate { get; set; }
    public string? Status { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
