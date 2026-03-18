using FormBuilder.Models;

namespace FormBuilder.Repositories;

public interface ITaskNoteRepository
{
    Task<IEnumerable<TaskNote>> GetByTaskIdAsync(int submissionTaskId);
    Task<TaskNote> CreateAsync(TaskNote note);
}
