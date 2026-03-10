Validate a Form Definition JSON against the Dynamic Form Builder schema.

Input: $ARGUMENTS
Provide either:
- The JSON directly as a string, or
- A file path to a `.json` file, or
- A `form_version_id` to fetch and validate from the database

## Validation Rules

Run each check and report PASS / FAIL / WARNING:

### 1. Top-Level Structure
- [ ] `form_id` present and is a non-empty string
- [ ] `version` present and is a positive integer
- [ ] `title` present and is a non-empty string
- [ ] `fields` present and is a non-empty array

### 2. Field-Level Checks (for each field in `fields`)
- [ ] `key` is present, a string, uses snake_case (no spaces, no camelCase)
- [ ] `label` is present and non-empty
- [ ] `type` is one of: `yes_no`, `list`, `date`, `text`, `number`, `multi-select`, `file_upload`
- [ ] No duplicate `key` values within the fields array
- [ ] If `type` is `list`: `lookup` key is present and non-empty
- [ ] If `type` is `yes_no`: no `lookup` key expected (warn if present)

### 3. Conditional Rule Checks (if `visible_if` present on any field)
- [ ] `visible_if.field` references a `key` that exists in the same `fields` array
- [ ] `visible_if.equals` (or equivalent operator) has a non-empty value
- [ ] The referenced source field is not the same as the target field

### 4. Cross-Reference Checks
- [ ] List all `lookup` names referenced across all fields
- [ ] Note: these must exist in the `Lookups` table — verify with:
  ```sql
  SELECT name FROM Lookups WHERE name IN ('<lookup1>', '<lookup2>');
  ```

### 5. JSON Syntax
- [ ] The JSON is syntactically valid (no trailing commas, unclosed brackets, etc.)

## Output Format
```
=== Form JSON Validation Report ===
Form: <title> (version <version>)
Total fields: <n>
Lookup references: <list>
Conditional rules: <count>

CHECKS:
  [PASS] Top-level structure: all required keys present
  [FAIL] fields[1].key: "Job Type" — contains a space. Use snake_case: "job_type"
  [FAIL] fields[2].type: "dropdown" — not a supported type. Use "list"
  [WARN] fields[3]: type is yes_no but has a lookup key — lookup will be ignored

LOOKUP CROSS-REFERENCE:
  - "job_type_lookup" → verify exists in Lookups table
  - "industry_lookup" → verify exists in Lookups table

RESULT: FAILED (2 errors, 1 warning)
Fix all errors before storing in FormVersions.definition_json.
```
