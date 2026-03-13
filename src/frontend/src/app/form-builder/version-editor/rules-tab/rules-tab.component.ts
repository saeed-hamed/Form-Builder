import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { VersionService } from '../../../services/version.service';
import { ConditionalRule, ConditionJsonPayload, Field } from '../../../models/api.models';

const OPERATORS = [
  { value: 'equals', label: 'equals', labelKey: 'op.equals' },
  { value: 'not_equals', label: 'does not equal', labelKey: 'op.not_equals' },
  { value: 'contains', label: 'contains', labelKey: 'op.contains' },
  { value: 'is_empty', label: 'is empty', labelKey: 'op.is_empty' },
  { value: 'is_not_empty', label: 'is not empty', labelKey: 'op.is_not_empty' },
];

const ACTIONS = [
  { value: 'show', label: 'Show', labelKey: 'action.show' },
  { value: 'hide', label: 'Hide', labelKey: 'action.hide' },
  { value: 'enable', label: 'Enable', labelKey: 'action.enable' },
  { value: 'disable', label: 'Disable', labelKey: 'action.disable' },
];

@Component({
  selector: 'app-rules-tab',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoPipe],
  template: `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600;color:var(--tx2)">{{ 'rules.heading' | transloco }}</h3>
        <button class="btn-primary btn-sm" (click)="toggleAddForm()">
          {{ (showAddForm() ? 'common.cancel' : 'rules.addRule') | transloco }}
        </button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (showAddForm()) {
        <div class="card">
          <h3>{{ (editingRule() ? 'rules.editRule' : 'rules.newRule') | transloco }}</h3>
          <p style="font-size:0.85rem;color:var(--tx4);margin-bottom:1rem">
            {{ 'rules.hint' | transloco }}
          </p>
          <form [formGroup]="ruleFg" (ngSubmit)="submitRule()">
            <div class="form-grid-2">
              <div class="form-row">
                <label>{{ 'rules.sourceField' | transloco }}</label>
                <select formControlName="sourceFieldId">
                  <option [value]="0" disabled>{{ 'rules.selectField' | transloco }}</option>
                  @for (f of fields(); track f.fieldId) {
                    <option [value]="f.fieldId">{{ f.label }} ({{ f.fieldKey }})</option>
                  }
                </select>
              </div>
              <div class="form-row">
                <label>{{ 'rules.operator' | transloco }}</label>
                <select formControlName="operator">
                  @for (op of operators; track op.value) {
                    <option [value]="op.value">{{ op.labelKey | transloco }}</option>
                  }
                </select>
              </div>
            </div>
            @if (!isEmptyOperator()) {
              <div class="form-row">
                <label>{{ 'rules.value' | transloco }}</label>
                <input formControlName="value" [placeholder]="'rules.valuePlaceholder' | transloco" />
              </div>
            }
            <div class="form-grid-2">
              <div class="form-row">
                <label>{{ 'rules.action' | transloco }}</label>
                <select formControlName="actionType">
                  @for (a of actions; track a.value) {
                    <option [value]="a.value">{{ a.labelKey | transloco }}</option>
                  }
                </select>
              </div>
              <div class="form-row">
                <label>{{ 'rules.targetField' | transloco }}</label>
                <select formControlName="targetFieldKey">
                  <option value="" disabled>{{ 'rules.selectField' | transloco }}</option>
                  @for (f of fields(); track f.fieldId) {
                    <option [value]="f.fieldKey">{{ f.label }} ({{ f.fieldKey }})</option>
                  }
                </select>
              </div>
            </div>
            <div class="flex-row" style="margin-top:0.5rem">
              <button type="submit" class="btn-primary" [disabled]="ruleFg.invalid || saving()">
                {{ (editingRule() ? 'rules.saveChanges' : 'rules.addBtn') | transloco }}
              </button>
              @if (editingRule()) {
                <button type="button" class="btn-secondary" (click)="cancelEdit()">{{ 'common.cancel' | transloco }}</button>
              }
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <p class="text-muted">{{ 'common.loading' | transloco }}</p>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>{{ 'rules.colSource' | transloco }}</th>
              <th>{{ 'rules.colCondition' | transloco }}</th>
              <th>{{ 'rules.colAction' | transloco }}</th>
              <th>{{ 'rules.colTarget' | transloco }}</th>
              <th>{{ 'common.actions' | transloco }}</th>
            </tr>
          </thead>
          <tbody>
            @for (rule of rules(); track rule.ruleId) {
              <tr>
                <td><code style="font-size:0.8rem">{{ rule.sourceFieldKey }}</code></td>
                <td>{{ describeCondition(rule) }}</td>
                <td>{{ describeAction(rule) }}</td>
                <td><code style="font-size:0.8rem">{{ describeTarget(rule) }}</code></td>
                <td>
                  <button class="btn-sm btn-secondary" (click)="editRule(rule)">{{ 'common.edit' | transloco }}</button>
                  <button class="btn-sm btn-danger" (click)="deleteRule(rule.ruleId)">{{ 'common.delete' | transloco }}</button>
                </td>
              </tr>
            }
            @if (rules().length === 0) {
              <tr>
                <td colspan="5" style="text-align:center;color:var(--tx3);padding:2rem">
                  {{ 'rules.empty' | transloco }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class RulesTabComponent implements OnInit {
  @Input({ required: true }) versionId!: number;

  private versionService = inject(VersionService);
  private fb = inject(FormBuilder);

  rules = signal<ConditionalRule[]>([]);
  fields = signal<Field[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  showAddForm = signal(false);
  editingRule = signal<ConditionalRule | null>(null);

  operators = OPERATORS;
  actions = ACTIONS;

  ruleFg = this.fb.group({
    sourceFieldId: [0, [Validators.required, Validators.min(1)]],
    operator: ['equals', Validators.required],
    value: [''],
    actionType: ['show', Validators.required],
    targetFieldKey: ['', Validators.required]
  });

  isEmptyOperator = signal(false);

  ngOnInit() {
    this.loadFields();
    this.loadRules();
    this.ruleFg.get('operator')!.valueChanges.subscribe(op => {
      this.isEmptyOperator.set(op === 'is_empty' || op === 'is_not_empty');
    });
  }

  loadFields() {
    this.versionService.getFields(this.versionId).subscribe({
      next: data => this.fields.set(data)
    });
  }

  loadRules() {
    this.loading.set(true);
    this.versionService.getRules(this.versionId).subscribe({
      next: data => { this.rules.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load rules'); this.loading.set(false); }
    });
  }

  toggleAddForm() {
    if (this.editingRule()) { this.cancelEdit(); return; }
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) this.ruleFg.reset({ operator: 'equals', actionType: 'show' });
  }

  editRule(rule: ConditionalRule) {
    const c = this.parseCondition(rule);
    if (!c) return;
    const srcField = this.fields().find(f => f.fieldKey === rule.sourceFieldKey);
    this.editingRule.set(rule);
    this.showAddForm.set(true);
    this.ruleFg.patchValue({
      sourceFieldId: srcField?.fieldId ?? 0,
      operator: c.operator,
      value: c.value ?? '',
      actionType: c.actions?.[0]?.type ?? 'show',
      targetFieldKey: c.actions?.[0]?.target_field ?? ''
    });
    this.isEmptyOperator.set(c.operator === 'is_empty' || c.operator === 'is_not_empty');
  }

  cancelEdit() {
    this.editingRule.set(null);
    this.showAddForm.set(false);
    this.ruleFg.reset({ operator: 'equals', actionType: 'show' });
    this.isEmptyOperator.set(false);
  }

  submitRule() {
    if (this.ruleFg.invalid) return;
    const v = this.ruleFg.value;
    const payload: ConditionJsonPayload = {
      operator: v.operator!,
      value: this.isEmptyOperator() ? '' : (v.value ?? ''),
      actions: [{ type: v.actionType!, target_field: v.targetFieldKey! }]
    };

    const editing = this.editingRule();
    if (editing) {
      // Delete old, then create new
      this.saving.set(true);
      this.versionService.deleteRule(this.versionId, editing.ruleId).subscribe({
        next: () => {
          this.versionService.createRule(this.versionId, {
            sourceFieldId: v.sourceFieldId!,
            ruleType: 'conditional',
            conditionJson: JSON.stringify(payload)
          }).subscribe({
            next: rule => {
              this.rules.update(rs => rs.map(r => r.ruleId === editing.ruleId ? rule : r));
              this.saving.set(false);
              this.cancelEdit();
            },
            error: () => { this.error.set('Failed to save rule'); this.saving.set(false); this.loadRules(); }
          });
        },
        error: () => { this.error.set('Failed to save rule'); this.saving.set(false); }
      });
    } else {
      this.versionService.createRule(this.versionId, {
        sourceFieldId: v.sourceFieldId!,
        ruleType: 'conditional',
        conditionJson: JSON.stringify(payload)
      }).subscribe({
        next: rule => {
          this.rules.update(rs => [...rs, rule]);
          this.showAddForm.set(false);
          this.ruleFg.reset({ operator: 'equals', actionType: 'show' });
        },
        error: () => this.error.set('Failed to create rule')
      });
    }
  }

  deleteRule(ruleId: number) {
    if (!confirm('Delete this rule?')) return;
    this.versionService.deleteRule(this.versionId, ruleId).subscribe({
      next: () => this.rules.update(rs => rs.filter(r => r.ruleId !== ruleId)),
      error: () => this.error.set('Failed to delete rule')
    });
  }

  private parseCondition(rule: ConditionalRule): ConditionJsonPayload | null {
    try { return JSON.parse(rule.conditionJson); } catch { return null; }
  }

  describeCondition(rule: ConditionalRule): string {
    const c = this.parseCondition(rule);
    if (!c) return '—';
    return c.operator === 'is_empty' || c.operator === 'is_not_empty'
      ? c.operator.replace('_', ' ')
      : `${c.operator} "${c.value}"`;
  }

  describeAction(rule: ConditionalRule): string {
    const c = this.parseCondition(rule);
    return c?.actions?.[0]?.type ?? '—';
  }

  describeTarget(rule: ConditionalRule): string {
    const c = this.parseCondition(rule);
    return c?.actions?.[0]?.target_field ?? '—';
  }
}
