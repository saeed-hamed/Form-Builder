using FormBuilder.Models;

namespace FormBuilder.Repositories;

public interface ITaskTriggerRepository
{
    Task<IEnumerable<TaskTrigger>> GetByVersionIdAsync(int formVersionId);
    Task<TaskTrigger?> GetByIdAsync(int triggerId);
    Task<int> CreateAsync(int formVersionId, int taskId, string conditionJson);
    Task<bool> DeleteAsync(int triggerId);
}
