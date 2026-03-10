# Dynamic Form Builder & Task Automation System

Technical Specification

---

# 1. Project Overview

This project implements a **Dynamic Form Builder Platform** that allows administrators to create configurable forms with:

* Dynamic fields
* Conditional UI logic
* Lookup-based options
* Task generation rules
* Form versioning
* Relational storage for submissions

The system enables **business workflows triggered by form input**.

Users fill forms, and based on their responses the system **automatically generates tasks**.

---

# 2. Core System Components

## 2.1 Form Builder UI

Administrative interface for creating and managing forms.

Capabilities:

* Create/edit forms
* Add fields
* Define lookup options
* Define conditional UI rules
* Define task generation rules
* Preview form behavior
* Manage form versions

The form builder outputs a **structured JSON definition** that drives frontend rendering.

---

## 2.2 Dynamic Form Renderer

Frontend component responsible for:

* Loading form definitions
* Rendering fields dynamically
* Evaluating conditional UI rules
* Handling field dependencies
* Collecting submission values

---

## 2.3 Rule Engine

Evaluates conditions based on field values.

Responsible for:

* Showing/hiding UI fields
* Enabling/disabling fields
* Triggering tasks
* Validating conditional logic

---

## 2.4 Task Automation Engine

Creates tasks when trigger conditions are met.

Tasks may be triggered:

* Immediately after submission
* When a specific field value is selected
* When multiple conditions are satisfied

---

# 3. High-Level Architecture

Components:

Frontend Application
Dynamic Form Renderer
Form Builder UI

Backend API
Form Service
Submission Service
Task Engine
Rule Engine

Database (MS SQL)

---

# 4. Database Design

MS SQL is suitable for this system.

Key design principle:

* **Form definitions stored as JSON**
* **Submissions stored relationally**

This provides both **flexibility and query performance**.

---

# 5. Forms

Stores metadata and JSON definition.

| Column            | Type          |
| ----------------- | ------------- |
| form_id           | INT PK        |
| title             | NVARCHAR(255) |
| active_version_id | INT           |
| created_at        | DATETIME      |

---

# 6. Form Versions

Forms must support versioning so that previous submissions remain consistent.

| Column          | Type          |
| --------------- | ------------- |
| version_id      | INT PK        |
| form_id         | INT FK        |
| version_number  | INT           |
| definition_json | NVARCHAR(MAX) |
| created_at      | DATETIME      |
| published       | BIT           |

Each version contains the **exact JSON structure of the form**.

---

# 7. Fields

Stores field metadata.

| Column          | Type          |
| --------------- | ------------- |
| field_id        | INT PK        |
| form_version_id | INT FK        |
| field_key       | NVARCHAR(100) |
| label           | NVARCHAR(255) |
| field_type      | NVARCHAR(50)  |
| lookup_id       | INT           |
| order_index     | INT           |
| required        | BIT           |

Supported field types:

* yes_no
* list
* date

Future types:

* text
* number
* multi-select
* file upload

---

# 8. Lookup System

Lookups allow reusable option lists.

## Lookups

| Column    | Type          |
| --------- | ------------- |
| lookup_id | INT PK        |
| name      | NVARCHAR(255) |

---

## LookupValues

| Column          | Type          |
| --------------- | ------------- |
| lookup_value_id | INT PK        |
| lookup_id       | INT           |
| value           | NVARCHAR(255) |
| order_index     | INT           |

---

# 9. Conditional UI Rules

UI rules control dynamic behavior of fields.

Examples:

* Show field B when field A = Yes
* Enable field C when field B selected

---

## ConditionalRules

| Column          | Type          |
| --------------- | ------------- |
| rule_id         | INT PK        |
| form_version_id | INT           |
| source_field_id | INT           |
| rule_type       | NVARCHAR(50)  |
| condition_json  | NVARCHAR(MAX) |

---

Example JSON:

```json
{
  "operator": "equals",
  "value": "Yes",
  "actions": [
    {
      "type": "show",
      "target_field": "jobType"
    }
  ]
}
```

---

# 10. Task System

Tasks represent business actions generated from form input.

Examples:

* Review application
* Schedule interview
* Verify employment
* Contact applicant

---

## Tasks

Master task definitions.

| Column      | Type          |
| ----------- | ------------- |
| task_id     | INT PK        |
| name        | NVARCHAR(255) |
| description | NVARCHAR(MAX) |

---

# 11. Task Trigger Rules

Task triggers define **when a task should be created**.

Triggers depend on field values and conditions.

---

## TaskTriggers

| Column          | Type          |
| --------------- | ------------- |
| trigger_id      | INT PK        |
| form_version_id | INT           |
| task_id         | INT           |
| condition_json  | NVARCHAR(MAX) |

---

Example Trigger Rule

```json
{
  "conditions": [
    {
      "field": "hasWork",
      "operator": "equals",
      "value": "Yes"
    }
  ]
}
```

---

# 12. Form Submission System

Submissions are stored relationally to allow reporting.

---

## FormSubmissions

| Column          | Type          |
| --------------- | ------------- |
| submission_id   | INT PK        |
| form_id         | INT           |
| form_version_id | INT           |
| submitted_by    | NVARCHAR(255) |
| submitted_at    | DATETIME      |

---

## SubmissionValues

| Column              | Type          |
| ------------------- | ------------- |
| submission_value_id | INT PK        |
| submission_id       | INT           |
| field_id            | INT           |
| value               | NVARCHAR(MAX) |

---

# 13. Generated Tasks

Tasks generated after rule evaluation.

---

## SubmissionTasks

| Column             | Type         |
| ------------------ | ------------ |
| submission_task_id | INT PK       |
| submission_id      | INT          |
| task_id            | INT          |
| status             | NVARCHAR(50) |
| created_at         | DATETIME     |
| completed_at       | DATETIME     |

Statuses:

* Pending
* In Progress
* Completed

---

# 14. Task Generation Workflow

1. User submits form
2. Submission values stored
3. Rule engine evaluates conditions
4. Matching task triggers identified
5. Tasks created in SubmissionTasks
6. Tasks assigned or queued

---

# 15. Form Builder UI

The Form Builder UI must support the following features:

## Form Management

* Create form
* Edit form
* Publish form version
* Clone form

---

## Field Builder

Users can:

* Add field
* Select field type
* Configure lookup source
* Set required flag
* Reorder fields

---

## Conditional Rule Builder

Visual interface allowing:

* Select source field
* Define condition
* Select action
* Choose target fields

Example actions:

* Show field
* Hide field
* Enable field
* Disable field

---

## Task Rule Builder

Users define **task triggers** visually.

Configuration steps:

1. Select task
2. Define trigger condition
3. Choose fields involved
4. Define logical operator

Example:

IF
`hasWork = Yes`
AND
`jobType = Full-Time`

THEN
Create Task: `Verify Employment`

---

# 16. Example Form Definition JSON

```json
{
  "form_id": "employee_form",
  "version": 1,
  "title": "Employee Information",
  "fields": [
    {
      "key": "hasWork",
      "label": "Do you have work?",
      "type": "yes_no"
    },
    {
      "key": "jobType",
      "label": "Job Type",
      "type": "list",
      "lookup": "job_type_lookup",
      "visible_if": {
        "field": "hasWork",
        "equals": "Yes"
      }
    },
    {
      "key": "startDate",
      "label": "Start Date",
      "type": "date"
    }
  ]
}
```

---

# 17. Indexing Strategy

Recommended indexes:

SubmissionValues(field_id)

SubmissionValues(submission_id)

SubmissionTasks(submission_id)

TaskTriggers(form_version_id)

---

# 18. Future Enhancements

Potential improvements:

* Multi-page forms
* File attachments
* Advanced rule engine
* Role-based task assignment
* Task SLA and deadlines
* Notification system
* Workflow engine
* Form analytics
* Conditional validation rules

---

# 19. Design Principles

Flexibility
Forms evolve without schema changes.

Performance
Relational storage for submissions enables fast SQL queries.

Extensibility
New field types and rules can be added easily.

Maintainability
Versioned forms prevent breaking historical submissions.

---

# 20. Summary

This system provides:

Dynamic form creation
Conditional UI logic
Automated task generation
Relational data storage
Version-controlled forms

The architecture enables a **scalable workflow-driven form platform** suitable for enterprise applications.

---

# 21. Tech Stack

## Backend
- Framework: ASP.NET Core Web API (.NET 8+)
- Language: C#
- DB Access: Dapper (raw SQL preferred) or Entity Framework Core — TBD
- Validation: Data Annotations + FluentValidation (TBD)
- Pattern: Controller → Service → Repository
- DI registration: `Program.cs` using `builder.Services.AddScoped<IService, Service>()`

## Frontend
- Framework: Angular 17+ (standalone components)
- Language: TypeScript
- Forms: Angular Reactive Forms (`FormBuilder`, `FormGroup`, `FormControl`)
- HTTP: `HttpClient` via injected services
- State: Angular Signals or RxJS `BehaviorSubject` (TBD)
- UI Library: TBD

## Database
- MS SQL Server 2019+
- Migrations: manual SQL scripts in `db/migrations/` named `YYYYMMDD_HHMMSS_description.sql`
- All multi-table writes use `BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`
- New IDs captured via `SCOPE_IDENTITY()`

## Dev Environment
- Local DB connection string env var: `FORMBUILDER_DB_CONNECTION`
- API base URL (local): `https://localhost:5001`
- Angular dev port: `4200`
- Run API: `dotnet run` from `src/backend/`
- Run frontend: `ng serve` from `src/frontend/`

---

# 22. Project Directory Structure

```
Form-Builder/
├── CLAUDE.md
├── .claude/
│   ├── settings.json
│   └── commands/
├── src/
│   ├── backend/                    # ASP.NET Core Web API
│   │   ├── Controllers/
│   │   ├── Services/               # IService interfaces + implementations
│   │   ├── Repositories/           # DB access layer
│   │   ├── DTOs/                   # Request/Response data transfer objects
│   │   ├── Models/                 # Domain models matching DB schema
│   │   └── Program.cs
│   └── frontend/                   # Angular app
│       └── src/
│           └── app/
│               ├── form-builder/   # Admin form builder UI components
│               ├── form-renderer/  # Dynamic form rendering components
│               ├── services/       # Angular services (FormApiService, etc.)
│               ├── models/         # TypeScript interfaces matching CLAUDE.md schemas
│               └── app.routes.ts
├── db/
│   └── migrations/                 # SQL migration files
└── tests/
    ├── unit/
    └── integration/
```

---

# 23. Coding Conventions

- **Field keys**: always `snake_case` in definition_json (e.g., `has_work`, `job_type`)
- **Rule operators**: lowercase string (e.g., `"equals"`, `"not_equals"`, `"contains"`)
- **Task statuses**: Title Case matching DB values exactly: `"Pending"`, `"In Progress"`, `"Completed"`
- **SQL**: PascalCase table and column names matching schemas in this document
- **C# DTOs**: PascalCase properties with `[Required]` annotations for mandatory fields
- **Angular components**: kebab-case selector (`app-form-renderer`), PascalCase class name
- **API responses (success)**: `{ data: T }` wrapper
- **API responses (error)**: `{ error: string, details?: any }`
- **All DB writes touching multiple tables**: wrapped in explicit transactions
- **Never store raw user input** directly into `definition_json` without sanitization

---

# 24. Supported Rule Engine Operators

Both the Rule Engine (section 2.3) and Task Automation Engine (section 2.4) evaluate conditions using these operators:

| Operator       | Applies To          | Description                              |
| -------------- | ------------------- | ---------------------------------------- |
| `equals`       | all field types     | Exact string match (case-insensitive)    |
| `not_equals`   | all field types     | Value does not match                     |
| `contains`     | list, text          | Value is a substring or list member      |
| `is_empty`     | all field types     | No value submitted or value is null/""   |
| `is_not_empty` | all field types     | Any non-null, non-empty value submitted  |

**Logical combinators for TaskTriggers:**
- `AND` — all conditions must match
- `OR` — any one condition must match

**ConditionalRules** support single-condition evaluation only (no AND/OR combinators). Use TaskTriggers for multi-condition logic.
