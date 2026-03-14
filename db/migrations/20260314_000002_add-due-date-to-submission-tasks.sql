-- Migration: Add DueDate to SubmissionTasks for SLA tracking
-- Affected tables: SubmissionTasks (alter)

BEGIN TRANSACTION;

-- ============================================================
-- UP: Apply migration
-- ============================================================

ALTER TABLE SubmissionTasks
    ADD DueDate DATETIME NULL;

-- ============================================================
-- DOWN: Rollback (run manually if needed)
-- ============================================================
-- ALTER TABLE SubmissionTasks DROP COLUMN DueDate;
-- ============================================================

IF @@ERROR = 0
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Migration applied successfully: add-due-date-to-submission-tasks';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Migration FAILED and was rolled back: add-due-date-to-submission-tasks';
END
