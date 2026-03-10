Define a new Task Trigger Rule for the Dynamic Form Builder automation engine.

Input: $ARGUMENTS
Expected format: `form_version_id | task_name | field_key operator value [AND|OR field_key operator value ...]`
Example: `3 | Verify Employment | has_work equals Yes AND job_type equals Full-Time`

Supported operators (see CLAUDE.md section 24): `equals`, `not_equals`, `contains`, `is_empty`, `is_not_empty`
Logical combinators: `AND` (all conditions must match), `OR` (any condition must match)

## 1. Build condition_json
Generate the JSON following the schema from CLAUDE.md section 11. Support multiple conditions:
```json
{
  "logical_operator": "AND",
  "conditions": [
    { "field": "has_work", "operator": "equals", "value": "Yes" },
    { "field": "job_type", "operator": "equals", "value": "Full-Time" }
  ]
}
```
For a single condition, still use the `conditions` array with one entry and set `logical_operator` to `"AND"`.

## 2. Task Lookup / Creation
Check if the task already exists:
```sql
SELECT task_id, name, description FROM Tasks WHERE name = '<task_name>';
```
If no result, generate an INSERT to create it first:
```sql
INSERT INTO Tasks (name, description) VALUES ('<task_name>', 'Auto-generated. Update description.');
DECLARE @taskId INT = SCOPE_IDENTITY();
```

## 3. Field Validation Query
Verify all field keys in the conditions exist for this form version:
```sql
SELECT field_key FROM Fields
WHERE form_version_id = <form_version_id>
  AND field_key IN ('<field_key1>', '<field_key2>');
```
Warn for any field key that is not returned.

## 4. SQL Insert
```sql
BEGIN TRANSACTION;

-- (Include task INSERT here if task did not exist)

INSERT INTO TaskTriggers (form_version_id, task_id, condition_json)
VALUES (
  <form_version_id>,
  <task_id>,
  '<condition_json>'
);

SELECT * FROM TaskTriggers WHERE trigger_id = SCOPE_IDENTITY();

COMMIT TRANSACTION;
```

## 5. Task Engine Note
The .NET Task Automation Engine (CLAUDE.md section 2.4) evaluates `TaskTriggers` after each submission.
It must:
- Load all `TaskTriggers` for the submitted `form_version_id`
- Evaluate each trigger's `condition_json` against the `SubmissionValues`
- Insert into `SubmissionTasks` with `status = 'Pending'` and `created_at = GETDATE()` for each match

If the engine is not yet implemented, run `/check-submission-flow <form_version_id>` to identify what is missing.

## 6. Test Payload
Generate a sample test submission payload that would trigger this rule, so you can validate it end-to-end:
```json
{
  "form_id": <form_id>,
  "form_version_id": <form_version_id>,
  "submitted_by": "test@example.com",
  "values": [
    { "field_key": "has_work", "value": "Yes" },
    { "field_key": "job_type", "value": "Full-Time" }
  ]
}
```
