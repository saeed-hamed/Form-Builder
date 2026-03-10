using FormBuilder.DTOs;
using FormBuilder.Repositories;

namespace FormBuilder.Services;

public class FormService : IFormService
{
    private readonly IFormRepository _repo;

    public FormService(IFormRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<FormResponse>> GetAllFormsAsync()
    {
        var forms = await _repo.GetAllAsync();
        return forms.Select(f => new FormResponse
        {
            FormId = f.FormId,
            Title = f.Title,
            ActiveVersionId = f.ActiveVersionId,
            CreatedAt = f.CreatedAt
        });
    }

    public async Task<FormResponse?> GetFormByIdAsync(int formId)
    {
        var f = await _repo.GetByIdAsync(formId);
        if (f is null) return null;
        return new FormResponse
        {
            FormId = f.FormId,
            Title = f.Title,
            ActiveVersionId = f.ActiveVersionId,
            CreatedAt = f.CreatedAt
        };
    }

    public async Task<FormResponse> CreateFormAsync(CreateFormRequest request)
    {
        var id = await _repo.CreateAsync(request.Title);
        var form = await _repo.GetByIdAsync(id);
        return new FormResponse
        {
            FormId = form!.FormId,
            Title = form.Title,
            ActiveVersionId = form.ActiveVersionId,
            CreatedAt = form.CreatedAt
        };
    }

    public async Task<bool> UpdateFormAsync(int formId, UpdateFormRequest request)
    {
        return await _repo.UpdateAsync(formId, request.Title);
    }

    public async Task<bool> DeleteFormAsync(int formId)
    {
        return await _repo.DeleteAsync(formId);
    }

    public async Task<IEnumerable<FormVersionResponse>> GetVersionsByFormIdAsync(int formId)
    {
        var versions = await _repo.GetVersionsByFormIdAsync(formId);
        return versions.Select(MapVersion);
    }

    public async Task<FormVersionResponse?> GetVersionByIdAsync(int versionId)
    {
        var v = await _repo.GetVersionByIdAsync(versionId);
        return v is null ? null : MapVersion(v);
    }

    public async Task<FormVersionResponse> CreateVersionAsync(int formId, CreateFormVersionRequest request)
    {
        var id = await _repo.CreateVersionAsync(formId, request.DefinitionJson);
        var version = await _repo.GetVersionByIdAsync(id);
        return MapVersion(version!);
    }

    public async Task<bool> PublishVersionAsync(int formId, int versionId)
    {
        return await _repo.PublishVersionAsync(formId, versionId);
    }

    private static FormVersionResponse MapVersion(Models.FormVersion v) => new()
    {
        VersionId = v.VersionId,
        FormId = v.FormId,
        VersionNumber = v.VersionNumber,
        DefinitionJson = v.DefinitionJson,
        CreatedAt = v.CreatedAt,
        Published = v.Published
    };
}
