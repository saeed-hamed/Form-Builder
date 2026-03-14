using FormBuilder.DTOs;

namespace FormBuilder.Services;

public interface ISubmissionService
{
    Task<SubmissionResponse> SubmitAsync(SubmitFormRequest request);
    Task<SubmissionResponse?> GetByIdAsync(int submissionId);
    Task<IEnumerable<SubmissionResponse>> GetByFormIdAsync(int formId);
    Task<IEnumerable<SubmissionResponse>> GetAllAsync();
    Task<IEnumerable<TaskBoardItemResponse>> GetTaskBoardAsync();
    Task<bool> UpdateTaskStatusAsync(int submissionTaskId, string status);
    Task<bool> AssignTaskAsync(int submissionTaskId, int? userId);
}
