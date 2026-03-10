using FormBuilder.DTOs;
using FormBuilder.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers;

[ApiController]
[Route("api/versions/{versionId:int}/rules")]
public class ConditionalRulesController : ControllerBase
{
    private readonly IConditionalRuleService _ruleService;
    private readonly IFormService _formService;

    public ConditionalRulesController(IConditionalRuleService ruleService, IFormService formService)
    {
        _ruleService = ruleService;
        _formService = formService;
    }

    // GET api/versions/{versionId}/rules
    [HttpGet]
    public async Task<IActionResult> GetAll(int versionId)
    {
        var version = await _formService.GetVersionByIdAsync(versionId);
        if (version is null) return NotFound(new { error = "Version not found" });

        var rules = await _ruleService.GetByVersionIdAsync(versionId);
        return Ok(new { data = rules });
    }

    // GET api/versions/{versionId}/rules/{ruleId}
    [HttpGet("{ruleId:int}")]
    public async Task<IActionResult> GetById(int versionId, int ruleId)
    {
        var rule = await _ruleService.GetByIdAsync(ruleId);
        if (rule is null || rule.FormVersionId != versionId)
            return NotFound(new { error = "Rule not found" });
        return Ok(new { data = rule });
    }

    // POST api/versions/{versionId}/rules
    [HttpPost]
    public async Task<IActionResult> Create(int versionId, [FromBody] CreateConditionalRuleRequest request)
    {
        var version = await _formService.GetVersionByIdAsync(versionId);
        if (version is null) return NotFound(new { error = "Version not found" });

        var rule = await _ruleService.CreateAsync(versionId, request);
        return CreatedAtAction(nameof(GetById), new { versionId, ruleId = rule.RuleId }, new { data = rule });
    }

    // DELETE api/versions/{versionId}/rules/{ruleId}
    [HttpDelete("{ruleId:int}")]
    public async Task<IActionResult> Delete(int versionId, int ruleId)
    {
        var rule = await _ruleService.GetByIdAsync(ruleId);
        if (rule is null || rule.FormVersionId != versionId)
            return NotFound(new { error = "Rule not found" });

        await _ruleService.DeleteAsync(ruleId);
        return Ok(new { data = "Rule deleted" });
    }
}
