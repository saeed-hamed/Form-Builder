using FormBuilder.Models;

namespace FormBuilder.Repositories;

public interface IFormRepository
{
    Task<IEnumerable<Form>> GetAllAsync();
    Task<Form?> GetByIdAsync(int formId);
    Task<int> CreateAsync(string title);
    Task<bool> UpdateAsync(int formId, string title);
    Task<bool> DeleteAsync(int formId);
    Task<bool> SetActiveVersionAsync(int formId, int versionId);

    Task<IEnumerable<FormVersion>> GetVersionsByFormIdAsync(int formId);
    Task<FormVersion?> GetVersionByIdAsync(int versionId);
    Task<int> CreateVersionAsync(int formId, string definitionJson);
    Task<bool> PublishVersionAsync(int formId, int versionId);
}
