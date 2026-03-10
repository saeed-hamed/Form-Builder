namespace FormBuilder.Models;

public class TaskTrigger
{
    public int TriggerId { get; set; }
    public int FormVersionId { get; set; }
    public int TaskId { get; set; }
    public string ConditionJson { get; set; } = string.Empty;
}
