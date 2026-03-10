# Form Builder UI — Implementation Plan

This document defines the 6-phase build order for the Form Builder admin UI, its backing .NET API, and the MS SQL database schema.

---

## Phase 1 — Database Foundation & Project Bootstrap

**Goal:** Running .NET API skeleton, Angular app shell, and all core DB tables.

### Actions

1. **Bootstrap the .NET project**
   ```bash
   dotnet new webapi -n FormBuilder --output src/backend
   ```
   - Add `Dapper` + `Microsoft.Data.SqlClient` NuGet packages
   - Register `IDbConnection` factory in `Program.cs` reading from `FORMBUILDER_DB_CONNECTION` env var
   - Add CORS policy allowing `localhost:4200`
   - Configure JSON serializer (camelCase, ignore nulls)

2. **Bootstrap the Angular project**
   ```bash
   ng new form-builder-frontend --standalone --routing --style=scss --directory src/frontend
   ```
   - Configure `app.routes.ts` with placeholder routes
   - Create base `FormApiService` pointing to `https://localhost:5001`
   - Create empty `models/` directory

3. **Run `/new-migration create-core-schema`** — create all 10 tables in FK-safe order:
   - `Forms`, `FormVersions`, `Fields`, `Lookups`, `LookupValues`
   - `ConditionalRules`, `Tasks`, `TaskTriggers`
   - `FormSubmissions`, `SubmissionValues`, `SubmissionTasks`
   - Deferred FK: `Forms.active_version_id → FormVersions.version_id`

4. **Run `/new-migration create-indexes`** — 4 indexes from spec §17:
   - `SubmissionValues(field_id)`
   - `SubmissionValues(submission_id)`
   - `SubmissionTasks(submission_id)`
   - `TaskTriggers(form_version_id)`

### Verify
- `dotnet build` + `ng build` — zero errors
- `db-inspector` agent: confirm all 10 tables and 4 indexes exist

---

## Phase 2 — Forms & Versions API + Form List UI

**Goal:** Create, list, and view forms/versions end-to-end.

### Backend
- **Models** in `src/backend/Models/`: `Form.cs`, `FormVersion.cs`
- **DTOs** in `src/backend/DTOs/`: `CreateFormRequest.cs`, `FormSummaryDto.cs`, `FormVersionDto.cs`, `ErrorResponse.cs`
- **`IFormRepository` / `FormRepository`** in `src/backend/Repositories/`
- **`IFormService` / `FormService`** in `src/backend/Services/`
  - `CreateFormWithInitialVersionAsync()` — wraps `Forms` insert + `FormVersions` insert in one transaction
- **Endpoints** via `/scaffold-api-endpoint`:
  - `GET /api/forms` → `{ data: FormSummaryDto[] }`
  - `POST /api/forms` → `{ data: { formId, versionId } }`
  - `GET /api/forms/{formId}/versions` → `{ data: FormVersionDto[] }`
  - `GET /api/forms/versions/{versionId}` → `{ data: FormVersionDto }`

### Frontend
- **TypeScript models** in `src/frontend/src/app/models/`: `form.model.ts`, `field.model.ts`
- **`FormApiService`**: add `getForms()`, `createForm()`, `getFormVersion()`
- **`FormListComponent`** via `/scaffold-frontend-component FormList`
  - Path: `src/frontend/src/app/form-builder/form-list/`
  - Loads forms on init, table with Title / Created At / Active Version / actions
  - "Create New Form" button
- **Routes**: `{ path: 'forms', component: FormListComponent }`, default redirect to `/forms`

### Verify
- `api-smoke-tester`: `POST /api/forms` → 201, DB row confirmed
- Angular `/forms` page renders and create form works

---

## Phase 3 — Field Builder & Lookup Management

**Goal:** Add/reorder fields and manage reusable option lists.

### Backend (via `/scaffold-api-endpoint`)
- `GET /api/forms/versions/{versionId}/fields` — ordered by `order_index`
- `POST /api/forms/versions/{versionId}/fields` — **dual-write**: `Fields` table row + patch `definition_json` in `FormVersions`, all in one transaction
- `PUT /api/forms/versions/{versionId}/fields/reorder` — batch `order_index` update in one transaction
- `GET /api/lookups`
- `POST /api/lookups` — creates `Lookups` row + all `LookupValues` in one transaction
- `GET /api/lookups/{lookupId}/values`

**DTOs**: `CreateFieldRequest.cs` (snake_case `FieldKey` validation), `ReorderFieldsRequest.cs`, `CreateLookupRequest.cs`

### Seed reference lookups
```
/add-lookup yes_no_lookup | Yes, No
/add-lookup job_type_lookup | Full-Time, Part-Time, Contract, Self-Employed
```

### Frontend (via `/scaffold-frontend-component`)
- **`FieldBuilder`** → `src/frontend/src/app/form-builder/field-builder/`
  - `field_key` input validated against `^[a-z][a-z0-9_]*$`
  - Field type dropdown: `yes_no`, `list`, `date`
  - Lookup dropdown shown conditionally when type = `list`
  - Up/down reorder controls
- **`LookupManager`** → `src/frontend/src/app/form-builder/lookup-manager/`
- **`FormBuilderShell`** (tabbed layout) → route: `forms/:formId/versions/:versionId/builder`

### Verify
- `/add-field` smoke test (validates the SQL dual-write path)
- `/audit-form {versionId}` — Section 1 (Field Integrity) and Section 4 (JSON ↔ Fields sync) pass

---

## Phase 4 — Conditional Rule Builder

**Goal:** Define single-condition show/hide/enable/disable rules between fields.

### Backend (via `/scaffold-api-endpoint`)
- `GET /api/forms/versions/{versionId}/rules` — join `Fields` to include `source_field_key`
- `POST /api/forms/versions/{versionId}/rules`:
  1. Validate `source_field_id` belongs to this `form_version_id`
  2. Validate `target_field` key exists in this version's `Fields`
  3. Build `condition_json`: `{ "operator": "...", "value": "...", "actions": [{ "type": "...", "target_field": "..." }] }`
  4. Insert in transaction
- `DELETE /api/forms/versions/{versionId}/rules/{ruleId}` — reject with 409 if version is published

**DTOs**: `CreateConditionalRuleRequest.cs`, `ConditionalRuleDto.cs`

### Frontend (via `/scaffold-frontend-component`)
- **`ConditionalRuleBuilder`** → `src/frontend/src/app/form-builder/conditional-rule-builder/`
  - Source field → Operator → Value input (hidden for `is_empty` / `is_not_empty`) → Action → Target field
  - Existing rules in human-readable table with delete button

### Seed test rule
```
/add-conditional-rule 1 | has_work | equals | Yes | show | job_type
```

### Verify
- `/audit-form {versionId}` — Section 2 (Conditional Rule Integrity) passes
- Invalid target field key → API returns 400

---

## Phase 5 — Task Rule Builder & Version Management

**Goal:** Multi-condition AND/OR task triggers + publish/clone version workflows.

### Backend (via `/scaffold-api-endpoint`)
- `GET /api/tasks`, `POST /api/tasks`
- `GET /api/forms/versions/{versionId}/triggers` — join `Tasks` for `task_name`
- `POST /api/forms/versions/{versionId}/triggers`:
  - Validate all `field_key` values exist for this version
  - Build `condition_json`: `{ "logical_operator": "AND"|"OR", "conditions": [...] }`
  - Insert in transaction
- `DELETE /api/forms/versions/{versionId}/triggers/{triggerId}`
- `POST /api/forms/versions/{versionId}/publish` — audit gate → retire old published → `published=1` → update `Forms.active_version_id`, all in one transaction
- `POST /api/forms/versions/{versionId}/clone` — deep-clone with FK remapping (see `.claude/commands/clone-form-version.md` for remapping logic)

### Frontend (via `/scaffold-frontend-component`)
- **`TaskRuleBuilder`** → `src/frontend/src/app/form-builder/task-rule-builder/`
  - `FormArray` for condition rows (field key, operator, value)
  - Value input hidden when operator is `is_empty` or `is_not_empty`
  - AND / OR toggle
  - "Create New Task" inline option in task dropdown
- **`VersionManager`** → `src/frontend/src/app/form-builder/version-manager/`
  - Version history table with Published badge
  - Publish button (disabled for already-published versions)
  - Clone to New Draft button

### Seed test trigger
```
/add-task-trigger 1 | Verify Employment | has_work equals Yes AND job_type equals Full-Time
```

### Verify
- `/audit-form {versionId}` — all 5 sections pass
- `/publish-form-version {versionId}` — `published=1`, `active_version_id` updated on `Forms`
- `/test-rule-engine {versionId} | has_work=Yes,job_type=Full-Time` — task fires correctly
- Clone creates version 2 with `published=0`

---

## Phase 6 — Form Preview (Live Render in Builder)

**Goal:** Admin can preview the form with conditional logic active without leaving the builder.

### Frontend (via `/scaffold-frontend-component`)
- **`RuleEngineService`** → `src/frontend/src/app/services/rule-engine.service.ts`
  - Subscribes to `valueChanges` on each source field's `FormControl`
  - Evaluates condition operator + value against current control value
  - Outputs visibility state map `{ [fieldKey]: boolean }`
  - Supports all 5 operators: `equals` (case-insensitive), `not_equals`, `contains`, `is_empty`, `is_not_empty`

- **`FormPreviewComponent`** → `src/frontend/src/app/form-builder/form-preview/`
  - `@Input() formVersion`, `@Input() fields`, `@Input() rules`
  - Dynamic field rendering: `[formControlName]="field.fieldKey"` (never hardcoded)
  - `yes_no` → radio buttons; `list` → `<select>` from lookup values; `date` → `<input type="date">`
  - Visibility driven by `RuleEngineService` state map via `@if` / `*ngIf`
  - "Preview Mode" banner — no submission capability

- **Wire into `FormBuilderShell`**: add "Preview" tab passing current fields + rules reactively

### Verify
- `has_work = No` → `job_type` hidden; `has_work = Yes` → `job_type` appears (no page reload)
- Playwright MCP test with `ng serve` running on port 4200
- `/audit-form {versionId}` still passes (preview is read-only, no side effects)

---

## Dependency Order

```
Phase 1 — DB + Project Bootstrap
  └── Phase 2 — Forms/Versions API + Form List UI
        └── Phase 3 — Fields + Lookups API + Field Builder UI
              ├── Phase 4 — Conditional Rule Builder  ← parallel
              └── Phase 5 — Task Rule Builder + Version Management  ← parallel
                    └── Phase 6 — Form Preview + Rule Engine
```

Phases 4 and 5 are independent of each other once Phase 3 is complete.

---

## Commands Used Per Phase

| Phase | Commands |
|---|---|
| 1 | `/new-migration create-core-schema`, `/new-migration create-indexes` |
| 2 | `/scaffold-api-endpoint GET /api/forms`, `/scaffold-api-endpoint POST /api/forms`, `/scaffold-frontend-component FormList` |
| 3 | `/add-lookup`, `/scaffold-api-endpoint POST .../fields`, `/scaffold-api-endpoint POST /api/lookups`, `/scaffold-frontend-component FieldBuilder`, `/scaffold-frontend-component LookupManager`, `/add-field` |
| 4 | `/scaffold-api-endpoint POST .../rules`, `/scaffold-frontend-component ConditionalRuleBuilder`, `/add-conditional-rule`, `/audit-form` |
| 5 | `/scaffold-api-endpoint POST .../triggers`, `/scaffold-frontend-component TaskRuleBuilder`, `/scaffold-frontend-component VersionManager`, `/add-task-trigger`, `/audit-form`, `/publish-form-version`, `/clone-form-version`, `/test-rule-engine` |
| 6 | `/scaffold-frontend-component FormPreview`, `/scaffold-frontend-component RuleEngineService`, `/validate-form-json` |

---

## Critical Reference Files

| File | Purpose |
|---|---|
| `CLAUDE.md` | Full technical specification — schema, conventions, operators |
| `.claude/commands/scaffold-api-endpoint.md` | C# controller/DTO/service pattern |
| `.claude/commands/scaffold-frontend-component.md` | Angular standalone component pattern |
| `.claude/commands/new-migration.md` | SQL migration scaffold with transaction pattern |
| `.claude/commands/clone-form-version.md` | FK remapping logic for the clone endpoint |
| `.claude/agents/form-auditor.md` | 5-section audit checklist — required gate before publish |
| `CLAUDE.md §16` | Reference `definition_json` schema |
| `CLAUDE.md §24` | Full supported operator list for the rule engine |
