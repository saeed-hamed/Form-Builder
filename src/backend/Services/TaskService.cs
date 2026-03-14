using FormBuilder.DTOs;
using FormBuilder.Repositories;

namespace FormBuilder.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _repo;

    public TaskService(ITaskRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<TaskResponse>> GetAllAsync()
    {
        var tasks = await _repo.GetAllAsync();
        return tasks.Select(t => new TaskResponse { TaskId = t.TaskId, Name = t.Name, Description = t.Description, DueDays = t.DueDays });
    }

    public async Task<TaskResponse?> GetByIdAsync(int taskId)
    {
        var t = await _repo.GetByIdAsync(taskId);
        return t is null ? null : new TaskResponse { TaskId = t.TaskId, Name = t.Name, Description = t.Description, DueDays = t.DueDays };
    }

    public async Task<TaskResponse> CreateAsync(CreateTaskRequest request)
    {
        var id = await _repo.CreateAsync(request.Name, request.Description, request.DueDays);
        return (await GetByIdAsync(id))!;
    }

    public async Task<bool> UpdateAsync(int taskId, UpdateTaskRequest request)
        => await _repo.UpdateAsync(taskId, request.Name, request.Description, request.DueDays);

    public async Task<bool> DeleteAsync(int taskId)
    {
        return await _repo.DeleteAsync(taskId);
    }
}
