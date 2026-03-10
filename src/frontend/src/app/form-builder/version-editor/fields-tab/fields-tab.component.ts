import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VersionService } from '../../../services/version.service';
import { LookupService } from '../../../services/lookup.service';
import { Field, Lookup, SubField } from '../../../models/api.models';

@Component({
  selector: 'app-fields-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600;color:#475569">Fields</h3>
        <button class="btn-primary btn-sm" (click)="toggleAddForm()">
          {{ showAddForm() ? 'Cancel' : '+ Add Field' }}
        </button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (showAddForm()) {
        <div class="card">
          <h3>{{ editingField() ? 'Edit Field' : 'New Field' }}</h3>
          <form [formGroup]="fieldFg" (ngSubmit)="submitField()">
            <div class="form-grid-2">
              <div class="form-row">
                <label>Field Key (snake_case)</label>
                <input formControlName="fieldKey" placeholder="e.g. has_work" [attr.readonly]="editingField() ? true : null" />
              </div>
              <div class="form-row">
                <label>Label</label>
                <input formControlName="label" placeholder="e.g. Do you have work?" />
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-row">
                <label>Type</label>
                <select formControlName="fieldType" (change)="onTypeChange()">
                  <option value="yes_no">Yes / No</option>
                  <option value="list">List (Lookup)</option>
                  <option value="date">Date</option>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="repeater">Repeater (multiple rows)</option>
                </select>
              </div>
              @if (fieldFg.value.fieldType === 'list') {
                <div class="form-row">
                  <label>Lookup</label>
                  <select formControlName="lookupId">
                    <option [value]="null">Select lookup...</option>
                    @for (l of lookups(); track l.lookupId) {
                      <option [value]="l.lookupId">{{ l.name }}</option>
                    }
                  </select>
                </div>
              }
              @if (fieldFg.value.fieldType === 'text' || fieldFg.value.fieldType === 'number') {
                <div class="form-row">
                  <label>Placeholder <span style="font-weight:400;color:#94a3b8">(optional)</span></label>
                  <input formControlName="placeholder" placeholder="e.g. Enter your name" />
                </div>
              }
            </div>

            @if (fieldFg.value.fieldType === 'repeater') {
              <div class="sub-field-builder">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                  <label style="font-size:0.8125rem;font-weight:500;color:#374151">Sub-fields</label>
                  <button type="button" class="btn-sm btn-secondary" (click)="addSubField()">+ Add Sub-field</button>
                </div>

                @if (subFields().length > 0) {
                  <table class="sub-field-table">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Label</th>
                        <th>Type</th>
                        <th>Lookup</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (sf of subFields(); track $index; let i = $index) {
                        <tr>
                          <td><input class="sf-input" [value]="sf.key" (input)="updateSubField(i, 'key', $any($event.target).value)" placeholder="e.g. name" /></td>
                          <td><input class="sf-input" [value]="sf.label" (input)="updateSubField(i, 'label', $any($event.target).value)" placeholder="e.g. Name" /></td>
                          <td>
                            <select class="sf-select" [value]="sf.type" (change)="updateSubField(i, 'type', $any($event.target).value)">
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="list">List</option>
                              <option value="yes_no">Yes/No</option>
                            </select>
                          </td>
                          <td>
                            @if (sf.type === 'list') {
                              <select class="sf-select" [value]="sf.lookupId ?? ''" (change)="updateSubField(i, 'lookupId', $any($event.target).value)">
                                <option value="">—</option>
                                @for (l of lookups(); track l.lookupId) {
                                  <option [value]="l.lookupId">{{ l.name }}</option>
                                }
                              </select>
                            } @else {
                              <span style="color:#94a3b8;font-size:0.75rem">—</span>
                            }
                          </td>
                          <td>
                            <button type="button" class="btn-sm btn-danger" (click)="removeSubField(i)">✕</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                } @else {
                  <p style="font-size:0.8rem;color:#94a3b8;margin:0.25rem 0">No sub-fields yet — add one above</p>
                }
              </div>
            }

            <div class="form-row" style="flex-direction:row;align-items:center;gap:0.5rem">
              <input type="checkbox" formControlName="required" id="req" style="width:auto" />
              <label for="req" style="margin:0">Required</label>
            </div>
            <div class="flex-row" style="margin-top:0.5rem">
              <button type="submit" class="btn-primary" [disabled]="fieldFg.invalid">
                {{ editingField() ? 'Save Changes' : 'Add Field' }}
              </button>
              @if (editingField()) {
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
              <th>Order</th>
              <th>Key</th>
              <th>Label</th>
              <th>Type</th>
              <th>Required</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (field of sortedFields(); track field.fieldId; let idx = $index, count = $count) {
              <tr>
                <td>
                  <div class="flex-row" style="gap:0.25rem">
                    <button class="btn-sm btn-secondary" (click)="moveUp(field)" [disabled]="idx === 0">↑</button>
                    <button class="btn-sm btn-secondary" (click)="moveDown(field)" [disabled]="idx === count - 1">↓</button>
                  </div>
                </td>
                <td><code style="font-size:0.8rem">{{ field.fieldKey }}</code></td>
                <td>{{ field.label }}</td>
                <td>{{ typeLabel(field.fieldType) }}</td>
                <td>{{ field.required ? 'Yes' : '—' }}</td>
                <td>
                  <button class="btn-sm btn-secondary" (click)="editField(field)">Edit</button>
                  <button class="btn-sm btn-danger" (click)="deleteField(field.fieldId)">Delete</button>
                </td>
              </tr>
            }
            @if (fields().length === 0) {
              <tr>
                <td colspan="6" style="text-align:center;color:#94a3b8;padding:2rem">
                  No fields yet — add one above
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .sub-field-builder {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .sub-field-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .sub-field-table th {
      text-align: left;
      font-weight: 500;
      color: #64748b;
      padding: 0.25rem 0.375rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .sub-field-table td {
      padding: 0.25rem 0.375rem;
      vertical-align: middle;
    }
    .sf-input, .sf-select {
      width: 100%;
      padding: 0.25rem 0.375rem;
      font-size: 0.8rem;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      background: #fff;
    }
    .sf-input:focus, .sf-select:focus {
      outline: none;
      border-color: #3b82f6;
    }
  `]
})
export class FieldsTabComponent implements OnInit {
  @Input({ required: true }) versionId!: number;

  private versionService = inject(VersionService);
  private lookupService = inject(LookupService);
  private fb = inject(FormBuilder);

  fields = signal<Field[]>([]);
  lookups = signal<Lookup[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showAddForm = signal(false);
  editingField = signal<Field | null>(null);
  subFields = signal<SubField[]>([]);

  fieldFg = this.fb.group({
    fieldKey: ['', Validators.required],
    label: ['', Validators.required],
    fieldType: ['yes_no', Validators.required],
    lookupId: [null as number | null],
    required: [false],
    placeholder: [null as string | null]
  });

  sortedFields = signal<Field[]>([]);

  ngOnInit() {
    this.loadLookups();
    this.loadFields();
  }

  loadFields(onDone?: () => void) {
    this.loading.set(true);
    this.versionService.getFields(this.versionId).subscribe({
      next: data => {
        this.fields.set(data);
        this.sortedFields.set([...data].sort((a, b) => a.orderIndex - b.orderIndex));
        this.loading.set(false);
        onDone?.();
      },
      error: () => { this.error.set('Failed to load fields'); this.loading.set(false); }
    });
  }

  loadLookups() {
    this.lookupService.getAll().subscribe({
      next: data => this.lookups.set(data)
    });
  }

  toggleAddForm() {
    if (this.editingField()) { this.cancelEdit(); return; }
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) {
      this.fieldFg.reset({ fieldType: 'yes_no', required: false });
      this.subFields.set([]);
    }
  }

  onTypeChange() {
    const type = this.fieldFg.value.fieldType;
    if (type !== 'list') {
      this.fieldFg.patchValue({ lookupId: null });
    }
    if (type !== 'repeater') {
      this.subFields.set([]);
    }
  }

  // Sub-field management
  addSubField() {
    this.subFields.update(sf => [...sf, { key: '', label: '', type: 'text' }]);
  }

  removeSubField(index: number) {
    this.subFields.update(sf => sf.filter((_, i) => i !== index));
  }

  updateSubField(index: number, prop: keyof SubField, value: string) {
    this.subFields.update(sf => {
      const updated = [...sf];
      if (prop === 'lookupId') {
        updated[index] = { ...updated[index], lookupId: value ? Number(value) : null };
      } else {
        updated[index] = { ...updated[index], [prop]: value } as SubField;
      }
      return updated;
    });
  }

  submitField() {
    if (this.fieldFg.invalid) return;
    const v = this.fieldFg.value;
    const editing = this.editingField();

    const isTextOrNumber = v.fieldType === 'text' || v.fieldType === 'number';
    const placeholder = isTextOrNumber ? (v.placeholder ?? null) : null;
    const subFieldsJson = v.fieldType === 'repeater' && this.subFields().length > 0
      ? JSON.stringify(this.subFields())
      : null;

    if (editing) {
      this.versionService.updateField(this.versionId, editing.fieldId, {
        label: v.label!,
        fieldType: v.fieldType!,
        lookupId: v.fieldType === 'list' ? (v.lookupId ?? null) : null,
        orderIndex: editing.orderIndex,
        required: v.required ?? false,
        placeholder,
        subFieldsJson
      }).subscribe({
        next: () => { this.cancelEdit(); this.loadFields(); },
        error: () => this.error.set('Failed to update field')
      });
    } else {
      const maxIndex = this.fields().reduce((m, f) => Math.max(m, f.orderIndex), -1);
      this.versionService.createField(this.versionId, {
        fieldKey: v.fieldKey!,
        label: v.label!,
        fieldType: v.fieldType!,
        lookupId: v.fieldType === 'list' ? (v.lookupId ?? null) : null,
        orderIndex: maxIndex + 1,
        required: v.required ?? false,
        placeholder,
        subFieldsJson
      }).subscribe({
        next: () => {
          this.loadFields();
          this.showAddForm.set(false);
          this.fieldFg.reset({ fieldType: 'yes_no', required: false });
          this.subFields.set([]);
        },
        error: () => this.error.set('Failed to create field')
      });
    }
  }

  editField(field: Field) {
    this.editingField.set(field);
    this.showAddForm.set(true);
    this.fieldFg.patchValue({
      fieldKey: field.fieldKey,
      label: field.label,
      fieldType: field.fieldType,
      lookupId: field.lookupId,
      required: field.required,
      placeholder: field.placeholder
    });
    if (field.fieldType === 'repeater' && field.subFieldsJson) {
      try {
        this.subFields.set(JSON.parse(field.subFieldsJson));
      } catch {
        this.subFields.set([]);
      }
    } else {
      this.subFields.set([]);
    }
  }

  cancelEdit() {
    this.editingField.set(null);
    this.showAddForm.set(false);
    this.fieldFg.reset({ fieldType: 'yes_no', required: false });
    this.subFields.set([]);
  }

  deleteField(fieldId: number) {
    if (!confirm('Delete this field? This may affect rules and triggers that reference it.')) return;
    this.versionService.deleteField(this.versionId, fieldId).subscribe({
      next: () => this.loadFields(() => {
        this.applyNewOrder([...this.sortedFields()]);
      }),
      error: () => this.error.set('Failed to delete field')
    });
  }

  moveUp(field: Field) {
    const sorted = [...this.sortedFields()];
    const idx = sorted.findIndex(f => f.fieldId === field.fieldId);
    if (idx === 0) return;
    [sorted[idx - 1], sorted[idx]] = [sorted[idx], sorted[idx - 1]];
    this.applyNewOrder(sorted);
  }

  moveDown(field: Field) {
    const sorted = [...this.sortedFields()];
    const idx = sorted.findIndex(f => f.fieldId === field.fieldId);
    if (idx === sorted.length - 1) return;
    [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
    this.applyNewOrder(sorted);
  }

  private applyNewOrder(sorted: Field[]) {
    this.sortedFields.set(sorted);

    const toUpdate = sorted.filter((f, i) => f.orderIndex !== i);
    const doNext = (i: number) => {
      if (i >= toUpdate.length) { this.loadFields(); return; }
      const f = toUpdate[i];
      const newIdx = sorted.indexOf(f);
      this.versionService.updateField(this.versionId, f.fieldId, {
        label: f.label, fieldType: f.fieldType, lookupId: f.lookupId,
        orderIndex: newIdx, required: f.required, placeholder: f.placeholder,
        subFieldsJson: f.subFieldsJson ?? null
      }).subscribe({
        next: () => doNext(i + 1),
        error: () => { this.error.set('Failed to reorder fields'); this.loadFields(); }
      });
    };
    doNext(0);
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      yes_no: 'Yes/No', list: 'List', date: 'Date', text: 'Text', number: 'Number', repeater: 'Repeater'
    };
    return labels[type] ?? type;
  }
}
