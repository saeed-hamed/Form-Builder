using FormBuilder.DTOs;
using FormBuilder.Repositories;
using FormBuilder.Services.RuleEngine;

namespace FormBuilder.Services;

public class SubmissionService : ISubmissionService
{
    private readonly ISubmissionRepository _submissionRepo;
    private readonly IFormRepository _formRepo;
    private readonly IFieldRepository _fieldRepo;
    private readonly ITaskTriggerRepository _triggerRepo;
    private readonly IRuleEngine _ruleEngine;

    public SubmissionService(
        ISubmissionRepository submissionRepo,
        IFormRepository formRepo,
        IFieldRepository fieldRepo,
        ITaskTriggerRepository triggerRepo,
        IRuleEngine ruleEngine)
    {
        _submissionRepo = submissionRepo;
        _formRepo = formRepo;
        _fieldRepo = fieldRepo;
        _triggerRepo = triggerRepo;
        _ruleEngine = ruleEngine;
    }

    public async Task<SubmissionResponse> SubmitAsync(SubmitFormRequest request)
    {
        // Load all fields for this version to build the fieldKey → value map
        var fields = (await _fieldRepo.GetByVersionIdAsync(request.FormVersionId))
            .ToDictionary(f => f.FieldId, f => f.FieldKey);

        // Build fieldKey → submitted value map for rule engine
        var fieldValues = request.Values
            .Where(v => fields.ContainsKey(v.FieldId))
            .ToDictionary(v => fields[v.FieldId], v => v.Value);

        // Evaluate task triggers
        var triggers = await _triggerRepo.GetByVersionIdAsync(request.FormVersionId);
        var matchedTaskIds = _ruleEngine.EvaluateTriggers(triggers, fieldValues);

        // Persist submission + values + tasks in a single transaction
        var values = request.Values.Select(v => (v.FieldId, v.Value));
        var result = await _submissionRepo.CreateAsync(new SubmissionCreateData(
            request.FormId,
            request.FormVersionId,
            request.SubmittedBy,
            values,
            matchedTaskIds));

        return MapToResponse(result);
    }

    public async Task<SubmissionResponse?> GetByIdAsync(int submissionId)
    {
        var result = await _submissionRepo.GetByIdAsync(submissionId);
        return result is null ? null : MapToResponse(result);
    }

    public async Task<IEnumerable<SubmissionResponse>> GetByFormIdAsync(int formId)
    {
        var submissions = await _submissionRepo.GetByFormIdAsync(formId);
        var result = new List<SubmissionResponse>();
        foreach (var s in submissions)
        {
            var full = await _submissionRepo.GetByIdAsync(s.SubmissionId);
            if (full is not null) result.Add(MapToResponse(full));
        }
        return result;
    }

    public async Task<IEnumerable<SubmissionResponse>> GetAllAsync()
    {
        var submissions = await _submissionRepo.GetAllAsync();
        var result = new List<SubmissionResponse>();
        foreach (var s in submissions)
        {
            var full = await _submissionRepo.GetByIdAsync(s.SubmissionId);
            if (full is not null) result.Add(MapToResponse(full));
        }
        return result;
    }

    public Task<IEnumerable<TaskBoardItemResponse>> GetTaskBoardAsync()
        => _submissionRepo.GetAllTaskBoardAsync();

    public Task<bool> UpdateTaskStatusAsync(int submissionTaskId, string status)
        => _submissionRepo.UpdateTaskStatusAsync(submissionTaskId, status);

    private static SubmissionResponse MapToResponse(SubmissionFullData data) => new()
    {
        SubmissionId = data.Submission.SubmissionId,
        FormId = data.Submission.FormId,
        FormVersionId = data.Submission.FormVersionId,
        SubmittedBy = data.Submission.SubmittedBy,
        SubmittedAt = data.Submission.SubmittedAt,
        Values = data.Values.Select(v => new SubmissionValueResponse
        {
            SubmissionValueId = v.Value.SubmissionValueId,
            FieldId = v.Value.FieldId,
            FieldKey = v.FieldKey,
            Value = v.Value.Value
        }).ToList(),
        GeneratedTasks = data.Tasks.Select(t => new SubmissionTaskResponse
        {
            SubmissionTaskId = t.Task.SubmissionTaskId,
            TaskId = t.Task.TaskId,
            TaskName = t.TaskName,
            Status = t.Task.Status,
            CreatedAt = t.Task.CreatedAt
        }).ToList()
    };
}
