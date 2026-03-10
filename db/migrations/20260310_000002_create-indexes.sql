-- Migration: create-indexes
-- Date: 2026-03-10 00:00:02
-- Author: [developer name]
-- Affected tables: SubmissionValues, SubmissionTasks, TaskTriggers

BEGIN TRANSACTION;

-- ============================================================
-- UP: Apply migration
-- ============================================================

-- Index: SubmissionValues(FieldId) — fast lookup of all values for a field
CREATE INDEX IX_SubmissionValues_FieldId
    ON SubmissionValues(FieldId);

-- Index: SubmissionValues(SubmissionId) — fast lookup of all values in a submission
CREATE INDEX IX_SubmissionValues_SubmissionId
    ON SubmissionValues(SubmissionId);

-- Index: SubmissionTasks(SubmissionId) — fast lookup of tasks generated per submission
CREATE INDEX IX_SubmissionTasks_SubmissionId
    ON SubmissionTasks(SubmissionId);

-- Index: TaskTriggers(FormVersionId) — fast rule engine lookup per form version
CREATE INDEX IX_TaskTriggers_FormVersionId
    ON TaskTriggers(FormVersionId);

-- ============================================================
-- DOWN: Rollback
-- ============================================================
-- DROP INDEX IX_SubmissionValues_FieldId       ON SubmissionValues;
-- DROP INDEX IX_SubmissionValues_SubmissionId  ON SubmissionValues;
-- DROP INDEX IX_SubmissionTasks_SubmissionId   ON SubmissionTasks;
-- DROP INDEX IX_TaskTriggers_FormVersionId     ON TaskTriggers;

-- ============================================================
IF @@ERROR = 0
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Migration applied successfully: create-indexes';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Migration FAILED and was rolled back: create-indexes';
END
