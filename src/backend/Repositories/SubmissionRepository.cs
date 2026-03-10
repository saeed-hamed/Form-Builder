using Dapper;
using FormBuilder.DTOs;
using FormBuilder.Models;
using System.Data;

namespace FormBuilder.Repositories;

// Flat query result for SubmissionValue + FieldKey join
file class SubmissionValueRow
{
    public int SubmissionValueId { get; set; }
    public int SubmissionId { get; set; }
    public int FieldId { get; set; }
    public string Value { get; set; } = string.Empty;
    public string FieldKey { get; set; } = string.Empty;
}

// Flat query result for SubmissionTask + TaskName join
file class SubmissionTaskRow
{
    public int SubmissionTaskId { get; set; }
    public int SubmissionId { get; set; }
    public int TaskId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string TaskName { get; set; } = string.Empty;
}

public class SubmissionRepository : ISubmissionRepository
{
    private readonly IDbConnection _db;

    public SubmissionRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<SubmissionFullData> CreateAsync(SubmissionCreateData data)
    {
        if (_db.State != ConnectionState.Open) _db.Open();
        using var tx = _db.BeginTransaction();
        try
        {
            // 1. Insert submission
            var submissionId = await _db.ExecuteScalarAsync<int>("""
                INSERT INTO FormSubmissions (FormId, FormVersionId, SubmittedBy, SubmittedAt)
                VALUES (@FormId, @FormVersionId, @SubmittedBy, GETUTCDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);
                """,
                new { data.FormId, data.FormVersionId, data.SubmittedBy },
                tx);

            // 2. Insert values
            foreach (var (fieldId, value) in data.Values)
            {
                await _db.ExecuteAsync("""
                    INSERT INTO SubmissionValues (SubmissionId, FieldId, Value)
                    VALUES (@SubmissionId, @FieldId, @Value);
                    """,
                    new { SubmissionId = submissionId, FieldId = fieldId, Value = value },
                    tx);
            }

            // 3. Insert generated tasks
            foreach (var taskId in data.TaskIds)
            {
                await _db.ExecuteAsync("""
                    INSERT INTO SubmissionTasks (SubmissionId, TaskId, Status, CreatedAt)
                    VALUES (@SubmissionId, @TaskId, 'Pending', GETUTCDATE());
                    """,
                    new { SubmissionId = submissionId, TaskId = taskId },
                    tx);
            }

            tx.Commit();

            return (await GetByIdAsync(submissionId))!;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<SubmissionFullData?> GetByIdAsync(int submissionId)
    {
        var submission = await _db.QuerySingleOrDefaultAsync<FormSubmission>(
            "SELECT SubmissionId, FormId, FormVersionId, SubmittedBy, SubmittedAt FROM FormSubmissions WHERE SubmissionId = @SubmissionId",
            new { SubmissionId = submissionId });

        if (submission is null) return null;

        var valueRows = await _db.QueryAsync<SubmissionValueRow>("""
            SELECT sv.SubmissionValueId, sv.SubmissionId, sv.FieldId, sv.Value, f.FieldKey
            FROM SubmissionValues sv
            JOIN Fields f ON f.FieldId = sv.FieldId
            WHERE sv.SubmissionId = @SubmissionId
            """,
            new { SubmissionId = submissionId });

        var taskRows = await _db.QueryAsync<SubmissionTaskRow>("""
            SELECT st.SubmissionTaskId, st.SubmissionId, st.TaskId, st.Status, st.CreatedAt, st.CompletedAt, t.Name AS TaskName
            FROM SubmissionTasks st
            JOIN Tasks t ON t.TaskId = st.TaskId
            WHERE st.SubmissionId = @SubmissionId
            """,
            new { SubmissionId = submissionId });

        var values = valueRows.Select(r => (
            new SubmissionValue { SubmissionValueId = r.SubmissionValueId, SubmissionId = r.SubmissionId, FieldId = r.FieldId, Value = r.Value },
            r.FieldKey));

        var tasks = taskRows.Select(r => (
            new SubmissionTask { SubmissionTaskId = r.SubmissionTaskId, SubmissionId = r.SubmissionId, TaskId = r.TaskId, Status = r.Status, CreatedAt = r.CreatedAt, CompletedAt = r.CompletedAt },
            r.TaskName));

        return new SubmissionFullData(submission, values, tasks);
    }

    public async Task<IEnumerable<FormSubmission>> GetByFormIdAsync(int formId)
    {
        return await _db.QueryAsync<FormSubmission>(
            "SELECT SubmissionId, FormId, FormVersionId, SubmittedBy, SubmittedAt FROM FormSubmissions WHERE FormId = @FormId ORDER BY SubmittedAt DESC",
            new { FormId = formId });
    }

    public async Task<IEnumerable<FormSubmission>> GetAllAsync()
    {
        return await _db.QueryAsync<FormSubmission>(
            "SELECT fs.SubmissionId, fs.FormId, fs.FormVersionId, fs.SubmittedBy, fs.SubmittedAt FROM FormSubmissions fs ORDER BY fs.SubmittedAt DESC");
    }

    public async Task<IEnumerable<TaskBoardItemResponse>> GetAllTaskBoardAsync()
    {
        return await _db.QueryAsync<TaskBoardItemResponse>("""
            SELECT st.SubmissionTaskId, st.TaskId, t.Name AS TaskName,
                   st.Status, st.CreatedAt, st.CompletedAt, st.SubmissionId,
                   f.Title AS FormTitle, fs.SubmittedBy, fs.SubmittedAt
            FROM SubmissionTasks st
            JOIN Tasks t ON t.TaskId = st.TaskId
            JOIN FormSubmissions fs ON fs.SubmissionId = st.SubmissionId
            JOIN Forms f ON f.FormId = fs.FormId
            ORDER BY st.CreatedAt DESC
            """);
    }

    public async Task<bool> UpdateTaskStatusAsync(int submissionTaskId, string status)
    {
        var rows = await _db.ExecuteAsync("""
            UPDATE SubmissionTasks
            SET Status = @Status,
                CompletedAt = CASE WHEN @Status = 'Completed' THEN GETUTCDATE() ELSE NULL END
            WHERE SubmissionTaskId = @SubmissionTaskId
            """,
            new { SubmissionTaskId = submissionTaskId, Status = status });
        return rows > 0;
    }
}
