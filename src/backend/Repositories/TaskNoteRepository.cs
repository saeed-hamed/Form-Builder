using Dapper;
using FormBuilder.Models;
using Microsoft.Data.SqlClient;

namespace FormBuilder.Repositories;

public class TaskNoteRepository : ITaskNoteRepository
{
    private readonly string _connectionString;

    public TaskNoteRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<IEnumerable<TaskNote>> GetByTaskIdAsync(int submissionTaskId)
    {
        using var conn = new SqlConnection(_connectionString);
        return await conn.QueryAsync<TaskNote>(
            "SELECT NoteId, SubmissionTaskId, Author, Body, CreatedAt " +
            "FROM TaskNotes WHERE SubmissionTaskId = @SubmissionTaskId " +
            "ORDER BY CreatedAt ASC",
            new { SubmissionTaskId = submissionTaskId });
    }

    public async Task<TaskNote> CreateAsync(TaskNote note)
    {
        using var conn = new SqlConnection(_connectionString);
        var id = await conn.ExecuteScalarAsync<int>(
            "INSERT INTO TaskNotes (SubmissionTaskId, Author, Body, CreatedAt) " +
            "VALUES (@SubmissionTaskId, @Author, @Body, GETUTCDATE()); " +
            "SELECT SCOPE_IDENTITY();",
            note);

        note.NoteId = id;
        return note;
    }
}
