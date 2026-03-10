namespace FormBuilder.Models;

public class FormVersion
{
    public int VersionId { get; set; }
    public int FormId { get; set; }
    public int VersionNumber { get; set; }
    public string DefinitionJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool Published { get; set; }
}
