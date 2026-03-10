using Dapper;
using FormBuilder.Models;
using System.Data;

namespace FormBuilder.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly IDbConnection _db;

    public TaskRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<TaskModel>> GetAllAsync()
    {
        return await _db.QueryAsync<TaskModel>(
            "SELECT TaskId, Name, Description FROM Tasks ORDER BY Name");
    }

    public async Task<TaskModel?> GetByIdAsync(int taskId)
    {
        return await _db.QuerySingleOrDefaultAsync<TaskModel>(
            "SELECT TaskId, Name, Description FROM Tasks WHERE TaskId = @TaskId",
            new { TaskId = taskId });
    }

    public async Task<int> CreateAsync(string name, string? description)
    {
        return await _db.ExecuteScalarAsync<int>("""
            INSERT INTO Tasks (Name, Description) VALUES (@Name, @Description);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """,
            new { Name = name, Description = description });
    }

    public async Task<bool> DeleteAsync(int taskId)
    {
        var rows = await _db.ExecuteAsync(
            "DELETE FROM Tasks WHERE TaskId = @TaskId",
            new { TaskId = taskId });
        return rows > 0;
    }
}
