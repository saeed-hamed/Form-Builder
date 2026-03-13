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
            <div class="form-row">
              <label>{{ 'common.name' | transloco }}</label>
              <input formControlName="name" [placeholder]="'lookups.namePlaceholder' | transloco" />
            </div>
            <div class="form-row">
              <label>{{ 'lookups.initialValues' | transloco }}</label>
              <div class="flex-row">
                <input
                  [value]="pendingInput()"
                  (input)="pendingInput.set($any($event.target).value)"
                  (keydown.enter)="$event.preventDefault(); addPending()"
                  [placeholder]="'lookups.valuePlaceholder' | transloco"
                />
                <button type="button" class="btn-secondary" (click)="addPending()">{{ 'common.add' | transloco }}</button>
              </div>
              <div class="chips">
                @for (val of pendingValues(); track $index; let i = $index) {
                  <span class="chip">
                    {{ val }}
                    <button type="button" (click)="removePending(i)">×</button>
                  </span>
                }
              </div>
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
        <table class="table">
          <thead>
            <tr>
              <th>{{ 'lookups.colName' | transloco }}</th>
              <th>{{ 'lookups.colValues' | transloco }}</th>
              <th>{{ 'common.actions' | transloco }}</th>
            </tr>
          </thead>
          <tbody>
            @for (lookup of lookups(); track lookup.lookupId) {
              <tr>
                <td>{{ lookup.name }}</td>
                <td>{{ lookup.values.length }}</td>
                <td>
                  <button
                    class="btn-sm btn-secondary"
                    (click)="toggleManage(lookup.lookupId)"
                  >
                    {{ (managingId() === lookup.lookupId ? 'lookups.close' : 'lookups.manageValues') | transloco }}
                  </button>
                  <button class="btn-sm btn-danger" (click)="deleteLookup(lookup.lookupId)">
                    {{ 'common.delete' | transloco }}
                  </button>
                </td>
              </tr>
              @if (managingId() === lookup.lookupId) {
                <tr>
                  <td colspan="3">
                    <div class="inline-panel">
                      <h4>Values for "{{ lookup.name }}"</h4>
                      <div class="chips mb-2">
                        @for (val of lookup.values; track val.lookupValueId) {
                          <span class="chip">
                            {{ val.value }}
                            <button type="button" (click)="deleteValue(lookup.lookupId, val.lookupValueId)">×</button>
                          </span>
                        }
                        @if (lookup.values.length === 0) {
                          <span class="text-muted" style="font-size:0.8rem">{{ 'lookups.noValues' | transloco }}</span>
                        }
                      </div>
                      <div class="add-value-row">
                        <input
                          [value]="manageInput()"
                          (input)="manageInput.set($any($event.target).value)"
                          (keydown.enter)="$event.preventDefault(); addValue(lookup.lookupId)"
                          [placeholder]="'lookups.newValuePlaceholder' | transloco"
                          style="flex:1"
                        />
                        <input
                          [value]="manageInputAr()"
                          (input)="manageInputAr.set($any($event.target).value)"
                          (keydown.enter)="$event.preventDefault(); addValue(lookup.lookupId)"
                          placeholder="قيمة بالعربية (اختياري)"
                          dir="rtl"
                          style="flex:1"
                        />
                        <button
                          class="btn-secondary btn-sm"
                          (click)="addValue(lookup.lookupId)"
                        >{{ 'lookups.addValue' | transloco }}</button>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            }
            @if (lookups().length === 0) {
              <tr>
                <td colspan="3" style="text-align:center;color:var(--tx3);padding:2rem">
                  {{ 'lookups.empty' | transloco }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .add-value-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
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
  pendingValues = signal<string[]>([]);
  pendingInput = signal('');
  managingId = signal<number | null>(null);
  manageInput = signal('');
  manageInputAr = signal('');

  createFg = this.fb.group({ name: ['', Validators.required] });

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
      this.pendingInput.set('');
    }
  }

  addPending() {
    const v = this.pendingInput().trim();
    if (!v) return;
    this.pendingValues.update(vals => [...vals, v]);
    this.pendingInput.set('');
  }

  removePending(i: number) {
    this.pendingValues.update(vals => vals.filter((_, idx) => idx !== i));
  }

  submitCreate() {
    if (this.createFg.invalid) return;
    const name = this.createFg.value.name!;
    this.lookupService.create(name, this.pendingValues()).subscribe({
      next: created => {
        this.lookups.update(ls => [...ls, created]);
        this.toggleCreateForm();
      },
      error: () => this.error.set('Failed to create lookup')
    });
  }

  deleteLookup(id: number) {
    if (!confirm('Delete this lookup? This may affect forms that use it.')) return;
    this.lookupService.deleteById(id).subscribe({
      next: () => {
        this.lookups.update(ls => ls.filter(l => l.lookupId !== id));
        if (this.managingId() === id) this.managingId.set(null);
      },
      error: () => this.error.set('Failed to delete lookup')
    });
  }

  toggleManage(id: number) {
    this.managingId.update(cur => cur === id ? null : id);
    this.manageInput.set('');
    this.manageInputAr.set('');
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
