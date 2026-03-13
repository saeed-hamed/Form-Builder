import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormService } from '../services/form.service';
import { VersionService } from '../services/version.service';
import { LookupService } from '../services/lookup.service';
import { SubmissionService } from '../services/submission.service';
import { DirectionService } from '../services/direction.service';
import { Field, ConditionalRule, ConditionJsonPayload, Lookup, LookupValue, SubField, SubmissionResponse } from '../models/api.models';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [RouterLink, TranslocoPipe],
  template: `
    <div class="renderer-page">

      <!-- Back link -->
      <a routerLink="/submit" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        {{ 'renderer.allForms' | transloco }}
      </a>

      @if (loading()) {
        <div class="renderer-loading">
          <div class="spinner"></div>
          <span>{{ 'renderer.loading' | transloco }}</span>
        </div>
      } @else if (error()) {
        <div class="renderer-error">{{ error() }}</div>
      } @else if (submitted()) {
        <!-- SUCCESS STATE -->
        <div class="success-card">
          <div class="success-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 class="success-title">{{ 'renderer.submitted' | transloco }}</h2>
          <p class="success-sub">{{ 'renderer.submittedSub' | transloco }}</p>

          @if (submissionResult()?.generatedTasks?.length) {
            <div class="success-tasks">
              <p class="success-tasks-label">{{ 'renderer.tasksLabel' | transloco }}</p>
              @for (task of submissionResult()!.generatedTasks; track task.submissionTaskId) {
                <div class="success-task-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  {{ task.taskName }}
                  <span class="task-chip-status pending">{{ task.status }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="success-notasks">{{ 'renderer.noTasks' | transloco }}</p>
          }

          <div class="success-actions">
            <a routerLink="/submit" class="btn-secondary-link">{{ 'renderer.submitAnother' | transloco }}</a>
            <a routerLink="/my-submissions" class="btn-primary-link">{{ 'renderer.viewSubmissions' | transloco }}</a>
          </div>
        </div>

      } @else {
        <!-- FORM STATE -->
        <div class="form-shell">
          <div class="form-shell-header">
            <h1 class="form-shell-title">{{ formTitle() }}</h1>
          </div>

          <div class="form-shell-body">
            <!-- Dynamic fields -->
            @for (field of visibleFields(); track field.fieldId) {
              <div class="field-group" [class.field-required]="field.required">
                <label class="field-label">
                  {{ fieldLabel(field) }}
                  @if (field.required) { <span class="required-star">*</span> }
                </label>

                @if (field.fieldType === 'yes_no') {
                  <div class="radio-group">
                    <label class="radio-option">
                      <input type="radio" [name]="'f_' + field.fieldKey" value="Yes"
                        [checked]="values()[field.fieldKey] === 'Yes'"
                        (change)="setValue(field.fieldKey, 'Yes')" />
                      <span>{{ 'common.yes' | transloco }}</span>
                    </label>
                    <label class="radio-option">
                      <input type="radio" [name]="'f_' + field.fieldKey" value="No"
                        [checked]="values()[field.fieldKey] === 'No'"
                        (change)="setValue(field.fieldKey, 'No')" />
                      <span>{{ 'common.no' | transloco }}</span>
                    </label>
                  </div>
                }

                @if (field.fieldType === 'list') {
                  <select class="field-input"
                    [value]="values()[field.fieldKey] || ''"
                    (change)="setValue(field.fieldKey, $any($event.target).value)">
                    <option value="">{{ 'renderer.selectOption' | transloco }}</option>
                    @for (opt of lookupOptions(field.lookupId); track opt.lookupValueId) {
                      <option [value]="opt.value">{{ optionLabel(opt) }}</option>
                    }
                  </select>
                }

                @if (field.fieldType === 'date') {
                  <input type="date" class="field-input"
                    [value]="values()[field.fieldKey] || ''"
                    (change)="setValue(field.fieldKey, $any($event.target).value)" />
                }

                @if (field.fieldType === 'text') {
                  <input type="text" class="field-input"
                    [value]="values()[field.fieldKey] || ''"
                    [placeholder]="field.placeholder || ''"
                    (input)="setValue(field.fieldKey, $any($event.target).value)" />
                }

                @if (field.fieldType === 'number') {
                  <input type="number" class="field-input"
                    [value]="values()[field.fieldKey] || ''"
                    [placeholder]="field.placeholder || ''"
                    (input)="setValue(field.fieldKey, $any($event.target).value)" />
                }

                @if (field.fieldType === 'repeater') {
                  <div class="repeater-wrap">
                    @if (repeaterSubFields(field).length === 0) {
                      <p class="rep-no-subfields">{{ 'renderer.noSubFields' | transloco }}</p>
                    } @else {
                      <table class="repeater-table">
                        <thead>
                          <tr>
                            @for (sf of repeaterSubFields(field); track sf.key) {
                              <th>{{ sf.label }}</th>
                            }
                            <th style="width:2rem"></th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of repeaterRows(field.fieldKey); track $index; let ri = $index) {
                            <tr>
                              @for (sf of repeaterSubFields(field); track sf.key) {
                                <td>
                                  @if (sf.type === 'text') {
                                    <input class="rep-input" type="text" [value]="row[sf.key] || ''"
                                      (input)="onRepeaterCell(field.fieldKey, ri, sf.key, $any($event.target).value)" />
                                  }
                                  @if (sf.type === 'number') {
                                    <input class="rep-input" type="number" [value]="row[sf.key] || ''"
                                      (input)="onRepeaterCell(field.fieldKey, ri, sf.key, $any($event.target).value)" />
                                  }
                                  @if (sf.type === 'list') {
                                    <select class="rep-select" [value]="row[sf.key] || ''"
                                      (change)="onRepeaterCell(field.fieldKey, ri, sf.key, $any($event.target).value)">
                                      <option value="">—</option>
                                      @for (opt of lookupOptions(sf.lookupId ?? null); track opt.lookupValueId) {
                                        <option [value]="opt.value">{{ opt.value }}</option>
                                      }
                                    </select>
                                  }
                                  @if (sf.type === 'yes_no') {
                                    <select class="rep-select" [value]="row[sf.key] || ''"
                                      (change)="onRepeaterCell(field.fieldKey, ri, sf.key, $any($event.target).value)">
                                      <option value="">—</option>
                                      <option value="Yes">{{ 'common.yes' | transloco }}</option>
                                      <option value="No">{{ 'common.no' | transloco }}</option>
                                    </select>
                                  }
                                </td>
                              }
                              <td>
                                <button type="button" class="rep-remove" (click)="removeRepeaterRow(field.fieldKey, ri)">✕</button>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                      <button type="button" class="rep-add-btn" (click)="addRepeaterRow(field.fieldKey)">{{ 'renderer.addRow' | transloco }}</button>
                    }
                  </div>
                }
              </div>
            }

            <!-- Submit -->
            <div class="form-actions">
              @if (submitError()) {
                <p class="submit-error">{{ submitError() }}</p>
              }
              <button
                class="btn-submit"
                [disabled]="!canSubmit() || submitting()"
                (click)="onSubmit()"
              >
                @if (submitting()) {
                  <span class="btn-spinner"></span> {{ 'renderer.submitting' | transloco }}
                } @else {
                  {{ 'renderer.submit' | transloco }}
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .renderer-page {
      padding: 1.5rem 2rem;
      max-width: 680px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: var(--tx4);
      text-decoration: none;
      margin-bottom: 1.25rem;
      transition: color 0.15s;
    }
    .back-link:hover { color: #10b981; }

    .renderer-loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 4rem;
      color: var(--tx4);
    }

    .spinner, .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid var(--bd);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    .btn-spinner { width: 14px; height: 14px; border-top-color: #fff; display: inline-block; }

    @keyframes spin { to { transform: rotate(360deg); } }

    .renderer-error {
      background: var(--error-bg);
      color: #f87171;
      border: 1px solid var(--error-border);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
    }

    /* Form shell */
    .form-shell {
      background: var(--sf);
      border: 1px solid var(--bd);
      border-radius: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      overflow: hidden;
    }

    .form-shell-header {
      padding: 1.25rem 1.5rem 1rem;
      border-bottom: 1px solid var(--bds);
      background: var(--sf2);
    }

    .form-shell-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--tx);
      letter-spacing: -0.01em;
      margin: 0;
    }

    .form-shell-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    .fields-divider {
      border-top: 1px dashed var(--bd);
      margin: 0.25rem 0;
    }

    .field-group { display: flex; flex-direction: column; gap: 0.375rem; }

    .field-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--tx3);
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }

    .required-star { color: #e11d48; }

    .field-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--bdi);
      border-radius: 8px;
      font-size: 0.875rem;
      color: var(--tx);
      background: var(--bg);
      transition: border-color 0.15s, box-shadow 0.15s;
      width: 100%;
      box-sizing: border-box;
    }

    .field-input:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
    }

    .radio-group { display: flex; gap: 1.25rem; }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.875rem;
      color: var(--tx3);
      cursor: pointer;
      user-select: none;
    }

    .radio-option input[type="radio"] {
      width: 16px;
      height: 16px;
      appearance: none;
      -webkit-appearance: none;
      border: 2px solid var(--bdi);
      border-radius: 50%;
      background: var(--bg);
      cursor: pointer;
      flex-shrink: 0;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }

    .radio-option input[type="radio"]:checked {
      border-color: #10b981;
      background: #10b981;
      box-shadow: inset 0 0 0 3px var(--sf);
    }

    .radio-option input[type="radio"]:focus-visible {
      outline: 2px solid rgba(16,185,129,0.4);
      outline-offset: 2px;
    }

    /* Repeater */
    .repeater-wrap { display: flex; flex-direction: column; gap: 0.5rem; }

    .rep-no-subfields {
      font-size: 0.8125rem;
      color: var(--warn-color);
      background: var(--warn-bg);
      border: 1px solid var(--warn-border);
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      margin: 0;
    }

    .repeater-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .repeater-table th {
      text-align: left;
      font-weight: 500;
      color: var(--tx4);
      padding: 0.25rem 0.375rem;
      border-bottom: 1px solid var(--bds);
      background: var(--sf2);
    }

    .repeater-table td { padding: 0.25rem 0.375rem; vertical-align: middle; }

    .rep-input, .rep-select {
      width: 100%;
      padding: 0.25rem 0.375rem;
      font-size: 0.8rem;
      border: 1px solid var(--bdi);
      border-radius: 4px;
      background: var(--bg);
      color: var(--tx);
    }

    .rep-remove {
      background: none;
      border: none;
      color: #f87171;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.125rem 0.25rem;
      border-radius: 4px;
    }

    .rep-remove:hover { background: rgba(225,29,72,0.15); }

    .rep-add-btn {
      align-self: flex-start;
      background: none;
      border: 1px dashed var(--bdi);
      color: var(--tx4);
      font-size: 0.8125rem;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
    }

    .rep-add-btn:hover { border-color: #10b981; color: #10b981; background: rgba(16,185,129,0.1); }

    /* Submit row */
    .form-actions {
      padding-top: 0.75rem;
      border-top: 1px solid var(--bds);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .submit-error {
      font-size: 0.8125rem;
      color: #f87171;
      background: var(--error-bg);
      border: 1px solid var(--error-border);
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      margin: 0;
    }

    .btn-submit {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #059669, #10b981);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0.6875rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
      width: 100%;
    }

    .btn-submit:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    /* Success state */
    .success-card {
      background: var(--sf);
      border: 1px solid var(--bd);
      border-radius: 14px;
      padding: 2rem 2rem 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
    }

    .success-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin-bottom: 0.5rem;
    }

    .success-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--tx);
      margin: 0;
    }

    .success-sub {
      font-size: 0.875rem;
      color: var(--tx4);
      margin: 0;
    }

    .success-tasks {
      width: 100%;
      background: var(--sf2);
      border: 1px solid var(--bd);
      border-radius: 10px;
      padding: 0.875rem 1rem;
      margin-top: 0.5rem;
      text-align: left;
    }

    .success-tasks-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--tx4);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 0 0.5rem;
    }

    .success-task-chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      color: var(--tx3);
      padding: 0.3rem 0;
    }

    .task-chip-status {
      margin-left: auto;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
    }

    .task-chip-status.pending {
      background: rgba(245,158,11,0.15);
      color: #f59e0b;
    }

    .success-notasks {
      font-size: 0.8125rem;
      color: var(--tx3);
      margin: 0.25rem 0;
    }

    .success-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .btn-primary-link {
      background: linear-gradient(135deg, #059669, #10b981);
      color: #fff;
      text-decoration: none;
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .btn-secondary-link {
      color: var(--tx3);
      text-decoration: none;
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid var(--bdi);
    }

    .btn-secondary-link:hover { background: var(--sf2); }
  `]
})
export class FormRendererComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private formService = inject(FormService);
  private versionService = inject(VersionService);
  private lookupService = inject(LookupService);
  private submissionService = inject(SubmissionService);
  private dir = inject(DirectionService);

  formId = signal(0);
  versionId = signal(0);
  formTitle = signal('');
  fields = signal<Field[]>([]);
  rules = signal<ConditionalRule[]>([]);
  lookups = signal<Lookup[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  submissionResult = signal<SubmissionResponse | null>(null);

  values = signal<Record<string, string>>({});

  // Conditional visibility (same logic as form-preview)
  private visibilityMap = computed<Record<string, boolean>>(() => {
    const fields = this.fields();
    const rules = this.rules();
    const vals = this.values();

    const showTargets = new Set<string>();
    for (const rule of rules) {
      const p = this.parsePayload(rule.conditionJson);
      if (!p) continue;
      for (const a of p.actions) {
        if (a.type === 'show') showTargets.add(a.target_field);
      }
    }

    const vis: Record<string, boolean> = {};
    for (const f of fields) vis[f.fieldKey] = !showTargets.has(f.fieldKey);

    for (const rule of rules) {
      const p = this.parsePayload(rule.conditionJson);
      if (!p) continue;
      const srcVal = vals[rule.sourceFieldKey] ?? '';
      if (this.evaluate(p.operator, srcVal, p.value)) {
        for (const a of p.actions) {
          if (a.type === 'show') vis[a.target_field] = true;
          else if (a.type === 'hide') vis[a.target_field] = false;
        }
      }
    }
    return vis;
  });

  visibleFields = computed<Field[]>(() =>
    this.fields()
      .filter(f => this.visibilityMap()[f.fieldKey] !== false)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  );

  canSubmit = computed(() => this.versionId() > 0);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('formId'));
    this.formId.set(id);
    this.loadForm(id);
  }

  loadForm(formId: number) {
    this.loading.set(true);
    let done = 0;
    const check = () => { if (++done === 3) this.loading.set(false); };

    this.formService.getById(formId).subscribe({
      next: form => {
        this.formTitle.set(form.title);
        if (!form.activeVersionId) {
          this.error.set('This form has no published version.');
          this.loading.set(false);
          return;
        }
        this.versionId.set(form.activeVersionId);

        this.versionService.getFields(form.activeVersionId).subscribe({
          next: f => { this.fields.set(f); check(); },
          error: () => check()
        });
        this.versionService.getRules(form.activeVersionId).subscribe({
          next: r => { this.rules.set(r); check(); },
          error: () => check()
        });
      },
      error: () => { this.error.set('Form not found.'); this.loading.set(false); }
    });

    this.lookupService.getAll().subscribe({
      next: l => { this.lookups.set(l); check(); },
      error: () => check()
    });
  }

  setValue(key: string, value: string) {
    this.values.update(v => ({ ...v, [key]: value }));
  }

  fieldLabel(field: Field): string {
    return (this.dir.isRtl() && field.labelAr) ? field.labelAr : field.label;
  }

  optionLabel(opt: LookupValue): string {
    return (this.dir.isRtl() && opt.valueAr) ? opt.valueAr : opt.value;
  }

  lookupOptions(lookupId: number | null): LookupValue[] {
    if (!lookupId) return [];
    const lkp = this.lookups().find(l => l.lookupId === lookupId);
    return lkp ? [...lkp.values].sort((a, b) => a.orderIndex - b.orderIndex) : [];
  }

  repeaterSubFields(field: Field): SubField[] {
    if (!field.subFieldsJson) return [];
    try { return JSON.parse(field.subFieldsJson); } catch { return []; }
  }

  repeaterRows(fieldKey: string): Record<string, string>[] {
    const raw = this.values()[fieldKey];
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  addRepeaterRow(fieldKey: string) {
    this.setValue(fieldKey, JSON.stringify([...this.repeaterRows(fieldKey), {}]));
  }

  removeRepeaterRow(fieldKey: string, index: number) {
    this.setValue(fieldKey, JSON.stringify(this.repeaterRows(fieldKey).filter((_, i) => i !== index)));
  }

  onRepeaterCell(fieldKey: string, rowIndex: number, cellKey: string, value: string) {
    const rows = this.repeaterRows(fieldKey).map((r, i) =>
      i === rowIndex ? { ...r, [cellKey]: value } : r
    );
    this.setValue(fieldKey, JSON.stringify(rows));
  }

  onSubmit() {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitError.set(null);
    this.submitting.set(true);

    const vals = this.values();
    const submissionValues = this.visibleFields()
      .map(f => ({ fieldId: f.fieldId, value: vals[f.fieldKey] ?? '' }));

    const nameField = this.fields().find(f =>
      f.fieldType === 'text' && (f.fieldKey.includes('name') || f.fieldKey.includes('Name'))
    );
    const submittedBy = (nameField && vals[nameField.fieldKey]?.trim()) || 'Anonymous';

    this.submissionService.submit({
      formId: this.formId(),
      formVersionId: this.versionId(),
      submittedBy,
      values: submissionValues
    }).subscribe({
      next: result => {
        this.submissionResult.set(result);
        this.submitted.set(true);
        this.submitting.set(false);
      },
      error: () => {
        this.submitError.set('Failed to submit. Please try again.');
        this.submitting.set(false);
      }
    });
  }

  private parsePayload(json: string): ConditionJsonPayload | null {
    try { return JSON.parse(json); } catch { return null; }
  }

  private evaluate(operator: string, actual: string, expected: string): boolean {
    const a = (actual ?? '').toLowerCase().trim();
    const e = (expected ?? '').toLowerCase().trim();
    switch (operator) {
      case 'equals':       return a === e;
      case 'not_equals':   return a !== e;
      case 'contains':     return a.includes(e);
      case 'is_empty':     return a === '';
      case 'is_not_empty': return a !== '';
      default:             return false;
    }
  }
}
