using FormBuilder.Models;

namespace FormBuilder.Repositories;

public record SubmissionCreateData(
    int FormId,
    int FormVersionId,
    string SubmittedBy,
    IEnumerable<(int FieldId, string Value)> Values,
    IEnumerable<int> TaskIds);

public record SubmissionFullData(
    FormSubmission Submission,
    IEnumerable<(SubmissionValue Value, string FieldKey)> Values,
    IEnumerable<(SubmissionTask Task, string TaskName)> Tasks);

public interface ISubmissionRepository
{
    Task<SubmissionFullData> CreateAsync(SubmissionCreateData data);
    Task<SubmissionFullData?> GetByIdAsync(int submissionId);
    Task<IEnumerable<FormSubmission>> GetByFormIdAsync(int formId);
}
