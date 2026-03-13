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
            "SELECT FieldId, FormVersionId, FieldKey, Label, LabelAr, FieldType, LookupId, OrderIndex, Required, Placeholder, SubFieldsJson FROM Fields WHERE FormVersionId = @FormVersionId ORDER BY OrderIndex",
            new { FormVersionId = formVersionId });
    }

    public async Task<Field?> GetByIdAsync(int fieldId)
    {
        return await _db.QuerySingleOrDefaultAsync<Field>(
            "SELECT FieldId, FormVersionId, FieldKey, Label, LabelAr, FieldType, LookupId, OrderIndex, Required, Placeholder, SubFieldsJson FROM Fields WHERE FieldId = @FieldId",
            new { FieldId = fieldId });
    }

    public async Task<int> CreateAsync(int formVersionId, string fieldKey, string label, string? labelAr, string fieldType, int? lookupId, int orderIndex, bool required, string? placeholder, string? subFieldsJson)
    {
        return await _db.ExecuteScalarAsync<int>("""
            INSERT INTO Fields (FormVersionId, FieldKey, Label, LabelAr, FieldType, LookupId, OrderIndex, Required, Placeholder, SubFieldsJson)
            VALUES (@FormVersionId, @FieldKey, @Label, @LabelAr, @FieldType, @LookupId, @OrderIndex, @Required, @Placeholder, @SubFieldsJson);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """,
            new { FormVersionId = formVersionId, FieldKey = fieldKey, Label = label, LabelAr = labelAr, FieldType = fieldType, LookupId = lookupId, OrderIndex = orderIndex, Required = required, Placeholder = placeholder, SubFieldsJson = subFieldsJson });
    }

    public async Task<bool> UpdateAsync(int fieldId, string label, string? labelAr, string fieldType, int? lookupId, int orderIndex, bool required, string? placeholder, string? subFieldsJson)
    {
        var rows = await _db.ExecuteAsync("""
            UPDATE Fields SET Label = @Label, LabelAr = @LabelAr, FieldType = @FieldType, LookupId = @LookupId, OrderIndex = @OrderIndex, Required = @Required, Placeholder = @Placeholder, SubFieldsJson = @SubFieldsJson
            WHERE FieldId = @FieldId
            """,
            new { FieldId = fieldId, Label = label, LabelAr = labelAr, FieldType = fieldType, LookupId = lookupId, OrderIndex = orderIndex, Required = required, Placeholder = placeholder, SubFieldsJson = subFieldsJson });
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
