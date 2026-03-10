using System.ComponentModel.DataAnnotations;

namespace FormBuilder.DTOs;

public class CreateFieldRequest
{
    [Required]
    public string FieldKey { get; set; } = string.Empty;

    [Required]
    public string Label { get; set; } = string.Empty;

    [Required]
    public string FieldType { get; set; } = string.Empty;

    public int? LookupId { get; set; }
    public int OrderIndex { get; set; }
    public bool Required { get; set; }
}

public class UpdateFieldRequest
{
    [Required]
    public string Label { get; set; } = string.Empty;

    [Required]
    public string FieldType { get; set; } = string.Empty;

    public int? LookupId { get; set; }
    public int OrderIndex { get; set; }
    public bool Required { get; set; }
}

public class FieldResponse
{
    public int FieldId { get; set; }
    public int FormVersionId { get; set; }
    public string FieldKey { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public int? LookupId { get; set; }
    public int OrderIndex { get; set; }
    public bool Required { get; set; }
}
