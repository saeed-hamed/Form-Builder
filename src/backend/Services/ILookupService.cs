using FormBuilder.DTOs;

namespace FormBuilder.Services;

public interface ILookupService
{
    Task<IEnumerable<LookupResponse>> GetAllLookupsAsync();
    Task<LookupResponse?> GetLookupByIdAsync(int lookupId);
    Task<LookupResponse> CreateLookupAsync(CreateLookupRequest request);
    Task<bool> DeleteLookupAsync(int lookupId);
    Task<LookupValueResponse> AddValueAsync(int lookupId, AddLookupValueRequest request);
    Task<bool> DeleteValueAsync(int lookupValueId);
}
