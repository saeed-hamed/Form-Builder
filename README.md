# Dynamic Form Builder & Task Automation System

A platform for creating configurable forms with dynamic fields, conditional UI logic, lookup-based options, task generation rules, and form versioning. Users fill forms and the system automatically generates business workflow tasks based on their responses.

**Stack:** ASP.NET Core Web API (.NET 8+) · Angular 17+ · MS SQL Server

---

## Custom Commands

Slash commands that encode project conventions and automate common development tasks. Invoke them in conversation with Claude Code.

| Command | Purpose |
|---|---|
| `/new-form <name>` | Scaffold a complete new form end-to-end: SQL seed data, .NET controller, and Angular component |
| `/add-field <key\|type\|label\|version_id>` | Add a field to the `Fields` table and patch `definition_json` in the same transaction |
| `/add-lookup <name\|val1,val2,...>` | Insert a `Lookups` record and all its `LookupValues` with correct `order_index` |
| `/add-conditional-rule <version\|source\|op\|val\|action\|target>` | Create a `ConditionalRules` entry with proper `condition_json` (single-condition) |
| `/add-task-trigger <version\|task\|conditions>` | Create a `TaskTriggers` entry with multi-condition AND/OR logic |
| `/new-migration <description>` | Scaffold a timestamped SQL migration file (`YYYYMMDD_HHMMSS_description.sql`) with UP/DOWN sections and transaction wrappers |
| `/validate-form-json <json or path>` | Validate a `definition_json` blob — checks snake_case keys, field types, lookup references, conditional rule field validity |
| `/scaffold-api-endpoint <METHOD /path>` | Generate a .NET controller action, DTOs, service stub, and 3 test case stubs (happy path, 400, 404) |
| `/scaffold-frontend-component <Name \| purpose>` | Generate an Angular standalone component, TypeScript interface, HTML template, and service integration |
| `/check-submission-flow <form_version_id>` | Trace all 6 steps of the task generation workflow — from API endpoint through to task creation |
| `/audit-form <version_id>` | Run the `form-auditor` sub-agent for a deep cross-table integrity check (required before publishing) |
| `/publish-form-version <version_id>` | Safe multi-step publish: runs audit first, retires old version, updates `active_version_id`, wraps in transaction |
| `/clone-form-version <version_id \| desc>` | Deep-clone a published form version for editing — remaps all FK references (fields, conditional rules, triggers) |
| `/test-rule-engine <version_id \| field=value,...>` | Dry-run trigger evaluation with field values you supply — predicts which tasks would fire without creating a real submission |

---

## Sub-Agents

Specialized agents with restricted tool access and focused roles. Invoked automatically by certain commands or on demand.

### `db-inspector`
**Tools:** SQL MCP (read-only), Read, Bash

Inspects live database state. Use it to verify migrations ran correctly, trace a submission through all tables, confirm lookups have values, and check that indexes exist. Intentionally read-only to prevent accidental mutation during investigation.

### `form-auditor`
**Tools:** SQL MCP, `sequential-thinking` MCP, Read, Bash

Runs a deep cross-table consistency audit across 5 areas:
1. **Field integrity** — snake_case keys, no duplicates, list fields have `lookup_id`, lookups exist with values
2. **Conditional rule integrity** — source/target field IDs exist in the version, no self-referencing rules
3. **Task trigger integrity** — task IDs exist, field keys are valid, operators are from the supported set
4. **`definition_json` ↔ `Fields` table consistency** — field counts, types, and lookup names match between JSON and DB rows
5. **Version state** — published flag, `active_version_id` alignment, mutation safety warnings

Output is a structured report with PASS/FAIL/WARN per check and a prioritized fix list. Required before `/publish-form-version`.

### `api-smoke-tester`
**Tools:** Bash (HTTP), SQL MCP, Read

Fires real HTTP requests to `localhost:5001`, checks response codes and shapes, then queries the DB to confirm side effects actually happened. Validates the full stack (controller → service → repository → DB) end-to-end.

---

## MCPs (Tool Integrations)

Configured in `.claude/settings.json`.

| MCP | Purpose |
|---|---|
| `mssql` (`mcp-mssql-server`) | Live queries against `FormBuilderDb` on `localhost:1433` — powers all three sub-agents and direct DB inspection. Credentials via `FORMBUILDER_DB_PASSWORD` env var. |
| `playwright` (`@playwright/mcp`) | Browser automation for testing the Angular UI at `localhost:4200`. Activate when `ng serve` is running. |
| `sequential-thinking` (`@modelcontextprotocol/server-sequential-thinking`) | Structured step-by-step reasoning — used by `form-auditor` for complex cross-table logic. |

---

## Hooks (Automated Guardrails)

Hooks fire automatically before or after tool calls to enforce architectural constraints.

### PostToolUse (fire after writing/editing a file)

- **SQL checklist** — After any `.sql` file is written, verifies it has `BEGIN TRANSACTION`, uses `SCOPE_IDENTITY()` for new IDs, follows the migration filename format, and adds indexes where appropriate.
- **JSON definition detector** — If a written file contains `definition_json`, reminds you to run `/validate-form-json`.
- **FormControlName warning** — If Angular code contains hardcoded `formControlName="fieldName"`, warns that the dynamic renderer must use dynamic binding instead.

### PreToolUse (fire before executing SQL)

- **Dangerous SQL blocker** — Prevents `DROP TABLE`, `TRUNCATE`, or unguarded `DELETE` on core tables (Forms, Fields, FormVersions, etc.) without explicit confirmation.
- **Production DB warning** — If a command targets a production connection string, surfaces a warning before proceeding.
- **Version mutation guard** — Blocks any `UPDATE` to `FormVersions`, `ConditionalRules`, or `TaskTriggers` rows that belong to a published version — enforces immutability of published form versions.

---

## Design Philosophy

Everything in this setup enforces four core principles from the architecture:

1. **Published versions are immutable** — The version mutation guard hook and `/clone-form-version` command ensure you never accidentally edit a published form. Clone it first, then edit the draft.

2. **`definition_json` and the `Fields` table must stay in sync** — `/add-field` always patches both in the same transaction. The `form-auditor` section 4 catches any drift.

3. **All multi-table writes need transactions** — The SQL checklist hook enforces `BEGIN TRANSACTION / COMMIT / ROLLBACK` on every migration. All scaffold commands include transaction wrappers.

4. **You can't safely publish without integrity** — `/audit-form` is a required gate before `/publish-form-version`. Publishing is irreversible; the audit catches cross-table violations before they get locked in.

---

## Project Structure

```
Form-Builder/
├── CLAUDE.md                       # Full technical specification
├── README.md                       # This file
├── .claude/
│   ├── settings.json               # MCPs, permissions, hooks
│   ├── settings.local.json         # Local env (DB password via env var)
│   ├── commands/                   # 14 custom slash command definitions
│   └── agents/                     # 3 sub-agent specifications
├── src/
│   ├── backend/                    # ASP.NET Core Web API
│   │   ├── Controllers/
│   │   ├── Services/
│   │   ├── Repositories/
│   │   ├── DTOs/
│   │   ├── Models/
│   │   └── Program.cs
│   └── frontend/                   # Angular app
│       └── src/app/
│           ├── form-builder/
│           ├── form-renderer/
│           ├── services/
│           ├── models/
│           └── app.routes.ts
├── db/
│   └── migrations/                 # SQL migration files
└── tests/
    ├── unit/
    └── integration/
```

---

## Quick Start

```bash
# Run the API
dotnet run --project src/backend/

# Run the frontend
ng serve --project src/frontend/

# Set DB connection (required for API and MCPs)


API available at `https://localhost:5001` · Frontend at `http://localhost:4200`
