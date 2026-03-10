using Dapper;
using FormBuilder.Models;
using System.Data;

namespace FormBuilder.Repositories;

public class TaskTriggerRepository : ITaskTriggerRepository
{
    private readonly IDbConnection _db;

    public TaskTriggerRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<TaskTrigger>> GetByVersionIdAsync(int formVersionId)
    {
        return await _db.QueryAsync<TaskTrigger>(
            "SELECT TriggerId, FormVersionId, TaskId, ConditionJson FROM TaskTriggers WHERE FormVersionId = @FormVersionId",
            new { FormVersionId = formVersionId });
    }

    public async Task<TaskTrigger?> GetByIdAsync(int triggerId)
    {
        return await _db.QuerySingleOrDefaultAsync<TaskTrigger>(
            "SELECT TriggerId, FormVersionId, TaskId, ConditionJson FROM TaskTriggers WHERE TriggerId = @TriggerId",
            new { TriggerId = triggerId });
    }

    public async Task<int> CreateAsync(int formVersionId, int taskId, string conditionJson)
    {
        return await _db.ExecuteScalarAsync<int>("""
            INSERT INTO TaskTriggers (FormVersionId, TaskId, ConditionJson)
            VALUES (@FormVersionId, @TaskId, @ConditionJson);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """,
            new { FormVersionId = formVersionId, TaskId = taskId, ConditionJson = conditionJson });
    }

    public async Task<bool> DeleteAsync(int triggerId)
    {
        var rows = await _db.ExecuteAsync(
            "DELETE FROM TaskTriggers WHERE TriggerId = @TriggerId",
            new { TriggerId = triggerId });
        return rows > 0;
    }
}
