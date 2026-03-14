using FormBuilder.DTOs;

namespace FormBuilder.Services;

public interface IUserService
{
    Task<IEnumerable<UserResponse>> GetAllActiveAsync();
    Task<UserResponse?> GetByIdAsync(int userId);
    Task<UserResponse> CreateAsync(CreateUserRequest request);
    Task<bool> UpdateAsync(int userId, UpdateUserRequest request);
    Task<bool> DeactivateAsync(int userId);
}
