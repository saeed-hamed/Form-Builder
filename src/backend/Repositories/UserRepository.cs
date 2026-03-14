using Dapper;
using FormBuilder.Models;
using System.Data;

namespace FormBuilder.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IDbConnection _db;

    public UserRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<UserModel>> GetAllActiveAsync()
    {
        return await _db.QueryAsync<UserModel>(
            "SELECT UserId, Name, Email, Role, IsActive, CreatedAt FROM Users WHERE IsActive = 1 ORDER BY Name");
    }

    public async Task<UserModel?> GetByIdAsync(int userId)
    {
        return await _db.QuerySingleOrDefaultAsync<UserModel>(
            "SELECT UserId, Name, Email, Role, IsActive, CreatedAt FROM Users WHERE UserId = @UserId",
            new { UserId = userId });
    }

    public async Task<int> CreateAsync(string name, string email, string role)
    {
        return await _db.ExecuteScalarAsync<int>("""
            INSERT INTO Users (Name, Email, Role) VALUES (@Name, @Email, @Role);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """,
            new { Name = name, Email = email, Role = role });
    }

    public async Task<bool> UpdateAsync(int userId, string name, string email, string role)
    {
        var rows = await _db.ExecuteAsync(
            "UPDATE Users SET Name = @Name, Email = @Email, Role = @Role WHERE UserId = @UserId",
            new { UserId = userId, Name = name, Email = email, Role = role });
        return rows > 0;
    }

    public async Task<bool> DeactivateAsync(int userId)
    {
        var rows = await _db.ExecuteAsync(
            "UPDATE Users SET IsActive = 0 WHERE UserId = @UserId",
            new { UserId = userId });
        return rows > 0;
    }
}
