using Dapper;
using FormBuilder.Models;
using System.Data;

namespace FormBuilder.Repositories;

public class FormRepository : IFormRepository
{
    private readonly IDbConnection _db;

    public FormRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Form>> GetAllAsync()
    {
        return await _db.QueryAsync<Form>(
            "SELECT FormId, Title, ActiveVersionId, CreatedAt FROM Forms ORDER BY CreatedAt DESC");
    }

    public async Task<Form?> GetByIdAsync(int formId)
    {
        return await _db.QuerySingleOrDefaultAsync<Form>(
            "SELECT FormId, Title, ActiveVersionId, CreatedAt FROM Forms WHERE FormId = @FormId",
            new { FormId = formId });
    }

    public async Task<int> CreateAsync(string title)
    {
        return await _db.ExecuteScalarAsync<int>("""
            INSERT INTO Forms (Title, CreatedAt)
            VALUES (@Title, GETUTCDATE());
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """,
            new { Title = title });
    }

    public async Task<bool> UpdateAsync(int formId, string title)
    {
        var rows = await _db.ExecuteAsync(
            "UPDATE Forms SET Title = @Title WHERE FormId = @FormId",
            new { Title = title, FormId = formId });
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int formId)
    {
        var rows = await _db.ExecuteAsync("""
            BEGIN TRANSACTION;

            -- Nullify active version reference first to avoid circular FK
            UPDATE Forms SET ActiveVersionId = NULL WHERE FormId = @FormId;

            -- Delete submission-level dependents
            DELETE sv FROM SubmissionValues sv
                INNER JOIN FormSubmissions fs ON sv.SubmissionId = fs.SubmissionId
                WHERE fs.FormId = @FormId;

            DELETE st FROM SubmissionTasks st
                INNER JOIN FormSubmissions fs ON st.SubmissionId = fs.SubmissionId
                WHERE fs.FormId = @FormId;

            DELETE FROM FormSubmissions WHERE FormId = @FormId;

            -- Delete version-level dependents
            DELETE cr FROM ConditionalRules cr
                INNER JOIN FormVersions fv ON cr.FormVersionId = fv.VersionId
                WHERE fv.FormId = @FormId;

            DELETE tt FROM TaskTriggers tt
                INNER JOIN FormVersions fv ON tt.FormVersionId = fv.VersionId
                WHERE fv.FormId = @FormId;

            DELETE f FROM Fields f
                INNER JOIN FormVersions fv ON f.FormVersionId = fv.VersionId
                WHERE fv.FormId = @FormId;

            DELETE FROM FormVersions WHERE FormId = @FormId;

            -- Finally delete the form
            DELETE FROM Forms WHERE FormId = @FormId;

            COMMIT;
            """,
            new { FormId = formId });
        return rows > 0;
    }

    public async Task<bool> SetActiveVersionAsync(int formId, int versionId)
    {
        var rows = await _db.ExecuteAsync(
            "UPDATE Forms SET ActiveVersionId = @VersionId WHERE FormId = @FormId",
            new { VersionId = versionId, FormId = formId });
        return rows > 0;
    }

    public async Task<IEnumerable<FormVersion>> GetVersionsByFormIdAsync(int formId)
    {
        return await _db.QueryAsync<FormVersion>(
            "SELECT VersionId, FormId, VersionNumber, DefinitionJson, CreatedAt, Published FROM FormVersions WHERE FormId = @FormId ORDER BY VersionNumber DESC",
            new { FormId = formId });
    }

    public async Task<FormVersion?> GetVersionByIdAsync(int versionId)
    {
        return await _db.QuerySingleOrDefaultAsync<FormVersion>(
            "SELECT VersionId, FormId, VersionNumber, DefinitionJson, CreatedAt, Published FROM FormVersions WHERE VersionId = @VersionId",
            new { VersionId = versionId });
    }

    public async Task<int> CreateVersionAsync(int formId, string definitionJson)
    {
        return await _db.ExecuteScalarAsync<int>("""
            DECLARE @NextVersion INT;
            SELECT @NextVersion = ISNULL(MAX(VersionNumber), 0) + 1
            FROM FormVersions WHERE FormId = @FormId;

            INSERT INTO FormVersions (FormId, VersionNumber, DefinitionJson, CreatedAt, Published)
            VALUES (@FormId, @NextVersion, @DefinitionJson, GETUTCDATE(), 0);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """,
            new { FormId = formId, DefinitionJson = definitionJson });
    }

    public async Task<bool> PublishVersionAsync(int formId, int versionId)
    {
        var rows = await _db.ExecuteAsync("""
            BEGIN TRANSACTION;
            UPDATE FormVersions SET Published = 1 WHERE VersionId = @VersionId AND FormId = @FormId;
            UPDATE Forms SET ActiveVersionId = @VersionId WHERE FormId = @FormId;
            COMMIT;
            """,
            new { VersionId = versionId, FormId = formId });
        return rows > 0;
    }
}
