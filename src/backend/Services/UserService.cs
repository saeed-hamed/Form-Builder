using FormBuilder.DTOs;
using FormBuilder.Repositories;

namespace FormBuilder.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repo;

    public UserService(IUserRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<UserResponse>> GetAllActiveAsync()
    {
        var users = await _repo.GetAllActiveAsync();
        return users.Select(u => new UserResponse
        {
            UserId = u.UserId,
            Name = u.Name,
            Email = u.Email,
            Role = u.Role,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt
        });
    }

    public async Task<UserResponse?> GetByIdAsync(int userId)
    {
        var u = await _repo.GetByIdAsync(userId);
        if (u == null) return null;
        return new UserResponse
        {
            UserId = u.UserId,
            Name = u.Name,
            Email = u.Email,
            Role = u.Role,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt
        };
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request)
    {
        var id = await _repo.CreateAsync(request.Name, request.Email, request.Role);
        return (await GetByIdAsync(id))!;
    }

    public async Task<bool> UpdateAsync(int userId, UpdateUserRequest request)
    {
        return await _repo.UpdateAsync(userId, request.Name, request.Email, request.Role);
    }

    public async Task<bool> DeactivateAsync(int userId)
    {
        return await _repo.DeactivateAsync(userId);
    }
}
