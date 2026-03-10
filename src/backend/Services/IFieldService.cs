using FormBuilder.DTOs;

namespace FormBuilder.Services;

public interface IFieldService
{
    Task<IEnumerable<FieldResponse>> GetFieldsByVersionAsync(int formVersionId);
    Task<FieldResponse?> GetFieldByIdAsync(int fieldId);
    Task<FieldResponse> CreateFieldAsync(int formVersionId, CreateFieldRequest request);
    Task<bool> UpdateFieldAsync(int fieldId, UpdateFieldRequest request);
    Task<bool> DeleteFieldAsync(int fieldId);
}
