import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormService } from '../../services/form.service';
import { Form } from '../../models/api.models';

@Component({
  selector: 'app-form-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>{{ 'forms.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'forms.subtitle' | transloco }}</p>
        </div>
        <button class="btn-primary" (click)="toggleCreateForm()">
          {{ (showCreateForm() ? 'common.cancel' : 'forms.newForm') | transloco }}
        </button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (showCreateForm()) {
        <div class="card">
          <h3>{{ 'forms.newFormCard' | transloco }}</h3>
          <form [formGroup]="createFg" (ngSubmit)="submit()">
            <div class="form-row">
              <label>{{ 'forms.titleLabel' | transloco }}</label>
              <input formControlName="title" [placeholder]="'forms.titlePlaceholder' | transloco" />
            </div>
            <button type="submit" class="btn-primary" [disabled]="createFg.invalid">
              {{ 'forms.createForm' | transloco }}
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
              <th>{{ 'forms.colTitle' | transloco }}</th>
              <th>{{ 'forms.colCreated' | transloco }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (form of forms(); track form.formId) {
              <tr>
                <td style="font-weight:500">{{ form.title }}</td>
                <td class="text-muted text-sm">{{ formatDate(form.createdAt) }}</td>
                <td style="text-align:right;display:flex;gap:0.5rem;justify-content:flex-end">
                  <a class="btn-sm btn-secondary" [routerLink]="['/forms', form.formId]">
                    {{ 'forms.open' | transloco }}
                  </a>
                  <button class="btn-sm btn-danger" (click)="deleteForm(form.formId, form.title)">
                    {{ 'common.delete' | transloco }}
                  </button>
                </td>
              </tr>
            }
            @if (forms().length === 0) {
              <tr>
                <td colspan="3" style="text-align:center;color:var(--tx3);padding:3rem">
                  {{ 'forms.empty' | transloco }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class FormListComponent implements OnInit {
  private formService = inject(FormService);
  private fb = inject(FormBuilder);

  forms = signal<Form[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showCreateForm = signal(false);

  createFg = this.fb.group({ title: ['', Validators.required] });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.formService.getAll().subscribe({
      next: data => { this.forms.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load forms'); this.loading.set(false); }
    });
  }

  toggleCreateForm() {
    this.showCreateForm.update(v => !v);
    if (!this.showCreateForm()) this.createFg.reset();
  }

  submit() {
    if (this.createFg.invalid) return;
    const title = this.createFg.value.title!;
    this.formService.create(title).subscribe({
      next: form => { this.forms.update(fs => [...fs, form]); this.toggleCreateForm(); },
      error: () => this.error.set('Failed to create form')
    });
  }

  deleteForm(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    this.formService.deleteById(id).subscribe({
      next: () => this.forms.update(fs => fs.filter(f => f.formId !== id)),
      error: () => this.error.set('Failed to delete form')
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
}
