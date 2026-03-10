namespace FormBuilder.Models;

public class SubmissionValue
{
    public int SubmissionValueId { get; set; }
    public int SubmissionId { get; set; }
    public int FieldId { get; set; }
    public string Value { get; set; } = string.Empty;
}
