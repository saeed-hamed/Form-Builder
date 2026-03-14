using FormBuilder.DTOs;
using FormBuilder.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers;

[ApiController]
[Route("api/task-board")]
public class TaskBoardController : ControllerBase
{
    private readonly ISubmissionService _submissionService;

    public TaskBoardController(ISubmissionService submissionService)
    {
        _submissionService = submissionService;
    }

    // GET api/task-board
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _submissionService.GetTaskBoardAsync();
        return Ok(new { data = items });
    }

    // PATCH api/task-board/{id}/status
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTaskStatusRequest request)
    {
        var validStatuses = new[] { "Pending", "In Progress", "Completed" };
        if (!validStatuses.Contains(request.Status))
            return BadRequest(new { error = "Invalid status. Must be Pending, In Progress, or Completed." });

        var updated = await _submissionService.UpdateTaskStatusAsync(id, request.Status);
        if (!updated) return NotFound(new { error = "Task not found" });

        return Ok(new { data = "Status updated" });
    }

    // PATCH api/task-board/{id}/assign
    [HttpPatch("{id:int}/assign")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignTaskRequest request)
    {
        var updated = await _submissionService.AssignTaskAsync(id, request.UserId);
        if (!updated) return NotFound(new { error = "Task not found" });

        return Ok(new { data = "Assigned" });
    }

}
