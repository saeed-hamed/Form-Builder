using System.ComponentModel.DataAnnotations;

namespace FormBuilder.DTOs;

public class CreateConditionalRuleRequest
{
    [Required]
    public int SourceFieldId { get; set; }

    [Required]
    public string RuleType { get; set; } = string.Empty;

    [Required]
    public string ConditionJson { get; set; } = string.Empty;
}

public class ConditionalRuleResponse
{
    public int RuleId { get; set; }
    public int FormVersionId { get; set; }
    public int SourceFieldId { get; set; }
    public string SourceFieldKey { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public string ConditionJson { get; set; } = string.Empty;
}
