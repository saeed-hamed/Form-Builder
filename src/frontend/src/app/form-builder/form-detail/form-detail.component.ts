import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormService } from '../../services/form.service';
import { VersionService } from '../../services/version.service';
import { Form, FormVersion } from '../../models/api.models';

@Component({
  selector: 'app-form-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="page">
      @if (loading()) {
        <p class="text-muted">Loading...</p>
      } @else if (form()) {
        <div class="page-header">
          <div>
            <a routerLink="/forms" style="color:#64748b;font-size:0.85rem;text-decoration:none">
              ← Forms
            </a>
            @if (editingTitle()) {
              <form [formGroup]="titleFg" (ngSubmit)="saveTitle()" style="display:flex;gap:0.5rem;margin-top:0.5rem">
                <input formControlName="title" style="font-size:1.2rem;font-weight:700;max-width:360px" />
                <button type="submit" class="btn-primary btn-sm">Save</button>
                <button type="button" class="btn-secondary btn-sm" (click)="editingTitle.set(false)">Cancel</button>
              </form>
            } @else {
              <h1 style="margin-top:0.5rem">
                {{ form()!.title }}
                <button
                  class="btn-secondary btn-sm"
                  style="font-size:0.75rem;margin-left:0.75rem"
                  (click)="startEditTitle()"
                >Edit</button>
              </h1>
            }
          </div>
          <button class="btn-primary" (click)="createVersion()">+ New Version</button>
        </div>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <h3 style="margin-bottom:1rem;font-size:1rem;color:#475569">Versions</h3>

        <table class="table">
          <thead>
            <tr>
              <th>Version #</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (v of versions(); track v.versionId) {
              <tr>
                <td>v{{ v.versionNumber }}</td>
                <td>
                  @if (v.published) {
                    <span class="badge badge-green">Published</span>
                  } @else {
                    <span class="badge badge-yellow">Draft</span>
                  }
                </td>
                <td>{{ formatDate(v.createdAt) }}</td>
                <td>
                  <a
                    class="btn-sm btn-secondary"
                    [routerLink]="['/forms', formId(), 'versions', v.versionId]"
                  >Edit</a>
                  @if (!v.published) {
                    <button class="btn-sm btn-primary" (click)="publish(v)">
                      Publish
                    </button>
                  }
                </td>
              </tr>
            }
            @if (versions().length === 0) {
              <tr>
                <td colspan="4" style="text-align:center;color:#94a3b8;padding:2rem">
                  No versions yet — create one to start building the form
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class FormDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private formService = inject(FormService);
  private versionService = inject(VersionService);
  private fb = inject(FormBuilder);

  form = signal<Form | null>(null);
  versions = signal<FormVersion[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  editingTitle = signal(false);
  formId = signal(0);

  titleFg = this.fb.group({ title: ['', Validators.required] });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('formId'));
    this.formId.set(id);
    this.load(id);
  }

  load(id: number) {
    this.loading.set(true);
    this.formService.getById(id).subscribe({
      next: f => {
        this.form.set(f);
        this.loadVersions(id);
      },
      error: () => { this.error.set('Failed to load form'); this.loading.set(false); }
    });
  }

  loadVersions(formId: number) {
    this.versionService.getVersions(formId).subscribe({
      next: vs => { this.versions.set(vs); this.loading.set(false); },
      error: () => { this.error.set('Failed to load versions'); this.loading.set(false); }
    });
  }

  startEditTitle() {
    this.titleFg.patchValue({ title: this.form()!.title });
    this.editingTitle.set(true);
  }

  saveTitle() {
    if (this.titleFg.invalid) return;
    const title = this.titleFg.value.title!;
    this.formService.update(this.formId(), title).subscribe({
      next: () => {
        this.form.update(f => f ? { ...f, title } : f);
        this.editingTitle.set(false);
      },
      error: () => this.error.set('Failed to update title')
    });
  }

  createVersion() {
    this.versionService.createVersion(this.formId()).subscribe({
      next: v => this.versions.update(vs => [...vs, v]),
      error: () => this.error.set('Failed to create version')
    });
  }

  publish(v: FormVersion) {
    if (!confirm(`Publish v${v.versionNumber}? This will make it the active version.`)) return;
    this.versionService.publishVersion(this.formId(), v.versionId).subscribe({
      next: () => {
        this.versions.update(vs => vs.map(ver =>
          ver.versionId === v.versionId ? { ...ver, published: true } : ver
        ));
        this.form.update(f => f ? { ...f, activeVersionId: v.versionId } : f);
      },
      error: () => this.error.set('Failed to publish version')
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
}
