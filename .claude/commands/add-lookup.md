Create a new Lookup and its values in the Dynamic Form Builder system.

Input: $ARGUMENTS
Expected format: `lookup_name | value1, value2, value3, ...`
Example: `job_type_lookup | Full-Time, Part-Time, Contract, Self-Employed`

## 1. SQL Script
Generate a transaction-safe MS SQL script using `SCOPE_IDENTITY()`:

```sql
BEGIN TRANSACTION;

-- Insert the lookup
INSERT INTO Lookups (name)
VALUES ('<lookup_name>');

DECLARE @lookupId INT = SCOPE_IDENTITY();

-- Insert each value with sequential order_index
INSERT INTO LookupValues (lookup_id, value, order_index) VALUES (@lookupId, 'value1', 1);
INSERT INTO LookupValues (lookup_id, value, order_index) VALUES (@lookupId, 'value2', 2);
-- ... continue for all values

-- Verify
SELECT l.lookup_id, l.name, lv.lookup_value_id, lv.value, lv.order_index
FROM Lookups l
JOIN LookupValues lv ON l.lookup_id = lv.lookup_id
WHERE l.lookup_id = @lookupId
ORDER BY lv.order_index;

COMMIT TRANSACTION;
```

Generate a separate INSERT statement for each value — do not combine into one multi-row insert unless SQL Server version supports it.

## 2. Verification Query
After generating the script, include the SELECT verification query shown above to confirm all values were inserted with correct `order_index` values.

## 3. Usage in definition_json
Show how this lookup is referenced in a field definition:
```json
{
  "key": "job_type",
  "label": "Job Type",
  "type": "list",
  "lookup": "<lookup_name>"
}
```

## 4. Field Linkage
Remind me to update any `Fields` rows that should reference this `lookup_id`:
```sql
UPDATE Fields SET lookup_id = @lookupId WHERE field_key = '<field_key>' AND form_version_id = <version_id>;
```

## 5. Angular Renderer Note
The Angular form renderer should load lookup values dynamically via the API (GET /api/lookups/{lookup_id}/values). Confirm this endpoint exists or scaffold it with `/scaffold-api-endpoint GET /api/lookups/{id}/values | Get lookup values by id`.
