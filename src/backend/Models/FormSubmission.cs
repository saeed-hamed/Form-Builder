namespace FormBuilder.Models;

public class FormSubmission
{
    public int SubmissionId { get; set; }
    public int FormId { get; set; }
    public int FormVersionId { get; set; }
    public string SubmittedBy { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}
