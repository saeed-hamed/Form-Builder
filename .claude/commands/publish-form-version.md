Safely publish a form version in the Dynamic Form Builder.

Input: $ARGUMENTS
Provide: `form_version_id`
Example: `/publish-form-version 3`

Publishing is a multi-step, irreversible operation. Once a version is published, mutating it directly will corrupt historical submission records (Hook B in settings.json will warn on any direct mutations). Use this command to ensure all steps are done correctly.

## Step 1 — Pre-publish Audit
First, run the form auditor to confirm the version is ready:
```sql
-- Quick integrity pre-check
SELECT version_id, version_number, published FROM FormVersions WHERE version_id = <form_version_id>;
SELECT COUNT(*) AS field_count FROM Fields WHERE form_version_id = <form_version_id>;
SELECT COUNT(*) AS rule_count FROM ConditionalRules WHERE form_version_id = <form_version_id>;
SELECT COUNT(*) AS trigger_count FROM TaskTriggers WHERE form_version_id = <form_version_id>;
```

If any FAIL results exist from `/audit-form`, stop here. Do not publish. Fix the issues first.

## Step 2 — Check for Existing Published Version
```sql
SELECT fv.version_id, fv.version_number, f.form_id, f.title
FROM FormVersions fv
JOIN Forms f ON fv.form_id = f.form_id
WHERE fv.form_id = (SELECT form_id FROM FormVersions WHERE version_id = <form_version_id>)
  AND fv.published = 1
  AND fv.version_id != <form_version_id>;
```

If a result is returned: the old version must be retired first (Step 3 handles this).

## Step 3 — Generate the Publish Transaction

```sql
BEGIN TRANSACTION;

DECLARE @formId INT;
SELECT @formId = form_id FROM FormVersions WHERE version_id = <form_version_id>;

-- Retire all currently published versions for this form
UPDATE FormVersions
SET published = 0
WHERE form_id = @formId AND published = 1;

-- Publish the target version
UPDATE FormVersions
SET published = 1
WHERE version_id = <form_version_id>;

-- Set as the active version on the form
UPDATE Forms
SET active_version_id = <form_version_id>
WHERE form_id = @formId;

-- Verify
SELECT fv.version_id, fv.version_number, fv.published, f.active_version_id
FROM FormVersions fv
JOIN Forms f ON fv.form_id = f.form_id
WHERE fv.form_id = @formId
ORDER BY fv.version_number;

COMMIT TRANSACTION;
```

## Step 4 — Post-publish Confirmation
After running the transaction, confirm:
- `published = 1` on the target version
- `active_version_id` on Forms points to this version
- All other versions for the same form have `published = 0`

## Important Warnings
- Once published, DO NOT directly UPDATE Fields, ConditionalRules, or TaskTriggers for this version
- To make changes after publishing: run `/clone-form-version <form_version_id>` to create a new draft
- The Hook B in settings.json will warn if mutations are attempted on version-related tables
- Existing `FormSubmissions` will always reference their original `form_version_id` — historical data is preserved
