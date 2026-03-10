namespace FormBuilder.Models;

public class Field
{
    public int FieldId { get; set; }
    public int FormVersionId { get; set; }
    public string FieldKey { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public int? LookupId { get; set; }
    public int OrderIndex { get; set; }
    public bool Required { get; set; }
    public string? Placeholder { get; set; }
    public string? SubFieldsJson { get; set; }
}
