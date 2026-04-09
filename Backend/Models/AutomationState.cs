namespace Backend.Models;

public class AutomationState
{
    public int Id { get; set; }
    public bool Enabled { get; set; }
    public DateTime? LastRun { get; set; }
    public int EmailsThisWeek { get; set; }
}
