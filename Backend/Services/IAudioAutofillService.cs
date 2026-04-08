namespace Backend.Services;

public interface IAudioAutofillService
{
    Task<ProcessRecordingAutofillResult> GenerateProcessRecordingAutofillAsync(
        byte[] audioBytes,
        string fileName,
        CancellationToken cancellationToken = default);
}

