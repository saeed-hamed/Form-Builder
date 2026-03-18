-- Migration: Create TaskNotes table for task collaboration comments
-- Affected tables: TaskNotes (create)

BEGIN TRANSACTION;

-- ============================================================
-- UP: Apply migration
-- ============================================================

CREATE TABLE TaskNotes (
    NoteId           INT IDENTITY(1,1) PRIMARY KEY,
    SubmissionTaskId INT NOT NULL
        REFERENCES SubmissionTasks(SubmissionTaskId) ON DELETE CASCADE,
    Author           NVARCHAR(255) NOT NULL,
    Body             NVARCHAR(MAX) NOT NULL,
    CreatedAt        DATETIME NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_TaskNotes_SubmissionTaskId ON TaskNotes(SubmissionTaskId);

-- ============================================================
-- DOWN: Rollback (run manually if needed)
-- ============================================================
-- DROP INDEX IX_TaskNotes_SubmissionTaskId ON TaskNotes;
-- DROP TABLE TaskNotes;
-- ============================================================

IF @@ERROR = 0
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Migration applied successfully: add-task-notes';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Migration FAILED and was rolled back: add-task-notes';
END
