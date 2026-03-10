namespace FormBuilder.Models;

public class SubmissionTask
{
    public int SubmissionTaskId { get; set; }
    public int SubmissionId { get; set; }
    public int TaskId { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
