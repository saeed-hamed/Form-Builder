Scaffold an Angular component or service for the Dynamic Form Builder UI.

Input: $ARGUMENTS
Expected format: `ComponentName | purpose description`
Example: `ConditionalRuleBuilder | Visual editor for defining conditional UI rules on form fields`

## 1. Angular Component File
File path: `src/frontend/src/app/<feature-folder>/<component-name>/<component-name>.component.ts`

```typescript
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormApiService } from '../../services/form-api.service';

@Component({
  selector: 'app-<component-name>',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './<component-name>.component.html',
  styleUrl: './<component-name>.component.scss'
})
export class <ComponentName>Component implements OnInit {
  // Derive @Input properties from CLAUDE.md schema based on component purpose:
  // - Form Builder UI (section 15): formVersionId, fields, rules, triggers
  // - Form Renderer (section 2.2): formDefinition, submissionId
  // - Rule Builder (section 9): sourceField, targetField, operator, actionType

  @Input() // <-- derive from purpose

  private readonly formApiService = inject(FormApiService);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.initForm();
    // TODO: Load required data via formApiService
  }

  private initForm(): void {
    this.form = this.fb.group({
      // Define FormControls based on the component's purpose
    });
  }
}
```

## 2. TypeScript Interface
Generate a typed interface in `src/frontend/src/app/models/` for the component's data shape.
Map property names to CLAUDE.md schemas:
- FormDefinition (section 16): formId, version, title, fields[]
- Field (section 7): fieldId, fieldKey, label, fieldType, lookupId, orderIndex, required
- ConditionalRule (section 9): ruleId, sourceFieldId, ruleType, conditionJson
- TaskTrigger (section 11): triggerId, formVersionId, taskId, conditionJson

## 3. HTML Template Stub
File path: `src/frontend/src/app/<feature-folder>/<component-name>/<component-name>.component.html`

Generate a minimal template skeleton:
- Use Angular `*ngIf` / `@if` for loading and error states
- Use `[formGroup]` and `formControlName` for reactive form binding
- Add `aria-label` attributes to all interactive controls
- Dropdowns for field selection should bind to observable data sources

## 4. API Service Integration
If the component needs to fetch data, add the relevant method to `FormApiService`:
- Form Builder components call: `getFormVersion()`, `getFields()`, `getLookupValues()`
- Rule Builder components call: `saveConditionalRule()`, `saveTaskTrigger()`
- Form Renderer components call: `getFormDefinition()`, `submitForm()`

All methods return `Observable<T>` and use `HttpClient`.

## 5. Form Builder UI Placement
Based on the component purpose, note where it fits in the admin UI (CLAUDE.md section 15):
- **Form Management**: top-level form list and editor
- **Field Builder**: field list, field type selector, lookup linker
- **Conditional Rule Builder**: source/target field dropdowns, operator/action selectors
- **Task Rule Builder**: task selector, multi-condition builder with AND/OR logic

## 6. Routing Note
If this is a routable page component, remind me to add the route to `app.routes.ts`:
```typescript
{ path: 'forms/:id/builder', component: <ComponentName>Component }
```
