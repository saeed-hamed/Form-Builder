Trace field values through all TaskTrigger conditions to predict which tasks would fire — without submitting a real form.

Input: $ARGUMENTS
Expected format: `form_version_id | field_key=value, field_key=value, ...`
Example: `/test-rule-engine 3 | has_work=Yes, job_type=Full-Time, start_date=2026-03-10`

Use this command to:
- Debug why a task is (or is not) being created after form submission
- Verify trigger conditions before publishing a form version
- Test edge cases (empty values, boundary conditions) without polluting real submission data
- Confirm AND vs OR logic behaves as expected

## Step 1 — Load All Triggers for This Version

If the MSSQL MCP is available, fetch live:
```sql
SELECT tt.trigger_id, t.task_id, t.name AS task_name, tt.condition_json
FROM TaskTriggers tt
JOIN Tasks t ON tt.task_id = t.task_id
WHERE tt.form_version_id = <form_version_id>;
```

Also verify the provided field keys exist:
```sql
SELECT field_key, field_type FROM Fields
WHERE form_version_id = <form_version_id>
  AND field_key IN (<quoted comma-separated field_keys from input>);
```

## Step 2 — Parse Input Values
Parse the `field_key=value` pairs from the input into a lookup map:
```
has_work    → "Yes"
job_type    → "Full-Time"
start_date  → "2026-03-10"
```

## Step 3 — Evaluate Each Trigger

For each trigger, evaluate every condition in `condition_json.conditions[]` against the input map.

Apply operators as defined in CLAUDE.md §24:

| Operator       | Evaluation Rule |
|----------------|-----------------|
| `equals`       | value == condition.value (case-insensitive string comparison) |
| `not_equals`   | value != condition.value (case-insensitive) |
| `contains`     | value includes condition.value as substring or set member |
| `is_empty`     | value is null, empty string, or not present in input map |
| `is_not_empty` | value is non-null and non-empty |

Apply logical combinator:
- `AND` — ALL conditions must match → trigger fires
- `OR` — ANY ONE condition matches → trigger fires

## Step 4 — Report Results

Output a full evaluation trace:

```
=== RULE ENGINE TEST ===
Form version_id: 3
Input values: has_work=Yes, job_type=Full-Time, start_date=2026-03-10

─── Trigger 1: "Verify Employment" (trigger_id: 5) ───
  logical_operator: AND
  Condition 1: has_work equals "Yes"
    → Input: "Yes" | MATCH ✓
  Condition 2: job_type equals "Full-Time"
    → Input: "Full-Time" | MATCH ✓
  Result: AND(MATCH, MATCH) → FIRES ✓
  → Task "Verify Employment" would be created (status: Pending)

─── Trigger 2: "Review Application" (trigger_id: 6) ───
  logical_operator: OR
  Condition 1: job_type equals "Contract"
    → Input: "Full-Time" | NO MATCH ✗
  Condition 2: has_work equals "No"
    → Input: "Yes" | NO MATCH ✗
  Result: OR(NO MATCH, NO MATCH) → DOES NOT FIRE ✗

─── Trigger 3: "Contact Applicant" (trigger_id: 7) ───
  logical_operator: AND
  Condition 1: employment_type equals "Full-Time"
    → WARNING: field "employment_type" not found in Fields for version 3
    → This trigger can NEVER fire — dead trigger. Run /audit-form 3 to fix.
  Result: UNREACHABLE ⚠

=== SUMMARY ===
Input fields provided:  3
Triggers evaluated:     3
  → FIRES:          1  (task: "Verify Employment")
  → DOES NOT FIRE:  1
  → UNREACHABLE:    1  (dead trigger — fix required)

Tasks that WOULD be created by this submission:
  1. Verify Employment (status: Pending)
```

## Step 5 — Diagnosis Prompts

After the trace, answer these:
- Are the expected tasks firing?
- If a task is NOT firing when it should: which condition failed? Is the value format correct (case? date format?)?
- If a task IS firing when it should NOT: which condition is too broad?
- Are there any UNREACHABLE triggers that need to be fixed before publishing?

If `is_empty` or `is_not_empty` conditions exist, remind: these evaluate against what the user actually submits, not what `Fields.required` says. An optional field with no value submitted will be absent from `SubmissionValues`.
