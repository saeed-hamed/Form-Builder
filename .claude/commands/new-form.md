Scaffold a complete new form for the Dynamic Form Builder system.

Form name: $ARGUMENTS

Generate the following, tailored to the confirmed stack (.NET Web API + Angular + MS SQL):

## 1. Form Definition JSON
A starter `definition_json` following the schema in CLAUDE.md section 16. Include:
- One `yes_no` field
- One `list` field referencing a placeholder lookup name (snake_case)
- One `date` field
Use the form name as the title. Use snake_case for all field `key` values.

## 2. SQL Seed Script
File path: `db/migrations/YYYYMMDD_HHMMSS_seed-<form-name>.sql`

Generate a transaction-safe SQL script that:
- Inserts into `Forms` (title, created_at = GETDATE())
- Captures the new `form_id` via `SCOPE_IDENTITY()`
- Inserts into `FormVersions` (form_id, version_number=1, published=0, definition_json = the JSON above, created_at = GETDATE())
- Sets `active_version_id` on the Forms row
- Wraps everything in `BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK ON ERROR` pattern

## 3. .NET Web API Controller Stub
File path: `src/backend/Controllers/<FormName>Controller.cs`

Scaffold a C# ASP.NET Core controller:
```csharp
[ApiController]
[Route("api/[controller]")]
public class <FormName>Controller : ControllerBase
```
Include:
- Constructor injection of `I<FormName>Service`
- `POST` action for form submission accepting a `SubmitFormRequest` DTO
- `GET` action to retrieve the form definition by version id
- Standard `IActionResult` return types with 200/400/404/500 responses
- XML doc comments on each action

## 4. Service Interface + Stub
File path: `src/backend/Services/I<FormName>Service.cs` and `<FormName>Service.cs`

```csharp
public interface I<FormName>Service
{
    Task<FormVersionDto> GetFormVersionAsync(int formVersionId);
    Task<int> SubmitFormAsync(SubmitFormRequest request);
}
```

## 5. Angular Component Stub
File path: `src/frontend/src/app/forms/<form-name>/<form-name>.component.ts`

Scaffold an Angular standalone component:
- `@Component` with selector, templateUrl, standalone: true
- `@Input() formDefinition: FormDefinition`
- Inject `FormBuilderService` via constructor
- `ngOnInit()` stub to load form definition via HTTP
- Empty `onSubmit()` method stub

## 6. Angular Service Stub
File path: `src/frontend/src/app/services/form-api.service.ts` (create if not exists)

- `HttpClient` injection
- `getFormVersion(versionId: number): Observable<FormDefinition>`
- `submitForm(payload: SubmitFormPayload): Observable<SubmissionResult>`

## Reminders
- Run the SQL seed migration and verify the form_id/version_id before wiring the API
- Register `I<FormName>Service` in `Program.cs` DI container
- Add the lookup referenced in the list field via `/add-lookup`
- Define conditional rules if fields depend on each other via `/add-conditional-rule`
