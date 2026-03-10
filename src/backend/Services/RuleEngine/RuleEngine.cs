using FormBuilder.Models;
using System.Text.Json;

namespace FormBuilder.Services.RuleEngine;

public class RuleEngine : IRuleEngine
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public IEnumerable<int> EvaluateTriggers(
        IEnumerable<TaskTrigger> triggers,
        IReadOnlyDictionary<string, string> fieldValues)
    {
        var matchedTaskIds = new List<int>();

        foreach (var trigger in triggers)
        {
            TriggerConditionJson? conditionDef;
            try
            {
                conditionDef = JsonSerializer.Deserialize<TriggerConditionJson>(
                    trigger.ConditionJson, _jsonOptions);
            }
            catch
            {
                // Skip malformed trigger JSON
                continue;
            }

            if (conditionDef is null || conditionDef.Conditions.Count == 0)
                continue;

            bool triggered = EvaluateConditions(conditionDef, fieldValues);
            if (triggered)
                matchedTaskIds.Add(trigger.TaskId);
        }

        return matchedTaskIds;
    }

    private static bool EvaluateConditions(
        TriggerConditionJson conditionDef,
        IReadOnlyDictionary<string, string> fieldValues)
    {
        var results = conditionDef.Conditions.Select(c => EvaluateCondition(c, fieldValues));

        return conditionDef.LogicalOperator.ToUpperInvariant() == "OR"
            ? results.Any(r => r)
            : results.All(r => r); // Default: AND
    }

    private static bool EvaluateCondition(
        ConditionItem condition,
        IReadOnlyDictionary<string, string> fieldValues)
    {
        fieldValues.TryGetValue(condition.Field, out var submittedValue);
        submittedValue ??= string.Empty;

        return condition.Operator.ToLowerInvariant() switch
        {
            "equals" => string.Equals(submittedValue, condition.Value ?? string.Empty,
                StringComparison.OrdinalIgnoreCase),

            "not_equals" => !string.Equals(submittedValue, condition.Value ?? string.Empty,
                StringComparison.OrdinalIgnoreCase),

            "contains" => submittedValue.Contains(condition.Value ?? string.Empty,
                StringComparison.OrdinalIgnoreCase),

            "is_empty" => string.IsNullOrEmpty(submittedValue),

            "is_not_empty" => !string.IsNullOrEmpty(submittedValue),

            _ => false
        };
    }
}
