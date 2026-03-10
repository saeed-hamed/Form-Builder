using FormBuilder.Models;

namespace FormBuilder.Repositories;

public interface IFieldRepository
{
    Task<IEnumerable<Field>> GetByVersionIdAsync(int formVersionId);
    Task<Field?> GetByIdAsync(int fieldId);
    Task<int> CreateAsync(int formVersionId, string fieldKey, string label, string fieldType, int? lookupId, int orderIndex, bool required);
    Task<bool> UpdateAsync(int fieldId, string label, string fieldType, int? lookupId, int orderIndex, bool required);
    Task<bool> DeleteAsync(int fieldId);
}
