using FormBuilder.Models;

namespace FormBuilder.Services.RuleEngine;

public interface IRuleEngine
{
    /// <summary>
    /// Evaluates all triggers for a form version against submitted field values.
    /// Returns the TaskIds of triggers whose conditions are satisfied.
    /// </summary>
    /// <param name="triggers">All TaskTriggers for the form version.</param>
    /// <param name="fieldValues">Map of field_key → submitted value.</param>
    IEnumerable<int> EvaluateTriggers(
        IEnumerable<TaskTrigger> triggers,
        IReadOnlyDictionary<string, string> fieldValues);
}
