Define a new Conditional UI Rule for the Dynamic Form Builder.

Input: $ARGUMENTS
Expected format: `form_version_id | source_field_key | operator | value | action_type | target_field_key`
Example: `3 | has_work | equals | Yes | show | job_type`

Supported operators (see CLAUDE.md section 24): `equals`, `not_equals`, `contains`, `is_empty`, `is_not_empty`
Supported action_types: `show`, `hide`, `enable`, `disable`

## 1. Build condition_json
Generate the JSON object following the schema from CLAUDE.md section 9:
```json
{
  "operator": "<operator>",
  "value": "<value>",
  "actions": [
    {
      "type": "<action_type>",
      "target_field": "<target_field_key>"
    }
  ]
}
```
Note: `ConditionalRules` support single-condition evaluation only (no AND/OR combinators at this level — use TaskTriggers for multi-condition logic).

## 2. Field Validation Query
Before generating the INSERT, emit these verification queries:
```sql
-- Verify source field exists
SELECT field_id, field_key FROM Fields WHERE field_key = '<source_field_key>' AND form_version_id = <form_version_id>;

-- Verify target field exists
SELECT field_id, field_key FROM Fields WHERE field_key = '<target_field_key>' AND form_version_id = <form_version_id>;
```
Warn if either returns no rows — the rule will be invalid.

## 3. SQL Insert
```sql
BEGIN TRANSACTION;

DECLARE @sourceFieldId INT;
SELECT @sourceFieldId = field_id FROM Fields
WHERE field_key = '<source_field_key>' AND form_version_id = <form_version_id>;

INSERT INTO ConditionalRules (form_version_id, source_field_id, rule_type, condition_json)
VALUES (
  <form_version_id>,
  @sourceFieldId,
  '<action_type>',
  '<condition_json>'
);

SELECT * FROM ConditionalRules WHERE rule_id = SCOPE_IDENTITY();

COMMIT TRANSACTION;
```

## 4. Conflict Check
Query for existing rules targeting the same field:
```sql
SELECT cr.rule_id, cr.rule_type, cr.condition_json, f.field_key AS source_field
FROM ConditionalRules cr
JOIN Fields f ON cr.source_field_id = f.field_id
WHERE cr.form_version_id = <form_version_id>
  AND cr.condition_json LIKE '%<target_field_key>%';
```
If results exist, warn: "A rule already controls `<target_field_key>`. Review for conflicts."

## 5. Angular Rule Engine Note
The Angular form renderer's Rule Engine service must evaluate this rule at render time when `source_field_key` value changes.
Confirm the Rule Engine service subscribes to `valueChanges` on the source field's `FormControl` and applies the action to the target field.
If not implemented yet, scaffold it with `/scaffold-frontend-component RuleEngineService | Evaluates ConditionalRules against live FormGroup values`.
