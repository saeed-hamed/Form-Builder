-- Migration: Add Arabic name to Tasks for bilingual support
-- Affected tables: Tasks (alter)

BEGIN TRANSACTION;

-- ============================================================
-- UP: Apply migration
-- ============================================================

ALTER TABLE Tasks
    ADD NameAr NVARCHAR(255) NULL;

-- ============================================================
-- DOWN: Rollback (run manually if needed)
-- ============================================================
-- ALTER TABLE Tasks DROP COLUMN NameAr;
-- ============================================================

IF @@ERROR = 0
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Migration applied successfully: add-name-ar-to-tasks';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Migration FAILED and was rolled back: add-name-ar-to-tasks';
END
