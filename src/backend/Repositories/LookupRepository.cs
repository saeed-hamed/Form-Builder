using Dapper;
using FormBuilder.Models;
using System.Data;

namespace FormBuilder.Repositories;

public class LookupRepository : ILookupRepository
{
    private readonly IDbConnection _db;

    public LookupRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Lookup>> GetAllAsync()
    {
        return await _db.QueryAsync<Lookup>(
            "SELECT LookupId, Name FROM Lookups ORDER BY Name");
    }

    public async Task<Lookup?> GetByIdAsync(int lookupId)
    {
        return await _db.QuerySingleOrDefaultAsync<Lookup>(
            "SELECT LookupId, Name FROM Lookups WHERE LookupId = @LookupId",
            new { LookupId = lookupId });
    }

    public async Task<IEnumerable<LookupValue>> GetValuesByLookupIdAsync(int lookupId)
    {
        return await _db.QueryAsync<LookupValue>(
            "SELECT LookupValueId, LookupId, Value, ValueAr, OrderIndex FROM LookupValues WHERE LookupId = @LookupId ORDER BY OrderIndex",
            new { LookupId = lookupId });
    }

    public async Task<int> CreateAsync(string name)
    {
        return await _db.ExecuteScalarAsync<int>("""
            INSERT INTO Lookups (Name) VALUES (@Name);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """,
            new { Name = name });
    }

    public async Task<bool> DeleteAsync(int lookupId)
    {
        var rows = await _db.ExecuteAsync(
            "DELETE FROM Lookups WHERE LookupId = @LookupId",
            new { LookupId = lookupId });
        return rows > 0;
    }

    public async Task<int> AddValueAsync(int lookupId, string value, string? valueAr, int orderIndex)
    {
        return await _db.ExecuteScalarAsync<int>("""
            INSERT INTO LookupValues (LookupId, Value, ValueAr, OrderIndex)
            VALUES (@LookupId, @Value, @ValueAr, @OrderIndex);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """,
            new { LookupId = lookupId, Value = value, ValueAr = valueAr, OrderIndex = orderIndex });
    }

    public async Task<bool> DeleteValueAsync(int lookupValueId)
    {
        var rows = await _db.ExecuteAsync(
            "DELETE FROM LookupValues WHERE LookupValueId = @LookupValueId",
            new { LookupValueId = lookupValueId });
        return rows > 0;
    }
}
