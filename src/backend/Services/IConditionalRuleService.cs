using FormBuilder.DTOs;

namespace FormBuilder.Services;

public interface IConditionalRuleService
{
    Task<IEnumerable<ConditionalRuleResponse>> GetByVersionIdAsync(int formVersionId);
    Task<ConditionalRuleResponse?> GetByIdAsync(int ruleId);
    Task<ConditionalRuleResponse> CreateAsync(int formVersionId, CreateConditionalRuleRequest request);
    Task<bool> DeleteAsync(int ruleId);
}
