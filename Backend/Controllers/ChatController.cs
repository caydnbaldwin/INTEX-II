using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class ChatController(
    GeminiChatService geminiChat,
    ChatQueryService queryService,
    ChatValidationService validation) : ControllerBase
{
    private const string UnknownResponse =
        "I can help with resident risk levels, donor retention, caseload summaries, " +
        "incidents, and safehouse capacity. Try asking one of those.";

    // Resident-context endpoint: skips intent classification, fetches the full case
    // bundle for the given resident, and returns a concise summary + suggested actions.
    [HttpPost("resident/{residentId:int}")]
    public async Task<IActionResult> ChatResident(int residentId, CancellationToken ct)
    {
        var (summary, refs) = await queryService.QueryResidentDetailAsync(residentId, ct);

        if (refs.Count == 0)
            return NotFound("Resident not found.");

        var rawAnswer = await geminiChat.GenerateResidentAdviceAsync(summary, ct);
        var validatedAnswer = validation.ValidateAndStrip(rawAnswer, refs);

        return Ok(new ChatResponse(validatedAnswer, refs));
    }

    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
            return BadRequest("Question is required.");

        // Short-circuit for unknown intent before any data query
        var intent = await geminiChat.ClassifyIntentAsync(request.Question, ct);

        if (intent.Category == "unknown")
            return Ok(new ChatResponse(UnknownResponse, []));

        // Run the targeted EF Core query
        var (summary, refs) = await queryService.RunQueryAsync(intent, ct);

        // If the query came back empty, tell the user rather than hallucinating
        if (refs.Count == 0)
            return Ok(new ChatResponse(
                "I found no records matching that query. The data may not be available yet.",
                []));

        // Generate natural-language answer from Gemini
        var rawAnswer = intent.Category switch
        {
            "resident_detail"  => await geminiChat.GenerateResidentAdviceAsync(summary, ct),
            "supporter_detail" => await geminiChat.GenerateDonorAdviceAsync(summary, ct),
            _                  => await geminiChat.GenerateAnswerAsync(request.Question, summary, intent, ct)
        };

        // Strip any IDs Gemini hallucinated that weren't in our result set
        var validatedAnswer = validation.ValidateAndStrip(rawAnswer, refs);

        return Ok(new ChatResponse(validatedAnswer, refs));
    }
}
