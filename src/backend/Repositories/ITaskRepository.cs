using FormBuilder.Models;

namespace FormBuilder.Repositories;

public interface ITaskRepository
{
    Task<IEnumerable<TaskModel>> GetAllAsync();
    Task<TaskModel?> GetByIdAsync(int taskId);
    Task<int> CreateAsync(string name, string? description, int? dueDays);
    Task<bool> UpdateAsync(int taskId, string name, string? description, int? dueDays);
    Task<bool> DeleteAsync(int taskId);
}
