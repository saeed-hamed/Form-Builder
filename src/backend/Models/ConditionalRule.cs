namespace FormBuilder.Models;

public class ConditionalRule
{
    public int RuleId { get; set; }
    public int FormVersionId { get; set; }
    public int SourceFieldId { get; set; }
    public string RuleType { get; set; } = string.Empty;
    public string ConditionJson { get; set; } = string.Empty;
}
