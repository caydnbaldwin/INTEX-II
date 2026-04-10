namespace Backend.Tests.Security;

internal static class SecuritySourceFileReader
{
    private static readonly string SolutionRoot = Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory,
        "..", "..", "..", ".."));

    public static string Read(string relativePath) =>
        File.ReadAllText(Absolute(relativePath));

    public static string Absolute(string relativePath) =>
        Path.Combine(SolutionRoot, relativePath);
}
