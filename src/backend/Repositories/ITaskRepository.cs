using FormBuilder.Models;

namespace FormBuilder.Repositories;

public interface ITaskRepository
{
    Task<IEnumerable<TaskModel>> GetAllAsync();
    Task<TaskModel?> GetByIdAsync(int taskId);
    Task<int> CreateAsync(string name, string? description);
    Task<bool> DeleteAsync(int taskId);
}
