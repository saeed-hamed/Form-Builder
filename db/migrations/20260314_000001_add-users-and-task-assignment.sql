-- Migration: Add Users table and task assignment
-- Affected tables: Users (new), SubmissionTasks (alter)

BEGIN TRANSACTION;

-- ============================================================
-- UP: Apply migration
-- ============================================================

CREATE TABLE Users (
    UserId       INT IDENTITY(1,1) PRIMARY KEY,
    Name         NVARCHAR(255) NOT NULL,
    Email        NVARCHAR(255) NOT NULL,
    Role         NVARCHAR(50)  NOT NULL DEFAULT 'member',
    IsActive     BIT           NOT NULL DEFAULT 1,
    CreatedAt    DATETIME      NOT NULL DEFAULT GETDATE(),
    PasswordHash NVARCHAR(MAX) NULL,
    LastLoginAt  DATETIME      NULL,
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);

ALTER TABLE SubmissionTasks
    ADD AssignedToUserId INT NULL
        CONSTRAINT FK_SubmissionTasks_Users FOREIGN KEY REFERENCES Users(UserId);

CREATE INDEX IX_SubmissionTasks_AssignedToUserId
    ON SubmissionTasks(AssignedToUserId);

-- ============================================================
-- DOWN: Rollback (run manually if needed)
-- ============================================================
-- DROP INDEX IX_SubmissionTasks_AssignedToUserId ON SubmissionTasks;
-- ALTER TABLE SubmissionTasks DROP CONSTRAINT FK_SubmissionTasks_Users;
-- ALTER TABLE SubmissionTasks DROP COLUMN AssignedToUserId;
-- DROP TABLE Users;
-- ============================================================

IF @@ERROR = 0
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Migration applied successfully: add-users-and-task-assignment';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Migration FAILED and was rolled back: add-users-and-task-assignment';
END
