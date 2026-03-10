using FormBuilder.Models;

namespace FormBuilder.Repositories;

public interface IConditionalRuleRepository
{
    Task<IEnumerable<ConditionalRule>> GetByVersionIdAsync(int formVersionId);
    Task<ConditionalRule?> GetByIdAsync(int ruleId);
    Task<int> CreateAsync(int formVersionId, int sourceFieldId, string ruleType, string conditionJson);
    Task<bool> DeleteAsync(int ruleId);
}
