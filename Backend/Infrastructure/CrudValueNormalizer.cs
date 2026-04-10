namespace Backend.Infrastructure;

public static class CrudValueNormalizer
{
    public static string? NormalizeOptionalText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }
}
