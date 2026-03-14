# Form Builder — Roadmap & Extension Ideas

> Current state: Dynamic forms, conditional UI rules, task trigger rules, Kanban task board, form submission flow, Arabic/English i18n, dark/light theming.

---

## Task System Extensions

### A. Task Assignment / Ownership
Assign tasks to specific people and show the assignee on task cards.
- **DB:** `ALTER TABLE SubmissionTasks ADD AssignedTo NVARCHAR(255) NULL`
- **UI:** Dropdown on task card to pick assignee
- **Value:** Tasks become actionable by specific people

### B. Task Due Dates / SLA
Track deadlines and surface overdue tasks visually.
- **DB:** `ALTER TABLE SubmissionTasks ADD DueDate DATETIME NULL`
- **UI:** Red overdue badge on task cards, sortable by due date
- **Value:** Accountability and urgency visibility

### C. Task Notes / Comments
Collaboration thread on each task card.
- **DB:** New `TaskNotes` table — `NoteId, SubmissionTaskId, Author, Body, CreatedAt`
- **UI:** Expandable comment section on task cards
- **Value:** Teams can discuss tasks without leaving the app

### D. Task Detail Modal / Drawer
Click a task card to open a full detail view.
- Shows: submission values that triggered the task, status history, notes, assignee
- **Value:** Context-rich task handling without navigating away

### E. Task Board Filters
Filter the Kanban board by form, assignee, date range, overdue status.
- **Value:** Useful as task volume grows

---

## New Field Types

| Type | Description | Effort |
|------|-------------|--------|
| `textarea` | Multi-line text input — no DB change needed | Low |
| `multi_select` | Checkboxes from a Lookup list — works with existing `contains` operator | Medium |
| `rating` | 1–5 star picker, stored as number string | Low |
| `section_header` | Visual label/divider to group fields — no submission value stored | Low |
| `file_upload` | File attachments — requires storage strategy (local or Azure Blob) | High |

---

## Workflow Extensions

### A. Multi-Step Form Wizard
Split a form into pages with Next/Back navigation and a step indicator.
- **DB:** Add `StepIndex INT` to `Fields` table
- **UI:** Step progress bar, conditional step skipping based on rules
- **Value:** Better UX for long forms

### B. Conditional Required Fields
A field becomes required only when another field has a specific value.
- **Extend:** `ConditionalRules` with a new action type `set_required`
- **Value:** Smarter validation without cluttering forms

### C. Task-to-Form Chaining
Completing a task triggers a follow-up form to be filled in.
- **DB:** Add `FollowUpFormVersionId INT NULL` to `Tasks` table
- **UI:** "Complete & Fill Follow-up" button on task card
- **Value:** Chains workflows (e.g., Interview task → Hire Decision form → Onboarding task)

### D. Scheduled / Delayed Tasks
Create a task N days after submission instead of immediately.
- **DB:** Add `DelayDays INT DEFAULT 0` to `TaskTriggers`
- **Backend:** Daily background job (Hosted Service) to check and create pending delayed tasks
- **Value:** Reminders, follow-ups, SLA enforcement

### E. Email Notifications
Send email when a task is created, assigned, or overdue.
- **Backend:** .NET `IEmailSender` abstraction, SMTP or SendGrid provider
- **Config:** SMTP settings in `appsettings.json`
- **Value:** People know when they have work to do

### F. Submission Analytics Dashboard
Admin stats page using existing relational data — no schema changes needed.
- Total submissions per form (by date range)
- Task completion rates
- Average time to complete tasks
- Most triggered task types
- **Value:** Visibility into form and workflow performance

---

## Recommended Build Order

| # | Feature | Effort | Value |
|---|---------|--------|-------|
| 1 | `textarea` field type | 1 day | Medium |
| 2 | Task due dates + overdue indicator | 1 day | High |
| 3 | Task assignment | 1–2 days | High |
| 4 | `multi_select` field type | 2 days | High |
| 5 | Task detail modal | 2 days | High |
| 6 | Task-to-Form chaining | 3 days | Very High |
| 7 | Multi-step form wizard | 3–4 days | Very High |
| 8 | Analytics dashboard | 2 days | Medium |
| 9 | Conditional required fields | 1 day | Medium |
| 10 | Email notifications | 2 days | High |
| 11 | Scheduled/delayed tasks | 2–3 days | Medium |
