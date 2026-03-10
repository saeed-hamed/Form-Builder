-- Migration: create-core-schema
-- Date: 2026-03-10 00:00:01
-- Author: [developer name]
-- Affected tables: Forms, FormVersions, Fields, Lookups, LookupValues,
--                  ConditionalRules, Tasks, TaskTriggers,
--                  FormSubmissions, SubmissionValues, SubmissionTasks

BEGIN TRANSACTION;

-- ============================================================
-- UP: Apply migration
-- ============================================================

-- 1. Forms (active_version_id FK added after FormVersions exists)
CREATE TABLE Forms (
    FormId           INT IDENTITY(1,1) PRIMARY KEY,
    Title            NVARCHAR(255) NOT NULL,
    ActiveVersionId  INT NULL,
    CreatedAt        DATETIME NOT NULL DEFAULT GETDATE()
);

-- 2. FormVersions
CREATE TABLE FormVersions (
    VersionId      INT IDENTITY(1,1) PRIMARY KEY,
    FormId         INT NOT NULL,
    VersionNumber  INT NOT NULL,
    DefinitionJson NVARCHAR(MAX) NOT NULL,
    CreatedAt      DATETIME NOT NULL DEFAULT GETDATE(),
    Published      BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_FormVersions_Forms FOREIGN KEY (FormId) REFERENCES Forms(FormId)
);

-- 3. Deferred FK: Forms.ActiveVersionId -> FormVersions.VersionId
ALTER TABLE Forms
    ADD CONSTRAINT FK_Forms_ActiveVersion
    FOREIGN KEY (ActiveVersionId) REFERENCES FormVersions(VersionId);

-- 4. Fields
CREATE TABLE Fields (
    FieldId        INT IDENTITY(1,1) PRIMARY KEY,
    FormVersionId  INT NOT NULL,
    FieldKey       NVARCHAR(100) NOT NULL,
    Label          NVARCHAR(255) NOT NULL,
    FieldType      NVARCHAR(50) NOT NULL,
    LookupId       INT NULL,
    OrderIndex     INT NOT NULL DEFAULT 0,
    Required       BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Fields_FormVersions FOREIGN KEY (FormVersionId) REFERENCES FormVersions(VersionId)
);

-- 5. Lookups
CREATE TABLE Lookups (
    LookupId  INT IDENTITY(1,1) PRIMARY KEY,
    Name      NVARCHAR(255) NOT NULL
);

-- 6. LookupValues
CREATE TABLE LookupValues (
    LookupValueId  INT IDENTITY(1,1) PRIMARY KEY,
    LookupId       INT NOT NULL,
    Value          NVARCHAR(255) NOT NULL,
    OrderIndex     INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_LookupValues_Lookups FOREIGN KEY (LookupId) REFERENCES Lookups(LookupId)
);

-- 7. Add FK from Fields to Lookups (now that Lookups exists)
ALTER TABLE Fields
    ADD CONSTRAINT FK_Fields_Lookups
    FOREIGN KEY (LookupId) REFERENCES Lookups(LookupId);

-- 8. ConditionalRules
CREATE TABLE ConditionalRules (
    RuleId         INT IDENTITY(1,1) PRIMARY KEY,
    FormVersionId  INT NOT NULL,
    SourceFieldId  INT NOT NULL,
    RuleType       NVARCHAR(50) NOT NULL,
    ConditionJson  NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_ConditionalRules_FormVersions FOREIGN KEY (FormVersionId) REFERENCES FormVersions(VersionId),
    CONSTRAINT FK_ConditionalRules_SourceField  FOREIGN KEY (SourceFieldId)  REFERENCES Fields(FieldId)
);

-- 9. Tasks
CREATE TABLE Tasks (
    TaskId      INT IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL
);

-- 10. TaskTriggers
CREATE TABLE TaskTriggers (
    TriggerId      INT IDENTITY(1,1) PRIMARY KEY,
    FormVersionId  INT NOT NULL,
    TaskId         INT NOT NULL,
    ConditionJson  NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_TaskTriggers_FormVersions FOREIGN KEY (FormVersionId) REFERENCES FormVersions(VersionId),
    CONSTRAINT FK_TaskTriggers_Tasks        FOREIGN KEY (TaskId)         REFERENCES Tasks(TaskId)
);

-- 11. FormSubmissions
CREATE TABLE FormSubmissions (
    SubmissionId   INT IDENTITY(1,1) PRIMARY KEY,
    FormId         INT NOT NULL,
    FormVersionId  INT NOT NULL,
    SubmittedBy    NVARCHAR(255) NOT NULL,
    SubmittedAt    DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_FormSubmissions_Forms        FOREIGN KEY (FormId)        REFERENCES Forms(FormId),
    CONSTRAINT FK_FormSubmissions_FormVersions FOREIGN KEY (FormVersionId) REFERENCES FormVersions(VersionId)
);

-- 12. SubmissionValues
CREATE TABLE SubmissionValues (
    SubmissionValueId  INT IDENTITY(1,1) PRIMARY KEY,
    SubmissionId       INT NOT NULL,
    FieldId            INT NOT NULL,
    Value              NVARCHAR(MAX) NULL,
    CONSTRAINT FK_SubmissionValues_FormSubmissions FOREIGN KEY (SubmissionId) REFERENCES FormSubmissions(SubmissionId),
    CONSTRAINT FK_SubmissionValues_Fields          FOREIGN KEY (FieldId)      REFERENCES Fields(FieldId)
);

-- 13. SubmissionTasks
CREATE TABLE SubmissionTasks (
    SubmissionTaskId  INT IDENTITY(1,1) PRIMARY KEY,
    SubmissionId      INT NOT NULL,
    TaskId            INT NOT NULL,
    Status            NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    CreatedAt         DATETIME NOT NULL DEFAULT GETDATE(),
    CompletedAt       DATETIME NULL,
    CONSTRAINT FK_SubmissionTasks_FormSubmissions FOREIGN KEY (SubmissionId) REFERENCES FormSubmissions(SubmissionId),
    CONSTRAINT FK_SubmissionTasks_Tasks           FOREIGN KEY (TaskId)       REFERENCES Tasks(TaskId)
);

-- ============================================================
-- DOWN: Rollback
-- ============================================================
-- ALTER TABLE Forms DROP CONSTRAINT FK_Forms_ActiveVersion;
-- DROP TABLE SubmissionTasks;
-- DROP TABLE SubmissionValues;
-- DROP TABLE FormSubmissions;
-- DROP TABLE TaskTriggers;
-- DROP TABLE Tasks;
-- DROP TABLE ConditionalRules;
-- ALTER TABLE Fields DROP CONSTRAINT FK_Fields_Lookups;
-- DROP TABLE LookupValues;
-- DROP TABLE Lookups;
-- DROP TABLE Fields;
-- ALTER TABLE Forms DROP CONSTRAINT FK_Forms_ActiveVersion;
-- DROP TABLE FormVersions;
-- DROP TABLE Forms;

-- ============================================================
IF @@ERROR = 0
BEGIN
    COMMIT TRANSACTION;
    PRINT 'Migration applied successfully: create-core-schema';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT 'Migration FAILED and was rolled back: create-core-schema';
END
