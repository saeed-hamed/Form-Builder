using FormBuilder.DTOs;
using FormBuilder.Models;
using FormBuilder.Repositories;

namespace FormBuilder.Services;

public class TaskNoteService : ITaskNoteService
{
    private readonly ITaskNoteRepository _repo;

    public TaskNoteService(ITaskNoteRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<TaskNoteResponse>> GetByTaskIdAsync(int submissionTaskId)
    {
        var notes = await _repo.GetByTaskIdAsync(submissionTaskId);
        return notes.Select(Map);
    }

    public async Task<TaskNoteResponse> AddNoteAsync(int submissionTaskId, AddNoteRequest request)
    {
        var note = new TaskNote
        {
            SubmissionTaskId = submissionTaskId,
            Author = request.Author,
            Body = request.Body
        };
        var created = await _repo.CreateAsync(note);
        return Map(created);
    }

    private static TaskNoteResponse Map(TaskNote n) => new()
    {
        NoteId = n.NoteId,
        SubmissionTaskId = n.SubmissionTaskId,
        Author = n.Author,
        Body = n.Body,
        CreatedAt = n.CreatedAt
    };
}
