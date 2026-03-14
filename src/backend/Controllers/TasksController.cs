using FormBuilder.DTOs;
using FormBuilder.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers;

[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    // GET api/tasks
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tasks = await _taskService.GetAllAsync();
        return Ok(new { data = tasks });
    }

    // GET api/tasks/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var task = await _taskService.GetByIdAsync(id);
        if (task is null) return NotFound(new { error = "Task not found" });
        return Ok(new { data = task });
    }

    // POST api/tasks
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        var task = await _taskService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = task.TaskId }, new { data = task });
    }

    // PUT api/tasks/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskRequest request)
    {
        var updated = await _taskService.UpdateAsync(id, request);
        if (!updated) return NotFound(new { error = "Task not found" });
        var task = await _taskService.GetByIdAsync(id);
        return Ok(new { data = task });
    }

    // DELETE api/tasks/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _taskService.DeleteAsync(id);
        if (!deleted) return NotFound(new { error = "Task not found" });
        return Ok(new { data = "Task deleted" });
    }
}
