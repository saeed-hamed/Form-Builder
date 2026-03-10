Add a new field to an existing form version in the Dynamic Form Builder.

Input: $ARGUMENTS
Expected format: `field_key | field_type | label | form_version_id`
Example: `employment_status | list | Employment Status | 3`

Supported field types: `yes_no`, `list`, `date`, `text`, `number`

## 1. SQL Insert
Generate a transaction-safe INSERT into the `Fields` table:
```sql
BEGIN TRANSACTION;

DECLARE @nextOrder INT;
SELECT @nextOrder = ISNULL(MAX(order_index), 0) + 1
FROM Fields
WHERE form_version_id = <form_version_id>;

INSERT INTO Fields (form_version_id, field_key, label, field_type, lookup_id, order_index, required)
VALUES (<form_version_id>, '<field_key>', '<label>', '<field_type>', NULL, @nextOrder, 0);

DECLARE @newFieldId INT = SCOPE_IDENTITY();
-- Verify insert
SELECT * FROM Fields WHERE field_id = @newFieldId;

COMMIT TRANSACTION;
```
- If `field_type` is `list`: set `lookup_id` placeholder and add a comment to fill it after running `/add-lookup`
- Set `required = 0` by default — ask if this field should be required

## 2. Definition JSON Patch
Show the JSON entry to add to the `fields` array in `FormVersions.definition_json`:
```json
{
  "key": "<field_key>",
  "label": "<label>",
  "type": "<field_type>"
}
```
If `field_type` is `list`, include `"lookup": "<lookup_name>"`.
Show the full UPDATE statement to patch the definition_json in FormVersions.

## 3. Lookup Check (if field_type is `list`)
- Ask: "Does a lookup already exist for this field? Run: `SELECT * FROM Lookups WHERE name LIKE '%<keyword>%'`"
- If not, prompt to run `/add-lookup <lookup_name> | value1, value2, ...`

## 4. Conditional Rule Prompt
Ask: "Should this field be conditionally shown or hidden based on another field's value?"
If yes, suggest running: `/add-conditional-rule <form_version_id> | <source_field_key> | equals | <value> | show | <field_key>`

## 5. Frontend Note
The Angular dynamic form renderer picks up new fields automatically from `definition_json` if rendering is data-driven.
Flag if any `*ngIf` or `[formControlName]` bindings are hardcoded for this form — those will need updating.
