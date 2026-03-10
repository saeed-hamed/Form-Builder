using FormBuilder.DTOs;
using FormBuilder.Repositories;

namespace FormBuilder.Services;

public class FieldService : IFieldService
{
    private readonly IFieldRepository _repo;

    public FieldService(IFieldRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<FieldResponse>> GetFieldsByVersionAsync(int formVersionId)
    {
        var fields = await _repo.GetByVersionIdAsync(formVersionId);
        return fields.Select(MapField);
    }

    public async Task<FieldResponse?> GetFieldByIdAsync(int fieldId)
    {
        var f = await _repo.GetByIdAsync(fieldId);
        return f is null ? null : MapField(f);
    }

    public async Task<FieldResponse> CreateFieldAsync(int formVersionId, CreateFieldRequest request)
    {
        var id = await _repo.CreateAsync(
            formVersionId,
            request.FieldKey,
            request.Label,
            request.FieldType,
            request.LookupId,
            request.OrderIndex,
            request.Required);
        var field = await _repo.GetByIdAsync(id);
        return MapField(field!);
    }

    public async Task<bool> UpdateFieldAsync(int fieldId, UpdateFieldRequest request)
    {
        return await _repo.UpdateAsync(
            fieldId,
            request.Label,
            request.FieldType,
            request.LookupId,
            request.OrderIndex,
            request.Required);
    }

    public async Task<bool> DeleteFieldAsync(int fieldId)
    {
        return await _repo.DeleteAsync(fieldId);
    }

    private static FieldResponse MapField(Models.Field f) => new()
    {
        FieldId = f.FieldId,
        FormVersionId = f.FormVersionId,
        FieldKey = f.FieldKey,
        Label = f.Label,
        FieldType = f.FieldType,
        LookupId = f.LookupId,
        OrderIndex = f.OrderIndex,
        Required = f.Required
    };
}
