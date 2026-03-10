using FormBuilder.DTOs;
using FormBuilder.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers;

[ApiController]
[Route("api/versions/{versionId:int}/triggers")]
public class TriggersController : ControllerBase
{
    private readonly ITaskTriggerService _triggerService;
    private readonly IFormService _formService;

    public TriggersController(ITaskTriggerService triggerService, IFormService formService)
    {
        _triggerService = triggerService;
        _formService = formService;
    }

    // GET api/versions/{versionId}/triggers
    [HttpGet]
    public async Task<IActionResult> GetAll(int versionId)
    {
        var version = await _formService.GetVersionByIdAsync(versionId);
        if (version is null) return NotFound(new { error = "Version not found" });

        var triggers = await _triggerService.GetByVersionIdAsync(versionId);
        return Ok(new { data = triggers });
    }

    // GET api/versions/{versionId}/triggers/{triggerId}
    [HttpGet("{triggerId:int}")]
    public async Task<IActionResult> GetById(int versionId, int triggerId)
    {
        var trigger = await _triggerService.GetByIdAsync(triggerId);
        if (trigger is null || trigger.FormVersionId != versionId)
            return NotFound(new { error = "Trigger not found" });
        return Ok(new { data = trigger });
    }

    // POST api/versions/{versionId}/triggers
    [HttpPost]
    public async Task<IActionResult> Create(int versionId, [FromBody] CreateTaskTriggerRequest request)
    {
        var version = await _formService.GetVersionByIdAsync(versionId);
        if (version is null) return NotFound(new { error = "Version not found" });

        var trigger = await _triggerService.CreateAsync(versionId, request);
        return CreatedAtAction(nameof(GetById), new { versionId, triggerId = trigger.TriggerId }, new { data = trigger });
    }

    // DELETE api/versions/{versionId}/triggers/{triggerId}
    [HttpDelete("{triggerId:int}")]
    public async Task<IActionResult> Delete(int versionId, int triggerId)
    {
        var trigger = await _triggerService.GetByIdAsync(triggerId);
        if (trigger is null || trigger.FormVersionId != versionId)
            return NotFound(new { error = "Trigger not found" });

        await _triggerService.DeleteAsync(triggerId);
        return Ok(new { data = "Trigger deleted" });
    }
}
