using System.ComponentModel.DataAnnotations;

namespace FormBuilder.DTOs;

public class SubmitFormRequest
{
    [Required]
    public int FormId { get; set; }

    [Required]
    public int FormVersionId { get; set; }

    [Required]
    public string SubmittedBy { get; set; } = string.Empty;

    [Required]
    public List<SubmissionValueInput> Values { get; set; } = new();
}

public class SubmissionValueInput
{
    [Required]
    public int FieldId { get; set; }

    public string Value { get; set; } = string.Empty;
}

public class SubmissionValueResponse
{
    public int SubmissionValueId { get; set; }
    public int FieldId { get; set; }
    public string FieldKey { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class SubmissionTaskResponse
{
    public int SubmissionTaskId { get; set; }
    public int TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class SubmissionResponse
{
    public int SubmissionId { get; set; }
    public int FormId { get; set; }
    public int FormVersionId { get; set; }
    public string SubmittedBy { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public List<SubmissionValueResponse> Values { get; set; } = new();
    public List<SubmissionTaskResponse> GeneratedTasks { get; set; } = new();
}

public class TaskBoardItemResponse
{
    public int SubmissionTaskId { get; set; }
    public int TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public string? TaskNameAr { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int SubmissionId { get; set; }
    public string FormTitle { get; set; } = string.Empty;
    public string SubmittedBy { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime? DueDate { get; set; }
}

public class UpdateTaskStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}

public class AssignTaskRequest
{
    public int? UserId { get; set; }
}

