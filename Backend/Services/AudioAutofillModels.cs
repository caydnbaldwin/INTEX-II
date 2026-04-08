namespace Backend.Services;

/// <summary>
/// The structured data Gemini extracts from the audio recording.
/// All fields are nullable — Gemini may not be able to fill everything.
/// </summary>
public class ProcessRecordingAutofillResult
{
    public string? SessionDate { get; set; }           // "YYYY-MM-DD" or null
    public string? SessionType { get; set; }           // "Individual" or "Group"
    public string? EmotionalStateObserved { get; set; } // start-of-session state
    public string? EmotionalStateEnd { get; set; }     // end-of-session state
    public string? SessionNarrative { get; set; }      // 2–4 sentence summary
    public string? InterventionsApplied { get; set; }  // comma-separated techniques
    public string? FollowUpActions { get; set; }       // next steps
    public double? Confidence { get; set; }            // 0.0–1.0
    public List<string> MissingFields { get; set; } = [];
}

