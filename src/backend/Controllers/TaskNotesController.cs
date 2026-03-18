using FormBuilder.DTOs;
using FormBuilder.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers;

[ApiController]
[Route("api/task-notes")]
public class TaskNotesController : ControllerBase
{
    private readonly ITaskNoteService _service;

    public TaskNotesController(ITaskNoteService service)
    {
        _service = service;
    }

    [HttpGet("{submissionTaskId:int}")]
    public async Task<IActionResult> GetNotes(int submissionTaskId)
    {
        var notes = await _service.GetByTaskIdAsync(submissionTaskId);
        return Ok(new { data = notes });
    }

    [HttpPost("{submissionTaskId:int}")]
    public async Task<IActionResult> AddNote(int submissionTaskId, [FromBody] AddNoteRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        var note = await _service.AddNoteAsync(submissionTaskId, request);
        return Ok(new { data = note });
    }
}
