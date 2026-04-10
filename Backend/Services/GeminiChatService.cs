using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Backend.Models;

namespace Backend.Services;

public class GeminiChatService(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<GeminiChatService> logger)
{
    private const string GeminiModel = "gemini-2.5-flash";

    private string ApiKey => configuration["Gemini:ApiKey"]
        ?? throw new InvalidOperationException("Gemini:ApiKey is not configured.");

    private string BuildUrl() =>
        $"https://generativelanguage.googleapis.com/v1beta/models/{GeminiModel}:generateContent?key={ApiKey}";

    // Call 1: classify the user's question into a structured intent.
    public async Task<IntentResult> ClassifyIntentAsync(string question, CancellationToken ct = default)
    {
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = BuildIntentPrompt(question) }
                    }
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                responseSchema = BuildIntentSchema()
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        logger.LogInformation("Gemini intent classification for: {Question}", question);

        var response = await httpClient.PostAsync(BuildUrl(), content, ct);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(ct);
        return ParseIntentResponse(responseJson);
    }

    // Call 2: generate a natural-language answer given the question and a compact data summary.
    public async Task<string> GenerateAnswerAsync(
        string question,
        string dataSummary,
        IntentResult intent,
        CancellationToken ct = default)
    {
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = BuildAnswerPrompt(question, dataSummary, intent) }
                    }
                }
            },
            generationConfig = new
            {
                maxOutputTokens = 1024
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        logger.LogInformation("Gemini answer generation for category: {Category}", intent.Category);

        var response = await httpClient.PostAsync(BuildUrl(), content, ct);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(ct);
        return ParseTextResponse(responseJson);
    }

    // Call 3: generate structured resident advice (JSON schema output — no truncation risk).
    public async Task<string> GenerateResidentAdviceAsync(
        string dataSummary,
        CancellationToken ct = default)
    {
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = BuildResidentAdvicePrompt(dataSummary) }
                    }
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                responseSchema = new
                {
                    type = "OBJECT",
                    properties = new
                    {
                        residentTag  = new { type = "STRING" },
                        riskLevel    = new { type = "STRING" },
                        concern      = new { type = "STRING" },
                        action       = new { type = "STRING" }
                    },
                    required = new[] { "residentTag", "riskLevel", "concern", "action" }
                }
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await httpClient.PostAsync(BuildUrl(), content, ct);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(ct);
        return ParseResidentAdviceResponse(responseJson);
    }

    // Call 4: structured advice for a specific donor — always includes email re-engagement action.
    public async Task<string> GenerateDonorAdviceAsync(
        string dataSummary,
        CancellationToken ct = default)
    {
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = BuildDonorAdvicePrompt(dataSummary) }
                    }
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                responseSchema = new
                {
                    type = "OBJECT",
                    properties = new
                    {
                        supporterTag = new { type = "STRING" },
                        churnRisk    = new { type = "STRING" },
                        concern      = new { type = "STRING" },
                        action       = new { type = "STRING" }
                    },
                    required = new[] { "supporterTag", "churnRisk", "concern", "action" }
                }
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await httpClient.PostAsync(BuildUrl(), content, ct);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(ct);
        return ParseDonorAdviceResponse(responseJson);
    }

    private string ParseDonorAdviceResponse(string responseJson)
    {
        try
        {
            var doc = JsonNode.Parse(responseJson);
            var text = doc?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.GetValue<string>();

            if (string.IsNullOrWhiteSpace(text))
            {
                logger.LogWarning("Gemini returned empty donor advice response.");
                return "Unable to generate advice for this donor. Please try again.";
            }

            using var parsed = JsonDocument.Parse(text);
            var root = parsed.RootElement;

            var tag     = root.TryGetProperty("supporterTag", out var t) ? t.GetString() ?? "" : "";
            var risk    = root.TryGetProperty("churnRisk",    out var r) ? r.GetString() ?? "" : "";
            var concern = root.TryGetProperty("concern",      out var c) ? c.GetString() ?? "" : "";
            var action  = root.TryGetProperty("action",       out var a) ? a.GetString() ?? "" : "";

            return $"{tag} — {risk} churn risk, {concern}.\nAction: {action} Use the **Send Email** button in the At Risk Donors tab to reach out directly.";
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Failed to parse Gemini donor advice JSON.");
            return "Unable to generate advice for this donor. Please try again.";
        }
    }

    private static string BuildDonorAdvicePrompt(string dataSummary) => $"""
        You are a donor retention assistant for Lunas, a nonprofit safehouse for girls
        in the Philippines who are survivors of trafficking and abuse.

        Using only the data below, fill in these four fields:
        - supporterTag: the supporter tag exactly as it appears in the data, e.g. [[supporter:12]]
        - churnRisk: one of Critical, High, Medium, or Low
        - concern: the single most likely reason for churn, 6 words or fewer (e.g. "lapsed giving", "no recent contact")
        - action: one specific re-engagement action, 10 words or fewer (do NOT mention email — that is added automatically)

        Donor data:
        {dataSummary}
        """;

    private static string BuildResidentAdvicePrompt(string dataSummary) => $"""
        You are a trauma-informed case assistant for Lunas, a nonprofit safehouse for girls
        in the Philippines who are survivors of trafficking and abuse.

        Using only the case data below, fill in these four fields:
        - residentTag: the resident tag exactly as it appears in the data, e.g. [[resident:39]]
        - riskLevel: one of Critical, High, Medium, or Low
        - concern: the single most pressing concern, 6 words or fewer
        - action: one specific recommended next step, 10 words or fewer, referencing actual data (social worker name, plan status, etc.)

        Case data:
        {dataSummary}
        """;

    private string ParseResidentAdviceResponse(string responseJson)
    {
        try
        {
            var doc = JsonNode.Parse(responseJson);
            var text = doc?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.GetValue<string>();

            if (string.IsNullOrWhiteSpace(text))
            {
                logger.LogWarning("Gemini returned empty resident advice response.");
                return "Unable to generate advice for this resident. Please try again.";
            }

            using var parsed = JsonDocument.Parse(text);
            var root = parsed.RootElement;

            var tag     = root.TryGetProperty("residentTag", out var t) ? t.GetString() ?? "" : "";
            var risk    = root.TryGetProperty("riskLevel",   out var r) ? r.GetString() ?? "" : "";
            var concern = root.TryGetProperty("concern",     out var c) ? c.GetString() ?? "" : "";
            var action  = root.TryGetProperty("action",      out var a) ? a.GetString() ?? "" : "";

            return $"{tag} — {risk} risk, {concern}.\nAction: {action}";
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Failed to parse Gemini resident advice JSON.");
            return "Unable to generate advice for this resident. Please try again.";
        }
    }

    private static string BuildIntentPrompt(string question) => $"""
        You are an intent classifier for a nonprofit safehouse management system called Lunas.
        Classify the staff member's question into a structured query intent.

        Question: {question}

        Valid categories:
        - resident_detail: questions asking for advice, actions, or a case summary for a specific named resident (e.g. "what can I do for Maria?", "help me with John Doe")
        - supporter_detail: questions asking for advice or recommended actions for a specific named donor or supporter (e.g. "recommended action for Kian Farah", "how do I re-engage Lea Jain?", "what should I do about this donor?")
        - resident_risk: questions about which residents are at risk, highest risk scores, vulnerable residents
        - donor_churn: questions about donors likely to stop giving, at-risk donors, lapsed donors
        - resident_list: questions about listing or finding residents (not risk-related)
        - incident_summary: questions about incidents, safety events, unresolved issues
        - safehouse_capacity: questions about safehouse occupancy, capacity, space
        - unknown: anything else

        For entityName: if the category is resident_detail or supporter_detail, extract the full name of the specific person mentioned. Null otherwise.
        For safehouseId: extract a numeric safehouse ID if mentioned (e.g. "SH01" → 1, "safehouse 2" → 2). Null if not specified.
        For limit: how many records the user wants. Default to 5 if not specified.
        For sort: "score_desc" for ranked/top queries, "date_desc" for recent queries, null otherwise.
        For metric: any specific filter mentioned (e.g. "active", "closed", "unresolved"). Null if not specified.

        Return JSON only.
        """;

    private static object BuildIntentSchema() => new
    {
        type = "OBJECT",
        properties = new
        {
            category = new { type = "STRING" },
            entityName = new { type = "STRING", nullable = true },
            safehouseId = new { type = "INTEGER", nullable = true },
            metric = new { type = "STRING", nullable = true },
            limit = new { type = "INTEGER" },
            sort = new { type = "STRING", nullable = true }
        },
        required = new[] { "category", "limit" }
    };

    private static string BuildAnswerPrompt(string question, string dataSummary, IntentResult intent)
    {
        var isListQuery = intent.Category is "resident_risk" or "donor_churn" or "resident_list"
                          or "incident_summary" or "safehouse_capacity";

        var formatInstruction = isListQuery
            ? """
              Go straight to a numbered list — no preamble or greeting.
              Each line: the [[type:id]] tag, then a brief note (risk level, score, status, etc.).
              End with one short sentence summarising the overall picture.
              """
            : "Answer in 2-4 sentences. No preamble. Be concise and professional.";

        return $"""
            You are a staff assistant for Lunas, a nonprofit safehouse for girls in the Philippines
            who are survivors of trafficking and abuse. Be warm but professional.

            {formatInstruction}

            Embed every record you mention as a [[type:id]] tag — for example [[resident:41]] or
            [[supporter:12]]. Only use IDs that appear in the records below. Do not invent IDs.
            Do not include the raw ID numbers in your prose — use only the tag.

            Question: {question}

            Relevant records:
            {dataSummary}
            """;
    }

    private IntentResult ParseIntentResponse(string responseJson)
    {
        try
        {
            var doc = JsonNode.Parse(responseJson);
            var text = doc?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.GetValue<string>();

            if (string.IsNullOrWhiteSpace(text))
            {
                logger.LogWarning("Gemini returned empty intent response.");
                return new IntentResult("unknown", null, null, 5, null);
            }

            using var parsed = JsonDocument.Parse(text);
            var root = parsed.RootElement;

            return new IntentResult(
                Category: root.TryGetProperty("category", out var cat) ? cat.GetString() ?? "unknown" : "unknown",
                SafehouseId: root.TryGetProperty("safehouseId", out var sh) && sh.ValueKind == JsonValueKind.Number
                    ? sh.GetInt32() : null,
                Metric: root.TryGetProperty("metric", out var m) && m.ValueKind == JsonValueKind.String
                    ? m.GetString() : null,
                Limit: root.TryGetProperty("limit", out var lim) && lim.ValueKind == JsonValueKind.Number
                    ? Math.Clamp(lim.GetInt32(), 1, 10) : 5,
                Sort: root.TryGetProperty("sort", out var s) && s.ValueKind == JsonValueKind.String
                    ? s.GetString() : null,
                EntityName: root.TryGetProperty("entityName", out var rn) && rn.ValueKind == JsonValueKind.String
                    ? rn.GetString() : null
            );
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Failed to parse Gemini intent JSON.");
            return new IntentResult("unknown", null, null, 5, null);
        }
    }

    private string ParseTextResponse(string responseJson)
    {
        try
        {
            var doc = JsonNode.Parse(responseJson);
            var text = doc?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.GetValue<string>();
            return text?.Trim() ?? "I wasn't able to generate a response. Please try again.";
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Failed to parse Gemini answer response.");
            return "I wasn't able to generate a response. Please try again.";
        }
    }
}
