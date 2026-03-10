using Dapper;
using FormBuilder.Models;
using System.Data;

namespace FormBuilder.Repositories;

public class ConditionalRuleRepository : IConditionalRuleRepository
{
    private readonly IDbConnection _db;

    public ConditionalRuleRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ConditionalRule>> GetByVersionIdAsync(int formVersionId)
    {
        return await _db.QueryAsync<ConditionalRule>(
            "SELECT RuleId, FormVersionId, SourceFieldId, RuleType, ConditionJson FROM ConditionalRules WHERE FormVersionId = @FormVersionId",
            new { FormVersionId = formVersionId });
    }

    public async Task<ConditionalRule?> GetByIdAsync(int ruleId)
    {
        return await _db.QuerySingleOrDefaultAsync<ConditionalRule>(
            "SELECT RuleId, FormVersionId, SourceFieldId, RuleType, ConditionJson FROM ConditionalRules WHERE RuleId = @RuleId",
            new { RuleId = ruleId });
    }

    public async Task<int> CreateAsync(int formVersionId, int sourceFieldId, string ruleType, string conditionJson)
    {
        return await _db.ExecuteScalarAsync<int>("""
            INSERT INTO ConditionalRules (FormVersionId, SourceFieldId, RuleType, ConditionJson)
            VALUES (@FormVersionId, @SourceFieldId, @RuleType, @ConditionJson);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """,
            new { FormVersionId = formVersionId, SourceFieldId = sourceFieldId, RuleType = ruleType, ConditionJson = conditionJson });
    }

    public async Task<bool> DeleteAsync(int ruleId)
    {
        var rows = await _db.ExecuteAsync(
            "DELETE FROM ConditionalRules WHERE RuleId = @RuleId",
            new { RuleId = ruleId });
        return rows > 0;
    }
}
