namespace Backend.Services;

public record ScoredDonorDto(
    int SupporterId,
    string DisplayName,
    string FirstName,
    string Email,
    string EmailMasked,
    string UpgradeScore,
    decimal MonetaryAvg,
    int Frequency,
    int Recency
);

public interface IDonorScoringService
{
    Task<List<ScoredDonorDto>> GetUpgradeCandidatesAsync();
}
