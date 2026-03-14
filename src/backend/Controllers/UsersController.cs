using FormBuilder.DTOs;
using FormBuilder.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetAllActiveAsync();
        return Ok(new { data = users });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound(new { error = "User not found" });
        return Ok(new { data = user });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var user = await _userService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, new { data = user });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var updated = await _userService.UpdateAsync(id, request);
        if (!updated) return NotFound(new { error = "User not found" });
        return Ok(new { data = "Updated" });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var deactivated = await _userService.DeactivateAsync(id);
        if (!deactivated) return NotFound(new { error = "User not found" });
        return Ok(new { data = "Deactivated" });
    }
}
