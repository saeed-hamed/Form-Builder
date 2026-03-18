using FormBuilder.DTOs;

namespace FormBuilder.Services;

public interface ITaskNoteService
{
    Task<IEnumerable<TaskNoteResponse>> GetByTaskIdAsync(int submissionTaskId);
    Task<TaskNoteResponse> AddNoteAsync(int submissionTaskId, AddNoteRequest request);
}
