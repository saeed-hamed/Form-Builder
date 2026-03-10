Scaffold a .NET Web API endpoint for the Form Builder system.

Input: $ARGUMENTS
Expected format: `HTTP_METHOD /api/path | description`
Example: `POST /api/submissions | Submit a completed form`

## 1. C# Controller Action
Scaffold the action method in the appropriate controller. Follow the Controller/Service/Repository pattern:

```csharp
/// <summary>
/// <description>
/// </summary>
/// <returns>...</returns>
[Http<METHOD>("<route>")]
[ProducesResponseType(typeof(<ResponseDto>), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
public async Task<IActionResult> <ActionName>([FromBody] <RequestDto> request)
{
    if (!ModelState.IsValid)
        return BadRequest(new ErrorResponse { Error = "Invalid request", Details = ModelState });

    try
    {
        var result = await _<service>.<MethodAsync>(request);
        return Ok(result);
    }
    catch (NotFoundException ex)
    {
        return NotFound(new ErrorResponse { Error = ex.Message });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in <ActionName>");
        return StatusCode(500, new ErrorResponse { Error = "An unexpected error occurred" });
    }
}
```

## 2. Request & Response DTOs
Generate DTO classes in `src/backend/DTOs/`:
- Use `[Required]` and `[Range]` data annotations for validation
- For submission endpoints, validate per CLAUDE.md section 12:
  - `FormId` (required, int)
  - `FormVersionId` (required, int)
  - `SubmittedBy` (required, non-empty string)
  - `Values` (required, list of `{ FieldId: int, Value: string }`)

Add a shared `ErrorResponse` DTO if it does not exist:
```csharp
public class ErrorResponse
{
    public string Error { get; set; } = string.Empty;
    public object? Details { get; set; }
}
```

## 3. Service Interface Method
Add the method signature to the appropriate `IService` interface in `src/backend/Services/`:
```csharp
Task<<ReturnType>> <MethodName>Async(<RequestDto> request, CancellationToken ct = default);
```

## 4. Transaction Note
If this endpoint writes to multiple tables (e.g., FormSubmissions + SubmissionValues), remind me to use a transaction:
- With Dapper: wrap in `using var tx = connection.BeginTransaction();`
- With EF Core: wrap in `using var tx = await context.Database.BeginTransactionAsync();`

## 5. DI Registration
Remind me to register the service in `Program.cs`:
```csharp
builder.Services.AddScoped<I<ServiceName>, <ServiceName>>();
```

## 6. Test Cases
Generate 3 HTTP request snippets for testing (using `.http` file format for VS / Rider):
```http
### Happy path
POST https://localhost:5001/api/<path>
Content-Type: application/json

{ ... valid payload ... }

### Validation failure (missing required field)
POST https://localhost:5001/api/<path>
Content-Type: application/json

{ ... invalid payload ... }

### Not found
GET https://localhost:5001/api/<path>/99999
```
