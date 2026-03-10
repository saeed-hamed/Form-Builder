Generate a new SQL migration file for the Form Builder MS SQL database.

Migration description: $ARGUMENTS
Example: `add-status-column-to-submission-tasks`

## 1. Migration Filename
Format: `YYYYMMDD_HHMMSS_<description>.sql`
Use today's current date and time. Suggest placing the file in: `db/migrations/`

Example: `db/migrations/20260309_120000_add-status-column-to-submission-tasks.sql`

## 2. Migration File Content
Generate this scaffold:

```sql
-- Migration: <description>
-- Date: <YYYY-MM-DD HH:MM:SS>
-- Author: [developer name]
-- Affected tables: [list tables]

BEGIN TRANSACTION;

-- ============================================================
-- UP: Apply migration
-- ============================================================

-- TODO: Add your DDL/DML changes here
-- Reference CLAUDE.md sections 5-13 for table schemas
--
-- Examples:
--   ALTER TABLE SubmissionTasks ADD COLUMN priority NVARCHAR(50) NULL;
--   CREATE TABLE NewTable (...);
--   INSERT INTO Lookups (name) VALUES ('new_lookup');

-- ============================================================
-- DOWN: Rollback (reverse the changes above)
-- ============================================================

-- TODO: Add rollback logic here
-- Examples:
--   ALTER TABLE SubmissionTasks DROP COLUMN priority;
--   DROP TABLE NewTable;
--   DELETE FROM Lookups WHERE name = 'new_lookup';

-- ============================================================
-- Commit or rollback
-- ============================================================
IF @@ERROR = 0
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Migration applied successfully: <description>';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Migration FAILED and was rolled back: <description>';
END
```

## 3. Schema Reference
Point to the relevant CLAUDE.md sections for the affected tables:
- Forms / FormVersions: sections 5-6
- Fields / Lookups / LookupValues: sections 7-8
- ConditionalRules: section 9
- Tasks / TaskTriggers: sections 10-11
- FormSubmissions / SubmissionValues: section 12
- SubmissionTasks: section 13

## 4. Index Reminder
If adding new columns or tables, ask: "Does this change require a new index?"
Reference the indexing strategy from CLAUDE.md section 17:
- `SubmissionValues(field_id)`
- `SubmissionValues(submission_id)`
- `SubmissionTasks(submission_id)`
- `TaskTriggers(form_version_id)`

## 5. Destructive Migration Warning
If the description contains: `drop`, `delete`, `truncate`, `remove`, `alter column`, `rename column` — print this warning:

```
⚠ DESTRUCTIVE MIGRATION DETECTED
This migration may cause irreversible data loss.
Required before running:
  1. Take a full database backup
  2. Test the DOWN script in a dev environment
  3. Get team review approval
  4. Schedule a maintenance window for production
```
