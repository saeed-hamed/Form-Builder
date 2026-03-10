using FormBuilder.DTOs;

namespace FormBuilder.Services;

public interface ISubmissionService
{
    Task<SubmissionResponse> SubmitAsync(SubmitFormRequest request);
    Task<SubmissionResponse?> GetByIdAsync(int submissionId);
    Task<IEnumerable<SubmissionResponse>> GetByFormIdAsync(int formId);
}
