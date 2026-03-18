using FormBuilder.Models;

namespace FormBuilder.Repositories;

public interface ILookupRepository
{
    Task<IEnumerable<Lookup>> GetAllAsync();
    Task<Lookup?> GetByIdAsync(int lookupId);
    Task<IEnumerable<LookupValue>> GetValuesByLookupIdAsync(int lookupId);
    Task<int> CreateAsync(string name, string? nameAr);
    Task<bool> UpdateNameAsync(int lookupId, string name, string? nameAr);
    Task<bool> DeleteAsync(int lookupId);
    Task<int> AddValueAsync(int lookupId, string value, string? valueAr, int orderIndex);
    Task<bool> UpdateValueArAsync(int lookupValueId, string? valueAr);
    Task<bool> DeleteValueAsync(int lookupValueId);
}
