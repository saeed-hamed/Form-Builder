using FormBuilder.Models;

namespace FormBuilder.Repositories;

public interface IUserRepository
{
    Task<IEnumerable<UserModel>> GetAllActiveAsync();
    Task<UserModel?> GetByIdAsync(int userId);
    Task<int> CreateAsync(string name, string email, string role);
    Task<bool> UpdateAsync(int userId, string name, string email, string role);
    Task<bool> DeactivateAsync(int userId);
}
