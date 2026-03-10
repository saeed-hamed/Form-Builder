namespace FormBuilder.Services.RuleEngine;

/// <summary>
/// POCO for deserializing TaskTrigger condition_json.
/// Example: { "logical_operator": "AND", "conditions": [{ "field": "has_work", "operator": "equals", "value": "Yes" }] }
/// </summary>
public class TriggerConditionJson
{
    public string LogicalOperator { get; set; } = "AND";
    public List<ConditionItem> Conditions { get; set; } = new();
}

public class ConditionItem
{
    public string Field { get; set; } = string.Empty;
    public string Operator { get; set; } = string.Empty;
    public string? Value { get; set; }
}
