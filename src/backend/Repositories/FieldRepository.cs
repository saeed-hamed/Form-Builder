using Dapper;
using FormBuilder.Models;
using System.Data;

namespace FormBuilder.Repositories;

public class FieldRepository : IFieldRepository
{
    private readonly IDbConnection _db;

    public FieldRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Field>> GetByVersionIdAsync(int formVersionId)
    {
        return await _db.QueryAsync<Field>(
            "SELECT FieldId, FormVersionId, FieldKey, Label, FieldType, LookupId, OrderIndex, Required FROM Fields WHERE FormVersionId = @FormVersionId ORDER BY OrderIndex",
            new { FormVersionId = formVersionId });
    }

    public async Task<Field?> GetByIdAsync(int fieldId)
    {
        return await _db.QuerySingleOrDefaultAsync<Field>(
            "SELECT FieldId, FormVersionId, FieldKey, Label, FieldType, LookupId, OrderIndex, Required FROM Fields WHERE FieldId = @FieldId",
            new { FieldId = fieldId });
    }

    public async Task<int> CreateAsync(int formVersionId, string fieldKey, string label, string fieldType, int? lookupId, int orderIndex, bool required)
    {
        return await _db.ExecuteScalarAsync<int>("""
            INSERT INTO Fields (FormVersionId, FieldKey, Label, FieldType, LookupId, OrderIndex, Required)
            VALUES (@FormVersionId, @FieldKey, @Label, @FieldType, @LookupId, @OrderIndex, @Required);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """,
            new { FormVersionId = formVersionId, FieldKey = fieldKey, Label = label, FieldType = fieldType, LookupId = lookupId, OrderIndex = orderIndex, Required = required });
    }

    public async Task<bool> UpdateAsync(int fieldId, string label, string fieldType, int? lookupId, int orderIndex, bool required)
    {
        var rows = await _db.ExecuteAsync("""
            UPDATE Fields SET Label = @Label, FieldType = @FieldType, LookupId = @LookupId, OrderIndex = @OrderIndex, Required = @Required
            WHERE FieldId = @FieldId
            """,
            new { FieldId = fieldId, Label = label, FieldType = fieldType, LookupId = lookupId, OrderIndex = orderIndex, Required = required });
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int fieldId)
    {
        var rows = await _db.ExecuteAsync(
            "DELETE FROM Fields WHERE FieldId = @FieldId",
            new { FieldId = fieldId });
        return rows > 0;
    }
}
