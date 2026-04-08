using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Backend.Services;

public class AudioAutofillService(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<AudioAutofillService> logger) : IAudioAutofillService
{
    // Gemini model — Flash is fast and cheap; handles audio natively
    private const string GeminiModel = "gemini-2.5-flash";

    // Map common file extensions to MIME types Gemini accepts
    private static readonly Dictionary<string, string> MimeMap = new(StringComparer.OrdinalIgnoreCase)
    {
        [".mp3"]  = "audio/mpeg",
        [".mp4"]  = "audio/mp4",
        [".wav"]  = "audio/wav",
        [".webm"] = "audio/webm",
        [".ogg"]  = "audio/ogg",
        [".m4a"]  = "audio/mp4",
    };

    // Valid values the frontend dropdown accepts — Gemini must return one of these
    private static readonly HashSet<string> ValidSessionTypes =
        new(StringComparer.OrdinalIgnoreCase) { "Individual", "Group" };

    private static readonly HashSet<string> ValidEmotionalStates =
        new(StringComparer.OrdinalIgnoreCase)
        { "Calm", "Anxious", "Distressed", "Withdrawn", "Hopeful", "Angry", "Neutral" };

    public async Task<ProcessRecordingAutofillResult> GenerateProcessRecordingAutofillAsync(
        byte[] audioBytes,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        var apiKey = configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini:ApiKey is not configured.");

        var mimeType = ResolveMimeType(fileName);
        var audioBase64 = Convert.ToBase64String(audioBytes);

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new
                        {
                            inlineData = new
                            {
                                mimeType,
                                data = audioBase64
                            }
                        },
                        new { text = BuildPrompt() }
                    }
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                responseSchema = BuildResponseSchema()
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        var url =
            $"https://generativelanguage.googleapis.com/v1beta/models/{GeminiModel}:generateContent?key={apiKey}";

        logger.LogInformation(
            "Sending audio to Gemini ({Bytes} bytes, {MimeType})",
            audioBytes.Length,
            mimeType);

        var response = await httpClient.PostAsync(url, content, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogError("Gemini API error {Status}: {Body}", response.StatusCode, error);

            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                throw new HttpRequestException(
                    "Gemini quota exceeded",
                    null,
                    response.StatusCode);
            }

            throw new HttpRequestException($"Gemini API returned {response.StatusCode}", null, response.StatusCode);
        }

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        return ParseGeminiResponse(responseJson);
    }

    private static string BuildPrompt() => """
        You are a clinical documentation assistant for a domestic violence nonprofit shelter.
        Listen to this counseling session audio recording and extract information for a
        session notes form. Be objective, clinical, and trauma-informed.

        Extract the following fields:

        - sessionDate: The date the session took place (format YYYY-MM-DD).
          If the date is not mentioned, return null.

        - sessionType: Either "Individual" (one client) or "Group" (multiple clients).
          Default to "Individual" if unclear.

        - emotionalStateObserved: The client's emotional state at the START of the session.
          Must be exactly one of: Calm, Anxious, Distressed, Withdrawn, Hopeful, Angry, Neutral.
          Choose the closest match based on what you hear.

        - emotionalStateEnd: The client's emotional state at the END of the session.
          Must be exactly one of: Calm, Anxious, Distressed, Withdrawn, Hopeful, Angry, Neutral.

        - sessionNarrative: A brief, professional summary of the session (2–4 sentences).
          Focus on themes discussed and progress made. Do NOT include the client's name,
          identifying details, or verbatim quotes.

        - interventionsApplied: Therapeutic techniques or interventions the counselor used
          (e.g., CBT, motivational interviewing, grounding techniques, active listening,
          psychoeducation). Return as a comma-separated string. Return null if none mentioned.

        - followUpActions: Any next steps, tasks, referrals, or follow-up items discussed.
          Return as a comma-separated string or short sentence. Return null if none mentioned.

        - confidence: A number from 0.0 to 1.0 representing your overall confidence in the
          extracted data. 1.0 = very clear audio with explicit mentions of all fields.

        - missingFields: A JSON array of field names you could not confidently extract
          (e.g., ["sessionDate", "interventionsApplied"]). Empty array if all fields extracted.

        Important privacy rules:
        - Do not include client names, case numbers, addresses, or any PII in any output field.
        - The sessionNarrative should be anonymized and clinical in tone.
        """;

    private static object BuildResponseSchema() => new
    {
        type = "OBJECT",
        properties = new
        {
            sessionDate = new { type = "STRING", nullable = true },
            sessionType = new { type = "STRING", nullable = true },
            emotionalStateObserved = new { type = "STRING", nullable = true },
            emotionalStateEnd = new { type = "STRING", nullable = true },
            sessionNarrative = new { type = "STRING", nullable = true },
            interventionsApplied = new { type = "STRING", nullable = true },
            followUpActions = new { type = "STRING", nullable = true },
            confidence = new { type = "NUMBER", nullable = true },
            missingFields = new { type = "ARRAY", items = new { type = "STRING" } }
        },
        required = new[]
        {
            "sessionDate", "sessionType", "emotionalStateObserved", "emotionalStateEnd",
            "sessionNarrative", "interventionsApplied", "followUpActions",
            "confidence", "missingFields"
        }
    };

    private ProcessRecordingAutofillResult ParseGeminiResponse(string responseJson)
    {
        try
        {
            var doc = JsonNode.Parse(responseJson);

            var text = doc?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]
                ?.GetValue<string>();

            if (string.IsNullOrWhiteSpace(text))
            {
                logger.LogWarning("Gemini returned empty content.");
                return new ProcessRecordingAutofillResult { Confidence = 0 };
            }

            var result = JsonSerializer.Deserialize<ProcessRecordingAutofillResult>(
                    text,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                ?? new ProcessRecordingAutofillResult();

            if (result.SessionType is not null && !ValidSessionTypes.Contains(result.SessionType))
                result.SessionType = null;

            if (result.EmotionalStateObserved is not null &&
                !ValidEmotionalStates.Contains(result.EmotionalStateObserved))
            {
                result.EmotionalStateObserved = null;
            }

            if (result.EmotionalStateEnd is not null &&
                !ValidEmotionalStates.Contains(result.EmotionalStateEnd))
            {
                result.EmotionalStateEnd = null;
            }

            return result;
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Failed to parse Gemini JSON response.");
            return new ProcessRecordingAutofillResult { Confidence = 0 };
        }
    }

    private static string ResolveMimeType(string fileName)
    {
        var ext = Path.GetExtension(fileName);
        return MimeMap.TryGetValue(ext, out var mime) ? mime : "audio/mpeg";
    }
}

