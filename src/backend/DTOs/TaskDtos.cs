using System.ComponentModel.DataAnnotations;

namespace FormBuilder.DTOs;

public class CreateTaskRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? NameAr { get; set; }

    public string? Description { get; set; }

    public int? DueDays { get; set; }
}

public class UpdateTaskRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? NameAr { get; set; }

    public string? Description { get; set; }

    public int? DueDays { get; set; }
}

public class TaskResponse
{
    public int TaskId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public string? Description { get; set; }
    public int? DueDays { get; set; }
}
