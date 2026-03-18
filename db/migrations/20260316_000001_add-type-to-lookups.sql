-- Migration: Add Type column to Lookups for single/multi-choice distinction
-- Affected tables: Lookups (alter)

BEGIN TRANSACTION;

ALTER TABLE Lookups
    ADD Type NVARCHAR(10) NOT NULL DEFAULT 'single';

IF @@ERROR = 0
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Migration applied successfully: add-type-to-lookups';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Migration FAILED and was rolled back: add-type-to-lookups';
END

-- DOWN: ALTER TABLE Lookups DROP COLUMN Type;
