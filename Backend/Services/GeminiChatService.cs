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

    private static string BuildIntentPrompt(string question) => $"""
        You are an intent classifier for a nonprofit safehouse management system called Lunas.
        Classify the staff member's question into a structured query intent.

        Question: {question}

        Valid categories:
        - resident_risk: questions about which residents are at risk, highest risk scores, vulnerable residents
        - donor_churn: questions about donors likely to stop giving, at-risk donors, lapsed donors
        - resident_list: questions about listing or finding residents (not risk-related)
        - incident_summary: questions about incidents, safety events, unresolved issues
        - safehouse_capacity: questions about safehouse occupancy, capacity, space
        - unknown: anything else

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
                    ? s.GetString() : null
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
