Trace and verify the complete form submission flow for the Dynamic Form Builder.

Input: $ARGUMENTS
Provide: `form_version_id` or form name

Walk through every step of the Task Generation Workflow from CLAUDE.md section 14 and report status.

---

## Step 1 — Submission API Endpoint
- Does `POST /api/submissions` exist in the .NET controller?
- Does it accept: `FormId`, `FormVersionId`, `SubmittedBy`, `Values[]`?
- Does `ModelState` validation run before business logic?
- Does the response include the new `submission_id`?

**Status: [ IMPLEMENTED | STUBBED | MISSING | NOT CHECKED ]**

---

## Step 2 — Submission Values Storage
- Does the service insert into `FormSubmissions` first (capturing `submission_id` via `SCOPE_IDENTITY()`)?
- Does it then insert each value from `Values[]` into `SubmissionValues`?
- Are BOTH inserts wrapped in a single `BEGIN TRANSACTION`?
- On failure: does it `ROLLBACK` and return an appropriate error?

Run this query to verify:
```sql
SELECT fs.submission_id, fs.submitted_by, fs.submitted_at,
       sv.field_id, sv.value
FROM FormSubmissions fs
JOIN SubmissionValues sv ON fs.submission_id = sv.submission_id
WHERE fs.form_version_id = <form_version_id>
ORDER BY fs.submitted_at DESC;
```

**Status: [ IMPLEMENTED | STUBBED | MISSING | NOT CHECKED ]**

---

## Step 3 — Rule Engine Invocation
- Is the Rule Engine (a service or method) called after successful submission?
- Does it accept `formVersionId` and the submitted `values` dictionary?
- Does it load all `TaskTriggers` for the given `form_version_id`?

```sql
SELECT trigger_id, task_id, condition_json
FROM TaskTriggers
WHERE form_version_id = <form_version_id>;
```

**Status: [ IMPLEMENTED | STUBBED | MISSING | NOT CHECKED ]**

---

## Step 4 — Trigger Condition Evaluation
- Does the engine deserialize `condition_json` correctly?
- Does it handle `AND` / `OR` logical operators?
- Does it correctly evaluate all supported operators: `equals`, `not_equals`, `contains`, `is_empty`, `is_not_empty`?
- Are edge cases handled: case sensitivity, null/empty values, unrecognized operators?

**Status: [ IMPLEMENTED | STUBBED | MISSING | NOT CHECKED ]**

---

## Step 5 — Task Creation
- Does the engine insert into `SubmissionTasks` for each matching trigger?
- Is `status` set to `'Pending'`?
- Is `created_at` set to `GETDATE()`?
- Is `completed_at` left NULL on creation?

```sql
SELECT st.submission_task_id, st.task_id, t.name, st.status, st.created_at
FROM SubmissionTasks st
JOIN Tasks t ON st.task_id = t.task_id
WHERE st.submission_id = <submission_id>;
```

**Status: [ IMPLEMENTED | STUBBED | MISSING | NOT CHECKED ]**

---

## Step 6 — Task Assignment / Queue
- Is there a mechanism to notify or assign tasks after creation? (Future enhancement per CLAUDE.md section 18)
- At minimum: are pending tasks queryable via `GET /api/tasks/pending`?

**Status: [ IMPLEMENTED | STUBBED | MISSING | NOT CHECKED | FUTURE ENHANCEMENT ]**

---

## Summary Report
List all steps with their status and output a prioritized gap list:
```
SUBMISSION FLOW AUDIT — form_version_id: <n>
========================================
Step 1 (API Endpoint):          IMPLEMENTED
Step 2 (Value Storage):         IMPLEMENTED
Step 3 (Rule Engine Invoke):    MISSING     ← Priority 1
Step 4 (Condition Evaluation):  MISSING     ← Priority 2
Step 5 (Task Creation):         MISSING     ← Priority 3
Step 6 (Task Assignment):       FUTURE

ACTION: Implement the Rule Engine service and Task Engine before testing end-to-end submission.
Scaffold with: /scaffold-api-endpoint POST /api/submissions | Submit form and trigger task engine
```
