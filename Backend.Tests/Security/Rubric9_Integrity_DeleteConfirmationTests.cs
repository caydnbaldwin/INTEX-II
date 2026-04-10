namespace Backend.Tests.Security;

/// <summary>
/// IS 414 Security Rubric - Integrity (1 pt)
///
/// Backend authorization tests already verify that only authorized users can
/// modify or delete data. This class covers the remaining rubric requirement:
/// destructive UI flows must require confirmation before deletion.
/// </summary>
public class Rubric9_Integrity_DeleteConfirmationTests
{
    [Theory]
    [InlineData("Frontend\\src\\pages\\admin\\user-management.tsx", "Delete account?")]
    [InlineData("Frontend\\src\\pages\\admin\\donors.tsx", "Are you sure you want to remove")]
    [InlineData("Frontend\\src\\pages\\admin\\process-recording.tsx", "Delete Session")]
    [InlineData("Frontend\\src\\pages\\admin\\home-visitation.tsx", "Delete Visit")]
    [InlineData("Frontend\\src\\pages\\admin\\boarding.tsx", "Delete Placement")]
    [InlineData("Frontend\\src\\pages\\admin\\caseload.tsx", "Are you sure you want to remove")]
    public void Destructive_Admin_Flows_Use_Confirmation_Dialogs(
        string relativePath,
        string confirmationCopy)
    {
        var source = SecuritySourceFileReader.Read(relativePath);

        Assert.Contains("AlertDialog", source);
        Assert.Contains("AlertDialogAction", source);
        Assert.Contains("AlertDialogCancel", source);
        Assert.Contains(confirmationCopy, source, StringComparison.Ordinal);
    }

    [Fact]
    public void ProcessRecording_Delete_Warns_That_Action_Cannot_Be_Undone()
    {
        var source = SecuritySourceFileReader.Read(
            "Frontend\\src\\pages\\admin\\process-recording.tsx");

        Assert.Contains("This action cannot be undone.", source, StringComparison.Ordinal);
    }
}
