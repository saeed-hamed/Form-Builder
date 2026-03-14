using FormBuilder.DTOs;

namespace FormBuilder.Services;

public interface ITaskService
{
    Task<IEnumerable<TaskResponse>> GetAllAsync();
    Task<TaskResponse?> GetByIdAsync(int taskId);
    Task<TaskResponse> CreateAsync(CreateTaskRequest request);
    Task<bool> UpdateAsync(int taskId, UpdateTaskRequest request);
    Task<bool> DeleteAsync(int taskId);
}
