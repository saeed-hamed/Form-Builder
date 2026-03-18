namespace FormBuilder.Models;

// Named TaskModel to avoid conflict with System.Threading.Tasks.Task
public class TaskModel
{
    public int TaskId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public string? Description { get; set; }
    public int? DueDays { get; set; }
}
