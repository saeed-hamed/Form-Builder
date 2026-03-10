Deep-clone a form version to create a new editable draft in the Dynamic Form Builder.

Input: $ARGUMENTS
Expected format: `source_version_id | new version description`
Example: `/clone-form-version 3 | Add employment history fields`

Use this command to:
- Edit a published form (you CANNOT directly mutate published versions)
- Create a new version of a form with incremental changes
- Branch a form for A/B testing or regional variations

This generates the most complex SQL in the system — it deep-clones all related records while remapping foreign keys.

## What Gets Cloned
1. `FormVersions` row (new version, `published = 0`)
2. All `Fields` rows (new `field_id`s, same `field_key` and configuration)
3. All `ConditionalRules` rows (updated `source_field_id` to new field IDs)
4. All `TaskTriggers` rows (task_id and condition_json carry over unchanged)

`ConditionalRules.source_field_id` must be remapped because new `field_id`s are generated for the clone. A temporary mapping table handles this.

## Step 1 — Inspect Source Version
```sql
SELECT version_number FROM FormVersions WHERE version_id = <source_version_id>;
SELECT COUNT(*) FROM Fields WHERE form_version_id = <source_version_id>;
SELECT COUNT(*) FROM ConditionalRules WHERE form_version_id = <source_version_id>;
SELECT COUNT(*) FROM TaskTriggers WHERE form_version_id = <source_version_id>;
```

## Step 2 — Generate Clone Transaction

```sql
BEGIN TRANSACTION;

-- ============================================================
-- 1. Clone the FormVersion row
-- ============================================================
DECLARE @newVersionId INT;
DECLARE @formId INT;
DECLARE @newVersionNumber INT;

SELECT @formId = form_id FROM FormVersions WHERE version_id = <source_version_id>;
SELECT @newVersionNumber = MAX(version_number) + 1 FROM FormVersions WHERE form_id = @formId;

INSERT INTO FormVersions (form_id, version_number, definition_json, created_at, published)
SELECT form_id, @newVersionNumber, definition_json, GETDATE(), 0
FROM FormVersions
WHERE version_id = <source_version_id>;

SET @newVersionId = SCOPE_IDENTITY();

-- ============================================================
-- 2. Clone Fields with ID remapping
-- ============================================================
-- Mapping table: old field_id -> new field_id
CREATE TABLE #FieldIdMap (old_field_id INT, new_field_id INT);

DECLARE @oldFieldId INT, @newFieldId INT;
DECLARE field_cursor CURSOR FOR
    SELECT field_id FROM Fields WHERE form_version_id = <source_version_id> ORDER BY order_index;

OPEN field_cursor;
FETCH NEXT FROM field_cursor INTO @oldFieldId;

WHILE @@FETCH_STATUS = 0
BEGIN
    INSERT INTO Fields (form_version_id, field_key, label, field_type, lookup_id, order_index, required)
    SELECT @newVersionId, field_key, label, field_type, lookup_id, order_index, required
    FROM Fields WHERE field_id = @oldFieldId;

    SET @newFieldId = SCOPE_IDENTITY();
    INSERT INTO #FieldIdMap VALUES (@oldFieldId, @newFieldId);

    FETCH NEXT FROM field_cursor INTO @oldFieldId;
END

CLOSE field_cursor;
DEALLOCATE field_cursor;

-- ============================================================
-- 3. Clone ConditionalRules (remap source_field_id)
-- ============================================================
INSERT INTO ConditionalRules (form_version_id, source_field_id, rule_type, condition_json)
SELECT @newVersionId, m.new_field_id, cr.rule_type, cr.condition_json
FROM ConditionalRules cr
JOIN #FieldIdMap m ON cr.source_field_id = m.old_field_id
WHERE cr.form_version_id = <source_version_id>;

-- ============================================================
-- 4. Clone TaskTriggers (no FK remapping needed)
-- ============================================================
INSERT INTO TaskTriggers (form_version_id, task_id, condition_json)
SELECT @newVersionId, task_id, condition_json
FROM TaskTriggers
WHERE form_version_id = <source_version_id>;

-- ============================================================
-- 5. Cleanup and verify
-- ============================================================
DROP TABLE #FieldIdMap;

SELECT @newVersionId AS new_version_id, @newVersionNumber AS new_version_number;

SELECT 'Fields' AS entity, COUNT(*) AS cloned_count FROM Fields WHERE form_version_id = @newVersionId
UNION ALL
SELECT 'ConditionalRules', COUNT(*) FROM ConditionalRules WHERE form_version_id = @newVersionId
UNION ALL
SELECT 'TaskTriggers', COUNT(*) FROM TaskTriggers WHERE form_version_id = @newVersionId;

COMMIT TRANSACTION;
```

## Step 3 — Post-clone Actions
1. Note the new `version_id` returned — use it for all subsequent `/add-field`, `/add-conditional-rule`, `/add-task-trigger` commands
2. The `definition_json` was copied as-is — if you add fields, also update `definition_json` in the new `FormVersions` row
3. Run `/audit-form <new_version_id>` to confirm the clone is consistent
4. When ready to go live: run `/publish-form-version <new_version_id>`

## Note on condition_json target_field references
`ConditionalRules.condition_json` contains `target_field` as a `field_key` string (not a `field_id`). Since `field_key` values are copied unchanged, these references remain valid in the clone without remapping.
