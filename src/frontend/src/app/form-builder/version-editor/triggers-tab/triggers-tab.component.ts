import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { VersionService } from '../../../services/version.service';
import { TaskDefinitionService } from '../../../services/task-definition.service';
import { TaskTrigger, TriggerConditionJson, TriggerCondition, Field, TaskDefinition } from '../../../models/api.models';

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
];

@Component({
  selector: 'app-triggers-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600;color:#475569">Task Triggers</h3>
        <button class="btn-primary btn-sm" (click)="toggleAddForm()">
          {{ showAddForm() ? 'Cancel' : '+ Add Trigger' }}
        </button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (showAddForm()) {
        <div class="card">
          <h3>{{ editingTrigger() ? 'Edit Trigger' : 'New Task Trigger' }}</h3>
          <form [formGroup]="triggerFg" (ngSubmit)="submitTrigger()">
            <div class="form-grid-2">
              <div class="form-row">
                <label>Task to Create</label>
                <select formControlName="taskId">
                  <option [value]="0" disabled>Select task...</option>
                  @for (t of tasks(); track t.taskId) {
                    <option [value]="t.taskId">{{ t.name }}</option>
                  }
                </select>
              </div>
              <div class="form-row">
                <label>Logical Combinator</label>
                <select formControlName="combinator">
                  <option value="AND">AND — all conditions must match</option>
                  <option value="OR">OR — any condition must match</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom:0.75rem">
              <div style="font-size:0.85rem;font-weight:500;color:#475569;margin-bottom:0.5rem">
                Conditions
              </div>
              <div formArrayName="conditions">
                @for (ctrl of conditionControls; track $index; let i = $index) {
                  <div [formGroupName]="i" class="condition-row" style="margin-bottom:0.5rem">
                    <select formControlName="field">
                      <option value="" disabled>Field...</option>
                      @for (f of fields(); track f.fieldId) {
                        <option [value]="f.fieldKey">{{ f.label }}</option>
                      }
                    </select>
                    <select formControlName="operator">
                      @for (op of operators; track op.value) {
                        <option [value]="op.value">{{ op.label }}</option>
                      }
                    </select>
                    <input formControlName="value" placeholder="value" />
                    <button
                      type="button"
                      class="btn-danger btn-sm"
                      (click)="removeCondition(i)"
                      [disabled]="conditionControls.length === 1"
                      style="white-space:nowrap"
                    >Remove</button>
                  </div>
                }
              </div>
              <button type="button" class="btn-secondary btn-sm" (click)="addCondition()">
                + Add Condition
              </button>
            </div>

            <div class="flex-row" style="margin-top:0.5rem">
              <button type="submit" class="btn-primary" [disabled]="triggerFg.invalid || saving()">
                {{ editingTrigger() ? 'Save Changes' : 'Add Trigger' }}
              </button>
              @if (editingTrigger()) {
                <button type="button" class="btn-secondary" (click)="cancelEdit()">Cancel</button>
              }
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <p class="text-muted">Loading...</p>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Combinator</th>
              <th>Conditions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (trigger of triggers(); track trigger.triggerId) {
              <tr>
                <td>{{ trigger.taskName }}</td>
                <td>{{ describeCombinator(trigger) }}</td>
                <td>
                  @for (cond of describeConditions(trigger); track $index) {
                    <div style="font-size:0.8rem;color:#475569">{{ cond }}</div>
                  }
                </td>
                <td>
                  <button class="btn-sm btn-secondary" (click)="editTrigger(trigger)">Edit</button>
                  <button class="btn-sm btn-danger" (click)="deleteTrigger(trigger.triggerId)">Delete</button>
                </td>
              </tr>
            }
            @if (triggers().length === 0) {
              <tr>
                <td colspan="4" style="text-align:center;color:#94a3b8;padding:2rem">
                  No triggers yet
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class TriggersTabComponent implements OnInit {
  @Input({ required: true }) versionId!: number;

  private versionService = inject(VersionService);
  private taskService = inject(TaskDefinitionService);
  private fb = inject(FormBuilder);

  triggers = signal<TaskTrigger[]>([]);
  fields = signal<Field[]>([]);
  tasks = signal<TaskDefinition[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  showAddForm = signal(false);
  editingTrigger = signal<TaskTrigger | null>(null);

  operators = OPERATORS;

  triggerFg = this.fb.group({
    taskId: [0, [Validators.required, Validators.min(1)]],
    combinator: ['AND', Validators.required],
    conditions: this.fb.array([this.newConditionGroup()])
  });

  get conditionsArray(): FormArray {
    return this.triggerFg.get('conditions') as FormArray;
  }

  get conditionControls(): FormGroup[] {
    return this.conditionsArray.controls as FormGroup[];
  }

  private newConditionGroup(): FormGroup {
    return this.fb.group({
      field: ['', Validators.required],
      operator: ['equals', Validators.required],
      value: ['']
    });
  }

  ngOnInit() {
    this.loadFields();
    this.loadTasks();
    this.loadTriggers();
  }

  loadFields() {
    this.versionService.getFields(this.versionId).subscribe({
      next: data => this.fields.set(data)
    });
  }

  loadTasks() {
    this.taskService.getAll().subscribe({
      next: data => this.tasks.set(data)
    });
  }

  loadTriggers() {
    this.loading.set(true);
    this.versionService.getTriggers(this.versionId).subscribe({
      next: data => { this.triggers.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load triggers'); this.loading.set(false); }
    });
  }

  toggleAddForm() {
    if (this.editingTrigger()) { this.cancelEdit(); return; }
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) this.resetForm();
  }

  editTrigger(trigger: TaskTrigger) {
    const parsed = this.parseConditionJson(trigger);
    if (!parsed) return;

    this.editingTrigger.set(trigger);
    this.showAddForm.set(true);

    // Rebuild conditions array to match the trigger's conditions
    while (this.conditionsArray.length > 0) this.conditionsArray.removeAt(0);
    for (const cond of parsed.conditions) {
      const grp = this.newConditionGroup();
      grp.patchValue({ field: cond.field, operator: cond.operator, value: cond.value ?? '' });
      this.conditionsArray.push(grp);
    }

    this.triggerFg.patchValue({ taskId: trigger.taskId, combinator: parsed.combinator });
  }

  cancelEdit() {
    this.editingTrigger.set(null);
    this.showAddForm.set(false);
    this.resetForm();
  }

  addCondition() {
    this.conditionsArray.push(this.newConditionGroup());
  }

  removeCondition(i: number) {
    if (this.conditionsArray.length > 1) this.conditionsArray.removeAt(i);
  }

  submitTrigger() {
    if (this.triggerFg.invalid) return;
    const v = this.triggerFg.value;
    const conditions: TriggerCondition[] = this.conditionControls.map(ctrl => ({
      field: ctrl.value.field,
      operator: ctrl.value.operator,
      value: ctrl.value.value ?? ''
    }));
    const payload: TriggerConditionJson = {
      combinator: (v.combinator ?? 'AND') as 'AND' | 'OR',
      conditions
    };

    const editing = this.editingTrigger();
    if (editing) {
      this.saving.set(true);
      this.versionService.deleteTrigger(this.versionId, editing.triggerId).subscribe({
        next: () => {
          this.versionService.createTrigger(this.versionId, {
            taskId: v.taskId!,
            conditionJson: JSON.stringify(payload)
          }).subscribe({
            next: trigger => {
              this.triggers.update(ts => ts.map(t => t.triggerId === editing.triggerId ? trigger : t));
              this.saving.set(false);
              this.cancelEdit();
            },
            error: () => { this.error.set('Failed to save trigger'); this.saving.set(false); this.loadTriggers(); }
          });
        },
        error: () => { this.error.set('Failed to save trigger'); this.saving.set(false); }
      });
    } else {
      this.versionService.createTrigger(this.versionId, {
        taskId: v.taskId!,
        conditionJson: JSON.stringify(payload)
      }).subscribe({
        next: trigger => {
          this.triggers.update(ts => [...ts, trigger]);
          this.showAddForm.set(false);
          this.resetForm();
        },
        error: () => this.error.set('Failed to create trigger')
      });
    }
  }

  private resetForm() {
    while (this.conditionsArray.length > 1) this.conditionsArray.removeAt(1);
    this.triggerFg.reset({ taskId: 0, combinator: 'AND' });
    this.conditionsArray.at(0).reset({ operator: 'equals' });
  }

  deleteTrigger(triggerId: number) {
    if (!confirm('Delete this trigger?')) return;
    this.versionService.deleteTrigger(this.versionId, triggerId).subscribe({
      next: () => this.triggers.update(ts => ts.filter(t => t.triggerId !== triggerId)),
      error: () => this.error.set('Failed to delete trigger')
    });
  }

  private parseConditionJson(trigger: TaskTrigger): TriggerConditionJson | null {
    try { return JSON.parse(trigger.conditionJson); } catch { return null; }
  }

  describeCombinator(trigger: TaskTrigger): string {
    return this.parseConditionJson(trigger)?.combinator ?? '—';
  }

  describeConditions(trigger: TaskTrigger): string[] {
    const parsed = this.parseConditionJson(trigger);
    if (!parsed) return ['(invalid)'];
    return parsed.conditions.map(c =>
      `${c.field} ${c.operator}${c.value ? ' "' + c.value + '"' : ''}`
    );
  }
}
