using FormBuilder.DTOs;
using FormBuilder.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers;

[ApiController]
[Route("api/forms")]
public class FormsController : ControllerBase
{
    private readonly IFormService _formService;

    public FormsController(IFormService formService)
    {
        _formService = formService;
    }

    // GET api/forms
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var forms = await _formService.GetAllFormsAsync();
        return Ok(new { data = forms });
    }

    // GET api/forms/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var form = await _formService.GetFormByIdAsync(id);
        if (form is null) return NotFound(new { error = "Form not found" });
        return Ok(new { data = form });
    }

    // POST api/forms
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFormRequest request)
    {
        var form = await _formService.CreateFormAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = form.FormId }, new { data = form });
    }

    // PUT api/forms/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateFormRequest request)
    {
        var updated = await _formService.UpdateFormAsync(id, request);
        if (!updated) return NotFound(new { error = "Form not found" });
        return Ok(new { data = "Form updated" });
    }

    // DELETE api/forms/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _formService.DeleteFormAsync(id);
        if (!deleted) return NotFound(new { error = "Form not found" });
        return Ok(new { data = "Form deleted" });
    }

    // GET api/forms/{id}/versions
    [HttpGet("{id:int}/versions")]
    public async Task<IActionResult> GetVersions(int id)
    {
        var form = await _formService.GetFormByIdAsync(id);
        if (form is null) return NotFound(new { error = "Form not found" });

        var versions = await _formService.GetVersionsByFormIdAsync(id);
        return Ok(new { data = versions });
    }

    // GET api/forms/{id}/versions/{versionId}
    [HttpGet("{id:int}/versions/{versionId:int}")]
    public async Task<IActionResult> GetVersion(int id, int versionId)
    {
        var version = await _formService.GetVersionByIdAsync(versionId);
        if (version is null || version.FormId != id)
            return NotFound(new { error = "Version not found" });
        return Ok(new { data = version });
    }

    // POST api/forms/{id}/versions
    [HttpPost("{id:int}/versions")]
    public async Task<IActionResult> CreateVersion(int id, [FromBody] CreateFormVersionRequest request)
    {
        var form = await _formService.GetFormByIdAsync(id);
        if (form is null) return NotFound(new { error = "Form not found" });

        var version = await _formService.CreateVersionAsync(id, request);
        return CreatedAtAction(nameof(GetVersion), new { id, versionId = version.VersionId }, new { data = version });
    }

    // POST api/forms/{id}/versions/{versionId}/publish
    [HttpPost("{id:int}/versions/{versionId:int}/publish")]
    public async Task<IActionResult> PublishVersion(int id, int versionId)
    {
        var version = await _formService.GetVersionByIdAsync(versionId);
        if (version is null || version.FormId != id)
            return NotFound(new { error = "Version not found" });

        if (version.Published)
            return BadRequest(new { error = "Version is already published" });

        var published = await _formService.PublishVersionAsync(id, versionId);
        if (!published) return StatusCode(500, new { error = "Failed to publish version" });
        return Ok(new { data = "Version published" });
    }
}
