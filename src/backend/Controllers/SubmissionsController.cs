using FormBuilder.DTOs;
using FormBuilder.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers;

[ApiController]
[Route("api/submissions")]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _submissionService;
    private readonly IFormService _formService;

    public SubmissionsController(ISubmissionService submissionService, IFormService formService)
    {
        _submissionService = submissionService;
        _formService = formService;
    }

    // POST api/submissions
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitFormRequest request)
    {
        // Validate form version exists and is published
        var version = await _formService.GetVersionByIdAsync(request.FormVersionId);
        if (version is null || version.FormId != request.FormId)
            return NotFound(new { error = "Form version not found" });

        if (!version.Published)
            return BadRequest(new { error = "Form version is not published" });

        var submission = await _submissionService.SubmitAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = submission.SubmissionId }, new { data = submission });
    }

    // GET api/submissions/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var submission = await _submissionService.GetByIdAsync(id);
        if (submission is null) return NotFound(new { error = "Submission not found" });
        return Ok(new { data = submission });
    }

    // GET api/forms/{formId}/submissions
    [HttpGet("/api/forms/{formId:int}/submissions")]
    public async Task<IActionResult> GetByForm(int formId)
    {
        var form = await _formService.GetFormByIdAsync(formId);
        if (form is null) return NotFound(new { error = "Form not found" });

        var submissions = await _submissionService.GetByFormIdAsync(formId);
        return Ok(new { data = submissions });
    }
}
