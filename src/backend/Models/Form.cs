namespace FormBuilder.Models;

public class Form
{
    public int FormId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? ActiveVersionId { get; set; }
    public DateTime CreatedAt { get; set; }
}
