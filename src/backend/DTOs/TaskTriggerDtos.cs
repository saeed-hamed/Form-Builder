using System.ComponentModel.DataAnnotations;

namespace FormBuilder.DTOs;

public class CreateTaskTriggerRequest
{
    [Required]
    public int TaskId { get; set; }

    [Required]
    public string ConditionJson { get; set; } = string.Empty;
}

public class TaskTriggerResponse
{
    public int TriggerId { get; set; }
    public int FormVersionId { get; set; }
    public int TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public string ConditionJson { get; set; } = string.Empty;
}
