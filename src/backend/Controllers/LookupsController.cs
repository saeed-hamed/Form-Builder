using FormBuilder.DTOs;
using FormBuilder.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers;

[ApiController]
[Route("api/lookups")]
public class LookupsController : ControllerBase
{
    private readonly ILookupService _lookupService;

    public LookupsController(ILookupService lookupService)
    {
        _lookupService = lookupService;
    }

    // GET api/lookups
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var lookups = await _lookupService.GetAllLookupsAsync();
        return Ok(new { data = lookups });
    }

    // GET api/lookups/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lookup = await _lookupService.GetLookupByIdAsync(id);
        if (lookup is null) return NotFound(new { error = "Lookup not found" });
        return Ok(new { data = lookup });
    }

    // POST api/lookups
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLookupRequest request)
    {
        var lookup = await _lookupService.CreateLookupAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = lookup.LookupId }, new { data = lookup });
    }

    // DELETE api/lookups/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _lookupService.DeleteLookupAsync(id);
        if (!deleted) return NotFound(new { error = "Lookup not found" });
        return Ok(new { data = "Lookup deleted" });
    }

    // POST api/lookups/{id}/values
    [HttpPost("{id:int}/values")]
    public async Task<IActionResult> AddValue(int id, [FromBody] AddLookupValueRequest request)
    {
        var lookup = await _lookupService.GetLookupByIdAsync(id);
        if (lookup is null) return NotFound(new { error = "Lookup not found" });

        var value = await _lookupService.AddValueAsync(id, request);
        return CreatedAtAction(nameof(GetById), new { id }, new { data = value });
    }

    // DELETE api/lookups/{id}/values/{valueId}
    [HttpDelete("{id:int}/values/{valueId:int}")]
    public async Task<IActionResult> DeleteValue(int id, int valueId)
    {
        var deleted = await _lookupService.DeleteValueAsync(valueId);
        if (!deleted) return NotFound(new { error = "Lookup value not found" });
        return Ok(new { data = "Lookup value deleted" });
    }
}
