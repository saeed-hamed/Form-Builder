using System.ComponentModel.DataAnnotations;

namespace FormBuilder.DTOs;

public class CreateFormVersionRequest
{
    [Required]
    public string DefinitionJson { get; set; } = string.Empty;
}

public class FormVersionResponse
{
    public int VersionId { get; set; }
    public int FormId { get; set; }
    public int VersionNumber { get; set; }
    public string DefinitionJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool Published { get; set; }
}
