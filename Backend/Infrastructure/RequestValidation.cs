using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Infrastructure;

public static class RequestValidation
{
    public static bool TryValidate(
        object model,
        out ValidationProblemDetails? problem,
        string? title = null)
    {
        var validationContext = new ValidationContext(model);
        var validationResults = new List<ValidationResult>();

        if (Validator.TryValidateObject(model, validationContext, validationResults, validateAllProperties: true))
        {
            problem = null;
            return true;
        }

        var errors = validationResults
            .SelectMany(result =>
            {
                var members = result.MemberNames.Any()
                    ? result.MemberNames
                    : [string.Empty];

                return members.Select(memberName => new
                {
                    MemberName = ToCamelCase(memberName),
                    Message = result.ErrorMessage ?? "The request is invalid."
                });
            })
            .GroupBy(entry => entry.MemberName, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.Select(entry => entry.Message).Distinct().ToArray(),
                StringComparer.OrdinalIgnoreCase);

        problem = new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = title ?? "One or more validation errors occurred."
        };

        return false;
    }

    private static string ToCamelCase(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return JsonNamingPolicy.CamelCase.ConvertName(value);
    }
}
