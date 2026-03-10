using FormBuilder.DTOs;

namespace FormBuilder.Services;

public interface IFormService
{
    Task<IEnumerable<FormResponse>> GetAllFormsAsync();
    Task<FormResponse?> GetFormByIdAsync(int formId);
    Task<FormResponse> CreateFormAsync(CreateFormRequest request);
    Task<bool> UpdateFormAsync(int formId, UpdateFormRequest request);
    Task<bool> DeleteFormAsync(int formId);

    Task<IEnumerable<FormVersionResponse>> GetVersionsByFormIdAsync(int formId);
    Task<FormVersionResponse?> GetVersionByIdAsync(int versionId);
    Task<FormVersionResponse> CreateVersionAsync(int formId, CreateFormVersionRequest request);
    Task<bool> PublishVersionAsync(int formId, int versionId);
}
