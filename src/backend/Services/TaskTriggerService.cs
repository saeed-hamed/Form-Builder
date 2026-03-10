using FormBuilder.DTOs;
using FormBuilder.Repositories;

namespace FormBuilder.Services;

public class TaskTriggerService : ITaskTriggerService
{
    private readonly ITaskTriggerRepository _repo;
    private readonly ITaskRepository _taskRepo;

    public TaskTriggerService(ITaskTriggerRepository repo, ITaskRepository taskRepo)
    {
        _repo = repo;
        _taskRepo = taskRepo;
    }

    public async Task<IEnumerable<TaskTriggerResponse>> GetByVersionIdAsync(int formVersionId)
    {
        var triggers = await _repo.GetByVersionIdAsync(formVersionId);
        var result = new List<TaskTriggerResponse>();
        foreach (var t in triggers)
        {
            var task = await _taskRepo.GetByIdAsync(t.TaskId);
            result.Add(new TaskTriggerResponse
            {
                TriggerId = t.TriggerId,
                FormVersionId = t.FormVersionId,
                TaskId = t.TaskId,
                TaskName = task?.Name ?? string.Empty,
                ConditionJson = t.ConditionJson
            });
        }
        return result;
    }

    public async Task<TaskTriggerResponse?> GetByIdAsync(int triggerId)
    {
        var t = await _repo.GetByIdAsync(triggerId);
        if (t is null) return null;
        var task = await _taskRepo.GetByIdAsync(t.TaskId);
        return new TaskTriggerResponse
        {
            TriggerId = t.TriggerId,
            FormVersionId = t.FormVersionId,
            TaskId = t.TaskId,
            TaskName = task?.Name ?? string.Empty,
            ConditionJson = t.ConditionJson
        };
    }

    public async Task<TaskTriggerResponse> CreateAsync(int formVersionId, CreateTaskTriggerRequest request)
    {
        var id = await _repo.CreateAsync(formVersionId, request.TaskId, request.ConditionJson);
        return (await GetByIdAsync(id))!;
    }

    public async Task<bool> DeleteAsync(int triggerId)
    {
        return await _repo.DeleteAsync(triggerId);
    }
}
