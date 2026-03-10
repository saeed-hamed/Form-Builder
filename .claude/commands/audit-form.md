Run a complete consistency audit of a form version in the Dynamic Form Builder.

Input: $ARGUMENTS
Provide: `form_version_id`
Example: `/audit-form 3`

This command invokes the `form-auditor` sub-agent to perform a 5-section cross-table integrity check.

## What Gets Audited
1. **Field Integrity** — snake_case keys, no duplicates, lookup_id populated for list fields, lookups have values
2. **Conditional Rule Integrity** — source/target field_ids exist, no self-targeting, no conflicting rules
3. **Task Trigger Integrity** — task_ids exist, condition field keys exist, valid logical_operator and operators
4. **definition_json ↔ Fields Consistency** — field counts match, types match, lookup names match
5. **Version State** — published status, active_version_id alignment, mutation safety warning

## Output
Structured report with PASS / FAIL / WARN per check and a prioritized fix list.

## When to Run
- Before running `/publish-form-version` (required — no FAIL results allowed before publishing)
- After `/add-field`, `/add-conditional-rule`, or `/add-task-trigger` to verify integrity
- After any direct SQL modification to the form's fields or rules
- When the form renderer behaves unexpectedly

## Fallback (if MSSQL MCP is not configured)
If the `db-inspector` agent is unavailable, output these SQL queries for manual execution:

```sql
-- Section 1: Field check
SELECT field_id, field_key, field_type, lookup_id, order_index
FROM Fields WHERE form_version_id = <form_version_id> ORDER BY order_index;

-- Section 2: Conditional rules
SELECT cr.rule_id, f.field_key AS source, cr.rule_type, cr.condition_json
FROM ConditionalRules cr
JOIN Fields f ON cr.source_field_id = f.field_id
WHERE cr.form_version_id = <form_version_id>;

-- Section 3: Task triggers
SELECT tt.trigger_id, t.name, tt.condition_json
FROM TaskTriggers tt
JOIN Tasks t ON tt.task_id = t.task_id
WHERE tt.form_version_id = <form_version_id>;

-- Section 4: definition_json
SELECT version_number, published, definition_json
FROM FormVersions WHERE version_id = <form_version_id>;

-- Section 5: Version state
SELECT fv.version_id, fv.published, f.active_version_id
FROM FormVersions fv JOIN Forms f ON fv.form_id = f.form_id
WHERE fv.version_id = <form_version_id>;
```

Run each query and compare results manually against the checklist in `.claude/agents/form-auditor.md`.
