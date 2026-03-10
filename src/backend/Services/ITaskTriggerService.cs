using FormBuilder.DTOs;

namespace FormBuilder.Services;

public interface ITaskTriggerService
{
    Task<IEnumerable<TaskTriggerResponse>> GetByVersionIdAsync(int formVersionId);
    Task<TaskTriggerResponse?> GetByIdAsync(int triggerId);
    Task<TaskTriggerResponse> CreateAsync(int formVersionId, CreateTaskTriggerRequest request);
    Task<bool> DeleteAsync(int triggerId);
}
