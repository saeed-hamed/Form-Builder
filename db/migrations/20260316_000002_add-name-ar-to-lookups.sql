-- Migration: Add Arabic name to Lookups for bilingual support
-- Affected tables: Lookups (alter)

BEGIN TRANSACTION;

ALTER TABLE Lookups
    ADD NameAr NVARCHAR(255) NULL;

IF @@ERROR = 0
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Migration applied successfully: add-name-ar-to-lookups';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Migration FAILED and was rolled back: add-name-ar-to-lookups';
END

-- DOWN: ALTER TABLE Lookups DROP COLUMN NameAr;
