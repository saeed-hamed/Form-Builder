namespace FormBuilder.Models;

public class TaskNote
{
    public int NoteId { get; set; }
    public int SubmissionTaskId { get; set; }
    public string Author { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
