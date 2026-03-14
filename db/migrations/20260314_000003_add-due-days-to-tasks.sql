-- Migration: Add DueDays to Tasks for SLA configuration
-- Affected tables: Tasks (alter)

BEGIN TRANSACTION;

-- ============================================================
-- UP: Apply migration
-- ============================================================

ALTER TABLE Tasks
    ADD DueDays INT NULL;

-- ============================================================
-- DOWN: Rollback (run manually if needed)
-- ============================================================
-- ALTER TABLE Tasks DROP COLUMN DueDays;
-- ============================================================

IF @@ERROR = 0
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Migration applied successfully: add-due-days-to-tasks';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Migration FAILED and was rolled back: add-due-days-to-tasks';
END
