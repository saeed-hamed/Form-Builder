using FormBuilder.DTOs;
using FormBuilder.Repositories;

namespace FormBuilder.Services;

public class ConditionalRuleService : IConditionalRuleService
{
    private readonly IConditionalRuleRepository _repo;
    private readonly IFieldRepository _fieldRepo;

    public ConditionalRuleService(IConditionalRuleRepository repo, IFieldRepository fieldRepo)
    {
        _repo = repo;
        _fieldRepo = fieldRepo;
    }

    public async Task<IEnumerable<ConditionalRuleResponse>> GetByVersionIdAsync(int formVersionId)
    {
        var rules = await _repo.GetByVersionIdAsync(formVersionId);
        var result = new List<ConditionalRuleResponse>();
        foreach (var r in rules)
        {
            var field = await _fieldRepo.GetByIdAsync(r.SourceFieldId);
            result.Add(MapRule(r, field?.FieldKey ?? string.Empty));
        }
        return result;
    }

    public async Task<ConditionalRuleResponse?> GetByIdAsync(int ruleId)
    {
        var r = await _repo.GetByIdAsync(ruleId);
        if (r is null) return null;
        var field = await _fieldRepo.GetByIdAsync(r.SourceFieldId);
        return MapRule(r, field?.FieldKey ?? string.Empty);
    }

    public async Task<ConditionalRuleResponse> CreateAsync(int formVersionId, CreateConditionalRuleRequest request)
    {
        var id = await _repo.CreateAsync(formVersionId, request.SourceFieldId, request.RuleType, request.ConditionJson);
        return (await GetByIdAsync(id))!;
    }

    public async Task<bool> DeleteAsync(int ruleId)
    {
        return await _repo.DeleteAsync(ruleId);
    }

    private static ConditionalRuleResponse MapRule(Models.ConditionalRule r, string fieldKey) => new()
    {
        RuleId = r.RuleId,
        FormVersionId = r.FormVersionId,
        SourceFieldId = r.SourceFieldId,
        SourceFieldKey = fieldKey,
        RuleType = r.RuleType,
        ConditionJson = r.ConditionJson
    };
}
