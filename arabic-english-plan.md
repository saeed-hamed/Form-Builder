# Arabic / English i18n + RTL/LTR Support — Milestone Plan

**Status:** Planning
**Date:** 2026-03-11
**Scope:** Full bilingual support (UI shell + form content)

---

## Context

The Form Builder currently has no i18n, no RTL support, and uses `Plus Jakarta Sans` (no Arabic glyphs). The goal is to support Arabic and English simultaneously, with direction-aware layout (RTL for Arabic, LTR for English), at both the UI chrome level and form content level.

---

## Two Distinct Problems

| Problem | Scope |
|---|---|
| **UI chrome i18n** | Buttons, nav, labels, system messages in admin & client shell |
| **Form content i18n** | Field labels, lookup values, task names entered by the admin |

---

## Phase 1 — Direction Service & Font (Foundation)

**Goal:** Make the layout direction-aware without any translation yet.

### 1.1 DirectionService
- Create `src/frontend/src/app/services/direction.service.ts`
- Mirror `theme.service.ts` pattern exactly (Signal-based, LocalStorage)
- Signal: `dir = signal<'ltr' | 'rtl'>('ltr')`
- On toggle: set `document.documentElement.setAttribute('dir', ...)` and `lang` attribute
- LocalStorage key: `fb-lang` (store `'en'` or `'ar'`)
- Inject in `app.ts`, add language toggle button to topbar (next to theme toggle)

### 1.2 Arabic Font
- Add **Tajawal** (Google Fonts or self-hosted) — visual weight closest to Plus Jakarta Sans
- Fallback font stack via CSS variable:
  ```css
  :root { --font: 'Plus Jakarta Sans', system-ui; }
  [dir=rtl] { --font: 'Tajawal', 'Plus Jakarta Sans', system-ui; }
  ```
- Apply `font-family: var(--font)` on `body` in `styles.scss`

### 1.3 CSS Logical Properties Migration (`styles.scss`)
- Replace physical properties with logical equivalents:
  - `margin-left` → `margin-inline-start`
  - `padding-right` → `padding-inline-end`
  - `border-left` → `border-inline-start`
  - `left: 0` → `inset-inline-start: 0`
  - `margin-left: 232px` (main content offset) → `margin-inline-start: 232px`
- Key layout classes to update: `.page`, `.fe-left`, `.fe-right`, `.fe-header`, `.card`, sidebar positioning
- Angular CDK `Directionality` injectable for components needing programmatic direction (modals, overlays)

### 1.4 Directional Icons
- Arrows, chevrons, back buttons need mirroring in RTL
- Strategy: `[dir=rtl] .icon-dir { transform: scaleX(-1); }`
- Apply `.icon-dir` class only to icons with directional meaning (not decorative icons)

---

## Phase 2 — UI Translation (Transloco)

**Goal:** All static UI text switchable between EN and AR at runtime.

### 2.1 Install & Configure Transloco
```bash
ng add @jsverse/transloco
```
- Runtime loading (not compile-time like `@angular/localize`)
- Translation files: `src/assets/i18n/en.json` and `src/assets/i18n/ar.json`
- Lazy-loaded scopes per feature module (form-builder scope, client scope, etc.)

### 2.2 Translation Key Convention
```json
// en.json
{
  "nav.dashboard": "Dashboard",
  "nav.forms": "Forms",
  "nav.lookups": "Lookups",
  "nav.tasks": "Tasks",
  "nav.submit": "Submit a Form",
  "nav.submissions": "My Submissions",
  "nav.taskBoard": "Task Board",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.publish": "Publish",
  "forms.newForm": "New Form",
  "forms.addField": "Add Field"
}
```
- Flat key structure with dot-namespaced sections
- `*transloco="let t"` structural directive in templates
- `{{ t('key') }}` or `translocoService.translate('key')` in TS

### 2.3 Integration Points
- `app.html` — nav labels, topbar buttons
- All component templates — buttons, headings, empty states, error messages
- `TranslocoService` in `form-api.service.ts` for error message localization

---

## Phase 3 — Form Content Bilingualism (DB + JSON)

**Goal:** Admins can enter Arabic and English labels for fields and lookup values.

### 3.1 Decision: Extend definition_json (Option A)

Change field label convention from a string to a locale object:

```json
{
  "key": "has_work",
  "label": { "en": "Do you have work?", "ar": "هل لديك عمل؟" },
  "type": "yes_no"
}
```

For lookup values:
- Add `label_ar NVARCHAR(255) NULL` to `LookupValues` table (simpler querying)
- Add `label_ar NVARCHAR(255) NULL` to `Fields` table

### 3.2 Migration Required
- New migration: `db/migrations/YYYYMMDD_HHMMSS_add_label_ar_columns.sql`
- Add `label_ar` to `Fields` and `LookupValues` tables
- Existing rows: `label_ar` defaults to NULL (renderer falls back to EN label)

### 3.3 Admin UI Changes (Form Editor)
- `fields-tab` component: each field row shows two label inputs (EN / AR) side by side
- `lookup-list` component: each lookup value row shows EN + AR value inputs
- Form definition JSON builder: serialize labels as `{ en, ar }` objects

### 3.4 Form Renderer Changes
- `form-renderer.component.ts`: read active language from DirectionService
- Resolve label: `field.label[activeLang] ?? field.label.en ?? field.label`
- Supports graceful fallback: AR missing → shows EN

### 3.5 Backend DTOs
- `FieldDto`: add `LabelAr` property
- `LookupValueDto`: add `LabelAr` property
- Field creation endpoint: accept and store `label_ar`

---

## Phase 4 — User Preference Persistence

| Store | When |
|---|---|
| **LocalStorage** (`fb-lang`) | Now — anonymous users |
| **User profile in DB** | When authentication is added |
| **URL prefix** (`/ar/`, `/en/`) | Future — if SEO or link sharing is needed |

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/frontend/src/app/services/direction.service.ts` | Create (new) |
| `src/frontend/src/app/app.ts` | Modify — inject DirectionService, add lang toggle |
| `src/frontend/src/app/app.html` | Modify — lang toggle button in topbar |
| `src/frontend/src/styles.scss` | Modify — logical properties, font variable, `[dir=rtl]` blocks |
| `src/assets/i18n/en.json` | Create (new) |
| `src/assets/i18n/ar.json` | Create (new) |
| `db/migrations/YYYYMMDD_add_label_ar_columns.sql` | Create (new) |
| `src/backend/DTOs/FieldDto.cs` | Modify — add LabelAr |
| `src/backend/DTOs/LookupValueDto.cs` | Modify — add LabelAr |
| All component templates (`*.html`) | Modify — use transloco keys |
| `src/frontend/src/app/form-builder/form-editor/version-editor/fields-tab/` | Modify — dual label inputs |
| `src/frontend/src/app/client/form-renderer.component.ts` | Modify — locale-aware label resolution |

---

## Recommended Implementation Order

1. **DirectionService** + font + `[dir]` on `<html>` → visual RTL flip working
2. **CSS logical properties** migration in `styles.scss` → layout correct in both directions
3. **Directional icon** mirroring → polish
4. **Transloco install** + translation files → UI text switchable
5. **DB migration** + `label_ar` columns → schema ready
6. **Admin UI** dual-label inputs → admins can author bilingual forms
7. **Form renderer** locale-aware label resolution → users see correct language

---

## Key Dependencies

- `@jsverse/transloco` — runtime i18n
- `@angular/cdk` (already likely present) — `Directionality` service
- **Tajawal** font — Arabic typeface
- New SQL migration for `label_ar` columns

---

## Open Questions (decide before Phase 3)

- [ ] Should task names/descriptions (`Tasks` table) also be bilingual?
- [ ] Should conditional rule labels and trigger labels be translated?
- [ ] URL-based locale routing needed for external sharing / SEO?
- [ ] Will authentication be added before this milestone ships? (affects preference storage)
