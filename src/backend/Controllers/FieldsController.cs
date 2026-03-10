using FormBuilder.DTOs;
using FormBuilder.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers;

[ApiController]
[Route("api/versions/{versionId:int}/fields")]
public class FieldsController : ControllerBase
{
    private readonly IFieldService _fieldService;
    private readonly IFormService _formService;

    public FieldsController(IFieldService fieldService, IFormService formService)
    {
        _fieldService = fieldService;
        _formService = formService;
    }

    // GET api/versions/{versionId}/fields
    [HttpGet]
    public async Task<IActionResult> GetAll(int versionId)
    {
        var version = await _formService.GetVersionByIdAsync(versionId);
        if (version is null) return NotFound(new { error = "Version not found" });

        var fields = await _fieldService.GetFieldsByVersionAsync(versionId);
        return Ok(new { data = fields });
    }

    // GET api/versions/{versionId}/fields/{fieldId}
    [HttpGet("{fieldId:int}")]
    public async Task<IActionResult> GetById(int versionId, int fieldId)
    {
        var field = await _fieldService.GetFieldByIdAsync(fieldId);
        if (field is null || field.FormVersionId != versionId)
            return NotFound(new { error = "Field not found" });
        return Ok(new { data = field });
    }

    // POST api/versions/{versionId}/fields
    [HttpPost]
    public async Task<IActionResult> Create(int versionId, [FromBody] CreateFieldRequest request)
    {
        var version = await _formService.GetVersionByIdAsync(versionId);
        if (version is null) return NotFound(new { error = "Version not found" });

        var field = await _fieldService.CreateFieldAsync(versionId, request);
        return CreatedAtAction(nameof(GetById), new { versionId, fieldId = field.FieldId }, new { data = field });
    }

    // PUT api/versions/{versionId}/fields/{fieldId}
    [HttpPut("{fieldId:int}")]
    public async Task<IActionResult> Update(int versionId, int fieldId, [FromBody] UpdateFieldRequest request)
    {
        var field = await _fieldService.GetFieldByIdAsync(fieldId);
        if (field is null || field.FormVersionId != versionId)
            return NotFound(new { error = "Field not found" });

        var updated = await _fieldService.UpdateFieldAsync(fieldId, request);
        if (!updated) return StatusCode(500, new { error = "Failed to update field" });
        return Ok(new { data = "Field updated" });
    }

    // DELETE api/versions/{versionId}/fields/{fieldId}
    [HttpDelete("{fieldId:int}")]
    public async Task<IActionResult> Delete(int versionId, int fieldId)
    {
        var field = await _fieldService.GetFieldByIdAsync(fieldId);
        if (field is null || field.FormVersionId != versionId)
            return NotFound(new { error = "Field not found" });

        var deleted = await _fieldService.DeleteFieldAsync(fieldId);
        if (!deleted) return StatusCode(500, new { error = "Failed to delete field" });
        return Ok(new { data = "Field deleted" });
    }
}
