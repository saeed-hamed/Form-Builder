using FormBuilder.DTOs;
using FormBuilder.Repositories;

namespace FormBuilder.Services;

public class LookupService : ILookupService
{
    private readonly ILookupRepository _repo;

    public LookupService(ILookupRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<LookupResponse>> GetAllLookupsAsync()
    {
        var lookups = await _repo.GetAllAsync();
        var result = new List<LookupResponse>();
        foreach (var l in lookups)
        {
            var values = await _repo.GetValuesByLookupIdAsync(l.LookupId);
            result.Add(MapLookup(l, values));
        }
        return result;
    }

    public async Task<LookupResponse?> GetLookupByIdAsync(int lookupId)
    {
        var l = await _repo.GetByIdAsync(lookupId);
        if (l is null) return null;
        var values = await _repo.GetValuesByLookupIdAsync(lookupId);
        return MapLookup(l, values);
    }

    public async Task<LookupResponse> CreateLookupAsync(CreateLookupRequest request)
    {
        var lookupId = await _repo.CreateAsync(request.Name);
        for (int i = 0; i < request.Values.Count; i++)
        {
            await _repo.AddValueAsync(lookupId, request.Values[i], i + 1);
        }
        return (await GetLookupByIdAsync(lookupId))!;
    }

    public async Task<bool> DeleteLookupAsync(int lookupId)
    {
        return await _repo.DeleteAsync(lookupId);
    }

    public async Task<LookupValueResponse> AddValueAsync(int lookupId, AddLookupValueRequest request)
    {
        var id = await _repo.AddValueAsync(lookupId, request.Value, request.OrderIndex);
        return new LookupValueResponse
        {
            LookupValueId = id,
            LookupId = lookupId,
            Value = request.Value,
            OrderIndex = request.OrderIndex
        };
    }

    public async Task<bool> DeleteValueAsync(int lookupValueId)
    {
        return await _repo.DeleteValueAsync(lookupValueId);
    }

    private static LookupResponse MapLookup(Models.Lookup l, IEnumerable<Models.LookupValue> values) => new()
    {
        LookupId = l.LookupId,
        Name = l.Name,
        Values = values.Select(v => new LookupValueResponse
        {
            LookupValueId = v.LookupValueId,
            LookupId = v.LookupId,
            Value = v.Value,
            OrderIndex = v.OrderIndex
        }).ToList()
    };
}
