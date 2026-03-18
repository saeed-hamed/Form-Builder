import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { LookupService } from '../../services/lookup.service';
import { Lookup } from '../../models/api.models';

@Component({
  selector: 'app-lookup-list',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>{{ 'lookups.title' | transloco }}</h1>
        <button class="btn-primary" (click)="toggleCreateForm()">
          {{ (showCreateForm() ? 'common.cancel' : 'lookups.newLookup') | transloco }}
        </button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (showCreateForm()) {
        <div class="card">
          <h3>{{ 'lookups.newLookupCard' | transloco }}</h3>
          <form [formGroup]="createFg" (ngSubmit)="submitCreate()">
            <div class="form-grid-2">
              <div class="form-row">
                <label>{{ 'common.name' | transloco }} <span class="lang-badge">EN</span></label>
                <input formControlName="name" [placeholder]="'lookups.namePlaceholder' | transloco" />
              </div>
              <div class="form-row">
                <label>{{ 'lookups.nameAr' | transloco }} <span class="lang-badge lang-badge--ar">AR</span></label>
                <input formControlName="nameAr" dir="rtl" placeholder="مثال: أنواع الوظائف" />
              </div>
            </div>

            <div class="form-row">
              <label>{{ 'lookups.initialValues' | transloco }}</label>
              <div class="bilingual-input-row">
                <input
                  [value]="pendingInputEn()"
                  (input)="pendingInputEn.set($any($event.target).value)"
                  (keydown.enter)="$event.preventDefault(); addPending()"
                  [placeholder]="'lookups.valuePlaceholder' | transloco"
                  class="flex-1"
                />
                <input
                  [value]="pendingInputAr()"
                  (input)="pendingInputAr.set($any($event.target).value)"
                  (keydown.enter)="$event.preventDefault(); addPending()"
                  placeholder="قيمة بالعربية (اختياري)"
                  dir="rtl"
                  class="flex-1"
                />
                <button type="button" class="btn-secondary btn-sm" (click)="addPending()">
                  {{ 'common.add' | transloco }}
                </button>
              </div>

              @if (pendingValues().length > 0) {
                <table class="values-table mt-1">
                  <thead>
                    <tr>
                      <th>EN</th>
                      <th>AR</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (val of pendingValues(); track $index; let i = $index) {
                      <tr>
                        <td>{{ val.value }}</td>
                        <td dir="rtl">{{ val.valueAr || '—' }}</td>
                        <td><button type="button" class="btn-icon-danger" (click)="removePending(i)">×</button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>

            <button type="submit" class="btn-primary" [disabled]="createFg.invalid">
              {{ 'lookups.createLookup' | transloco }}
            </button>
          </form>
        </div>
      }

      @if (loading()) {
        <p class="text-muted">{{ 'common.loading' | transloco }}</p>
      } @else {
        <div class="lookups-list">
          @for (lookup of lookups(); track lookup.lookupId) {
            <div class="lookup-card">

              <!-- Header: name + edit/delete actions -->
              <div class="lookup-header">
                @if (editingNameId() === lookup.lookupId) {
                  <div class="name-edit-form">
                    <div class="bilingual-input-row">
                      <input
                        [value]="editNameEn()"
                        (input)="editNameEn.set($any($event.target).value)"
                        placeholder="English name"
                        class="flex-1"
                      />
                      <input
                        [value]="editNameAr()"
                        (input)="editNameAr.set($any($event.target).value)"
                        placeholder="الاسم بالعربية"
                        dir="rtl"
                        class="flex-1"
                      />
                      <button class="btn-primary btn-sm" (click)="saveName(lookup.lookupId)" [disabled]="!editNameEn().trim()">
                        {{ 'common.save' | transloco }}
                      </button>
                      <button class="btn-secondary btn-sm" (click)="cancelEditName()">
                        {{ 'common.cancel' | transloco }}
                      </button>
                    </div>
                  </div>
                } @else {
                  <div class="lookup-title">
                    <span class="lookup-name-en">{{ lookup.name }}</span>
                    @if (lookup.nameAr) {
                      <span class="lookup-name-ar" dir="rtl">{{ lookup.nameAr }}</span>
                    } @else {
                      <span class="no-ar">{{ 'lookups.noArabicName' | transloco }}</span>
                    }
                  </div>
                  <div class="lookup-actions">
                    <span class="value-count">{{ lookup.values.length }} {{ 'lookups.colValues' | transloco }}</span>
                    <button class="btn-sm btn-secondary" (click)="startEditName(lookup)">
                      {{ 'lookups.editName' | transloco }}
                    </button>
                    <button class="btn-sm btn-secondary" (click)="toggleManage(lookup.lookupId)">
                      {{ (managingId() === lookup.lookupId ? 'lookups.close' : 'lookups.manageValues') | transloco }}
                    </button>
                    <button class="btn-sm btn-danger" (click)="deleteLookup(lookup.lookupId)">
                      {{ 'common.delete' | transloco }}
                    </button>
                  </div>
                }
              </div>

              <!-- Values grid -->
              @if (managingId() === lookup.lookupId) {
                <div class="values-panel">
                  <table class="values-table">
                    <thead>
                      <tr>
                        <th>EN</th>
                        <th>AR</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (val of lookup.values; track val.lookupValueId) {
                        <tr>
                          <td>{{ val.value }}</td>
                          <td dir="rtl">
                            @if (editingValueId() === val.lookupValueId) {
                              <div class="ar-edit-row">
                                <input
                                  class="inline-input"
                                  dir="rtl"
                                  [value]="editValueAr()"
                                  (input)="editValueAr.set($any($event.target).value)"
                                  (keydown.enter)="saveValueAr(lookup.lookupId, val.lookupValueId)"
                                  (keydown.escape)="cancelEditValue()"
                                  placeholder="أضف ترجمة عربية"
                                />
                                <button class="btn-sm btn-primary" (click)="saveValueAr(lookup.lookupId, val.lookupValueId)">{{ 'common.save' | transloco }}</button>
                                <button class="btn-sm btn-secondary" (click)="cancelEditValue()">{{ 'common.cancel' | transloco }}</button>
                              </div>
                            } @else {
                              <span
                                class="ar-cell"
                                (click)="startEditValue(val.lookupValueId, val.valueAr)"
                                [class.ar-cell--empty]="!val.valueAr"
                              >{{ val.valueAr || 'أضف ترجمة' }}</span>
                            }
                          </td>
                          <td>
                            <button class="btn-icon-danger" (click)="deleteValue(lookup.lookupId, val.lookupValueId)">×</button>
                          </td>
                        </tr>
                      }
                      @if (lookup.values.length === 0) {
                        <tr>
                          <td colspan="3" class="empty-row">{{ 'lookups.noValues' | transloco }}</td>
                        </tr>
                      }
                      <!-- Add value row -->
                      <tr class="add-row">
                        <td>
                          <input
                            [value]="manageInput()"
                            (input)="manageInput.set($any($event.target).value)"
                            (keydown.enter)="$event.preventDefault(); addValue(lookup.lookupId)"
                            [placeholder]="'lookups.newValuePlaceholder' | transloco"
                            class="inline-input"
                          />
                        </td>
                        <td>
                          <input
                            [value]="manageInputAr()"
                            (input)="manageInputAr.set($any($event.target).value)"
                            (keydown.enter)="$event.preventDefault(); addValue(lookup.lookupId)"
                            placeholder="قيمة بالعربية"
                            dir="rtl"
                            class="inline-input"
                          />
                        </td>
                        <td>
                          <button class="btn-sm btn-secondary" (click)="addValue(lookup.lookupId)">
                            {{ 'lookups.addValue' | transloco }}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }

            </div>
          }

          @if (lookups().length === 0) {
            <p class="text-muted" style="text-align:center;padding:2rem">
              {{ 'lookups.empty' | transloco }}
            </p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .lookups-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .lookup-card {
      border: 1px solid var(--bd);
      border-radius: 10px;
      overflow: hidden;
      background: var(--surface);
    }

    .lookup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .lookup-title {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .lookup-name-en {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .lookup-name-ar {
      font-size: 0.88rem;
      color: var(--tx2);
    }

    .no-ar {
      font-size: 0.78rem;
      color: var(--tx3);
      font-style: italic;
    }

    .lookup-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .value-count {
      font-size: 0.78rem;
      color: var(--tx3);
      padding: 0.1rem 0.5rem;
      background: var(--bg2);
      border-radius: 99px;
    }

    .name-edit-form {
      flex: 1;
    }

    .values-panel {
      border-top: 1px solid var(--bd);
      padding: 0.75rem 1rem 1rem;
    }

    .values-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .values-table th {
      text-align: left;
      padding: 0.35rem 0.5rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--tx3);
      border-bottom: 1px solid var(--bd);
    }

    .values-table td {
      padding: 0.4rem 0.5rem;
      border-bottom: 1px solid var(--bd);
      vertical-align: middle;
    }

    .values-table td:last-child {
      width: 2.5rem;
      text-align: center;
    }

    .values-table .add-row td {
      border-bottom: none;
      padding-top: 0.6rem;
    }

    .empty-row {
      text-align: center;
      color: var(--tx3);
      font-style: italic;
    }

    .inline-input {
      width: 100%;
      padding: 0.3rem 0.5rem;
      font-size: 0.875rem;
      border: 1px solid var(--bd);
      border-radius: 6px;
      background: var(--bg);
      color: var(--tx);
    }

    .bilingual-input-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .flex-1 { flex: 1; min-width: 120px; }

    .btn-icon-danger {
      background: none;
      border: none;
      color: var(--danger, #ef4444);
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      transition: background 0.15s;
    }

    .btn-icon-danger:hover {
      background: rgba(239,68,68,0.1);
    }

    .mt-1 { margin-top: 0.5rem; }

    .ar-cell {
      cursor: pointer;
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      transition: background 0.15s;
      display: inline-block;
      min-width: 3rem;
    }

    .ar-cell:hover {
      background: rgba(var(--accent-rgb, 99,102,241), 0.1);
    }

    .ar-cell--empty {
      color: var(--tx3);
      font-style: italic;
      font-size: 0.8rem;
    }

    .ar-edit-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .ar-edit-row .inline-input {
      flex: 1;
    }
  `]
})
export class LookupListComponent implements OnInit {
  private lookupService = inject(LookupService);
  private fb = inject(FormBuilder);

  lookups = signal<Lookup[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showCreateForm = signal(false);

  pendingValues = signal<{ value: string; valueAr: string | null }[]>([]);
  pendingInputEn = signal('');
  pendingInputAr = signal('');

  managingId = signal<number | null>(null);
  manageInput = signal('');
  manageInputAr = signal('');

  editingNameId = signal<number | null>(null);
  editNameEn = signal('');
  editNameAr = signal('');

  editingValueId = signal<number | null>(null);
  editValueAr = signal('');

  createFg = this.fb.group({
    name: ['', Validators.required],
    nameAr: ['']
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.lookupService.getAll().subscribe({
      next: data => { this.lookups.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load lookups'); this.loading.set(false); }
    });
  }

  toggleCreateForm() {
    this.showCreateForm.update(v => !v);
    if (!this.showCreateForm()) {
      this.createFg.reset();
      this.pendingValues.set([]);
      this.pendingInputEn.set('');
      this.pendingInputAr.set('');
    }
  }

  addPending() {
    const v = this.pendingInputEn().trim();
    if (!v) return;
    const vAr = this.pendingInputAr().trim() || null;
    this.pendingValues.update(vals => [...vals, { value: v, valueAr: vAr }]);
    this.pendingInputEn.set('');
    this.pendingInputAr.set('');
  }

  removePending(i: number) {
    this.pendingValues.update(vals => vals.filter((_, idx) => idx !== i));
  }

  submitCreate() {
    if (this.createFg.invalid) return;
    const { name, nameAr } = this.createFg.value;
    this.lookupService.create(name!, nameAr || null, this.pendingValues()).subscribe({
      next: created => {
        this.lookups.update(ls => [...ls, created]);
        this.toggleCreateForm();
      },
      error: () => this.error.set('Failed to create lookup')
    });
  }

  startEditName(lookup: Lookup) {
    this.editingNameId.set(lookup.lookupId);
    this.editNameEn.set(lookup.name);
    this.editNameAr.set(lookup.nameAr ?? '');
  }

  cancelEditName() {
    this.editingNameId.set(null);
    this.editNameEn.set('');
    this.editNameAr.set('');
  }

  saveName(lookupId: number) {
    const name = this.editNameEn().trim();
    if (!name) return;
    const nameAr = this.editNameAr().trim() || null;
    this.lookupService.updateName(lookupId, name, nameAr).subscribe({
      next: () => {
        this.lookups.update(ls => ls.map(l =>
          l.lookupId === lookupId ? { ...l, name, nameAr } : l
        ));
        this.cancelEditName();
      },
      error: () => this.error.set('Failed to update lookup name')
    });
  }

  deleteLookup(id: number) {
    if (!confirm('Delete this lookup? This may affect forms that use it.')) return;
    this.lookupService.deleteById(id).subscribe({
      next: () => {
        this.lookups.update(ls => ls.filter(l => l.lookupId !== id));
        if (this.managingId() === id) this.managingId.set(null);
        if (this.editingNameId() === id) this.cancelEditName();
      },
      error: () => this.error.set('Failed to delete lookup')
    });
  }

  toggleManage(id: number) {
    this.managingId.update(cur => cur === id ? null : id);
    this.manageInput.set('');
    this.manageInputAr.set('');
  }

  startEditValue(valueId: number, currentAr: string | null) {
    this.editingValueId.set(valueId);
    this.editValueAr.set(currentAr ?? '');
  }

  cancelEditValue() {
    this.editingValueId.set(null);
    this.editValueAr.set('');
  }

  saveValueAr(lookupId: number, valueId: number) {
    const valueAr = this.editValueAr().trim() || null;
    this.lookupService.updateValueAr(lookupId, valueId, valueAr).subscribe({
      next: () => {
        this.lookups.update(ls => ls.map(l =>
          l.lookupId === lookupId
            ? { ...l, values: l.values.map(v => v.lookupValueId === valueId ? { ...v, valueAr } : v) }
            : l
        ));
        this.cancelEditValue();
      },
      error: () => this.error.set('Failed to update value')
    });
  }

  addValue(lookupId: number) {
    const v = this.manageInput().trim();
    if (!v) return;
    const vAr = this.manageInputAr().trim() || null;
    const lookup = this.lookups().find(l => l.lookupId === lookupId);
    const orderIndex = lookup?.values.length ?? 0;
    this.lookupService.addValue(lookupId, v, vAr, orderIndex).subscribe({
      next: newVal => {
        this.lookups.update(ls => ls.map(l =>
          l.lookupId === lookupId ? { ...l, values: [...l.values, newVal] } : l
        ));
        this.manageInput.set('');
        this.manageInputAr.set('');
      },
      error: () => this.error.set('Failed to add value')
    });
  }

  deleteValue(lookupId: number, valueId: number) {
    if (!confirm('Remove this value?')) return;
    this.lookupService.deleteValue(lookupId, valueId).subscribe({
      next: () => {
        this.lookups.update(ls => ls.map(l =>
          l.lookupId === lookupId
            ? { ...l, values: l.values.filter(v => v.lookupValueId !== valueId) }
            : l
        ));
      },
      error: () => this.error.set('Failed to delete value')
    });
  }
}
