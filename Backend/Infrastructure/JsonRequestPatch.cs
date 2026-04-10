using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Infrastructure;

public sealed class JsonRequestPatch<T> where T : class, new()
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly HashSet<string> _propertyNames;

    private JsonRequestPatch(T model, HashSet<string> propertyNames)
    {
        Model = model;
        _propertyNames = propertyNames;
    }

    public T Model { get; }

    public bool HasProperty(string propertyName) => _propertyNames.Contains(propertyName);

    public static bool TryParse(
        JsonElement body,
        out JsonRequestPatch<T>? patch,
        out ProblemDetails? problem)
    {
        patch = null;
        problem = null;

        try
        {
            if (body.ValueKind != JsonValueKind.Object)
            {
                problem = new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Invalid request body.",
                    Detail = "The request body must be a JSON object."
                };
                return false;
            }

            var model = JsonSerializer.Deserialize<T>(body.GetRawText(), SerializerOptions) ?? new T();
            var propertyNames = body.EnumerateObject()
                .Select(property => property.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            patch = new JsonRequestPatch<T>(model, propertyNames);
            return true;
        }
        catch (JsonException ex)
        {
            problem = new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid request body.",
                Detail = ex.Message
            };
            return false;
        }
    }
}
