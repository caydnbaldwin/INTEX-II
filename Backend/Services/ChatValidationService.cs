using System.Text.RegularExpressions;
using Backend.Models;

namespace Backend.Services;

public partial class ChatValidationService
{
    // Matches [[type:id]] tags, e.g. [[resident:41]] or [[supporter:12]]
    [GeneratedRegex(@"\[\[(\w+):(\d+)\]\]")]
    private static partial Regex TagPattern();

    /// <summary>
    /// Strips any [[type:id]] tag from the answer whose ID was not in the query result set.
    /// Replaces stripped tags with their display label when available, otherwise removes them.
    /// </summary>
    public string ValidateAndStrip(string answer, List<RecordReference> validRefs)
    {
        var refLookup = validRefs.ToDictionary(
            r => $"{r.Type}:{r.Id}",
            r => r.Label);

        return TagPattern().Replace(answer, match =>
        {
            var type = match.Groups[1].Value;
            var id = match.Groups[2].Value;
            var key = $"{type}:{id}";

            // Keep the tag if the ID was in our verified query results
            return refLookup.ContainsKey(key) ? match.Value : string.Empty;
        });
    }
}
