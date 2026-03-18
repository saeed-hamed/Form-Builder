using System.ComponentModel.DataAnnotations;

namespace FormBuilder.DTOs;

public class AddNoteRequest
{
    [Required]
    public string Author { get; set; } = string.Empty;

    [Required]
    public string Body { get; set; } = string.Empty;
}

public class TaskNoteResponse
{
    public int NoteId { get; set; }
    public int SubmissionTaskId { get; set; }
    public string Author { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
