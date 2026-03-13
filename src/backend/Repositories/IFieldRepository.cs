using FormBuilder.Models;

namespace FormBuilder.Repositories;

public interface IFieldRepository
{
    Task<IEnumerable<Field>> GetByVersionIdAsync(int formVersionId);
    Task<Field?> GetByIdAsync(int fieldId);
    Task<int> CreateAsync(int formVersionId, string fieldKey, string label, string? labelAr, string fieldType, int? lookupId, int orderIndex, bool required, string? placeholder, string? subFieldsJson);
    Task<bool> UpdateAsync(int fieldId, string label, string? labelAr, string fieldType, int? lookupId, int orderIndex, bool required, string? placeholder, string? subFieldsJson);
    Task<bool> DeleteAsync(int fieldId);
}
